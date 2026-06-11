'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

interface AnnotationPin {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
}

interface ImageAnnotationProps {
  imageUrl: string;
  imageId: string;
  annotations?: AnnotationPin[];
  onSave?: (annotations: AnnotationPin[]) => void;
  readOnly?: boolean;
}

export function ImageAnnotation({
  imageUrl,
  imageId,
  annotations: initialAnnotations = [],
  onSave,
  readOnly = false,
}: ImageAnnotationProps) {
  const [annotations, setAnnotations] = useState<AnnotationPin[]>(initialAnnotations);
  const [activeTool, setActiveTool] = useState<'select' | 'pin' | 'measure'>('select');

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || activeTool !== 'pin') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPin: AnnotationPin = {
      id: `pin-${Date.now()}`,
      x,
      y,
      label: `Pin ${annotations.length + 1}`,
      color: '#2EC4B2',
    };
    setAnnotations((prev) => [...prev, newPin]);
  };

  const handleSave = () => {
    onSave?.(annotations);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tool rail — per imaging.html reference */}
      {!readOnly && (
        <div className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg">
          {(['select', 'pin', 'measure'] as const).map((tool) => (
            <button
              key={tool}
              onClick={() => setActiveTool(tool)}
              className={`p-2 rounded-md transition-colors ${
                activeTool === tool
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon
                icon={
                  tool === 'select'
                    ? 'tabler:pointer'
                    : tool === 'pin'
                      ? 'tabler:map-pin'
                      : 'tabler:ruler-measure'
                }
                width={20}
              />
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700"
          >
            Save Annotations
          </button>
        </div>
      )}

      {/* Image canvas with annotation pins */}
      <div
        className="relative bg-black rounded-lg overflow-hidden cursor-crosshair"
        onClick={handleImageClick}
      >
        <img
          src={imageUrl}
          alt={`Dental image ${imageId}`}
          className="w-full h-auto"
        />
        {annotations.map((pin) => (
          <div
            key={pin.id}
            className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white flex items-center justify-center text-xs text-white"
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
              backgroundColor: pin.color,
            }}
            title={pin.label}
          >
            <Icon icon="tabler:map-pin" width={14} />
          </div>
        ))}
      </div>
    </div>
  );
}
