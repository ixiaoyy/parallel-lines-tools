// 运行资源尚未就绪的工具保留说明路径，不加载其引擎；详见 config/deferred-tools.json。
import { tool as splitImage } from './split/meta';
import { tool as resizeImage } from './resize/meta';
import { tool as compressImage } from './compress/meta';
import { tool as changeColors } from './change-colors/meta';
import { tool as cropImage } from './crop/meta';
import { tool as changeOpacity } from './change-opacity/meta';
import { tool as createTransparent } from './create-transparent/meta';
import { tool as qrCodeGenerator } from './qr-code/meta';
import { tool as rotateImage } from './rotate/meta';
import { tool as watermark } from './watermark/meta';

export const imageGenericTools = [
  resizeImage,
  compressImage,
  cropImage,
  changeOpacity,
  changeColors,
  createTransparent,
  qrCodeGenerator,
  rotateImage,
  watermark,
  splitImage
];
