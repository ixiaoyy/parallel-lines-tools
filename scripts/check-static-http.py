"""验收 CI loopback 静态容器的实际 HTTP 合同，不连接生产或自动跟随外站重定向。"""

import argparse
import json
from html.parser import HTMLParser
from pathlib import Path
import re
import urllib.error
import urllib.parse
import urllib.request


ROOT = Path(__file__).resolve().parent.parent
TITLE = "平行线工具箱"
MAX_RESPONSE = 2 * 1024 * 1024


class NoRedirect(urllib.request.HTTPRedirectHandler):
    """请求必须在本次 loopback 容器完成；任何重定向都交给状态检查显式失败。"""

    def redirect_request(self, request, file, code, message, headers, new_url):
        return None


class EntryResources(HTMLParser):
    """从实际 HTML 收集脚本、样式与 CSP，避免只拿假定文件名测试路由。"""

    def __init__(self):
        super().__init__()
        self.scripts = []
        self.styles = []
        self.csp = None

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "script" and values.get("src"):
            self.scripts.append(values["src"])
        if tag == "link" and values.get("rel") == "stylesheet" and values.get("href"):
            self.styles.append(values["href"])
        if tag == "meta" and values.get("http-equiv", "").lower() == "content-security-policy":
            self.csp = values.get("content")


def require(condition, message):
    """HTTP 或文件合同不符时立即失败，不用默认值把真实失败包装成成功。"""
    if not condition:
        raise RuntimeError(message)


def media_type(headers):
    """保留 MIME 的语义部分，允许服务器附带 charset。"""
    return headers.get("Content-Type", "").split(";", 1)[0].strip().lower()


def assert_cache(headers, immutable):
    """入口/源码/错误不得长缓存；只有成功指纹资源按约定 immutable。"""
    value = headers.get("Cache-Control", "").lower()
    if immutable:
        require("immutable" in value and "max-age=31536000" in value, f"Missing immutable cache policy: {value}")
    else:
        require("no-store" in value and "immutable" not in value, f"Expected no-store cache policy: {value}")


class StaticHTTP:
    """对固定 CI 容器做少量有界请求；代理与自动重定向均禁用。"""

    def __init__(self, base_url):
        base = urllib.parse.urlsplit(base_url)
        require(base.scheme == "http" and base.hostname in {"127.0.0.1", "localhost", "::1"}, "Only the CI loopback HTTP service is allowed")
        require(base.port == 5180 and not base.username and not base.password and not base.query and not base.fragment and base.path in {"", "/"}, "CI service must be loopback port 5180 without credentials or a URL suffix")
        self.base = base_url.rstrip("/")
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
        self.requests = 0

    def request(self, relative, method="GET", headers=None, data=None):
        require(relative.startswith("/") and not relative.startswith("//"), "Only root-relative CI URLs are allowed")
        request = urllib.request.Request(
            self.base + relative,
            method=method,
            data=data,
            headers={"Accept-Encoding": "identity", **(headers or {})},
        )
        self.requests += 1
        require(self.requests <= 40, "Static HTTP validation exceeded its request limit")
        try:
            response = self.opener.open(request, timeout=10)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            body = response.read(MAX_RESPONSE + 1)
            require(len(body) <= MAX_RESPONSE, "Validation response exceeded 2 MiB; use HEAD or bounded Range for large files")
            return response.code, response.headers, body


def entry_path(resource):
    """入口引用必须为本站 assets，不替应用访问任何 CDN 或其他主机。"""
    value = urllib.parse.urlsplit(resource)
    require(not value.scheme and not value.netloc and value.path.startswith("/assets/") and not value.query and not value.fragment, f"Unexpected entry resource: {resource}")
    require(".." not in value.path.split("/"), f"Unsafe resource path: {resource}")
    return value.path


def run_check(dist, base_url):
    """验证实际运行的静态站与本次 dist 一致；只对当前服务生效，不探测其他端口。"""
    require(dist.is_dir(), "Built dist is missing")
    receipt = json.loads((dist / "media-core-receipt.json").read_text(encoding="utf-8"))
    require(receipt.get("validation", {}).get("status") == "passed", "Media core validation is not passed")
    client = StaticHTTP(base_url)
    checks = []

    status, headers, body = client.request("/healthz")
    require(status == 200 and body == b"ok\n", "Static container health endpoint failed")
    assert_cache(headers, False)
    checks.append("healthz")

    status, headers, index = client.request("/")
    require(status == 200 and media_type(headers) == "text/html", "Homepage did not return HTML 200")
    require(re.search(r"<title>\s*平行线工具箱\s*</title>", index.decode("utf-8")), "Homepage title is incorrect")
    assert_cache(headers, False)
    parser = EntryResources()
    parser.feed(index.decode("utf-8"))
    require(parser.csp and "default-src 'self'" in parser.csp, "Entry HTML CSP was lost")
    require(parser.scripts and parser.styles, "Entry HTML does not reference built JS and CSS")
    checks.append("homepage-title-csp-no-store")

    for route in ("/converters/markdown-to-docx", "/image-generic/compress"):
        status, headers, body = client.request(route)
        require(status == 200 and body == index and media_type(headers) == "text/html", f"SPA deep link did not return the actual entry: {route}")
        assert_cache(headers, False)
    checks.append("spa-deep-links")

    assets = [(entry_path(parser.scripts[0]), "application/javascript"), (entry_path(parser.styles[0]), "text/css")]
    mjs = sorted((dist / "assets").glob("*.mjs"))
    if mjs:
        assets.append(("/assets/" + mjs[0].name, "application/javascript"))
    wasm = sorted((dist / "assets").glob("*.wasm"))
    require(wasm, "Built dist has no local WASM asset")
    # 自建核心先于可能存在的其他解码器 WASM，实际文件名由当前 dist 得出。
    core_wasm = next((file for file in wasm if file.name.startswith("ffmpeg-core-")), None)
    require(core_wasm is not None, "The validated media core WASM asset is missing; no other decoder may substitute for it")
    assets.append(("/assets/" + core_wasm.name, "application/wasm"))
    for url, mime in assets:
        status, headers, body = client.request(url, method="HEAD")
        require(status == 200 and media_type(headers) == mime, f"Wrong resource status/MIME: {url}")
        local = dist / url.lstrip("/")
        require(local.is_file() and int(headers.get("Content-Length", "-1")) == local.stat().st_size and not body, f"Resource size/HEAD contract differs from dist: {url}")
        assert_cache(headers, True)
        require(headers.get("X-Content-Type-Options", "").lower() == "nosniff", f"Missing nosniff: {url}")
    checks.append("actual-js-css-wasm-mime-immutable" + ("-mjs" if mjs else "-mjs-not-present"))

    status, headers, body = client.request("/assets/" + core_wasm.name, headers={"Range": "bytes=0-7"})
    require(status == 206 and len(body) == 8 and body.startswith(b"\0asm") and media_type(headers) == "application/wasm", "WASM Range did not return a valid local binary prefix")
    require(headers.get("Content-Range") == f"bytes 0-7/{core_wasm.stat().st_size}", "WASM Content-Range is incorrect")
    assert_cache(headers, True)
    checks.append("wasm-range-206")

    for filename, mime in (("THIRD_PARTY_NOTICES.txt", "text/plain"), ("toolbox-source-local-20261109.zip", "application/zip")):
        local = dist / filename
        require(local.is_file() and local.stat().st_size > 0, f"Missing delivery material: {filename}")
        status, headers, body = client.request("/" + filename, method="HEAD")
        require(status == 200 and media_type(headers) == mime and int(headers.get("Content-Length", "-1")) == local.stat().st_size, f"Source/notice HTTP contract failed: {filename}")
        assert_cache(headers, False)
    checks.append("source-zip-and-notice")

    served = {}
    for filename in ("media-core-receipt.json", "release-components.json"):
        status, headers, body = client.request("/" + filename)
        require(status == 200 and media_type(headers) == "application/json", f"Metadata HTTP contract failed: {filename}")
        assert_cache(headers, False)
        served[filename] = json.loads(body.decode("utf-8"))
    require(served["media-core-receipt.json"] == receipt, "Served media receipt differs from the built dist")
    components = served["release-components.json"]
    require(isinstance(components, list), "Release component list is invalid")
    require(any(isinstance(item, dict) and item.get("name") == "@parallellines/media-core" and item.get("version") == receipt.get("version") for item in components), "Validated self-built media core is missing from release components")
    require(not any(isinstance(item, dict) and item.get("name") == "@ffmpeg/core" for item in components), "Legacy npm media core is still bundled")
    checks.append("validated-new-core-without-legacy-core")

    for url in ("/assets/__deployment-missing-AbCd1234.js", "/__deployment-missing.zip"):
        status, headers, body = client.request(url)
        require(status == 404 and TITLE.encode() not in body, f"Missing resource was replaced by SPA HTML: {url}")
        assert_cache(headers, False)
    checks.append("missing-resources-404-no-store")
    status, headers, body = client.request("/", method="POST", data=b"CI static boundary fixture")
    require(status == 405, "Static service unexpectedly accepted POST")
    assert_cache(headers, False)
    checks.append("post-405")
    return {"status": "passed", "baseURL": base_url, "requests": client.requests, "coreVersion": receipt.get("version"), "checks": checks}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:5180")
    parser.add_argument("--dist", type=Path, default=ROOT / "dist")
    arguments = parser.parse_args()
    print(json.dumps(run_check(arguments.dist.resolve(), arguments.base_url), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
