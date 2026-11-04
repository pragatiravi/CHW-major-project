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
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { detectClinicalRedFlag } from '../../lib/chat/redFlagDetector';
import { searchOfflineKnowledgeBase } from '../../lib/chat/offlineRetrieval';
import { logChatInteraction } from '../../lib/chat/chatLogger';
import { speakText, stopSpeech } from '../../lib/speech/speechSynthesis';
import VoiceInputButton from '../shared/VoiceInputButton';
import { useLanguage } from '../shared/LanguageContext';
import { useToast } from '../shared/ToastContainer';
import { isDemoModeActive } from '../../lib/auth';
import { supabase } from '../../lib/supabaseClient';

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
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  const handleCopyMessage = async (msgId, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleRateMessage = (msgId, rating, topic, source) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, rating } : m));
    try {
      const feedbackLogs = JSON.parse(localStorage.getItem('chw_chat_feedback') || '[]');
      feedbackLogs.push({
        id: msgId,
        rating,
        topic: topic || 'general',
        source: source || 'unknown',
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('chw_chat_feedback', JSON.stringify(feedbackLogs.slice(-100)));
    } catch {
      // ignore
    }
  };

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
        // Build auth headers:
        // - Real users: get Supabase session token
        // - Demo users: send x-chw-demo-session marker (server checks ALLOW_DEMO_CHAT)
        const isDemo = isDemoModeActive() && currentUser?.source === 'local_demo';
        let sessionToken = null;
        if (!isDemo && supabase) {
          const { data } = await supabase.auth.getSession().catch(() => ({ data: null }));
          sessionToken = data?.session?.access_token || null;
        }

        const headers = { 'Content-Type': 'application/json' };
        if (sessionToken) {
          headers['Authorization'] = `Bearer ${sessionToken}`;
        }
        if (isDemo) {
          headers['x-chw-demo-session'] = 'true';
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: textToSend,
            language,
            context: {
              role: currentUser?.role || 'patient',
              patientName: patientContext?.name || null,
              riskTier: patientContext?.risk_tier || null
              // Note: no patientId in demo mode — server enforces this
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          // Show truncation warning if the server shortened the input
          if (data.wasTruncated) {
            toastWarning('Your message was shortened to 500 characters.');
          }
          const botMsg = {
            id: createMessageId('bot'),
            sender: 'bot',
            text: data.reply,
            timestamp: getCurrentTimeStr(),
            source: data.source || 'online_ai',
            badge: data.badge || data.source || 'online_ai',
            topic: data.topic || null,
            fallbackReason: data.fallbackReason || null
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
            retrievedTopic: data.topic || null,
            consentGiven: consentLogging
          });
          return;
        } else if (response.status === 401) {
          // Not authenticated — fall through to offline
          console.warn('Chat: 401 from /api/chat — using offline KB');
        } else {
          console.warn('Online chat request failed with status', response.status);
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
                  
                  {/* Source Badge — HONEST: reflects what actually produced the answer */}
                  {msg.source === 'online_ai' ? (
                    <div className="bubble-fallback-tag" style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46' }}>
                      <Sparkles size={13} className="text-emerald-600" />
                      <span>{language === 'kn' ? 'ಲೈವ್ ಎಐ' : language === 'hi' ? 'ऑनलाइन एआई' : language === 'mr' ? 'ऑनलाइन एआय' : 'Online AI'}</span>
                    </div>
                  ) : (msg.source === 'offline_kb') ? (
                    <div className="bubble-fallback-tag" style={{ backgroundColor: '#f0f9ff', borderColor: '#bae6fd', color: '#0369a1' }}>
                      <ShieldCheck size={13} className="text-sky-600" />
                      <span>
                        {language === 'kn' ? 'ಆಫ್‌ಲೈನ್ ಮಾರ್ಗದರ್ಶಿ' : language === 'hi' ? 'ऑफलाइन गाइड' : language === 'mr' ? 'ऑफलाइन मार्गदर्शक' : 'Offline guide'}
                        {msg.topic ? ` (${msg.topic.replace(/_/g, ' ')})` : ''}
                      </span>
                    </div>
                  ) : (msg.source === 'red_flag_pregnancy' || msg.source === 'red_flag_engine') ? (
                    <div className="bubble-fallback-tag" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
                      <AlertTriangle size={13} />
                      <span>{language === 'kn' ? 'ತಕ್ಷಣ ರೆಫರ್' : language === 'hi' ? 'तत्काल रेफरल' : language === 'mr' ? 'तात्काळ रेफरल' : 'Urgent referral'}</span>
                    </div>
                  ) : (msg.isFallback || msg.source === 'offline_fallback') ? (
                    <div className="bubble-fallback-tag" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
                      <Info size={13} />
                      <span>{language === 'kn' ? 'ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಉತ್ತರವಿಲ್ಲ' : language === 'hi' ? 'ऑफलाइन उत्तर नहीं' : language === 'mr' ? 'ऑफलाइन उत्तर नाही' : "Can't answer offline"}</span>
                    </div>
                  ) : null}
                  {/* Show why AI fell back (e.g., timeout, bad key) */}
                  {msg.fallbackReason && (
                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', fontStyle: 'italic' }}>
                      ℹ️ {msg.fallbackReason}
                    </p>
                  )}
                </>
              )}

              {/* Bubble Footer with timestamp, Copy, TTS, and Thumbs Up/Down */}
              <div className="bubble-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <span className="bubble-time">{msg.timestamp}</span>
                {msg.sender === 'bot' && !msg.isEmergency && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                    <button 
                      type="button" 
                      className="bubble-audio-btn"
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      aria-label="Copy message text"
                      title="Copy advice"
                      style={{ padding: '3px 5px', fontSize: '11px', display: 'flex', alignItems: 'center' }}
                    >
                      {copiedMsgId === msg.id ? <CheckCircle2 size={13} color="#059669" /> : <Copy size={13} />}
                    </button>
                    <button 
                      type="button" 
                      className="bubble-audio-btn"
                      onClick={() => handleReadAloud(msg.text)}
                      aria-label="Listen to message aloud"
                      title="Read advice aloud"
                      style={{ padding: '3px 5px', fontSize: '11px', display: 'flex', alignItems: 'center' }}
                    >
                      <Volume2 size={13} />
                    </button>
                    <button
                      type="button"
                      className="bubble-audio-btn"
                      onClick={() => handleRateMessage(msg.id, 'up', msg.topic, msg.source)}
                      aria-label="Helpful answer"
                      title="Mark helpful"
                      style={{ 
                        padding: '3px 5px', 
                        fontSize: '11px', 
                        display: 'flex', 
                        alignItems: 'center',
                        color: msg.rating === 'up' ? '#059669' : 'inherit'
                      }}
                    >
                      <ThumbsUp size={13} />
                    </button>
                    <button
                      type="button"
                      className="bubble-audio-btn"
                      onClick={() => handleRateMessage(msg.id, 'down', msg.topic, msg.source)}
                      aria-label="Unhelpful answer"
                      title="Mark unhelpful"
                      style={{ 
                        padding: '3px 5px', 
                        fontSize: '11px', 
                        display: 'flex', 
                        alignItems: 'center',
                        color: msg.rating === 'down' ? '#dc2626' : 'inherit'
                      }}
                    >
                      <ThumbsDown size={13} />
                    </button>
                  </div>
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
