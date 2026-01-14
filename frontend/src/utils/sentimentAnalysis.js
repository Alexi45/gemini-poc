/**
 * Análisis de sentimientos en conversaciones
 */

// Palabras clave para detección de sentimientos
const sentimentKeywords = {
  positive: {
    words: [
      'excelente', 'genial', 'perfecto', 'fantástico', 'maravilloso', 'increíble',
      'feliz', 'contento', 'alegre', 'satisfecho', 'encantado', 'agradecido',
      'bueno', 'bien', 'mejor', 'óptimo', 'positivo', 'favorable',
      'gracias', 'amor', 'éxito', 'victoria', 'logro', 'triunfo'
    ],
    emojis: ['😊', '😄', '😃', '🙂', '😁', '🥰', '😍', '🎉', '✨', '👍', '💚', '❤️']
  },
  negative: {
    words: [
      'mal', 'malo', 'peor', 'pésimo', 'terrible', 'horrible', 'desastroso',
      'triste', 'deprimido', 'frustrado', 'enojado', 'molesto', 'disgustado',
      'problema', 'error', 'fallo', 'fracaso', 'dificultad', 'preocupación',
      'odio', 'nunca', 'imposible', 'difícil', 'complicado'
    ],
    emojis: ['😢', '😭', '😞', '😔', '😟', '😠', '😡', '🤬', '💔', '👎']
  },
  neutral: {
    words: [
      'normal', 'regular', 'común', 'estándar', 'típico', 'promedio',
      'ok', 'bien', 'quizás', 'tal vez', 'posiblemente', 'probablemente'
    ],
    emojis: ['😐', '😑', '🤔', '🤷']
  }
};

/**
 * Analizar el sentimiento de un texto
 */
export const analyzeSentiment = (text) => {
  if (!text || typeof text !== 'string') {
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0
    };
  }
  
  const lowerText = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;
  
  // Contar palabras positivas
  sentimentKeywords.positive.words.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      positiveScore += matches.length;
    }
  });
  
  // Contar emojis positivos
  sentimentKeywords.positive.emojis.forEach(emoji => {
    const count = (text.match(new RegExp(emoji, 'g')) || []).length;
    positiveScore += count * 0.5;
  });
  
  // Contar palabras negativas
  sentimentKeywords.negative.words.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      negativeScore += matches.length;
    }
  });
  
  // Contar emojis negativos
  sentimentKeywords.negative.emojis.forEach(emoji => {
    const count = (text.match(new RegExp(emoji, 'g')) || []).length;
    negativeScore += count * 0.5;
  });
  
  // Calcular sentimiento final
  const totalScore = positiveScore + negativeScore;
  const normalizedScore = totalScore > 0 
    ? (positiveScore - negativeScore) / totalScore 
    : 0;
  
  let sentiment = 'neutral';
  if (normalizedScore > 0.2) sentiment = 'positive';
  else if (normalizedScore < -0.2) sentiment = 'negative';
  
  const confidence = Math.min(Math.abs(normalizedScore) * 100, 100);
  
  return {
    sentiment,
    score: normalizedScore,
    confidence: Math.round(confidence),
    details: {
      positiveScore,
      negativeScore,
      totalWords: text.split(/\s+/).length
    }
  };
};

/**
 * Analizar sentimiento de una conversación completa
 */
export const analyzeConversationSentiment = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      overall: 'neutral',
      userSentiment: 'neutral',
      timeline: []
    };
  }
  
  const userMessages = messages.filter(m => m.role === 'user');
  const timeline = [];
  
  let totalPositive = 0;
  let totalNegative = 0;
  let totalNeutral = 0;
  
  messages.forEach((message, index) => {
    const analysis = analyzeSentiment(message.text);
    
    timeline.push({
      index,
      role: message.role,
      sentiment: analysis.sentiment,
      score: analysis.score,
      confidence: analysis.confidence,
      timestamp: message.timestamp
    });
    
    if (message.role === 'user') {
      if (analysis.sentiment === 'positive') totalPositive++;
      else if (analysis.sentiment === 'negative') totalNegative++;
      else totalNeutral++;
    }
  });
  
  // Determinar sentimiento general del usuario
  let userSentiment = 'neutral';
  const total = totalPositive + totalNegative + totalNeutral;
  
  if (total > 0) {
    const positiveRatio = totalPositive / total;
    const negativeRatio = totalNegative / total;
    
    if (positiveRatio > 0.5) userSentiment = 'positive';
    else if (negativeRatio > 0.5) userSentiment = 'negative';
  }
  
  return {
    overall: userSentiment,
    userSentiment,
    timeline,
    stats: {
      positive: totalPositive,
      negative: totalNegative,
      neutral: totalNeutral,
      total: total
    }
  };
};

/**
 * Obtener emoji según el sentimiento
 */
export const getSentimentEmoji = (sentiment) => {
  const emojis = {
    positive: '😊',
    negative: '😔',
    neutral: '😐'
  };
  
  return emojis[sentiment] || '😐';
};

/**
 * Obtener color según el sentimiento
 */
export const getSentimentColor = (sentiment) => {
  const colors = {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#64748b'
  };
  
  return colors[sentiment] || '#64748b';
};

/**
 * Obtener texto descriptivo del sentimiento
 */
export const getSentimentText = (sentiment) => {
  const texts = {
    positive: 'Positivo',
    negative: 'Negativo',
    neutral: 'Neutral'
  };
  
  return texts[sentiment] || 'Neutral';
};

export default {
  analyzeSentiment,
  analyzeConversationSentiment,
  getSentimentEmoji,
  getSentimentColor,
  getSentimentText
};
