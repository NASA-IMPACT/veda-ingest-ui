import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { Menu, MenuProps } from 'antd';
import Link from 'next/link';
import {
  HomeOutlined,
  PlusCircleOutlined,
  EditOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

const items: MenuProps['items'] = [
  {
    label: <Link href="/">Home</Link>,
    key: '/',
    icon: <HomeOutlined />,
  },
  {
    label: <Link href="/create-ingest">Create Ingest</Link>,
    key: '/create-ingest',
    icon: <PlusCircleOutlined />,
  },
  {
    label: <Link href="/edit-ingest">Edit Ingest</Link>,
    key: '/edit-ingest',
    icon: <EditOutlined />,
  },
  {
    label: <Link href="/cog-viewer">COG Viewer</Link>,
    key: '/cog-viewer',
    icon: <GlobalOutlined />,
  },
];

const MenuBar = () => {
  const pathname = usePathname();

  const [activeLink, setActiveLink] = useState(pathname);

  useEffect(() => {
    if (location) {
      if (activeLink !== pathname) {
        setActiveLink(pathname);
      }
    }
  }, [activeLink, pathname]);

  return (
    <Menu
      theme="dark"
      mode="inline"
      defaultSelectedKeys={['1']}
      items={items}
      selectedKeys={[activeLink]}
    ></Menu>
  );
};

export default MenuBar;
