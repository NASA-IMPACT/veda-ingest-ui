import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';


import { Menu, MenuProps } from 'antd';
import Link from 'next/link';
import { HomeOutlined, PlusCircleOutlined } from '@ant-design/icons';

const items: MenuProps['items'] = [
  {
    label: (
      <Link href="/">Home</Link>
    ),
    key: '/',
    icon: <HomeOutlined />
  },
  {
    label: (
      <Link href="/create-ingest">
        Create Ingest
      </Link>
    ),
    key: '/create-ingest',
    icon: <PlusCircleOutlined />
  },
];


const MenuBar = () => {
  const pathname = usePathname();

  const [activeLink, setActiveLink] = useState(pathname)

  useEffect(() => {
    if (location) {
        if( activeLink !== pathname) {
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
        >
      </Menu>
  );
};

export default MenuBar;