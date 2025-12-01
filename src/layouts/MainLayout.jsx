import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ValidationBanner from '../components/ValidationBanner';
import './MainLayout.css';

const MainLayout = () => {
  return (
    <div className="container">
      <ValidationBanner />
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
