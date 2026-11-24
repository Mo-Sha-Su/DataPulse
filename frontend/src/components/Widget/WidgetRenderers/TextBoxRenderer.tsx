import React, { useState } from 'react';
import { WidgetConfig } from '../../../types/dashboard';
import { useLanguage } from '../../../i18n/LanguageContext';

interface Props {
  config: WidgetConfig;
  isPreviewMode?: boolean;
  onUpdateConfig?: (newConfig: Partial<WidgetConfig>) => void;
}

const getFontFamilyCss = (family?: string) => {
  switch (family) {
    case 'serif':
      return 'Georgia, Cambria, "Times New Roman", Times, serif';
    case 'mono':
      return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    case 'display':
      return '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';
    case 'cursive':
      return '"Caveat", "Comic Sans MS", cursive';
    case 'sans':
    default:
      return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  }
};

export const TextBoxRenderer: React.FC<Props> = ({
  config,
  isPreviewMode = false,
  onUpdateConfig,
}) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const text = config.textContent ?? config.title ?? t('textBoxDefaultPrompt');

  const fontStyle: React.CSSProperties = {
    fontSize: `${config.fontSize || 18}px`,
    fontFamily: getFontFamilyCss(config.fontFamily),
    fontWeight: config.isBold ? 'bold' : 'normal',
    fontStyle: config.isItalic ? 'italic' : 'normal',
    textAlign: config.textAlign || undefined,
    color: config.titleColor || '#0F172A',
    lineHeight: 1.4,
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsEditing(false);
    if (onUpdateConfig) {
      onUpdateConfig({ textContent: e.target.value, title: e.target.value });
    }
  };

  if (isEditing && !isPreviewMode) {
    return (
      <div className="w-full h-full p-1 flex flex-col justify-center">
        <textarea
          autoFocus
          dir="auto"
          defaultValue={text}
          onBlur={handleBlur}
          style={fontStyle}
          className="w-full h-full bg-white/95 border-2 border-sky-500 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none shadow-sm"
        />
      </div>
    );
  }

  return (
    <div
      onDoubleClick={() => {
        if (!isPreviewMode) setIsEditing(true);
      }}
      className="w-full h-full p-2 flex flex-col justify-center overflow-auto leading-relaxed group/text cursor-text"
      title={isPreviewMode ? undefined : t('textBoxEditTip')}
    >
      <div style={fontStyle} dir="auto" className="whitespace-pre-wrap break-words">
        {text}
      </div>
    </div>
  );
};
