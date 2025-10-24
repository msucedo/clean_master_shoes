import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Clients from './pages/Clients';
import Services from './pages/Services';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Empleados from './pages/Empleados';
import Inventory from './pages/Inventory';
import Promotions from './pages/Promotions';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import { NotificationProvider } from './contexts/NotificationContext';
import Notification from './components/Notification';
import './styles/global.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <ErrorBoundary>
      {isLoading && <LoadingScreen onLoadingComplete={handleLoadingComplete} />}

      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="clients" element={<Clients />} />
              <Route path="services" element={<Services />} />
              <Route path="employees" element={<Empleados />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="promotions" element={<Promotions />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <Notification />
        </BrowserRouter>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
