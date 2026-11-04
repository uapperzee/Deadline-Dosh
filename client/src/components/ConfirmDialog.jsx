import React from 'react';
import { Modal } from './Modal.jsx';

export function ConfirmDialog({ isOpen, onClose, onConfirm, title = 'Please confirm', message, confirmText = 'Delete', danger = true }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="480px">
      <p style={{ margin: '12px 0 20px', lineHeight: 1.6 }}>{message}</p>
      <div className="row end">
        <button type="button" className="ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn"
          style={danger ? { background: 'var(--err)', color: '#fff' } : {}}
          onClick={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
