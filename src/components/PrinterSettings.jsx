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
import {
  getNumberOfCopies,
  setNumberOfCopies
} from '../utils/printerConfig';
import './PrinterSettings.css';

const PrinterSettings = () => {
  const [status, setStatus] = useState({
    isConnected: false,
    deviceName: null
  });
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [numberOfCopies, setNumberOfCopiesState] = useState(2);

  // Cargar estado inicial
  useEffect(() => {
    loadStatus();
    setPlatform(detectPlatform());
    setNumberOfCopiesState(getNumberOfCopies());
  }, []);

  const loadStatus = () => {
    const printerStatus = getPrinterStatus();
    setStatus(printerStatus);
  };

  const handleCopiesChange = (copies) => {
    setNumberOfCopies(copies);
    setNumberOfCopiesState(copies);
    setMessage({
      type: 'success',
      text: `Configurado para imprimir ${copies} ${copies === 1 ? 'copia' : 'copias'}`
    });
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

      {/* Configuración de número de copias */}
      <div className="copies-setting">
        <label className="copies-label">
          <strong>Número de copias:</strong>
        </label>
        <div className="copies-toggle">
          <button
            className={`copy-option ${numberOfCopies === 1 ? 'active' : ''}`}
            onClick={() => handleCopiesChange(1)}
            disabled={loading}
          >
            1 copia
          </button>
          <button
            className={`copy-option ${numberOfCopies === 2 ? 'active' : ''}`}
            onClick={() => handleCopiesChange(2)}
            disabled={loading}
          >
            2 copias
          </button>
        </div>
        {numberOfCopies === 2 && (
          <div className="copies-info">
            <small>Se imprimirá "COPIA CLIENTE" y "COPIA NEGOCIO"</small>
          </div>
        )}
      </div>

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
              <li>❌ iOS Safari (usa impresion remota en cola)</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
};

export default PrinterSettings;
