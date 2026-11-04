import React from 'react';
import { useData } from '../context/DataContext.jsx';

export function Toast() {
  const { toastMessage, toastVisible } = useData();

  return (
    <div
      id="toast"
      className={toastVisible ? 'on' : ''}
      role="status"
      aria-live="polite"
    >
      {toastMessage}
    </div>
  );
}
