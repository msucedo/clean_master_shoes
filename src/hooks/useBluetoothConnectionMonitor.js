/**
 * useBluetoothConnectionMonitor Hook
 * Monitorea el estado de conexión Bluetooth y muestra alerta cuando sea necesario
 *
 * Este hook se ejecuta en cada cambio de ruta y verifica:
 * 1. Si el usuario no ha marcado "No volver a preguntar"
 * 2. Si el usuario NO está en la página de Settings (para evitar interrupciones)
 * 3. Si el método de impresión configurado es Bluetooth
 * 4. Si Bluetooth está soportado en el navegador
 * 5. Si hay una conexión Bluetooth activa
 *
 * Si se cumplen todas las condiciones Y NO hay conexión activa, muestra una alerta al usuario
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPrinterMethodPreference, PRINTER_METHODS } from '../utils/printerConfig';
import { bluetoothPrinter } from '../services/bluetoothPrinterService';

const STORAGE_KEY = 'bluetooth_alert_dont_ask';

export const useBluetoothConnectionMonitor = () => {
  const location = useLocation();
  const [shouldShowAlert, setShouldShowAlert] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Función para verificar si debemos mostrar la alerta
  const checkBluetoothConnection = async () => {
    // Evitar múltiples verificaciones simultáneas
    if (isChecking) {
      return;
    }

    setIsChecking(true);

    try {
      // 1. Verificar si el usuario marcó "No volver a preguntar"
      const dontAsk = sessionStorage.getItem(STORAGE_KEY);
      if (dontAsk === 'true') {
        setShouldShowAlert(false);
        return;
      }

      // 2. No mostrar alerta si el usuario está en la página de Settings
      // Esto permite que el usuario configure la impresora sin ser interrumpido
      if (location.pathname === '/settings') {
        setShouldShowAlert(false);
        return;
      }

      // 3. Verificar si el método de impresión configurado es Bluetooth
      const printerMethod = getPrinterMethodPreference();
      if (printerMethod !== PRINTER_METHODS.BLUETOOTH) {
        setShouldShowAlert(false);
        return;
      }

      // 4. Verificar si Bluetooth está soportado
      if (!bluetoothPrinter.isSupported()) {
        setShouldShowAlert(false);
        return;
      }

      // 5. Verificar si hay conexión Bluetooth activa
      const hasActiveConnection = await bluetoothPrinter.hasActiveBluetoothConnection();

      // Si NO hay conexión activa, mostrar alerta
      setShouldShowAlert(!hasActiveConnection);

    } catch (error) {
      console.error('Error checking Bluetooth connection:', error);
      setShouldShowAlert(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Ejecutar verificación cada vez que cambia la ruta
  useEffect(() => {
    checkBluetoothConnection();
  }, [location.pathname]);

  // También ejecutar verificación cuando el usuario regresa a la pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Usuario regresó a la pestaña, verificar conexión
        checkBluetoothConnection();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Escuchar cambios en el método de impresión
  useEffect(() => {
    const handlePrinterMethodChange = () => {
      checkBluetoothConnection();
    };

    window.addEventListener('printerMethodChanged', handlePrinterMethodChange);

    return () => {
      window.removeEventListener('printerMethodChanged', handlePrinterMethodChange);
    };
  }, []);

  // Función para cerrar la alerta manualmente
  const dismissAlert = () => {
    setShouldShowAlert(false);
  };

  // Función para manejar cuando se conecta exitosamente
  const handleConnected = () => {
    setShouldShowAlert(false);
  };

  // Función para forzar re-verificación (útil después de intentar conectar)
  const recheckConnection = () => {
    checkBluetoothConnection();
  };

  return {
    shouldShowAlert,
    dismissAlert,
    handleConnected,
    recheckConnection
  };
};

export default useBluetoothConnectionMonitor;
