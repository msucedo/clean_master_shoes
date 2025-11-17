/**
 * BluetoothConnectionAlert
 * Modal que alerta al usuario cuando no hay conexión Bluetooth activa
 * y el método de impresión configurado es Bluetooth
 */

import { useState } from 'react';
import { connectPrinter } from '../services/printService';
import { setPrinterMethodPreference, PRINTER_METHODS } from '../utils/printerConfig';
import Modal from './Modal';
import './BluetoothConnectionAlert.css';

const STORAGE_KEY = 'bluetooth_alert_dont_ask';

const BluetoothConnectionAlert = ({ isOpen, onClose, onConnected }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await connectPrinter();

      if (result.success) {
        // Conexión exitosa
        console.log('✅ Impresora conectada:', result.deviceName);

        // Guardar preferencia si el usuario marcó "No volver a preguntar"
        if (dontAskAgain) {
          sessionStorage.setItem(STORAGE_KEY, 'true');
        }

        // Notificar al padre que se conectó exitosamente
        if (onConnected) {
          onConnected(result);
        }

        // Cerrar modal
        onClose();
      } else if (result.cancelled) {
        // Usuario canceló la selección de dispositivo
        setError('Selección de impresora cancelada');
      } else {
        // Error en la conexión
        setError(result.error || 'Error al conectar con la impresora');
      }
    } catch (err) {
      console.error('Error en handleConnect:', err);
      setError(err.message || 'Error inesperado al conectar');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Guardar preferencia si el usuario marcó "No volver a preguntar"
    if (dontAskAgain) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    }

    setError(null);
    onClose();
  };

  const handleChangeToQueue = () => {
    // Cambiar método de impresión a Cola de Trabajo
    const success = setPrinterMethodPreference(PRINTER_METHODS.QUEUE);

    if (success) {
      console.log('✅ Método de impresión cambiado a Cola de Trabajo');

      // Guardar preferencia si el usuario marcó "No volver a preguntar"
      if (dontAskAgain) {
        sessionStorage.setItem(STORAGE_KEY, 'true');
      }

      // Cerrar modal
      onClose();
    } else {
      setError('Error al cambiar el método de impresión');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Conexión Bluetooth requerida"
      size="medium"
    >
      <div className="bluetooth-alert-content">
        <div className="bluetooth-alert-icon">
          🔵
        </div>

        <div className="bluetooth-alert-message">
          <p className="alert-primary-message">
            No hay impresora Bluetooth conectada
          </p>
          <p className="alert-secondary-message">
            Tu método de impresión está configurado como Bluetooth, pero no se detectó ninguna impresora emparejada en este dispositivo.
          </p>
        </div>

        {error && (
          <div className="bluetooth-alert-error">
            ⚠️ {error}
          </div>
        )}

        <div className="bluetooth-alert-actions">
          <button
            className="btn btn-primary btn-connect"
            onClick={handleConnect}
            disabled={loading}
          >
            {loading ? 'Conectando...' : '🔗 Conectar Impresora'}
          </button>

          <button
            className="btn btn-warning"
            onClick={handleChangeToQueue}
            disabled={loading}
          >
            📋 Cambiar a Impresión Remota
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cerrar
          </button>
        </div>

        <div className="bluetooth-alert-checkbox">
          <label>
            <input
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => setDontAskAgain(e.target.checked)}
              disabled={loading}
            />
            <span>No volver a preguntar (hasta refrescar página)</span>
          </label>
        </div>

        <div className="bluetooth-alert-help">
          <details>
            <summary>ℹ️ ¿Cómo conectar mi impresora?</summary>
            <ol>
              <li>Asegúrate de que tu impresora Bluetooth esté encendida</li>
              <li>Haz clic en "Conectar Impresora"</li>
              <li>Selecciona tu impresora de la lista que aparece</li>
              <li>Espera a que se establezca la conexión</li>
            </ol>
            <p className="help-note">
              <strong>Nota:</strong> Si quieres usar otro método de impresión,
              puedes cambiarlo en la página de Configuración.
            </p>
          </details>
        </div>
      </div>
    </Modal>
  );
};

export default BluetoothConnectionAlert;
