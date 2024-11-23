import { Outlet, RouteObject } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import App from './App';

const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <ConfigProvider
      theme={{
        token: {
          // Seed Token
          colorPrimary: '#2276AC',
        },
      }}>
        <Outlet />
      </ConfigProvider>
    ),
    children: [{ index: true, element: <App /> }],
  },
];

export default routes;
