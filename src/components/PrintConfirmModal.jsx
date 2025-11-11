/**
 * PrintConfirmModal Component
 * Shown after creating order on mobile/iOS
 * Asks if user wants to print ticket on local PC printer
 */

import './PrintConfirmModal.css';

const PrintConfirmModal = ({ isOpen, onConfirm, onCancel, orderNumber }) => {
  if (!isOpen) return null;

  return (
    <div className="print-confirm-overlay">
      <div className="print-confirm-modal">
        <div className="print-confirm-header">
          <div className="print-confirm-icon">🖨️</div>
          <h3 className="print-confirm-title">Imprimir Ticket</h3>
        </div>

        <div className="print-confirm-body">
          <p className="print-confirm-message">
            ¿Deseas imprimir el ticket de recepción{orderNumber ? ` #${orderNumber}` : ''} en la impresora del local?
          </p>

          <div className="print-confirm-info">
            <div className="info-item">
              <span className="info-icon">📍</span>
              <span className="info-text">Se enviará a la PC del local</span>
            </div>
            <div className="info-item">
              <span className="info-icon">⚡</span>
              <span className="info-text">Impresión automática</span>
            </div>
          </div>
        </div>

        <div className="print-confirm-actions">
          <button
            className="btn-print-confirm"
            onClick={onConfirm}
          >
            Sí, imprimir
          </button>
          <button
            className="btn-print-cancel"
            onClick={onCancel}
          >
            No, gracias
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintConfirmModal;
