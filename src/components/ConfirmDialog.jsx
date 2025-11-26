import { useEffect, useState } from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'default'
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      // Prevent closing while processing
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isProcessing, onCancel]);

  // Reset processing state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    // Prevent closing while processing
    if (e.target === e.currentTarget && !isProcessing) {
      onCancel();
    }
  };

  const handleConfirm = async () => {
    if (isProcessing) return; // Prevent multiple clicks

    setIsProcessing(true);
    try {
      // Execute onConfirm and wait if it's a promise
      await Promise.resolve(onConfirm());
    } catch (error) {
      console.error('Error in confirm action:', error);
      // Even if there's an error, we reset the processing state
      // The error should be handled by the calling component
    } finally {
      // Note: We don't reset isProcessing here because the dialog
      // should close after onConfirm completes. The useEffect will
      // reset it when isOpen becomes false.
    }
  };

  return (
    <div className="confirm-backdrop" onClick={handleBackdropClick}>
      <div className={`confirm-dialog confirm-${type}`}>
        <div className="confirm-header">
          <h3 className="confirm-title">{title}</h3>
        </div>
        <div className="confirm-body">
          <p className="confirm-message">{message}</p>
        </div>
        <div className="confirm-footer">
          <button
            className="confirm-btn confirm-btn-cancel"
            onClick={onCancel}
            disabled={isProcessing}
          >
            {cancelText}
          </button>
          <button
            className={`confirm-btn confirm-btn-confirm confirm-btn-${type}`}
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="confirm-spinner"></span>
                Guardando...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
