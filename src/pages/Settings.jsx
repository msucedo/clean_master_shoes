import { useState, useRef, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import PrinterSettings from '../components/PrinterSettings';
import { downloadBackup, getBackupInfo } from '../utils/backup';
import { saveBusinessProfile, getBusinessProfile } from '../services/firebaseService';
import { useNotification } from '../contexts/NotificationContext';
import { useAdminCheck } from '../contexts/AuthContext';
import {
  getPrinterMethodPreference,
  setPrinterMethodPreference,
  PRINTER_METHODS,
  PRINTER_METHOD_LABELS,
  PRINTER_METHOD_DESCRIPTIONS
} from '../utils/printerConfig';
import { detectPlatform } from '../services/printService';
import './Settings.css';

const Settings = () => {
  const { showSuccess, showError } = useNotification();
  const isAdmin = useAdminCheck();

  // Business Profile State
  const [businessName, setBusinessName] = useState('Clean Master Shoes');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Backup State
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupInfo, setBackupInfo] = useState(null);

  // Printer Method State
  const [printerMethod, setPrinterMethod] = useState(PRINTER_METHODS.AUTO);
  const [detectedPlatform, setDetectedPlatform] = useState(null);

  // Ref for file input
  const fileInputRef = useRef(null);

  // Load business profile on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profile = await getBusinessProfile();

        setBusinessName(profile.businessName || 'Clean Master Shoes');
        setPhone(profile.phone || '');
        setAddress(profile.address || '');
        setLogoPreview(profile.logoUrl || null);
      } catch (error) {
        console.error('Error loading business profile:', error);
        showError('Error al cargar el perfil del negocio');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [showError]);

  // Load printer method preference and detect platform
  useEffect(() => {
    const preference = getPrinterMethodPreference();
    setPrinterMethod(preference);

    const platform = detectPlatform();
    setDetectedPlatform(platform);
  }, []);

  const handleLogoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showError('Tipo de archivo no permitido. Usa PNG, JPG o WEBP.');
        return;
      }

      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        showError('El archivo es demasiado grande. Máximo 2MB.');
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    // Verificar permisos de admin
    if (!isAdmin) {
      showError('Solo los administradores pueden guardar cambios de configuración');
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        businessName,
        phone,
        address
      };

      await saveBusinessProfile(profileData, logoFile);

      showSuccess('Perfil guardado exitosamente');

      // Clear logo file after saving (keep preview)
      setLogoFile(null);
    } catch (error) {
      console.error('Error saving profile:', error);
      showError(error.message || 'Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelProfile = async () => {
    try {
      setLoading(true);
      const profile = await getBusinessProfile();

      setBusinessName(profile.businessName || 'Clean Master Shoes');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setLogoFile(null);
      setLogoPreview(profile.logoUrl || null);

      showSuccess('Cambios descartados');
    } catch (error) {
      console.error('Error reloading profile:', error);
      showError('Error al recargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const result = await downloadBackup();
      showSuccess(`Backup descargado: ${result.filename}`);

      // Get updated backup info
      const info = await getBackupInfo();
      setBackupInfo(info);
    } catch (error) {
      console.error('Error downloading backup:', error);
      showError('Error al descargar el backup');
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
      showError('Error al obtener información del backup');
    }
  };

  const handlePrinterMethodChange = (method) => {
    setPrinterMethod(method);
    const success = setPrinterMethodPreference(method);
    if (success) {
      showSuccess('Método de impresión guardado');
    } else {
      showError('Error al guardar el método de impresión');
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <PageHeader title="Configuración" />

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
              {logoPreview ? (
                <div className="logo-preview">
                  <img src={logoPreview} alt="Logo preview" />
                </div>
              ) : (
                <>
                  <div className="upload-icon">📸</div>
                  <div className="upload-text">Click para subir logo</div>
                  <div className="upload-subtext">PNG o JPG (máx. 2MB)</div>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
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
            <button
              className="btn-primary"
              onClick={handleSaveProfile}
              disabled={saving || loading}
            >
              {saving ? '⏳ Guardando...' : 'Guardar Cambios'}
            </button>
            <button
              className="btn-secondary"
              onClick={handleCancelProfile}
              disabled={loading}
            >
              Cancelar
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
              Descarga una copia de seguridad completa de todos tus datos en formato JSON.
              Incluye órdenes, servicios, clientes, empleados, inventario, gastos, cortes de caja y configuraciones.
            </p>

            {backupInfo && (
              <div className="backup-stats">
                <div className="stat-item">
                  <div className="stat-label">Órdenes</div>
                  <div className="stat-value">{backupInfo.ordersCount}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Servicios</div>
                  <div className="stat-value">{backupInfo.servicesCount}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Clientes</div>
                  <div className="stat-value">{backupInfo.clientsCount}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Empleados</div>
                  <div className="stat-value">{backupInfo.employeesCount}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Inventario</div>
                  <div className="stat-value">{backupInfo.inventoryCount || 0}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Gastos</div>
                  <div className="stat-value">{backupInfo.expensesCount || 0}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Cortes de Caja</div>
                  <div className="stat-value">{backupInfo.cashClosuresCount || 0}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Configuración</div>
                  <div className="stat-value">{backupInfo.settingsCount}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Tamaño</div>
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

        {/* Método de Impresión */}
        <div className="settings-section">
          <div className="section-header">
            <div className="section-icon printer">🖨️</div>
            <div>
              <div className="section-title">Método de Impresión</div>
              <div className="section-subtitle">Selecciona cómo imprimir tickets</div>
            </div>
          </div>

          <div className="printer-method-options">
            {Object.entries(PRINTER_METHODS).map(([key, value]) => (
              <div key={value} className="radio-option">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="printerMethod"
                    value={value}
                    checked={printerMethod === value}
                    onChange={(e) => handlePrinterMethodChange(e.target.value)}
                    className="radio-input"
                  />
                  <div className="radio-content">
                    <div className="radio-title">{PRINTER_METHOD_LABELS[value]}</div>
                    <div className="radio-description">{PRINTER_METHOD_DESCRIPTIONS[value]}</div>
                  </div>
                </label>
              </div>
            ))}
          </div>

          {printerMethod === PRINTER_METHODS.AUTO && detectedPlatform && (
            <div className="platform-detection">
              <div className="detection-label">🔍 Dispositivo detectado:</div>
              <div className="detection-info">
                <div className="detection-item">
                  <span className="detection-key">Plataforma:</span>
                  <span className="detection-value">
                    {detectedPlatform.isMobile ? 'Móvil' : 'Desktop'}
                    {detectedPlatform.isAndroid && ' (Android)'}
                    {detectedPlatform.isIOS && ' (iOS)'}
                  </span>
                </div>
                <div className="detection-item">
                  <span className="detection-key">Método recomendado:</span>
                  <span className="detection-value">
                    {PRINTER_METHOD_LABELS[detectedPlatform.recommendedMethod]}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Configuración de Impresora Bluetooth - Solo visible cuando método es Bluetooth */}
          {printerMethod === PRINTER_METHODS.BLUETOOTH && (
            <div className="bluetooth-settings-container">
              <PrinterSettings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
