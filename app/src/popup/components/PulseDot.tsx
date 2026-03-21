import React from 'react';
import { Status } from '../App';

interface PulseDotProps {
  status: Status;
}

export function PulseDot({ status }: PulseDotProps) {
  const color = { idle: '#94a3b8', loading: '#f59e0b', success: '#22c55e', error: '#ef4444' }[status];
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, flexShrink: 0 }}>
      {(status === 'loading' || status === 'success') && (
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: 0.4,
          animation: 'status-ping 1.2s ease-out infinite',
        }} />
      )}
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'block', position: 'relative' }} />
    </span>
  );
}