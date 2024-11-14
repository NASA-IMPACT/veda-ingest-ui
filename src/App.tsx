import  { useEffect } from 'react'
import { BrowserRouter,Routes, Route,Navigate  } from 'react-router-dom'
import Home from './components/Home';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

import userpool from './UserPool';

function App() {

  useEffect(()=>{
    const user=userpool.getCurrentUser();
      if(user){
        <Navigate to="/dashboard" replace />
      }
  },[]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />}/>
        <Route path='/login' element={<Login />}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;