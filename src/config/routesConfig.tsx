import { Navigate, RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const Home = lazy(() => import('../pages/home'));
const ToolsByCategory = lazy(() => import('../pages/tools-by-category'));
const DeferredTools = lazy(() => import('../pages/deferred-tools'));
import deferred from './deferred-tools.json';

const routes: RouteObject[] = [
  { path: '/deferred-tools', element: <DeferredTools /> },
  // 保留延期工具的既有路径，但只显示原因，避免误触发未核清的引擎。
  ...deferred.map((tool) => ({
    path: `/${tool.path}`,
    element: <DeferredTools />
  })),
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/categories/:categoryName',
    element: <ToolsByCategory />
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
];

export default routes;
