import React, { useEffect, useState, useRef } from 'react';

// Global state variables for image slot persistence
let globalSlotsState: Record<string, { u: string; s: number; x: number; y: number }> = {};
let globalLoaded = false;
let globalLoadPromise: Promise<void> | null = null;
const globalListeners = new Set<() => void>();

function notifyListeners() {
  globalListeners.forEach((listener) => listener());
}

async function loadGlobalSlots() {
  if (globalLoaded) return;
  if (globalLoadPromise) return globalLoadPromise;

  globalLoadPromise = fetch('/.image-slots.state.json')
    .then((r) => (r.ok ? r.json() : {}))
    .then((data: unknown) => {
      const record = data as Record<string, string | { u: string; s: number; x: number; y: number }>;
      const normalized: Record<string, { u: string; s: number; x: number; y: number }> = {};
      for (const k in record) {
        const val = record[k];
        normalized[k] = typeof val === 'string' ? { u: val, s: 1, x: 0, y: 0 } : val;
      }
      globalSlotsState = normalized;
      globalLoaded = true;
      notifyListeners();
    })
    .catch((err) => {
      console.error('Failed to load image slots sidecar:', err);
      globalLoaded = true;
      notifyListeners();
    });

  return globalLoadPromise;
}

function saveGlobalSlots() {
  const w = (window as unknown as { omelette?: { writeFile: (path: string, data: string) => Promise<void> } }).omelette?.writeFile;
  if (!w) return;
  w('.image-slots.state.json', JSON.stringify(globalSlotsState, null, 2))
    .catch((err: unknown) => console.error('Failed to save image slots sidecar:', err));
}

interface ImageSlotProps {
  id: string;
  shape?: 'rect' | 'circle' | 'rounded';
  radius?: number | string;
  placeholder?: string;
  credit?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  style?: React.CSSProperties;
}

export const ImageSlot: React.FC<ImageSlotProps> = ({
  id,
  shape = 'rect',
  radius,
  placeholder = 'Drop an image or browse files',
  credit,
  objectFit = 'cover',
  style
}) => {
  const [slotsState, setSlotsState] = useState<Record<string, { u: string; s: number; x: number; y: number }>>({});
  const [isReframe, setIsReframe] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track panning state
  const isDragging = useRef(false);
  const startDragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGlobalSlots();
    
    const onChange = () => {
      setSlotsState({ ...globalSlotsState });
    };
    
    globalListeners.add(onChange);
    onChange();
    
    return () => {
      globalListeners.delete(onChange);
    };
  }, []);

  const slotData = slotsState[id]; // { u, s, x, y }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const processFile = async (file: File) => {
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/avif'].includes(file.type)) {
      alert('Only PNG, JPEG, WebP, and AVIF files are supported.');
      return;
    }
    
    try {
      const bitmap = await createImageBitmap(file);
      const MAX_DIM = 1200;
      const targetW = containerRef.current?.getBoundingClientRect().width || 600;
      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)));
      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(bitmap, 0, 0, w, h);
      
      const u = canvas.toDataURL('image/webp', 0.85);
      
      globalSlotsState[id] = { u, s: 1, x: 0, y: 0 };
      notifyListeners();
      saveGlobalSlots();
      bitmap.close();
    } catch (err) {
      console.error('Failed to process image file:', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isReframe || e.button !== 0) return;
    isDragging.current = true;
    startDragOffset.current = {
      x: e.clientX - (slotData?.x || 0),
      y: e.clientY - (slotData?.y || 0)
    };
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !slotData) return;
    const newX = e.clientX - startDragOffset.current.x;
    const newY = e.clientY - startDragOffset.current.y;
    
    globalSlotsState[id] = {
      ...slotData,
      x: newX,
      y: newY
    };
    notifyListeners();
  };

  const handleMouseUp = () => {
    if (isDragging.current) {
      isDragging.current = false;
      saveGlobalSlots();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!isReframe || !slotData) return;
    e.preventDefault();
    const zoomFactor = 0.05;
    const delta = -e.deltaY;
    const currentScale = slotData.s || 1;
    const newScale = Math.max(1, Math.min(5, currentScale + (delta > 0 ? zoomFactor : -zoomFactor)));
    
    globalSlotsState[id] = {
      ...slotData,
      s: newScale
    };
    notifyListeners();
    saveGlobalSlots();
  };

  const isUnsplash = credit?.toLowerCase().includes('unsplash') || false;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    delete globalSlotsState[id];
    notifyListeners();
    saveGlobalSlots();
  };

  const handleTriggerBrowse = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const containerShapeStyle: React.CSSProperties = {
    borderRadius: shape === 'circle' ? '50%' : shape === 'rounded' ? (typeof radius === 'number' ? `${radius}px` : radius || '8px') : '0px',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    height: '100%',
    background: 'rgba(127,127,127,0.08)',
    outline: isOver ? '2px dashed var(--accent)' : 'none',
    transition: 'outline 0.15s ease',
    ...style
  };

  const imgStyle: React.CSSProperties = slotData ? {
    position: 'absolute',
    left: '50%',
    top: '50%',
    maxWidth: objectFit === 'contain' ? '100%' : 'none',
    maxHeight: objectFit === 'contain' ? '100%' : 'none',
    transform: `translate(calc(-50% + ${slotData.x || 0}px), calc(-50% + ${slotData.y || 0}px)) scale(${slotData.s || 1})`,
    userSelect: 'none',
    pointerEvents: isReframe ? 'auto' : 'none',
    cursor: isReframe ? 'grab' : 'default',
    width: '100%',
    height: '100%',
    objectFit: objectFit,
  } : {};

  return (
    <div
      ref={containerRef}
      style={containerShapeStyle}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={() => slotData && setIsReframe(!isReframe)}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/webp, image/avif"
        style={{ display: 'none' }}
      />

      {slotData ? (
        <>
          <img
            src={slotData.u}
            alt={placeholder}
            style={imgStyle}
            draggable={false}
          />

          {/* Hover controls overlay */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              display: 'flex',
              gap: '6px',
              zIndex: 10,
              pointerEvents: 'auto'
            }}
            className="image-slot-controls"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsReframe(!isReframe);
              }}
              style={{
                background: 'rgba(0,0,0,0.65)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
                transition: 'background 0.2s'
              }}
            >
              {isReframe ? 'Done' : 'Reframe'}
            </button>
            <button
              type="button"
              onClick={handleTriggerBrowse}
              style={{
                background: 'rgba(0,0,0,0.65)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
                transition: 'background 0.2s'
              }}
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'rgba(0,0,0,0.65)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
                transition: 'background 0.2s'
              }}
            >
              Clear
            </button>
          </div>

          {/* Credit attribution label */}
          {credit && (
            <div
              style={{
                position: 'absolute',
                left: '6px',
                bottom: '6px',
                padding: '3px 7px',
                borderRadius: '5px',
                background: 'rgba(0,0,0,0.55)',
                color: '#fff',
                fontSize: '10px',
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(6px)',
                zIndex: 5
              }}
            >
              {isUnsplash ? (
                <a
                  href="https://unsplash.com/?utm_source=claude_design&utm_medium=referral"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {credit}
                </a>
              ) : (
                credit
              )}
            </div>
          )}
        </>
      ) : (
        <div
          onClick={handleTriggerBrowse}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            textAlign: 'center',
            padding: '12px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.45, color: 'var(--text-muted)' }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span style={{ fontSize: '13px', fontWeight: 500, opacity: 0.75, color: 'var(--text-muted)' }}>
            {placeholder}
          </span>
          <span style={{ fontSize: '11px', opacity: 0.6, color: 'var(--text-muted)' }}>
            Drop an image or <u>browse files</u>
          </span>
        </div>
      )}
    </div>
  );
};
