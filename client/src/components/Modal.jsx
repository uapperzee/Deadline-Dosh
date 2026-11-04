import React, { useEffect } from 'react';

export function Modal({ isOpen, onClose, title, children, maxWidth = '580px' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div
        className="modal-dialog"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="row between mb" style={{ borderBottom: '1px solid var(--bd)', paddingBottom: '12px' }}>
            <h2 id="modal-title">{title}</h2>
            <button
              className="ghost"
              onClick={onClose}
              aria-label="Close dialog"
              style={{ padding: '4px 8px', minWidth: 'auto', borderRadius: '50%' }}
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
