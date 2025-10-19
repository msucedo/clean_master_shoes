import { exportAllData } from '../services/firebaseService';

/**
 * Download data as JSON file
 * @param {Object} data - Data to download
 * @param {string} filename - Name of the file
 */
const downloadJSON = (data, filename) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Export all data as JSON backup
 */
export const downloadBackup = async () => {
  try {
    const data = await exportAllData();

    // Create filename with current date
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    const filename = `cleanmaster-backup-${dateStr}-${timeStr}.json`;

    downloadJSON(data, filename);

    return { success: true, filename };
  } catch (error) {
    console.error('Error downloading backup:', error);
    throw error;
  }
};

/**
 * Format bytes to human readable size
 * @param {number} bytes
 * @returns {string}
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get backup info (size, count)
 */
export const getBackupInfo = async () => {
  try {
    const data = await exportAllData();
    const json = JSON.stringify(data);
    const size = new Blob([json]).size;

    // Count total orders
    const ordersCount = Object.values(data.orders).reduce((total, ordersList) => {
      return total + (Array.isArray(ordersList) ? ordersList.length : 0);
    }, 0);

    return {
      size: formatBytes(size),
      ordersCount,
      servicesCount: data.services?.length || 0,
      clientsCount: data.clients?.length || 0,
      employeesCount: data.employees?.length || 0,
      exportedAt: data.exportedAt
    };
  } catch (error) {
    console.error('Error getting backup info:', error);
    throw error;
  }
};
