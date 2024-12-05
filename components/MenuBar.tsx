import { Menu, Button } from 'antd';
import Link from 'next/link';
import { signOut } from 'aws-amplify/auth';
import { HomeOutlined, PlusCircleOutlined, LogoutOutlined } from '@ant-design/icons';

async function handleSignOut() {
  await signOut();
}

const MenuBar = () => {
  return (
    <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']} >
      <Menu.Item key="1" icon={<HomeOutlined />}>
        <Link href="/">Home</Link>
      </Menu.Item>
      <Menu.Item key="2" icon={<PlusCircleOutlined />}>
        <Link href="/create-ingest">Create Ingest</Link>
      </Menu.Item>
      <Menu.Item key="3" >
      <Button type='primary' danger onClick={handleSignOut} icon={<LogoutOutlined/>}>Sign out</Button>

      </Menu.Item>
    </Menu>
  );
};

export default MenuBar;