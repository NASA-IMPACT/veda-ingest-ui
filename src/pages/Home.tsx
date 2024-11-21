import { Button } from 'antd';

import { useNavigate } from 'react-router-dom'
import StyledHeader from '@/components/Header';

const Home = () => {
    const Navigate=useNavigate();
    return (
        <span style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <StyledHeader />
            <Button 
              size='large'
              color='primary'
              variant='solid'
              onClick={()=>Navigate('/login')
              }>
                Login
            </Button>
        </span>
    )
}

export default Home