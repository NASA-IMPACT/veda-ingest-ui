'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { Menu, MenuProps, Tooltip } from 'antd';
import Link from 'next/link';
import {
  HomeOutlined,
  GlobalOutlined,
  CloudUploadOutlined,
  FileAddOutlined,
  FormOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';

const MenuBar = () => {
  const { data: session } = useSession();
  const hasEditIngestPermission = session?.scopes?.includes('dataset:update');
  const hasLimitedAccess = session?.scopes?.includes('dataset:limited-access');
  const hasEditStacCollectionPermission = session?.scopes?.includes(
    'stac:collection:update'
  );
  const isEditExistingCollectionEnabled =
    process.env.NEXT_PUBLIC_ENABLE_EXISTING_COLLECTION_EDIT === 'true';

  const pathname = usePathname();
  const [activeLink, setActiveLink] = useState(pathname);

  const baseItems: MenuProps['items'] = [
    {
      label: <Link href="/">Home</Link>,
      key: '/',
      icon: <HomeOutlined />,
    },
    {
      label: <Link href="/collections">Collections Management</Link>,
      key: 'g1',
      type: 'group',
      children: [
        {
          key: '/create-collection',
          label: hasLimitedAccess ? (
            <Tooltip
              title="Contact the VEDA Data Services team for access"
              placement="right"
            >
              <span style={{ cursor: 'not-allowed' }}>
                <Link href="/create-collection">Create Collection</Link>
              </span>
            </Tooltip>
          ) : (
            <Link href="/create-collection">Create Collection</Link>
          ),
          icon: <FileAddOutlined />,
          disabled: hasLimitedAccess,
        },
        {
          key: '/edit-collection',
          label:
            hasLimitedAccess || !hasEditIngestPermission ? (
              <Tooltip
                title="Contact the VEDA Data Services team for access"
                placement="right"
              >
                <span style={{ cursor: 'not-allowed' }}>
                  <Link href="/edit-collection">Edit Collection</Link>
                </span>
              </Tooltip>
            ) : (
              <Link href="/edit-collection">Edit Collection</Link>
            ),
          icon: <FormOutlined />,
          disabled: hasLimitedAccess || !hasEditIngestPermission,
        },
        ...(isEditExistingCollectionEnabled
          ? [
              {
                key: '/edit-existing-collection',
                label:
                  hasLimitedAccess || !hasEditStacCollectionPermission ? (
                    <Tooltip
                      title="Contact the VEDA Data Services team for access"
                      placement="right"
                    >
                      <span style={{ cursor: 'not-allowed' }}>
                        <Link href="/edit-existing-collection">
                          Edit Existing Collection
                        </Link>
                      </span>
                    </Tooltip>
                  ) : (
                    <Link href="/edit-existing-collection">
                      Edit Existing Collection
                    </Link>
                  ),
                icon: <DatabaseOutlined />,
                disabled: hasLimitedAccess || !hasEditStacCollectionPermission,
              },
            ]
          : []),
      ],
    },
    {
      label: <Link href="/datasets">Dataset Management</Link>,
      key: 'g2',
      type: 'group',
      children: [
        {
          key: '/create-dataset',
          label: hasLimitedAccess ? (
            <Tooltip
              title="Contact the VEDA Data Services team for access"
              placement="right"
            >
              <span style={{ cursor: 'not-allowed' }}>
                <Link href="/create-dataset">Create Dataset</Link>
              </span>
            </Tooltip>
          ) : (
            <Link href="/create-dataset">Create Dataset</Link>
          ),
          icon: <FileAddOutlined />,
          disabled: hasLimitedAccess,
        },
        {
          key: '/edit-dataset',
          label:
            hasLimitedAccess || !hasEditIngestPermission ? (
              <Tooltip
                title="Contact the VEDA Data Services team for access"
                placement="right"
              >
                <span style={{ cursor: 'not-allowed' }}>
                  <Link href="/edit-dataset">Edit Dataset</Link>
                </span>
              </Tooltip>
            ) : (
              <Link href="/edit-dataset">Edit Dataset</Link>
            ),
          icon: <FormOutlined />,
          disabled: hasLimitedAccess || !hasEditIngestPermission,
        },
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
          label: hasLimitedAccess ? (
            <Tooltip
              title="Contact the VEDA Data Services team for access"
              placement="right"
            >
              <span style={{ cursor: 'not-allowed' }}>
                <Link href="/upload">Thumbnail Uploader</Link>
              </span>
            </Tooltip>
          ) : (
            <Link href="/upload">Thumbnail Uploader</Link>
          ),
          key: '/upload',
          icon: <CloudUploadOutlined />,
          disabled: hasLimitedAccess,
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
