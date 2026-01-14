/**
 * Sistema de reconocimiento y síntesis de voz
 */

// Verificar soporte de la Web Speech API
export const isSpeechRecognitionSupported = () => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

export const isSpeechSynthesisSupported = () => {
  return 'speechSynthesis' in window;
};

// Clase para manejar reconocimiento de voz (Speech-to-Text)
export class VoiceRecognition {
  constructor(options = {}) {
    if (!isSpeechRecognitionSupported()) {
      throw new Error('El navegador no soporta reconocimiento de voz');
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    // Configuración
    this.recognition.lang = options.lang || 'es-ES';
    this.recognition.continuous = options.continuous || false;
    this.recognition.interimResults = options.interimResults || true;
    this.recognition.maxAlternatives = 1;
    
    this.isListening = false;
    this.onResult = null;
    this.onError = null;
    this.onEnd = null;
    
    // Event listeners
    this.recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      
      const isFinal = event.results[event.results.length - 1].isFinal;
      
      if (this.onResult) {
        this.onResult(transcript, isFinal);
      }
    };
    
    this.recognition.onerror = (event) => {
      console.error('Error de reconocimiento de voz:', event.error);
      if (this.onError) {
        this.onError(event.error);
      }
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) {
        this.onEnd();
      }
    };
  }
  
  start() {
    if (!this.isListening) {
      this.recognition.start();
      this.isListening = true;
    }
  }
  
  stop() {
    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
  
  abort() {
    this.recognition.abort();
    this.isListening = false;
  }
}

// Clase para manejar síntesis de voz (Text-to-Speech)
export class VoiceSynthesis {
  constructor(options = {}) {
    if (!isSpeechSynthesisSupported()) {
      throw new Error('El navegador no soporta síntesis de voz');
    }
    
    this.synth = window.speechSynthesis;
    this.lang = options.lang || 'es-ES';
    this.rate = options.rate || 1.0; // Velocidad (0.1 a 10)
    this.pitch = options.pitch || 1.0; // Tono (0 a 2)
    this.volume = options.volume || 1.0; // Volumen (0 a 1)
    
    this.isSpeaking = false;
    this.currentUtterance = null;
  }
  
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      // Cancelar cualquier reproducción en curso
      this.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configurar voz
      const voices = this.synth.getVoices();
      const spanishVoice = voices.find(voice => voice.lang.startsWith('es'));
      
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }
      
      utterance.lang = options.lang || this.lang;
      utterance.rate = options.rate || this.rate;
      utterance.pitch = options.pitch || this.pitch;
      utterance.volume = options.volume || this.volume;
      
      utterance.onstart = () => {
        this.isSpeaking = true;
      };
      
      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        resolve();
      };
      
      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        reject(event);
      };
      
      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }
  
  pause() {
    if (this.isSpeaking) {
      this.synth.pause();
    }
  }
  
  resume() {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }
  
  cancel() {
    this.synth.cancel();
    this.isSpeaking = false;
    this.currentUtterance = null;
  }
  
  getVoices() {
    return this.synth.getVoices();
  }
}

// Funciones de utilidad
export const getAvailableVoices = () => {
  if (!isSpeechSynthesisSupported()) return [];
  
  return window.speechSynthesis.getVoices();
};

export const getSpanishVoices = () => {
  return getAvailableVoices().filter(voice => 
    voice.lang.startsWith('es')
  );
};

export default {
  VoiceRecognition,
  VoiceSynthesis,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  getAvailableVoices,
  getSpanishVoices
};
