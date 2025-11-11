/**
 * PrinterSettings Component
 * Panel de configuración de impresora Bluetooth
 */

import { useState, useEffect } from 'react';
import {
  getPrinterStatus,
  connectPrinter,
  disconnectPrinter,
  forgetPrinter,
  testPrint,
  detectPlatform,
  reconnectPrinter
} from '../services/printService';
import './PrinterSettings.css';

const PrinterSettings = () => {
  const [status, setStatus] = useState({
    isConnected: false,
    deviceName: null
  });
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Cargar estado inicial
  useEffect(() => {
    loadStatus();
    setPlatform(detectPlatform());
  }, []);

  const loadStatus = () => {
    const printerStatus = getPrinterStatus();
    setStatus(printerStatus);
  };

  const handleConnect = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await connectPrinter();

      if (result.success) {
        setMessage({
          type: 'success',
          text: `¡Conectado a ${result.deviceName}!`
        });
        loadStatus();
      } else if (result.cancelled) {
        setMessage({
          type: 'info',
          text: 'Conexión cancelada'
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Error al conectar'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await reconnectPrinter();

      if (result.success) {
        setMessage({
          type: 'success',
          text: `¡Reconectado a ${result.deviceName}!`
        });
        loadStatus();
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Error al reconectar'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await disconnectPrinter();
      setMessage({
        type: 'success',
        text: 'Impresora desconectada'
      });
      loadStatus();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForget = async () => {
    if (!confirm('¿Olvidar esta impresora? Tendrás que volver a conectarla.')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await forgetPrinter();
      setMessage({
        type: 'success',
        text: 'Impresora olvidada'
      });
      loadStatus();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await testPrint();

      if (result.success) {
        setMessage({
          type: 'success',
          text: '✓ Ticket de prueba enviado'
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Error al imprimir'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Si Bluetooth no está soportado
  if (platform && !platform.hasBluetooth) {
    return (
      <div className="printer-settings">
        <h3>🖨️ Configuración de Impresora</h3>
        <div className="alert alert-warning">
          <strong>Bluetooth no disponible</strong>
          <p>
            {platform.isIOS
              ? 'iOS Safari no soporta Web Bluetooth. Los tickets se compartirán como texto.'
              : 'Tu navegador no soporta Web Bluetooth API. Usa Chrome, Edge u Opera para conectar impresoras Bluetooth.'}
          </p>
          <p className="platform-info">
            <strong>Plataforma:</strong> {platform.isIOS ? 'iOS' : platform.isAndroid ? 'Android' : 'Desktop'}<br />
            <strong>Navegador:</strong> {platform.isSafari ? 'Safari' : platform.isChrome ? 'Chrome' : 'Otro'}<br />
            <strong>Método de impresión:</strong> {platform.recommendedMethod === 'html' ? 'Impresión HTML (window.print)' : platform.recommendedMethod}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="printer-settings">
      <h3>🖨️ Configuración de Impresora Bluetooth</h3>

      {/* Estado de conexión */}
      <div className={`connection-status ${status.isConnected ? 'connected' : 'disconnected'}`}>
        <div className="status-indicator">
          <span className="status-dot"></span>
          <span className="status-text">
            {status.isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {status.isConnected && status.deviceName && (
          <div className="device-info">
            <strong>Impresora:</strong> {status.deviceName}
          </div>
        )}
      </div>

      {/* Mensaje de feedback */}
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Botones de acción */}
      <div className="printer-actions">
        {!status.isConnected ? (
          <>
            <button
              className="btn btn-primary"
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? 'Conectando...' : '📱 Conectar Impresora'}
            </button>

            {/* Botón reconectar si hay impresora guardada */}
            {status.deviceName && (
              <button
                className="btn btn-secondary"
                onClick={handleReconnect}
                disabled={loading}
              >
                {loading ? 'Reconectando...' : `🔄 Reconectar a ${status.deviceName}`}
              </button>
            )}
          </>
        ) : (
          <>
            <button
              className="btn btn-secondary"
              onClick={handleTest}
              disabled={loading}
            >
              {loading ? 'Imprimiendo...' : '🧪 Imprimir Prueba'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleDisconnect}
              disabled={loading}
            >
              Desconectar
            </button>

            <button
              className="btn btn-danger"
              onClick={handleForget}
              disabled={loading}
            >
              Olvidar Impresora
            </button>
          </>
        )}
      </div>

      {/* Información de ayuda */}
      <div className="help-section">
        <details>
          <summary>ℹ️ Instrucciones</summary>
          <div className="help-content">
            <ol>
              <li>Enciende tu impresora térmica Bluetooth</li>
              <li>Haz clic en "Conectar Impresora"</li>
              <li>Selecciona tu impresora de la lista</li>
              <li>Una vez conectada, podrás imprimir tickets directamente</li>
              <li>La impresora se reconectará automáticamente la próxima vez</li>
            </ol>

            <h4>Compatibilidad:</h4>
            <ul>
              <li>✅ macOS Chrome/Edge/Opera</li>
              <li>✅ Windows Chrome/Edge/Opera</li>
              <li>✅ Android Chrome/WebView</li>
              <li>✅ PWA (App instalada)</li>
              <li>❌ iOS Safari (usa compartir texto)</li>
            </ul>

            <h4>Impresoras soportadas:</h4>
            <p>Cualquier impresora térmica de 58mm con Bluetooth que soporte comandos ESC/POS estándar.</p>

            <h4>Nota para macOS:</h4>
            <p>Si la impresora no aparece en la lista, asegúrate de que esté encendida y en modo de emparejamiento. No es necesario emparejarla desde Configuración del Sistema de macOS primero.</p>
          </div>
        </details>
      </div>

      {/* Información de plataforma (solo en dev) */}
      {platform && import.meta.env.DEV && (
        <details className="platform-debug">
          <summary>🔧 Debug Info</summary>
          <pre>{JSON.stringify(platform, null, 2)}</pre>
        </details>
      )}
    </div>
  );
};

export default PrinterSettings;
