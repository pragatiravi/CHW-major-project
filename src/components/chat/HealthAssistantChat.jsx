import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Volume2, 
  AlertTriangle, 
  PhoneCall, 
  FileText, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  Info, 
  Sparkles
} from 'lucide-react';
import { detectClinicalRedFlag } from '../../lib/chat/redFlagDetector';
import { searchOfflineKnowledgeBase } from '../../lib/chat/offlineRetrieval';
import { logChatInteraction } from '../../lib/chat/chatLogger';
import { speakText, stopSpeech } from '../../lib/speech/speechSynthesis';
import VoiceInputButton from '../shared/VoiceInputButton';
import { useLanguage } from '../shared/LanguageContext';
import { useToast } from '../shared/ToastContainer';

let msgCounter = 1;
function createMessageId(prefix) {
  msgCounter += 1;
  return `${prefix}-${msgCounter}`;
}

function getCurrentTimeStr() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export default function HealthAssistantChat({ 
  currentUser, 
  patientContext = null, 
  embedded = false,
  onGenerateEmergencySlip = null
}) {
  const { language } = useLanguage();
  const { toastWarning } = useToast();

  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      sender: 'bot',
      text: getWelcomeMessage(language),
      timestamp: getCurrentTimeStr(),
      source: 'system'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [manualOffline, setManualOffline] = useState(false);
  const [consentLogging, setConsentLogging] = useState(false);
  const [activeEmergencySlip, setActiveEmergencySlip] = useState(null);

  const messagesEndRef = useRef(null);

  // Auto-detect online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopSpeech();
    };
  }, []);

  // Auto-scroll chat to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const effectiveMode = isOnline && !manualOffline ? 'online' : 'offline';

  const quickPrompts = getQuickPrompts(language);

  const handleSendMessage = async (queryText = null) => {
    const textToSend = (typeof queryText === 'string' ? queryText : inputText).trim();
    if (!textToSend || isTyping) return;

    const userMsg = {
      id: createMessageId('user'),
      sender: 'user',
      text: textToSend,
      timestamp: getCurrentTimeStr()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // =========================================================================
    // 1. DETERMINISTIC RED-FLAG DETECTOR (Runs BEFORE any AI or KB search)
    // =========================================================================
    const redFlagResult = detectClinicalRedFlag(textToSend, language);

    if (redFlagResult.isRedFlag) {
      setTimeout(async () => {
        const emergencyAlert = redFlagResult.alert;
        const botEmergencyMsg = {
          id: createMessageId('bot-emergency'),
          sender: 'bot',
          isEmergency: true,
          redFlagCategory: redFlagResult.category,
          matchedKeyword: redFlagResult.matchedKeyword,
          text: `${emergencyAlert.title}: ${emergencyAlert.warning}\n\n${emergencyAlert.action}`,
          emergencyData: emergencyAlert,
          timestamp: getCurrentTimeStr(),
          source: 'red_flag_engine'
        };

        setMessages(prev => [...prev, botEmergencyMsg]);
        setIsTyping(false);

        // Optional log if consent given
        await logChatInteraction({
          userId: currentUser?.id,
          language,
          mode: effectiveMode,
          userMessage: textToSend,
          botResponse: botEmergencyMsg.text,
          redFlagDetected: true,
          retrievedTopic: redFlagResult.category,
          consentGiven: consentLogging
        });
      }, 350);
      return;
    }

    // =========================================================================
    // 2. NORMAL FLOW: ONLINE (Vercel Serverless /api/chat) OR OFFLINE (Fuse.js)
    // =========================================================================
    if (effectiveMode === 'online') {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('supabase_auth_token') || 'session_client'}`,
            'x-chw-session': currentUser?.id || 'guest_user'
          },
          body: JSON.stringify({
            message: textToSend,
            language,
            context: {
              role: currentUser?.role || 'patient',
              patientName: patientContext?.name || null,
              riskTier: patientContext?.risk_tier || null
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const botMsg = {
            id: createMessageId('bot'),
            sender: 'bot',
            text: data.reply,
            timestamp: getCurrentTimeStr(),
            source: data.source || 'online_ai'
          };

          setMessages(prev => [...prev, botMsg]);
          setIsTyping(false);

          await logChatInteraction({
            userId: currentUser?.id,
            language,
            mode: 'online',
            userMessage: textToSend,
            botResponse: botMsg.text,
            redFlagDetected: false,
            retrievedTopic: null,
            consentGiven: consentLogging
          });
          return;
        }
      } catch (err) {
        console.warn('Online chat request failed, falling back to offline knowledge base:', err);
      }
    }

    // =========================================================================
    // 3. OFFLINE RETRIEVAL ENGINE (Fuse.js with honest fallback)
    // =========================================================================
    setTimeout(async () => {
      const retrievalResult = searchOfflineKnowledgeBase(textToSend, language);

      const botMsg = {
        id: createMessageId('bot-kb'),
        sender: 'bot',
        text: retrievalResult.answer,
        isFallback: retrievalResult.isFallback,
        topic: retrievalResult.topic,
        confidence: retrievalResult.confidence,
        timestamp: getCurrentTimeStr(),
        source: retrievalResult.isFallback ? 'offline_fallback' : 'offline_kb'
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);

      await logChatInteraction({
        userId: currentUser?.id,
        language,
        mode: 'offline',
        userMessage: textToSend,
        botResponse: botMsg.text,
        redFlagDetected: false,
        retrievedTopic: retrievalResult.topic,
        consentGiven: consentLogging
      });
    }, 450);
  };

  const handleReadAloud = (text) => {
    stopSpeech();
    speakText(text, {
      lang: language,
      onVoiceUnavailable: (missingLang) => {
        toastWarning(`Notice: Regional voice for "${missingLang}" not found on device. Audio will play via default voice.`);
      }
    });
  };

  const handleGenerateEmergencyReport = (msg) => {
    const reportData = {
      patientName: patientContext?.name || 'Frontline Patient',
      patientId: patientContext?.id || patientContext?.legacy_id || 'ID-EMERGENCY',
      village: patientContext?.village || 'Community Ward',
      trigger: msg.matchedKeyword || msg.redFlagCategory || 'Critical Vitals / Symptoms',
      detectedAt: new Date().toLocaleString(),
      reportedBy: currentUser?.name || 'CHW Healthcare Assistant',
      adviceGiven: 'Immediate 108 Emergency Ambulance Dispatch'
    };

    if (onGenerateEmergencySlip) {
      onGenerateEmergencySlip(reportData);
    } else {
      setActiveEmergencySlip(reportData);
    }
  };

  return (
    <div className={`health-assistant-chat-container ${embedded ? 'embedded' : ''}`}>
      {/* 1. CHAT HEADER & MODE INDICATOR */}
      <div className="chat-header">
        <div className="chat-header-identity">
          <div className="chat-avatar bot-avatar">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="chat-title">
              {language === 'kn' ? 'ಆರೋಗ್ಯ ಸಹಾಯಕ (Health Assistant)' :
               language === 'hi' ? 'स्वास्थ्य सहायक (Health Assistant)' :
               language === 'mr' ? 'आरोग्य सहाय्यक (Health Assistant)' :
               'CHW Health Assistant'}
            </h3>
            <span className="chat-subtitle">
              {language === 'kn' ? 'ಮಧುಮೇಹ ಮತ್ತು ರಕ್ತದೊತ್ತಡ ಕ್ಲಿನಿಕಲ್ ಗೈಡ್' :
               language === 'hi' ? 'मधुमेह और उच्च रक्तचाप क्लिनिकल गाइड' :
               language === 'mr' ? 'मधुमेह आणि रक्तदाब क्लिनिकल मार्गदर्शक' :
               'NCD Clinical & Lifestyle Support'}
            </span>
          </div>
        </div>

        {/* Online / Offline Mode Badge & Toggle */}
        <div className="chat-mode-control">
          <span 
            className={`chat-mode-badge ${effectiveMode === 'online' ? 'mode-online' : 'mode-offline'}`}
            title={effectiveMode === 'online' ? 'Live AI connected' : 'Local verified clinical knowledge base'}
          >
            {effectiveMode === 'online' ? (
              <>
                <Wifi size={14} className="mode-icon" />
                <span>Online (AI)</span>
              </>
            ) : (
              <>
                <WifiOff size={14} className="mode-icon" />
                <span>Offline (Cached KB)</span>
              </>
            )}
          </span>

          <button 
            type="button"
            className="chat-mode-toggle-btn"
            onClick={() => setManualOffline(prev => !prev)}
            aria-label="Toggle offline test mode"
            title="Toggle between Online AI and Offline Clinical KB"
          >
            {manualOffline ? 'Enable AI' : 'Force Offline'}
          </button>
        </div>
      </div>

      {/* 2. PROMINENT MEDICAL DISCLAIMER */}
      <div className="chat-disclaimer-banner" role="note">
        <Info size={16} className="disclaimer-icon" />
        <p className="disclaimer-text">
          {language === 'kn' ? 'ವೈದ್ಯಕೀಯ ಎಚ್ಚರಿಕೆ: ಈ ಸಹಾಯಕ ಸಾಮಾನ್ಯ ಆರೋಗ್ಯ ಮಾಹಿತಿಯನ್ನು ನೀಡುತ್ತದೆ. ಇದು ವೈದ್ಯರ ಬದಲಿಯಲ್ಲ. ತೀವ್ರ ಎದೆನೋವು ಅಥವಾ ಉಸಿರಾಟದ ತೊಂದರೆಗೆ ತಕ್ಷಣ 108 ಗೆ ಕರೆ ಮಾಡಿ.' :
           language === 'hi' ? 'चिकित्सा अस्वीकरण: यह सहायक सामान्य स्वास्थ्य जानकारी देता है। यह डॉक्टर का विकल्प नहीं है। गंभीर सीने में दर्द या सांस की तकलीफ होने पर तुरंत 108 पर कॉल करें।' :
           language === 'mr' ? 'वैद्यकीय अस्वीकरण: हा सहाय्यक सामान्य आरोग्य माहिती देतो. हा डॉक्टरांचा पर्याय नाही. छातीत तीव्र वेदना किंवा श्वास घेण्यास त्रास झाल्यास त्वरित 108 वर संपर्क साधा.' :
           'Clinical Disclaimer: Provides general health information. Does not replace certified medical diagnosis or prescriptions. In emergencies, call 108 immediately.'}
        </p>
      </div>

      {/* 3. MESSAGE STREAM */}
      <div className="chat-messages-scroll" role="log" aria-live="polite">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`chat-bubble-row ${msg.sender === 'user' ? 'row-user' : 'row-bot'}`}
          >
            {msg.sender === 'bot' && (
              <div className="bubble-avatar bot">
                {msg.isEmergency ? <AlertTriangle size={18} color="#dc2626" /> : <Bot size={18} />}
              </div>
            )}

            <div className={`chat-bubble ${msg.sender} ${msg.isEmergency ? 'bubble-emergency' : ''}`}>
              {/* Emergency Alert Card */}
              {msg.isEmergency ? (
                <div className="emergency-alert-card">
                  <div className="emergency-alert-header">
                    <AlertTriangle size={20} className="emergency-pulse-icon" />
                    <h4>{msg.emergencyData?.title || 'CRITICAL EMERGENCY DETECTED'}</h4>
                  </div>
                  <p className="emergency-alert-body">{msg.text}</p>
                  
                  {msg.matchedKeyword && (
                    <div className="emergency-matched-trigger">
                      <strong>Trigger Keyword:</strong> <code>{msg.matchedKeyword}</code>
                    </div>
                  )}

                  <div className="emergency-action-buttons">
                    <a href="tel:108" className="btn-call-108" role="button">
                      <PhoneCall size={18} />
                      <span>{msg.emergencyData?.callBtn || 'Call 108 Ambulance Now'}</span>
                    </a>

                    <button 
                      type="button" 
                      className="btn-emergency-slip"
                      onClick={() => handleGenerateEmergencyReport(msg)}
                    >
                      <FileText size={16} />
                      <span>{msg.emergencyData?.reportBtn || 'Generate Emergency Report'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="bubble-text">{msg.text}</p>
                  
                  {/* Offline Fallback Advice Tag */}
                  {msg.isFallback && (
                    <div className="bubble-fallback-tag">
                      <ShieldCheck size={14} />
                      <span>{language === 'kn' ? 'ಪರಿಶೀಲಿಸಿದ ಕ್ಲಿನಿಕಲ್ ಗೈಡ್' : 'Verified Clinical Safety Guideline'}</span>
                    </div>
                  )}
                </>
              )}

              {/* Bubble Footer with timestamp and TTS button */}
              <div className="bubble-meta">
                <span className="bubble-time">{msg.timestamp}</span>
                {msg.sender === 'bot' && !msg.isEmergency && (
                  <button 
                    type="button" 
                    className="bubble-audio-btn"
                    onClick={() => handleReadAloud(msg.text)}
                    aria-label="Listen to message aloud"
                    title="Read advice aloud"
                  >
                    <Volume2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="bubble-avatar user">
                <User size={18} />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="chat-bubble-row row-bot">
            <div className="bubble-avatar bot"><Bot size={18} /></div>
            <div className="chat-bubble bot typing-indicator-bubble">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. QUICK PROMPT PILLS */}
      <div className="chat-quick-prompts">
        {quickPrompts.map((prompt, idx) => (
          <button 
            key={idx}
            type="button"
            className="quick-prompt-pill"
            onClick={() => handleSendMessage(prompt)}
          >
            <Sparkles size={12} className="pill-sparkle" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* 5. CONSENT CHECKBOX & INPUT FORM */}
      <div className="chat-input-wrapper">
        <label className="chat-consent-row">
          <input 
            type="checkbox" 
            checked={consentLogging} 
            onChange={(e) => setConsentLogging(e.target.checked)}
            className="consent-checkbox"
          />
          <span className="consent-text">
            {language === 'kn' ? 'ಕ್ಲಿನಿಕಲ್ ಫಾಲೋ-ಅಪ್‌ಗಾಗಿ ಸಂಭಾಷಣೆಯನ್ನು ಉಳಿಸಲು ಒಪ್ಪಿಗೆ (Consent to store chat)' :
             language === 'hi' ? 'फॉलो-अप के लिए बातचीत सुरक्षित करने की सहमति (Consent to store chat)' :
             language === 'mr' ? 'फॉलो-अपसाठी संभाषण जतन करण्यास संमती (Consent to store chat)' :
             'Consent to log interaction for clinical continuity'}
          </span>
        </label>

        <form 
          className="chat-input-form" 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <input 
            type="text"
            className="chat-text-input"
            placeholder={
              language === 'kn' ? 'ಆರೋಗ್ಯ ಪ್ರಶ್ನೆ ಅಥವಾ ಲಕ್ಷಣಗಳನ್ನು ಬರೆಯಿರಿ...' :
              language === 'hi' ? 'स्वास्थ्य प्रश्न या लक्षण यहां लिखें...' :
              language === 'mr' ? 'आरोग्य प्रश्न किंवा लक्षणे येथे लिहा...' :
              'Ask a health question or describe symptoms...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
            aria-label="Health question input"
          />

          <VoiceInputButton 
            onTranscript={(spokenText) => {
              setInputText(prev => (prev ? `${prev} ${spokenText}` : spokenText));
            }}
            language={language}
          />

          <button 
            type="submit" 
            className="chat-send-btn"
            disabled={!inputText.trim() || isTyping}
            aria-label="Send health query"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* 6. MODAL: EMERGENCY SLIP REPORT PREVIEW */}
      {activeEmergencySlip && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card emergency-slip-modal">
            <div className="modal-header emergency-header">
              <div className="emergency-title-box">
                <AlertTriangle size={24} color="#dc2626" />
                <h3>EMERGENCY REFERRAL SLIP</h3>
              </div>
              <button 
                type="button" 
                className="btn-icon" 
                onClick={() => setActiveEmergencySlip(null)}
                aria-label="Close slip"
              >
                ✕
              </button>
            </div>

            <div className="emergency-slip-content">
              <div className="emergency-notice-banner">
                HANDOVER THIS SLIP TO 108 AMBULANCE PARAMEDIC / EMERGENCY CASUALTY OFFICER
              </div>

              <div className="emergency-details-grid">
                <div><strong>Patient Name:</strong> {activeEmergencySlip.patientName}</div>
                <div><strong>Identifier:</strong> {activeEmergencySlip.patientId}</div>
                <div><strong>Village / Ward:</strong> {activeEmergencySlip.village}</div>
                <div><strong>Timestamp:</strong> {activeEmergencySlip.detectedAt}</div>
                <div className="full-width">
                  <strong>Triggered Red Flag:</strong> 
                  <span className="badge badge-risk-critical" style={{ marginLeft: '8px' }}>
                    {activeEmergencySlip.trigger}
                  </span>
                </div>
                <div className="full-width">
                  <strong>Initial Directive:</strong> {activeEmergencySlip.adviceGiven}
                </div>
                <div className="full-width">
                  <strong>Prepared By:</strong> {activeEmergencySlip.reportedBy}
                </div>
              </div>

              <div className="emergency-slip-actions">
                <a href="tel:108" className="btn btn-primary" style={{ backgroundColor: '#dc2626', borderColor: '#b91c1c' }}>
                  <PhoneCall size={16} /> Dial 108
                </a>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    window.print();
                  }}
                >
                  <FileText size={16} /> Print Slip
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setActiveEmergencySlip(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getWelcomeMessage(lang) {
  switch (lang) {
    case 'kn':
      return 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸಮುದಾಯ ಆರೋಗ್ಯ ಸಹಾಯಕ. ಮಧುಮೇಹ (ಶುಗರ್), ರಕ್ತದೊತ್ತಡ (ಬಿಪಿ), ಆಹಾರ ಪದ್ಧತಿ ಮತ್ತು ಔಷಧಿಗಳ ಬಗ್ಗೆ ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು.';
    case 'hi':
      return 'नमस्ते! मैं आपका सामुदायिक स्वास्थ्य सहायक हूं। आप मुझसे मधुमेह (शुगर), रक्तचाप (बीपी), खानपान और दवाओं के बारे में पूछ सकते हैं।';
    case 'mr':
      return 'नमस्कार! मी आपला समुदाय आरोग्य सहाय्यक आहे. आपण मला मधुमेह, रक्तदाब, आहार आणि औषधांबद्दल विचारू शकता.';
    default:
      return 'Hello! I am your CHW Health Assistant. Ask me about blood pressure, blood glucose ranges, diet, medications, or community referral guidelines.';
  }
}

function getQuickPrompts(lang) {
  switch (lang) {
    case 'kn':
      return [
        'ಸಾಮಾನ್ಯ ಬಿಪಿ ಎಷ್ಟು?',
        'ಶುಗರ್ ರೋಗಿಗಳಿಗೆ ಆಹಾರ',
        'ಲೋ ಶುಗರ್ ಲಕ್ಷಣಗಳು',
        'ಪಿಎಚ್‌ಸಿ ರೆಫರ್ ಯಾವಾಗ?'
      ];
    case 'hi':
      return [
        'सामान्य बीपी कितना है?',
        'शुगर में क्या खाएं?',
        'लो शुगर के लक्षण',
        'डॉक्टर को कब दिखाएं?'
      ];
    case 'mr':
      return [
        'सामान्य रक्तदाब किती असावा?',
        'मधुमेहातील आहार कोणता?',
        'लो शुगरची लक्षणे',
        'पीएचसीला कधी पाठवावे?'
      ];
    default:
      return [
        'What is normal BP?',
        'Millet diet for diabetes',
        'Low sugar symptoms',
        'When to refer to PHC?'
      ];
  }
}
