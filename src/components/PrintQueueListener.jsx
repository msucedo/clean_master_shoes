/**
 * PrintQueueListener Component
 * Runs on Desktop PC to automatically print tickets from remote devices
 *
 * Usage: Add to App.jsx or Dashboard, only renders on desktop
 */

import { useEffect, useState } from 'react';
import {
  subscribeToPrintQueue,
  claimPrintJob,
  completePrintJob,
  failPrintJob
} from '../services/printQueueService';
import { getOrderById } from '../services/firebaseService';
import { printTicket } from '../services/printService';
import { getPrinterMethodPreference, PRINTER_METHODS } from '../utils/printerConfig';

const PrintQueueListener = () => {
  const [isListening, setIsListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [printerMethod, setPrinterMethod] = useState(() => getPrinterMethodPreference());

  // Effect 1: Escuchar cambios en el método de impresión
  useEffect(() => {
    const handleMethodChange = (event) => {
      const newMethod = event.detail.method;
      console.log('🔄 PrintQueueListener: Method changed to', newMethod);
      setPrinterMethod(newMethod);
    };

    window.addEventListener('printerMethodChanged', handleMethodChange);

    return () => {
      window.removeEventListener('printerMethodChanged', handleMethodChange);
    };
  }, []);

  // Effect 2: Iniciar/detener listener según el método actual
  useEffect(() => {
    // Block iOS devices (Safari doesn't support Web Bluetooth API)
    // But allow Android devices to listen (they can use Web Bluetooth)
    const userAgent = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

    if (isIOS) {
      console.log('📱 PrintQueueListener: Skipping on iOS device (Web Bluetooth not supported)');
      return;
    }

    // Only listen to queue if printer method is Bluetooth
    // If method is "Queue", this device is just sending jobs, not processing them
    if (printerMethod !== PRINTER_METHODS.BLUETOOTH && printerMethod !== 'bluetooth') {
      console.log('⏸️  PrintQueueListener: Skipping (printer method is not Bluetooth, current:', printerMethod, ')');
      setIsListening(false);
      return;
    }

    console.log('🖨️  PrintQueueListener: Starting listener (Desktop/Android)...');
    setIsListening(true);

    // Subscribe to print queue
    const unsubscribe = subscribeToPrintQueue(async (job) => {
      await handlePrintJob(job);
    });

    return () => {
      console.log('🛑 PrintQueueListener: Stopping');
      setIsListening(false);
      unsubscribe();
    };
  }, [printerMethod]);

  /**
   * Handle a print job from the queue
   */
  const handlePrintJob = async (job) => {
    // Prevent concurrent processing
    if (processing) {
      console.log('⏸️  Already processing a job, skipping:', job.id);
      return;
    }

    setProcessing(true);

    try {
      console.log(`🖨️  Processing print job #${job.orderNumber}...`);

      // 1. Claim the job
      const claimed = await claimPrintJob(job.id);
      if (!claimed) {
        console.warn('⚠️  Failed to claim job:', job.id);
        setProcessing(false);
        return;
      }

      // 2. Get full order data from Firestore
      const order = await getOrderById(job.orderId);

      if (!order) {
        throw new Error(`Order not found: ${job.orderId}`);
      }

      // 3. Print the ticket
      const printResult = await printTicket(order, job.ticketType, {
        method: 'bluetooth', // Force Bluetooth for desktop auto-print
        allowFallback: false
      });

      if (!printResult.success) {
        throw new Error(printResult.error || 'Print failed');
      }

      // 3.5. Register print in Firebase history
      const { addPrintRecord } = await import('../services/firebaseService');
      const printData = {
        type: job.ticketType,
        printedAt: new Date().toISOString(),
        printedBy: 'queue',
        deviceInfo: `Bluetooth (${printResult.deviceName || 'Desktop Printer'})`
      };
      await addPrintRecord(job.orderId, printData);

      // 4. Mark as completed
      await completePrintJob(job.id);

      console.log(`✅ Print job #${job.orderNumber} completed successfully`);

    } catch (error) {
      console.error(`❌ Print job #${job.orderNumber} failed:`, error);

      // Mark as failed with error message
      await failPrintJob(job.id, error.message);

    } finally {
      setProcessing(false);
    }
  };

  // This component doesn't render anything
  // It just runs in the background

  // Optional: render status indicator for debugging
  if (import.meta.env.DEV && isListening) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: '#10b981',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
      >
        🖨️ Print Queue: {processing ? 'Printing...' : 'Listening'}
      </div>
    );
  }

  return null;
};

export default PrintQueueListener;
