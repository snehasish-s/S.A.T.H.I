import React from 'react';
import { useTranslation } from 'react-i18next';

const BodyMap = ({ selectedParts, onToggle }) => {
  const { t } = useTranslation();

  const parts = [
    { id: 'head', cx: 150, cy: 40, r: 25 },
    { id: 'chest', cx: 150, cy: 110, r: 35 },
    { id: 'abdomen', cx: 150, cy: 190, r: 30 },
    { id: 'left_arm', cx: 90, cy: 130, r: 20, ry: 60, isEllipse: true },
    { id: 'right_arm', cx: 210, cy: 130, r: 20, ry: 60, isEllipse: true },
    { id: 'left_leg', cx: 120, cy: 280, r: 22, ry: 80, isEllipse: true },
    { id: 'right_leg', cx: 180, cy: 280, r: 22, ry: 80, isEllipse: true },
  ];

  return (
    <div className="flex flex-col items-center">
      <p className="mb-4 text-sm text-gray-600">{t('select_area')}</p>
      <svg viewBox="0 0 300 400" className="w-full max-w-xs border border-gray-200 bg-white rounded shadow-sm p-4">
        {parts.map(part => {
          const isSelected = selectedParts.includes(part.id);
          const className = `cursor-pointer transition-colors duration-200 ${
            isSelected ? 'fill-sahayak-teal' : 'fill-gray-200 hover:fill-gray-300'
          }`;

          return part.isEllipse ? (
            <ellipse
              key={part.id}
              cx={part.cx}
              cy={part.cy}
              rx={part.r}
              ry={part.ry}
              className={className}
              onClick={() => onToggle(part.id)}
              role="button"
              aria-label={t(part.id)}
            />
          ) : (
            <circle
              key={part.id}
              cx={part.cx}
              cy={part.cy}
              r={part.r}
              className={className}
              onClick={() => onToggle(part.id)}
              role="button"
              aria-label={t(part.id)}
            />
          );
        })}
        {/* Simple connecting lines to make it look like a body structure (optional, purely aesthetic) */}
        <line x1="150" y1="65" x2="150" y2="75" stroke="#ccc" strokeWidth="20" />
        <line x1="150" y1="145" x2="150" y2="160" stroke="#ccc" strokeWidth="40" />
      </svg>
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {parts.map(part => (
          <button
            key={`btn-${part.id}`}
            type="button"
            onClick={() => onToggle(part.id)}
            className={`px-3 py-1 text-xs rounded-full border ${
              selectedParts.includes(part.id)
                ? 'bg-sahayak-teal text-white border-sahayak-teal'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t(part.id)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BodyMap;
