import React from 'react';

// ─── Design System shim ───────────────────────────────────────────────────────
// The proprietary _ds_bundle.js expects a UMD global React which conflicts with
// Vite's ESM module graph. We provide high-fidelity native fallback components
// that match the DS visual style exactly, without depending on the external bundle.
// ──────────────────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outline' | 'ghost' | 'subtle' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'filled',
  size = 'md',
  block = false,
  disabled = false,
  iconLeft,
  iconRight,
  style,
  ...rest
}) => {
  const height = size === 'lg' ? '52px' : size === 'sm' ? '36px' : '44px';
  const padding = size === 'lg' ? '0 28px' : size === 'sm' ? '0 14px' : '0 20px';
  const fontSize = size === 'lg' ? '16px' : size === 'sm' ? '13px' : '14.5px';

  const bgMap: Record<string, string> = {
    filled: 'var(--brand, #0A2342)',
    outline: 'transparent',
    ghost: 'transparent',
    subtle: 'rgba(10,35,66,0.06)',
    danger: '#DC2626',
  };
  const colorMap: Record<string, string> = {
    filled: '#fff',
    outline: 'var(--brand, #0A2342)',
    ghost: '#3F4A5A',
    subtle: '#0A2342',
    danger: '#fff',
  };
  const borderMap: Record<string, string> = {
    filled: '1.5px solid transparent',
    outline: '1.5px solid var(--brand, #0A2342)',
    ghost: '1.5px solid transparent',
    subtle: '1.5px solid transparent',
    danger: '1.5px solid transparent',
  };

  const baseStyle: React.CSSProperties = {
    display: block ? 'flex' : 'inline-flex',
    width: block ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height,
    padding,
    fontSize,
    fontFamily: 'var(--font-body, "Outfit", sans-serif)',
    fontWeight: 600,
    letterSpacing: '0.01em',
    borderRadius: '10px',
    border: borderMap[variant] ?? borderMap.filled,
    background: bgMap[variant] ?? bgMap.filled,
    color: colorMap[variant] ?? colorMap.filled,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
    transition: 'background 0.2s, color 0.2s, box-shadow 0.2s, opacity 0.2s',
    textDecoration: 'none',
    boxSizing: 'border-box',
    ...style,
  };

  return (
    <button {...rest} disabled={disabled} style={baseStyle}>
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
};

export const Input: React.FC<InputProps> = ({ label, style, ...rest }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label style={{
          fontSize: '13px',
          fontWeight: 500,
          color: '#3F4A5A',
          fontFamily: 'var(--font-body, "Outfit", sans-serif)',
        }}>
          {label}
        </label>
      )}
      <input
        {...rest}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          height: '44px',
          padding: '0 14px',
          borderRadius: '10px',
          border: '1.5px solid #D1D9E6',
          fontFamily: 'var(--font-body, "Outfit", sans-serif)',
          fontSize: '14.5px',
          color: '#1F2937',
          background: '#fff',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--brand, #0A2342)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(10,35,66,0.10)';
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#D1D9E6';
          e.currentTarget.style.boxShadow = 'none';
          rest.onBlur?.(e);
        }}
      />
    </div>
  );
};
