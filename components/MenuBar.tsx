import { Menu } from 'antd';
import Link from 'next/link';
import { HomeOutlined, PlusCircleOutlined } from '@ant-design/icons';


const MenuBar = () => {
  return (
      <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']} >
        <Menu.Item key="1" icon={<HomeOutlined />}>
          <Link href="/">Home</Link>
        </Menu.Item>
        <Menu.Item key="2" icon={<PlusCircleOutlined />}>
          <Link href="/create-ingest">Create Ingest</Link>
        </Menu.Item>
      </Menu>
  );
};

export default MenuBar;