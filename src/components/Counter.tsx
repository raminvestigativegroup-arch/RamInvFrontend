import React, { useEffect, useRef, useState } from 'react';

interface CounterProps {
  value: string;
  style?: React.CSSProperties;
  className?: string;
}

export const Counter: React.FC<CounterProps> = ({ value, style, className }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const m = value.match(/([\d.]+)/);
    if (!m) {
      setDisplayValue(value);
      return;
    }

    const target = parseFloat(m[1]);
    const dec = (m[1].split('.')[1] || '').length;
    const pre = value.slice(0, m.index);
    const post = value.slice((m.index || 0) + m[1].length);

    let animated = false;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting || animated) return;
        animated = true;
        observer.unobserve(el);

        const t0 = performance.now();
        const tick = (now: number) => {
          const k = Math.min(1, (now - t0) / 1100);
          const eased = 1 - Math.pow(1 - k, 3); // Cubic ease out
          const currentVal = (target * eased).toFixed(dec);
          setDisplayValue(`${pre}${currentVal}${post}`);
          if (k < 1) {
            requestAnimationFrame(tick);
          } else {
            setDisplayValue(value);
          }
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.2 });

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [value]);

  return (
    <span ref={ref} style={style} className={className}>
      {displayValue}
    </span>
  );
};
