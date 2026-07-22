import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: '' | 'warning' | 'error';
  onDismiss?: () => void;
}

export function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    if (onDismiss) {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [onDismiss]);

  return (
    <div className={`toast ${type}`}>
      {message}
    </div>
  );
}
