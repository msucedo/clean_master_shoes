import { useState, useEffect } from 'react';
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
import SplashScreen from './components/SplashScreen';
import LoadingScreen from './components/LoadingScreen';
import Login from './components/Login';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Notification from './components/Notification';
import { useWhatsAppNotifications } from './hooks/useWhatsAppNotifications';
import './styles/global.css';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [showSplashScreen, setShowSplashScreen] = useState(true);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  // Escuchar notificaciones de WhatsApp
  useWhatsAppNotifications();

  const handleSplashComplete = () => {
    setShowSplashScreen(false);
  };

  const handleLoadingComplete = () => {
    setShowLoadingScreen(false);
  };

  // Mostrar SplashScreen primero (animación inicial)
  if (showSplashScreen) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Mostrar Login si no está autenticado
  if (!authLoading && !user) {
    return <Login />;
  }

  // Mostrar LoadingScreen si está autenticado
  if (authLoading || (user && showLoadingScreen)) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  // Usuario autenticado y loading completado
  return (
    <>
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
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
