import React from 'react';
import { useTranslation } from 'react-i18next';

const RiskBadge = ({ tag, message, size = 'md' }) => {
  const { t } = useTranslation();

  const getBadgeStyles = () => {
    switch (tag) {
      case 'RED': return 'bg-safety-red text-white';
      case 'AMBER': return 'bg-safety-amber text-white';
      case 'GREEN': return 'bg-safety-green text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm': return 'text-xs px-2 py-1';
      case 'lg': return 'text-base px-4 py-2';
      case 'md':
      default: return 'text-sm px-3 py-1';
    }
  };

  const getLabel = () => {
    switch (tag) {
      case 'RED': return t('red_badge');
      case 'AMBER': return t('amber_badge');
      case 'GREEN': return t('green_badge');
      default: return tag;
    }
  };

  return (
    <div className="inline-flex flex-col items-center group relative">
      <div 
        className={`rounded-full font-bold uppercase ${getBadgeStyles()} ${getSizeStyles()} cursor-help`}
        title={message}
      >
        {getLabel()}
      </div>
      {message && (
        <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10 text-center">
          {message}
        </div>
      )}
      <div className="mt-1 text-[10px] text-gray-500 uppercase tracking-wider text-center">
        {t('ai_advisory')}
      </div>
    </div>
  );
};

export default RiskBadge;
