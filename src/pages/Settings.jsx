import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { downloadBackup, getBackupInfo } from '../utils/backup';
import './Settings.css';

const Settings = () => {
  const [businessName, setBusinessName] = useState('SneakerWash');
  const [phone, setPhone] = useState('555-123-4567');
  const [address, setAddress] = useState('Calle Principal #123, Colima');
  const [email, setEmail] = useState('usuario@sneakerwash.com');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [notifications, setNotifications] = useState({
    deliveryReminders: true,
    paymentAlerts: true,
    whatsappNotifications: false,
    dailySummary: true
  });

  const [integrations, setIntegrations] = useState({
    whatsapp: false,
    clipPayment: false,
    autoBackup: true,
    googleAnalytics: false
  });

  const [backupLoading, setBackupLoading] = useState(false);
  const [backupInfo, setBackupInfo] = useState(null);

  const handleToggle = (category, key) => {
    if (category === 'notifications') {
      setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
      // TODO: Save notification preferences to backend
    } else if (category === 'integrations') {
      setIntegrations(prev => ({ ...prev, [key]: !prev[key] }));
      // TODO: Save integration preferences to backend
    }
  };

  const handleLogoUpload = () => {
    // TODO: Implement logo upload functionality
  };

  const handleSaveProfile = () => {
    // TODO: Save profile changes to backend
  };

  const handleSavePassword = () => {
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    // TODO: Implement password change functionality
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      // TODO: Implement logout functionality
    }
  };

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const result = await downloadBackup();
      alert(`Backup descargado exitosamente: ${result.filename}`);

      // Get updated backup info
      const info = await getBackupInfo();
      setBackupInfo(info);
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert('Error al descargar el backup. Por favor intenta nuevamente.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleGetBackupInfo = async () => {
    try {
      const info = await getBackupInfo();
      setBackupInfo(info);
    } catch (error) {
      console.error('Error getting backup info:', error);
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <PageHeader
        title="Configuración"
      />

      {/* Settings Grid */}
      <div className="settings-grid">
        {/* Perfil del Negocio */}
        <div className="settings-section">
          <div className="section-header">
            <div className="section-icon profile">🏪</div>
            <div>
              <div className="section-title">Perfil del Negocio</div>
              <div className="section-subtitle">Información básica</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Logo del Negocio</label>
            <div className="upload-area" onClick={handleLogoUpload}>
              <div className="upload-icon">📸</div>
              <div className="upload-text">Click para subir logo</div>
              <div className="upload-subtext">PNG o JPG (máx. 2MB)</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nombre del Negocio</label>
            <input
              type="text"
              className="form-input"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Nombre del negocio"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Teléfono de contacto"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input
              type="text"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Dirección del local"
            />
          </div>

          <div className="btn-group">
            <button className="btn-primary" onClick={handleSaveProfile}>
              Guardar Cambios
            </button>
            <button className="btn-secondary">
              Cancelar
            </button>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="settings-section">
          <div className="section-header">
            <div className="section-icon notifications">🔔</div>
            <div>
              <div className="section-title">Notificaciones</div>
              <div className="section-subtitle">Alertas y recordatorios</div>
            </div>
          </div>

          <div className="toggle-group">
            <div className="toggle-info">
              <div className="toggle-label">Recordatorios de Entrega</div>
              <div className="toggle-description">Notificarte cuando un pedido esté listo</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.deliveryReminders}
                onChange={() => handleToggle('notifications', 'deliveryReminders')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="toggle-group">
            <div className="toggle-info">
              <div className="toggle-label">Alertas de Pagos Pendientes</div>
              <div className="toggle-description">Notificarte sobre pagos sin cobrar</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.paymentAlerts}
                onChange={() => handleToggle('notifications', 'paymentAlerts')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="toggle-group">
            <div className="toggle-info">
              <div className="toggle-label">Notificaciones por WhatsApp</div>
              <div className="toggle-description">Enviar recordatorios a clientes</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.whatsappNotifications}
                onChange={() => handleToggle('notifications', 'whatsappNotifications')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="toggle-group">
            <div className="toggle-info">
              <div className="toggle-label">Resumen Diario</div>
              <div className="toggle-description">Recibir reporte al final del día</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifications.dailySummary}
                onChange={() => handleToggle('notifications', 'dailySummary')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Seguridad */}
        <div className="settings-section">
          <div className="section-header">
            <div className="section-icon security">🔒</div>
            <div>
              <div className="section-title">Cuenta y Seguridad</div>
              <div className="section-subtitle">Protege tu cuenta</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nueva Contraseña</label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar Contraseña</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="btn-group">
            <button className="btn-primary" onClick={handleSavePassword}>
              Cambiar Contraseña
            </button>
          </div>

          <div className="logout-section">
            <button className="btn-danger" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Integraciones */}
        <div className="settings-section">
          <div className="section-header">
            <div className="section-icon integrations">🔌</div>
            <div>
              <div className="section-title">Integraciones</div>
              <div className="section-subtitle">Conecta herramientas</div>
            </div>
          </div>

          <div className="integration-item">
            <div className="integration-icon">💬</div>
            <div className="integration-info">
              <div className="integration-name">WhatsApp Business</div>
              <div className={`integration-status ${integrations.whatsapp ? 'connected' : ''}`}>
                {integrations.whatsapp ? '✓ Conectado' : 'No conectado'}
              </div>
            </div>
            <button
              className={`btn-connect ${integrations.whatsapp ? 'connected' : ''}`}
              onClick={() => handleToggle('integrations', 'whatsapp')}
            >
              {integrations.whatsapp ? 'Desconectar' : 'Conectar'}
            </button>
          </div>

          <div className="integration-item">
            <div className="integration-icon clip">💳</div>
            <div className="integration-info">
              <div className="integration-name">Terminal de Pago (Clip)</div>
              <div className={`integration-status ${integrations.clipPayment ? 'connected' : ''}`}>
                {integrations.clipPayment ? '✓ Conectado' : 'No conectado'}
              </div>
            </div>
            <button
              className={`btn-connect ${integrations.clipPayment ? 'connected' : ''}`}
              onClick={() => handleToggle('integrations', 'clipPayment')}
            >
              {integrations.clipPayment ? 'Desconectar' : 'Conectar'}
            </button>
          </div>

          <div className="integration-item">
            <div className="integration-icon backup">☁️</div>
            <div className="integration-info">
              <div className="integration-name">Backup Automático</div>
              <div className={`integration-status ${integrations.autoBackup ? 'connected' : ''}`}>
                {integrations.autoBackup ? '✓ Conectado' : 'No conectado'}
              </div>
            </div>
            <button
              className={`btn-connect ${integrations.autoBackup ? 'connected' : ''}`}
              onClick={() => handleToggle('integrations', 'autoBackup')}
            >
              {integrations.autoBackup ? 'Desconectar' : 'Conectar'}
            </button>
          </div>

          <div className="integration-item">
            <div className="integration-icon analytics">📊</div>
            <div className="integration-info">
              <div className="integration-name">Google Analytics</div>
              <div className={`integration-status ${integrations.googleAnalytics ? 'connected' : ''}`}>
                {integrations.googleAnalytics ? '✓ Conectado' : 'No conectado'}
              </div>
            </div>
            <button
              className={`btn-connect ${integrations.googleAnalytics ? 'connected' : ''}`}
              onClick={() => handleToggle('integrations', 'googleAnalytics')}
            >
              {integrations.googleAnalytics ? 'Desconectar' : 'Conectar'}
            </button>
          </div>
        </div>

        {/* Backup de Datos */}
        <div className="settings-section">
          <div className="section-header">
            <div className="section-icon backup">💾</div>
            <div>
              <div className="section-title">Backup de Datos</div>
              <div className="section-subtitle">Respalda tu información</div>
            </div>
          </div>

          <div className="backup-info">
            <p className="backup-description">
              Descarga una copia de seguridad de todas tus órdenes y servicios en formato JSON.
              Puedes usar este archivo para restaurar tu información si algo sale mal.
            </p>

            {backupInfo && (
              <div className="backup-stats">
                <div className="stat-item">
                  <div className="stat-label">Órdenes:</div>
                  <div className="stat-value">{backupInfo.ordersCount}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Servicios:</div>
                  <div className="stat-value">{backupInfo.servicesCount}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Clientes:</div>
                  <div className="stat-value">{backupInfo.clientsCount}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Empleados:</div>
                  <div className="stat-value">{backupInfo.employeesCount}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Tamaño:</div>
                  <div className="stat-value">{backupInfo.size}</div>
                </div>
              </div>
            )}

            <div className="btn-group">
              <button
                className="btn-primary"
                onClick={handleDownloadBackup}
                disabled={backupLoading}
              >
                {backupLoading ? '⏳ Generando...' : '💾 Descargar Backup'}
              </button>
              <button
                className="btn-secondary"
                onClick={handleGetBackupInfo}
                disabled={backupLoading}
              >
                📊 Ver Info
              </button>
            </div>

            <div className="backup-note">
              <strong>Nota:</strong> Tus datos también están respaldados automáticamente en Firebase.
              Este backup manual es una copia adicional de seguridad.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
