import { useState, useRef, useEffect } from 'react';
import { Languages, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from './LanguageContext';

export default function LanguageSwitcher({ variant = 'compact' }) {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = languages.find(l => l.code === language) || languages[0];

  if (variant === 'segmented') {
    return (
      <div 
        className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 gap-1"
        role="group"
        aria-label="Select language"
      >
        {languages.map(l => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLanguage(l.code)}
            aria-pressed={language === l.code}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center ${
              language === l.code
                ? 'bg-white text-sky-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            style={{ minHeight: '38px', minWidth: '48px' }}
          >
            {l.native}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Language selector. Current language: ${current.label}`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs"
        style={{ minHeight: '40px' }}
      >
        <Languages size={15} className="text-sky-600 flex-shrink-0" />
        <span className="font-bold">{current.native}</span>
        <span className="text-slate-400 font-normal">({current.code.toUpperCase()})</span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95"
          role="listbox"
          aria-label="Available languages"
        >
          {languages.map(l => {
            const isSelected = language === l.code;
            return (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLanguage(l.code);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between transition-colors ${
                  isSelected ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
                style={{ minHeight: '44px' }}
              >
                <div>
                  <span className="block text-xs font-bold">{l.native}</span>
                  <span className="text-3xs text-slate-500">{l.label}</span>
                </div>
                {isSelected && <Check size={14} className="text-sky-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
