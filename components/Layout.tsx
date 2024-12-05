import { Layout, Typography } from 'antd';
import Sidebar from './MenuBar';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;


const AppLayout = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            color: 'white',
            padding: '20px'
            }} >
            VEDA Ingest UI
        </Header>
        <Sidebar />
      </Sider>
      <Layout>

        <Content style={{ margin: '24px 16px 0' }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;