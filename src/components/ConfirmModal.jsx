import React from 'react';

export default function ConfirmModal({ isOpen, title = "AttendTracker says", message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '90%', textAlign: 'center', backgroundColor: 'var(--card-bg)' }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '15px' }}>{title}</h3>
        <p style={{ fontSize: '18px', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={onConfirm}
            style={{ flex: 1, backgroundColor: 'var(--btn-cross)', color: 'var(--bg-color)', fontWeight: 'bold', padding: '10px', borderRadius: '8px' }}
          >
            Confirm
          </button>
          <button 
            onClick={onCancel}
            style={{ flex: 1, backgroundColor: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
