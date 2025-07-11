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
      label: <Link href="/collections">Collections</Link>,
      key: 'g1',
      type: 'group',
      children: [
        {
          key: '/create-collection',
          label: <Link href="/create-collection">Create Collection</Link>,
          icon: <PlusCircleOutlined />,
        },
        ...(hasEditIngestPermission
          ? [
              {
                key: '/edit-collection',
                label: <Link href="/edit-collection">Edit Collection</Link>,
                icon: <EditOutlined />,
              },
            ]
          : []),
      ],
    },
    {
      label: <Link href="/datasets">Datasets</Link>,
      key: 'g2',
      type: 'group',
      children: [
        {
          key: '/create-dataset',
          label: <Link href="/create-dataset">Create Dataset</Link>,
          icon: <PlusCircleOutlined />,
        },
        // Conditionally add 'Edit Dataset'
        ...(hasEditIngestPermission
          ? [
              {
                key: '/edit-dataset',
                label: <Link href="/edit-dataset">Edit Dataset</Link>,
                icon: <EditOutlined />,
              },
            ]
          : []),
      ],
    },
    {
      label: 'Tools',
      key: 'g3',
      type: 'group',
      children: [
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
      ],
    },
  ];

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
      items={baseItems}
      selectedKeys={[activeLink]}
    ></Menu>
  );
};

export default MenuBar;
