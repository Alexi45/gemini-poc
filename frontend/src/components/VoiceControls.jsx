import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Play, Pause, Square } from 'lucide-react';
import { VoiceRecognition, VoiceSynthesis, isSpeechRecognitionSupported, isSpeechSynthesisSupported } from '../utils/voiceUtils';

const VoiceControls = ({ onTranscript, lastMessage }) => {
  const [recognition, setRecognition] = useState(null);
  const [synthesis, setSynthesis] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);

  // Inicializar servicios de voz
  useEffect(() => {
    try {
      if (isSpeechRecognitionSupported()) {
        const voiceRec = new VoiceRecognition({
          lang: 'es-ES',
          continuous: false,
          interimResults: true
        });

        voiceRec.onResult = (text, isFinal) => {
          setTranscript(text);
          if (isFinal && onTranscript) {
            onTranscript(text);
            setTranscript('');
          }
        };

        voiceRec.onError = (err) => {
          setError(`Error: ${err}`);
          setIsListening(false);
        };

        voiceRec.onEnd = () => {
          setIsListening(false);
        };

        setRecognition(voiceRec);
      }

      if (isSpeechSynthesisSupported()) {
        const voiceSynth = new VoiceSynthesis({
          lang: 'es-ES',
          rate: 1.0,
          pitch: 1.0
        });
        setSynthesis(voiceSynth);
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      setError('Reconocimiento de voz no disponible');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setError(null);
      recognition.start();
      setIsListening(true);
    }
  };

  const speakLastMessage = () => {
    if (!synthesis || !lastMessage) {
      setError('Síntesis de voz no disponible');
      return;
    }

    if (isSpeaking) {
      synthesis.cancel();
      setIsSpeaking(false);
    } else {
      setError(null);
      setIsSpeaking(true);
      
      synthesis.speak(lastMessage.text)
        .then(() => {
          setIsSpeaking(false);
        })
        .catch((err) => {
          setError('Error al reproducir voz');
          setIsSpeaking(false);
        });
    }
  };

  const togglePause = () => {
    if (!synthesis) return;

    if (isSpeaking) {
      synthesis.pause();
    } else {
      synthesis.resume();
    }
  };

  if (!isSpeechRecognitionSupported() && !isSpeechSynthesisSupported()) {
    return null;
  }

  return (
    <div className="voice-controls">
      {isSpeechRecognitionSupported() && (
        <button
          onClick={toggleListening}
          className={`voice-btn ${isListening ? 'active listening' : ''}`}
          title={isListening ? 'Detener grabación' : 'Iniciar grabación de voz'}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          {isListening && <span className="pulse-ring"></span>}
        </button>
      )}

      {isSpeechSynthesisSupported() && lastMessage && lastMessage.role === 'assistant' && (
        <button
          onClick={speakLastMessage}
          className={`voice-btn ${isSpeaking ? 'active speaking' : ''}`}
          title={isSpeaking ? 'Detener reproducción' : 'Escuchar respuesta'}
        >
          {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      )}

      {isListening && transcript && (
        <div className="voice-transcript">
          <span className="transcript-text">{transcript}</span>
        </div>
      )}

      {error && (
        <div className="voice-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <style jsx>{`
        .voice-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }

        .voice-btn {
          position: relative;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 10px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          width: 40px;
          height: 40px;
        }

        .voice-btn:hover {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
          transform: scale(1.05);
        }

        .voice-btn.active {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }

        .voice-btn.listening {
          animation: pulse 1.5s ease-in-out infinite;
        }

        .voice-btn.speaking {
          background: var(--success);
          border-color: var(--success);
        }

        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px solid var(--accent-primary);
          border-radius: 50%;
          animation: pulse-ring 1.5s ease-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .voice-transcript {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 0;
          background: var(--card-background);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          min-width: 200px;
          max-width: 300px;
          animation: slideUp 0.2s ease;
        }

        .transcript-text {
          color: var(--text-primary);
          font-size: 0.9rem;
          font-style: italic;
        }

        .voice-error {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 0;
          background: var(--error);
          color: white;
          border-radius: 8px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          animation: slideUp 0.2s ease;
        }

        .voice-error button {
          background: transparent;
          border: none;
          color: white;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .voice-controls {
            gap: 6px;
          }

          .voice-btn {
            width: 36px;
            height: 36px;
            padding: 8px;
          }

          .voice-transcript,
          .voice-error {
            max-width: 200px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default VoiceControls;
