import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './MainLayout.css';

const MainLayout = () => {
  return (
    <div className="container">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div> 
    </div>
  );
};

export default MainLayout;
