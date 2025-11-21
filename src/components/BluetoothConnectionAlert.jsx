/**
 * BluetoothConnectionAlert
 * Modal que alerta al usuario cuando no hay conexión Bluetooth activa
 * y el método de impresión configurado es Bluetooth
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import './BluetoothConnectionAlert.css';

const STORAGE_KEY = 'bluetooth_alert_dont_ask';

const BluetoothConnectionAlert = ({ isOpen, onClose, onConnected }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const handleGoToSettings = () => {
    // Guardar preferencia si el usuario marcó "No volver a preguntar"
    if (dontAskAgain) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    }

    // Cerrar modal
    onClose();

    // Navegar a la página de configuración
    navigate('/settings');
  };

  const handleClose = () => {
    // Guardar preferencia si el usuario marcó "No volver a preguntar"
    if (dontAskAgain) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    }

    setError(null);
    onClose();
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
          ⚠️
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
            className="btn btn-primary"
            onClick={handleGoToSettings}
          >
            ⚙️ Ir a Configuración
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleClose}
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
