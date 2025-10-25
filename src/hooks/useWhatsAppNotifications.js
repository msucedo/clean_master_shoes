import { useEffect, useRef } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Hook para detectar nuevos mensajes de WhatsApp y reproducir sonido de notificación
 */
export const useWhatsAppNotifications = () => {
  // Guardar el último timestamp conocido por orden
  const lastMessageTimestamps = useRef(new Map());
  const audioContext = useRef(null);
  const isInitialized = useRef(false);

  // Función para reproducir sonido de notificación
  const playNotificationSound = () => {
    try {
      // Crear AudioContext si no existe
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const ctx = audioContext.current;
      const now = ctx.currentTime;

      // Crear un sonido de notificación simple (dos tonos)
      const createTone = (frequency, startTime, duration) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Envelope para suavizar el sonido
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Dos tonos: uno alto y uno bajo (como WhatsApp)
      createTone(800, now, 0.15);
      createTone(600, now + 0.15, 0.15);

      console.log('🔔 Sonido de notificación reproducido');
    } catch (error) {
      console.error('❌ Error reproduciendo sonido:', error);
    }
  };

  useEffect(() => {
    console.log('📱 Iniciando listener de notificaciones de WhatsApp...');

    // Suscribirse a cambios en todas las órdenes
    const ordersRef = collection(db, 'orders');
    const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const order = { id: change.doc.id, ...change.doc.data() };
          const lastIncomingMessageAt = order.lastIncomingMessageAt;

          // Solo procesar si hay timestamp de mensaje entrante
          if (lastIncomingMessageAt) {
            const previousTimestamp = lastMessageTimestamps.current.get(order.id);

            // Si es un nuevo mensaje (timestamp diferente al anterior)
            if (previousTimestamp && previousTimestamp !== lastIncomingMessageAt) {
              console.log('💬 Nuevo mensaje recibido en orden:', order.orderNumber || order.id);
              playNotificationSound();
            }

            // Actualizar el timestamp conocido
            lastMessageTimestamps.current.set(order.id, lastIncomingMessageAt);
          }
        } else if (change.type === 'added' && isInitialized.current) {
          // Solo inicializar timestamps en el primer snapshot
          const order = { id: change.doc.id, ...change.doc.data() };
          if (order.lastIncomingMessageAt) {
            lastMessageTimestamps.current.set(order.id, order.lastIncomingMessageAt);
          }
        }
      });

      // Marcar como inicializado después del primer snapshot
      if (!isInitialized.current) {
        isInitialized.current = true;
        console.log('✅ Listener de WhatsApp inicializado');
      }
    });

    // Cleanup
    return () => {
      console.log('🔇 Deteniendo listener de notificaciones de WhatsApp');
      unsubscribe();
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);
};
