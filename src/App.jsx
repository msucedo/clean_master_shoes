import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Clients from './pages/Clients';
import Services from './pages/Services';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Empleados from './pages/Empleados';
import Catalog from './pages/Catalog';
import Promotions from './pages/Promotions';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="clients" element={<Clients />} />
          <Route path="services" element={<Services />} />
          <Route path="employees" element={<Empleados />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
