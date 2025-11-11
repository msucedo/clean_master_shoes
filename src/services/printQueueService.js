/**
 * Print Queue Service
 * Manages remote printing via Firebase
 *
 * Flow:
 * 1. Mobile device creates order → adds to print queue
 * 2. Desktop PC (local) listens to queue → prints automatically
 * 3. Desktop marks job as completed
 */

import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'printQueue';

/**
 * Generate unique device ID (stored in localStorage)
 */
const getDeviceId = () => {
  const STORAGE_KEY = 'device_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);

  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, deviceId);
  }

  return deviceId;
};

/**
 * Add a print job to the queue
 * Called from mobile/iOS after creating an order
 *
 * @param {string} orderId - Firestore order ID
 * @param {string} orderNumber - Order number for display
 * @param {string} ticketType - 'receipt' or 'delivery'
 * @returns {Promise<string>} Job ID
 */
export const addPrintJob = async (orderId, orderNumber, ticketType = 'receipt') => {
  try {
    const jobData = {
      orderId,
      orderNumber,
      ticketType,
      status: 'pending',
      createdAt: serverTimestamp(),
      createdBy: getDeviceId(),
      assignedTo: null,
      completedAt: null,
      error: null
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), jobData);

    console.log('📤 Print job added to queue:', docRef.id);

    return docRef.id;
  } catch (error) {
    console.error('Error adding print job:', error);
    throw error;
  }
};

/**
 * Subscribe to pending print jobs
 * Used by desktop PC to listen for new jobs
 *
 * @param {Function} callback - Called when new jobs arrive
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPrintQueue = (callback) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const job = {
            id: change.doc.id,
            ...change.doc.data()
          };

          console.log('📥 New print job detected:', job.id, job.orderNumber);
          callback(job);
        }
      });
    }, (error) => {
      console.error('Error in print queue subscription:', error);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to print queue:', error);
    throw error;
  }
};

/**
 * Claim a print job (mark as 'printing')
 * Desktop PC claims the job before printing
 *
 * @param {string} jobId - Job ID to claim
 * @returns {Promise<boolean>} Success
 */
export const claimPrintJob = async (jobId) => {
  try {
    const jobRef = doc(db, COLLECTION_NAME, jobId);

    await updateDoc(jobRef, {
      status: 'printing',
      assignedTo: getDeviceId(),
      claimedAt: serverTimestamp()
    });

    console.log('🔒 Print job claimed:', jobId);
    return true;
  } catch (error) {
    console.error('Error claiming print job:', error);
    return false;
  }
};

/**
 * Mark print job as completed
 *
 * @param {string} jobId - Job ID
 * @returns {Promise<boolean>} Success
 */
export const completePrintJob = async (jobId) => {
  try {
    const jobRef = doc(db, COLLECTION_NAME, jobId);

    await updateDoc(jobRef, {
      status: 'completed',
      completedAt: serverTimestamp()
    });

    console.log('✅ Print job completed:', jobId);
    return true;
  } catch (error) {
    console.error('Error completing print job:', error);
    return false;
  }
};

/**
 * Mark print job as failed
 *
 * @param {string} jobId - Job ID
 * @param {string} errorMessage - Error description
 * @returns {Promise<boolean>} Success
 */
export const failPrintJob = async (jobId, errorMessage) => {
  try {
    const jobRef = doc(db, COLLECTION_NAME, jobId);

    await updateDoc(jobRef, {
      status: 'failed',
      error: errorMessage,
      failedAt: serverTimestamp()
    });

    console.log('❌ Print job failed:', jobId, errorMessage);
    return true;
  } catch (error) {
    console.error('Error failing print job:', error);
    return false;
  }
};

/**
 * Get recent print jobs (for monitoring UI)
 *
 * @param {number} limitCount - Max jobs to retrieve
 * @returns {Promise<Array>} Recent jobs
 */
export const getRecentPrintJobs = async (limitCount = 10) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting recent print jobs:', error);
    return [];
  }
};

/**
 * Get device ID (for debugging)
 */
export const getCurrentDeviceId = () => {
  return getDeviceId();
};
