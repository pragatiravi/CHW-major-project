import { useState, useEffect } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { startVoiceRecognition, stopVoiceRecognition, isSpeechRecognitionSupported } from '../../lib/speech/speechRecognition';
import { useLanguage } from './LanguageContext';
import { useToast } from './ToastContainer';

export default function VoiceInputButton({
  onTranscript,
  title = 'Voice Input',
  className = '',
  size = 14
}) {
  const { language } = useLanguage();
  const { toastInfo, toastError } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [supported] = useState(() => isSpeechRecognitionSupported());

  useEffect(() => {
    return () => {
      stopVoiceRecognition();
    };
  }, []);

  const handleToggleListening = () => {
    if (!supported) {
      toastError('Voice speech input is not supported by your browser. Please type manually.');
      return;
    }

    if (isListening) {
      stopVoiceRecognition();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    toastInfo(`Listening in ${language === 'kn' ? 'Kannada' : language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English'}... Speak now.`);

    startVoiceRecognition({
      lang: language,
      onResult: ({ transcript, parsedNumbers }) => {
        setIsListening(false);
        if (onTranscript) {
          onTranscript(transcript, parsedNumbers);
        }
      },
      onError: (err) => {
        setIsListening(false);
        console.warn('Voice input error:', err);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={handleToggleListening}
      className={`btn-icon-xs transition-all ${
        isListening 
          ? 'bg-rose-500 text-white animate-pulse shadow-md border-rose-600' 
          : 'bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-sky-700'
      } ${className}`}
      title={isListening ? 'Stop listening' : `${title} (${language.toUpperCase()})`}
      aria-label={isListening ? 'Stop listening' : title}
    >
      {isListening ? <Loader2 size={size} className="animate-spin" /> : <Mic size={size} />}
    </button>
  );
}
