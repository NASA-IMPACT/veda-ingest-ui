import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin, ConfigProvider } from 'antd';
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

import userpool from './UserPool';

function App() {
  useEffect(() => {
    const user = userpool.getCurrentUser();
    if (user) {
      <Navigate to="/dashboard" replace />;
    }
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          // Seed Token
          colorPrimary: '#2276AC',
        },
      }}
    >
      <Suspense fallback={<Spin />}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </BrowserRouter>
      </Suspense>
    </ConfigProvider>
  );
}

export default App;
