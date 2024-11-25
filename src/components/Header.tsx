import { Layout, Button } from 'antd';
import React from 'react';
import { signOut } from "aws-amplify/auth"

const { Header } = Layout;

const headerStyle: React.CSSProperties = {
  fontSize: '2em',
  fontFamily: '"Open Sans",sans-serif',
  fontWeight: 700,
  textAlign: 'center',
  lineHeight: '1.1',
  backgroundColor: '#2276AC',
  color: '#FFFFFF',
  width: '100%',
  marginBottom: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexDirection: 'row',
};

    


const StyledHeader = () => {
  async function handleSignOut() {
    await signOut()
  }
    return (
      <Header style={headerStyle}>
        <div>
          {/* empty div to move logout button right */}
        </div>
        Welcome to the VEDA Data Ingest UI
          <Button onClick={handleSignOut}>
            Sign out
          </Button>
        </Header>
    );
};

export default StyledHeader;
