/**
 * Bluetooth Printer Service
 * Handles connection and communication with 58mm thermal printers via Web Bluetooth API
 *
 * Platform Support:
 * - ✅ Android Chrome/WebView
 * - ✅ Desktop Chrome/Edge
 * - ✅ PWA (installed apps)
 * - ❌ iOS Safari (Web Bluetooth not supported)
 *
 * Printer UUID: Standard Serial Port Profile (SPP)
 */

const PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb'; // Serial Port Service
const PRINTER_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb'; // TX Characteristic

// Alternative UUIDs for different printer manufacturers
const ALTERNATIVE_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard SPP
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Some thermal printers
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2'  // Alternative
];

const STORAGE_KEY = 'savedPrinterDevice';

// Timeouts para operaciones
const TIMEOUTS = {
  CONNECT: 30000,      // 30 segundos para conexión
  RECONNECT: 15000,    // 15 segundos para reconexión
  PRINT: 30000         // 30 segundos para impresión
};

class BluetoothPrinterService {
  constructor() {
    this.device = null;
    this.characteristic = null;
    this.isConnected = false;
    this.connectionPromise = null;
  }

  /**
   * Helper: Ejecutar operación con timeout
   */
  async _withTimeout(promise, timeoutMs, operationName) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: ${operationName} excedió ${timeoutMs / 1000}s`)), timeoutMs)
      )
    ]);
  }

  /**
   * Check if Web Bluetooth is supported
   */
  isSupported() {
    if (!('bluetooth' in navigator)) {
      return false;
    }

    // Additional check for secure context (HTTPS required)
    if (!window.isSecureContext) {
      console.warn('Web Bluetooth requiere contexto seguro (HTTPS)');
      return false;
    }

    return true;
  }

  /**
   * Get browser and platform info
   */
  getPlatformInfo() {
    const ua = navigator.userAgent;
    return {
      isAndroid: /Android/i.test(ua),
      isIOS: /iPhone|iPad|iPod/i.test(ua),
      isChrome: /Chrome/i.test(ua) && !/Edge/i.test(ua),
      isSafari: /Safari/i.test(ua) && !/Chrome/i.test(ua),
      supportsBluetooth: this.isSupported()
    };
  }

  /**
   * Request and connect to a Bluetooth printer
   * Opens browser's Bluetooth device picker
   */
  async connect() {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth no está soportado en este navegador');
    }

    // If already connecting, return existing promise
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // If already connected, return current device
    if (this.isConnected && this.device && this.device.gatt.connected) {
      return { success: true, device: this.device };
    }

    // Create new connection promise
    this.connectionPromise = this._doConnect();

    try {
      const result = await this.connectionPromise;
      return result;
    } finally {
      this.connectionPromise = null;
    }
  }

  async _doConnect() {
    try {
      console.log('🔍 Solicitando dispositivo Bluetooth...');
      console.log('💡 Asegúrate de que la impresora esté encendida y en modo de emparejamiento');

      // Request device - show picker to user (sin timeout, es UI del navegador)
      this.device = await navigator.bluetooth.requestDevice({
        // Accept all devices and let user choose
        acceptAllDevices: true,
        optionalServices: ALTERNATIVE_SERVICE_UUIDS
      });

      console.log('📱 Dispositivo seleccionado:', this.device.name || 'Sin nombre');

      // Add disconnect listener
      this.device.addEventListener('gattserverdisconnected', () => {
        console.log('❌ Impresora desconectada');
        this.isConnected = false;
      });

      // Connect to GATT Server con timeout
      console.log('🔌 Conectando a GATT Server...');
      const server = await this._withTimeout(
        this.device.gatt.connect(),
        TIMEOUTS.CONNECT,
        'Conexión a impresora'
      );

      // Try to find the correct service
      let service = null;
      for (const serviceUUID of ALTERNATIVE_SERVICE_UUIDS) {
        try {
          service = await server.getPrimaryService(serviceUUID);
          console.log('✅ Servicio encontrado:', serviceUUID);
          break;
        } catch (error) {
          console.log('⏭️  Intentando siguiente UUID...', serviceUUID);
        }
      }

      if (!service) {
        throw new Error('No se pudo encontrar el servicio de la impresora');
      }

      // Get characteristic for writing
      const characteristics = await service.getCharacteristics();
      console.log('📝 Características disponibles:', characteristics.length);

      // Find writable characteristic
      this.characteristic = characteristics.find(c =>
        c.properties.write || c.properties.writeWithoutResponse
      );

      if (!this.characteristic) {
        throw new Error('No se encontró una característica escribible');
      }

      console.log('✅ Característica encontrada:', this.characteristic.uuid);

      this.isConnected = true;

      // Save device ID for auto-reconnect
      this._saveDeviceInfo();

      return {
        success: true,
        device: this.device,
        deviceName: this.device.name,
        deviceId: this.device.id
      };

    } catch (error) {
      console.error('❌ Error conectando a impresora:', error);
      this.isConnected = false;
      this.device = null;
      this.characteristic = null;

      // User cancelled
      if (error.name === 'NotFoundError') {
        throw new Error('No se seleccionó ninguna impresora');
      }

      // Permission denied
      if (error.name === 'NotAllowedError') {
        throw new Error('Permiso denegado. Por favor, permite el acceso a Bluetooth.');
      }

      // Security error
      if (error.name === 'SecurityError') {
        throw new Error('Error de seguridad. Asegúrate de usar HTTPS o localhost.');
      }

      // Bluetooth not available
      if (error.name === 'NotSupportedError') {
        throw new Error('Bluetooth no disponible. Asegúrate de que Bluetooth esté encendido en tu dispositivo.');
      }

      // Network error (device out of range, etc)
      if (error.name === 'NetworkError') {
        throw new Error('Error de conexión. Asegúrate de que la impresora esté encendida y en rango.');
      }

      throw new Error(`Error de conexión: ${error.message}`);
    }
  }

  /**
   * Reconnect to previously saved printer
   * Uses navigator.bluetooth.getDevices() to reconnect without user interaction
   */
  async reconnect() {
    const savedInfo = this._getSavedDeviceInfo();

    if (!savedInfo) {
      throw new Error('No hay impresora guardada');
    }

    try {
      console.log('🔄 Intentando reconectar a:', savedInfo.name);

      // Check if getDevices API is available (Chrome 106+)
      if (!navigator.bluetooth.getDevices) {
        console.warn('⚠️ getDevices() no disponible, usando connect() manual');
        return this.connect();
      }

      // Get previously authorized devices
      const devices = await navigator.bluetooth.getDevices();
      console.log('📱 Dispositivos autorizados:', devices.length);

      // Find our saved device by ID
      const savedDevice = devices.find(d => d.id === savedInfo.id);

      if (!savedDevice) {
        console.warn('⚠️ Dispositivo guardado no encontrado en autorizados');
        // Device was forgotten or not authorized, need to pair again
        return this.connect();
      }

      console.log('✅ Dispositivo encontrado, reconectando...');

      // Set device and connect
      this.device = savedDevice;

      // Add disconnect listener
      this.device.addEventListener('gattserverdisconnected', () => {
        console.log('❌ Impresora desconectada');
        this.isConnected = false;
      });

      // Connect to GATT Server con timeout
      const server = await this._withTimeout(
        this.device.gatt.connect(),
        TIMEOUTS.RECONNECT,
        'Reconexión a impresora'
      );

      // Try to find the correct service
      let service = null;
      for (const serviceUUID of ALTERNATIVE_SERVICE_UUIDS) {
        try {
          service = await server.getPrimaryService(serviceUUID);
          console.log('✅ Servicio encontrado:', serviceUUID);
          break;
        } catch (error) {
          console.log('⏭️  Intentando siguiente UUID...', serviceUUID);
        }
      }

      if (!service) {
        throw new Error('No se pudo encontrar el servicio de la impresora');
      }

      // Get characteristic for writing
      const characteristics = await service.getCharacteristics();

      // Find writable characteristic
      this.characteristic = characteristics.find(c =>
        c.properties.write || c.properties.writeWithoutResponse
      );

      if (!this.characteristic) {
        throw new Error('No se encontró una característica escribible');
      }

      console.log('✅ Reconexión exitosa');

      this.isConnected = true;

      return {
        success: true,
        device: this.device,
        deviceName: this.device.name,
        deviceId: this.device.id
      };

    } catch (error) {
      console.error('❌ Error reconectando:', error);
      this.isConnected = false;
      this.device = null;
      this.characteristic = null;

      // If reconnection fails, may need to pair again
      throw new Error(`Error de reconexión: ${error.message}`);
    }
  }

  /**
   * Disconnect from printer
   */
  async disconnect() {
    if (this.device && this.device.gatt.connected) {
      await this.device.gatt.disconnect();
    }

    this.device = null;
    this.characteristic = null;
    this.isConnected = false;
  }

  /**
   * Send data to printer
   * @param {Uint8Array} data - Raw bytes to send (ESC/POS commands)
   */
  async print(data) {
    if (!this.isConnected || !this.characteristic) {
      throw new Error('Impresora no conectada');
    }

    // Envolver toda la operación de impresión con timeout
    return this._withTimeout(
      this._doPrint(data),
      TIMEOUTS.PRINT,
      'Impresión de ticket'
    );
  }

  /**
   * Operación interna de impresión
   */
  async _doPrint(data) {
    try {
      // Check if still connected
      if (!this.device.gatt.connected) {
        throw new Error('Impresora desconectada. Reconecte la impresora.');
      }

      // Bluetooth LE has MTU limit (usually 20-512 bytes per packet)
      // Split data into chunks
      const chunkSize = 512; // Conservative size
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, Math.min(i + chunkSize, data.length));

        // Write chunk
        if (this.characteristic.properties.writeWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.characteristic.writeValue(chunk);
        }

        // Small delay between chunks
        if (i + chunkSize < data.length) {
          await this._sleep(50);
        }
      }

      console.log(`✅ Enviados ${data.length} bytes a la impresora`);
      return { success: true };

    } catch (error) {
      console.error('❌ Error enviando datos:', error);

      // Check if disconnected
      if (!this.device.gatt.connected) {
        this.isConnected = false;
        throw new Error('La impresora se desconectó durante la impresión');
      }

      throw new Error(`Error de impresión: ${error.message}`);
    }
  }

  /**
   * Test print - sends a simple test page
   */
  async testPrint() {
    const { createESCPOS } = await import('../utils/escposCommands.js');

    const cmd = createESCPOS()
      .init()
      .align('center')
      .size(2, 2)
      .text('TEST DE IMPRESION')
      .feed()
      .size(1, 1)
      .text('Impresora configurada')
      .text('correctamente ✓')
      .feed(2)
      .text(new Date().toLocaleString('es-MX'))
      .feed(3)
      .cut();

    return this.print(cmd.getBytes());
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      deviceName: this.device?.name || null,
      deviceId: this.device?.id || null,
      isGattConnected: this.device?.gatt?.connected || false
    };
  }

  /**
   * Check if there's a saved printer
   */
  hasSavedPrinter() {
    return !!this._getSavedDeviceInfo();
  }

  /**
   * Clear saved printer info
   */
  forgetPrinter() {
    localStorage.removeItem(STORAGE_KEY);
    return this.disconnect();
  }

  // Private methods

  _saveDeviceInfo() {
    if (this.device) {
      const info = {
        id: this.device.id,
        name: this.device.name,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
    }
  }

  _getSavedDeviceInfo() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const bluetoothPrinter = new BluetoothPrinterService();

// Export class for testing
export { BluetoothPrinterService };
