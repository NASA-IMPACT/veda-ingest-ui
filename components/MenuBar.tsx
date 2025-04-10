import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { Menu, MenuProps } from 'antd';
import Link from 'next/link';
import {
  HomeOutlined,
  PlusCircleOutlined,
  EditOutlined,
  GlobalOutlined,
  CloudUploadOutlined,
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
  {
    label: <Link href="/upload">Thumbnail Uploader</Link>,
    key: '/upload',
    icon: <CloudUploadOutlined />,
  },
];

// Filter out "Thumbnail Uploader" if the env variable is set
const filteredItems =
  process.env.NEXT_PUBLIC_ENABLE_THUMBNAIL_UPLOAD !== 'true'
    ? items.filter(
        (item): item is Required<MenuProps>['items'][number] =>
          item?.key !== '/upload'
      )
    : items;

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
      items={filteredItems}
      selectedKeys={[activeLink]}
      style={{ minWidth: 'max-content' }}
    ></Menu>
  );
};

export default MenuBar;
