'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { Menu, MenuProps } from 'antd';
import Link from 'next/link';
import {
  HomeOutlined,
  PlusCircleOutlined,
  EditOutlined,
  GlobalOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';

const MenuBar = () => {
  const { data: session } = useSession();
  const hasEditIngestPermission = session?.scopes?.includes('dataset:update');
  const pathname = usePathname();
  const [activeLink, setActiveLink] = useState(pathname);

  const baseItems: MenuProps['items'] = [
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

  // Conditionally add Edit Ingest
  const itemsWithEdit = hasEditIngestPermission
    ? [
        ...baseItems.slice(0, 2),
        {
          label: <Link href="/edit-ingest">Edit Ingest</Link>,
          key: '/edit-ingest',
          icon: <EditOutlined />,
        },
        ...baseItems.slice(2),
      ]
    : baseItems;

  // Filter out "Thumbnail Uploader" based on env variable
  const filteredItems =
    process.env.NEXT_PUBLIC_ENABLE_THUMBNAIL_UPLOAD !== 'true'
      ? itemsWithEdit.filter(
          (item): item is Required<MenuProps>['items'][number] =>
            item?.key !== '/upload'
        )
      : itemsWithEdit;

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
      defaultSelectedKeys={['/']}
      items={filteredItems}
      selectedKeys={[activeLink]}
      style={{ minWidth: 'max-content' }}
    ></Menu>
  );
};

export default MenuBar;
