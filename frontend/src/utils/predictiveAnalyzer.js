/**
 * Sistema de análisis predictivo para conversaciones
 * Predice patrones y sugiere respuestas basadas en el historial
 */

export class PredictiveAnalyzer {
  constructor() {
    this.conversationPatterns = new Map();
    this.commonPhrases = new Map();
    this.userBehavior = {
      averageMessageLength: 0,
      preferredTopics: [],
      timePatterns: [],
      responseTime: []
    };
  }

  /**
   * Analizar patrones en el historial de conversaciones
   */
  analyzeConversationHistory(messages) {
    if (!messages || messages.length === 0) return null;

    const userMessages = messages.filter(m => m.role === 'user');
    const aiMessages = messages.filter(m => m.role === 'assistant');

    // Análisis de longitud de mensajes
    const avgUserLength = userMessages.reduce((sum, m) => sum + m.text.length, 0) / userMessages.length;
    const avgAILength = aiMessages.reduce((sum, m) => sum + m.text.length, 0) / aiMessages.length;

    // Detectar temas comunes
    const topics = this.detectTopics(userMessages);

    // Detectar frases frecuentes
    const phrases = this.detectCommonPhrases(userMessages);

    // Análisis temporal
    const timePattern = this.analyzeTimePatterns(messages);

    return {
      messageCount: messages.length,
      userMessageCount: userMessages.length,
      aiMessageCount: aiMessages.length,
      averageUserMessageLength: Math.round(avgUserLength),
      averageAIMessageLength: Math.round(avgAILength),
      commonTopics: topics,
      commonPhrases: phrases,
      timePattern,
      engagement: this.calculateEngagement(messages)
    };
  }

  /**
   * Detectar temas comunes en las conversaciones
   */
  detectTopics(messages) {
    const topicKeywords = {
      programming: ['código', 'programación', 'python', 'javascript', 'función', 'clase', 'bug', 'error'],
      general: ['cómo', 'qué', 'cuál', 'explica', 'ayuda', 'información'],
      creative: ['escribe', 'crea', 'genera', 'imagina', 'historia', 'poema'],
      analysis: ['analiza', 'compara', 'evalúa', 'resume', 'explica'],
      translation: ['traduce', 'traducción', 'idioma', 'inglés', 'español'],
      math: ['calcula', 'suma', 'resta', 'matemática', 'número', 'ecuación']
    };

    const topicCounts = {};
    
    messages.forEach(msg => {
      const text = msg.text.toLowerCase();
      
      Object.keys(topicKeywords).forEach(topic => {
        const count = topicKeywords[topic].reduce((sum, keyword) => {
          return sum + (text.includes(keyword) ? 1 : 0);
        }, 0);
        
        topicCounts[topic] = (topicCounts[topic] || 0) + count;
      });
    });

    // Ordenar por frecuencia
    return Object.entries(topicCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic, count]) => ({ topic, count }));
  }

  /**
   * Detectar frases comunes
   */
  detectCommonPhrases(messages) {
    const phrases = new Map();
    
    messages.forEach(msg => {
      const words = msg.text.toLowerCase().split(/\s+/);
      
      // Buscar bigramas (2 palabras)
      for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`;
        if (phrase.length > 5) {
          phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
        }
      }
    });

    return Array.from(phrases.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phrase, count]) => ({ phrase, count }));
  }

  /**
   * Analizar patrones temporales
   */
  analyzeTimePatterns(messages) {
    if (messages.length < 2) return null;

    const times = messages.map(m => new Date(m.timestamp));
    const intervals = [];

    for (let i = 1; i < times.length; i++) {
      const diff = (times[i] - times[i - 1]) / 1000; // segundos
      intervals.push(diff);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    return {
      averageInterval: Math.round(avgInterval),
      totalDuration: Math.round((times[times.length - 1] - times[0]) / 1000),
      messagesPerMinute: (messages.length / ((times[times.length - 1] - times[0]) / 60000)).toFixed(2)
    };
  }

  /**
   * Calcular nivel de engagement
   */
  calculateEngagement(messages) {
    if (messages.length === 0) return 0;

    const userMessages = messages.filter(m => m.role === 'user');
    const avgLength = userMessages.reduce((sum, m) => sum + m.text.length, 0) / userMessages.length;
    
    // Engagement basado en longitud y frecuencia
    let score = 0;
    
    // Longitud de mensajes (max 40 puntos)
    score += Math.min((avgLength / 100) * 40, 40);
    
    // Frecuencia de mensajes (max 30 puntos)
    score += Math.min((userMessages.length / 10) * 30, 30);
    
    // Variedad de temas (max 30 puntos)
    const topics = this.detectTopics(userMessages);
    score += Math.min(topics.length * 10, 30);

    return Math.round(score);
  }

  /**
   * Predecir el siguiente tipo de pregunta
   */
  predictNextQueryType(recentMessages) {
    if (recentMessages.length < 3) {
      return { type: 'general', confidence: 50 };
    }

    const last3 = recentMessages.slice(-3).filter(m => m.role === 'user');
    const topics = this.detectTopics(last3);

    if (topics.length === 0) {
      return { type: 'general', confidence: 50 };
    }

    return {
      type: topics[0].topic,
      confidence: Math.min((topics[0].count / last3.length) * 100, 95)
    };
  }

  /**
   * Sugerir consultas basadas en el historial
   */
  suggestQueries(messages, count = 3) {
    const analysis = this.analyzeConversationHistory(messages);
    if (!analysis) return [];

    const suggestions = [];

    // Sugerencias basadas en temas comunes
    if (analysis.commonTopics.length > 0) {
      const topTopic = analysis.commonTopics[0].topic;
      
      const topicSuggestions = {
        programming: [
          '¿Cómo optimizar este código?',
          'Explícame sobre clean code',
          '¿Cuáles son las mejores prácticas?'
        ],
        creative: [
          'Escribe una historia corta',
          'Crea un poema sobre...',
          'Genera ideas creativas para...'
        ],
        analysis: [
          'Compara estas dos opciones',
          'Resume los puntos principales',
          'Analiza las ventajas y desventajas'
        ],
        math: [
          'Resuelve esta ecuación',
          'Explica este concepto matemático',
          'Calcula el resultado de...'
        ],
        general: [
          '¿Puedes explicar...?',
          'Ayúdame con...',
          '¿Qué sabes sobre...?'
        ]
      };

      const topicSuggs = topicSuggestions[topTopic] || topicSuggestions.general;
      suggestions.push(...topicSuggs.slice(0, count));
    }

    return suggestions;
  }

  /**
   * Predecir complejidad de la siguiente respuesta
   */
  predictResponseComplexity(query) {
    const complexityIndicators = {
      high: ['explica detalladamente', 'compara', 'analiza', 'evalúa', 'diseña', 'implementa'],
      medium: ['cómo', 'por qué', 'cuál', 'describe', 'resume'],
      low: ['qué es', 'sí o no', 'define', 'lista']
    };

    const lowerQuery = query.toLowerCase();

    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      if (indicators.some(indicator => lowerQuery.includes(indicator))) {
        return level;
      }
    }

    return 'medium';
  }

  /**
   * Generar reporte de análisis predictivo
   */
  generatePredictiveReport(messages) {
    const analysis = this.analyzeConversationHistory(messages);
    const nextType = this.predictNextQueryType(messages);
    const suggestions = this.suggestQueries(messages, 5);

    return {
      analysis,
      prediction: {
        nextQueryType: nextType.type,
        confidence: nextType.confidence,
        suggestedQueries: suggestions
      },
      insights: {
        mostActiveHour: this.findMostActiveHour(messages),
        preferredStyle: this.detectPreferredStyle(messages),
        complexity: this.getAverageComplexity(messages)
      },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Encontrar hora más activa
   */
  findMostActiveHour(messages) {
    const hourCounts = new Array(24).fill(0);
    
    messages.forEach(msg => {
      const hour = new Date(msg.timestamp).getHours();
      hourCounts[hour]++;
    });

    const maxCount = Math.max(...hourCounts);
    const mostActiveHour = hourCounts.indexOf(maxCount);

    return {
      hour: mostActiveHour,
      count: maxCount,
      formatted: `${mostActiveHour}:00 - ${mostActiveHour + 1}:00`
    };
  }

  /**
   * Detectar estilo preferido
   */
  detectPreferredStyle(messages) {
    const userMessages = messages.filter(m => m.role === 'user');
    const avgLength = userMessages.reduce((sum, m) => sum + m.text.length, 0) / userMessages.length;

    if (avgLength < 50) return 'concise';
    if (avgLength < 150) return 'balanced';
    return 'detailed';
  }

  /**
   * Obtener complejidad promedio
   */
  getAverageComplexity(messages) {
    const userMessages = messages.filter(m => m.role === 'user');
    const complexities = userMessages.map(m => this.predictResponseComplexity(m.text));
    
    const complexityScores = { low: 1, medium: 2, high: 3 };
    const avgScore = complexities.reduce((sum, c) => sum + complexityScores[c], 0) / complexities.length;

    if (avgScore < 1.5) return 'low';
    if (avgScore < 2.5) return 'medium';
    return 'high';
  }
}

// Instancia global
export const predictiveAnalyzer = new PredictiveAnalyzer();

export default predictiveAnalyzer;
