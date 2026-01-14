/**
 * Sistema de Plugins para Gemini AI Chat
 * Arquitectura modular para extender funcionalidades
 */

// Registro global de plugins
const pluginRegistry = new Map();

/**
 * Clase base para todos los plugins
 */
export class Plugin {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.version = config.version || '1.0.0';
    this.description = config.description || '';
    this.icon = config.icon || '🔌';
    this.enabled = config.enabled !== false;
    this.commands = config.commands || [];
  }

  // Método llamado cuando el plugin se activa
  async onEnable() {
    console.log(`Plugin ${this.name} activado`);
  }

  // Método llamado cuando el plugin se desactiva
  async onDisable() {
    console.log(`Plugin ${this.name} desactivado`);
  }

  // Procesar mensaje antes de enviarlo a Gemini
  async beforeSend(message) {
    return message;
  }

  // Procesar respuesta de Gemini antes de mostrarla
  async afterReceive(response) {
    return response;
  }

  // Manejar comandos del plugin
  async handleCommand(command, args) {
    console.log(`Comando ${command} no implementado en ${this.name}`);
    return null;
  }
}

/**
 * Plugin: Calculadora
 */
export class CalculatorPlugin extends Plugin {
  constructor() {
    super({
      id: 'calculator',
      name: 'Calculadora',
      description: 'Realiza cálculos matemáticos directamente en el chat',
      icon: '🔢',
      commands: ['/calc', '/calcular']
    });
  }

  async handleCommand(command, args) {
    try {
      const expression = args.join(' ');
      // Evaluar expresión de forma segura (solo números y operadores básicos)
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
      const result = eval(sanitized);
      
      return {
        type: 'calculator',
        result: `📊 Resultado: ${expression} = ${result}`,
        raw: result
      };
    } catch (error) {
      return {
        type: 'calculator',
        result: '❌ Error en la expresión matemática',
        error: true
      };
    }
  }

  async beforeSend(message) {
    // Detectar expresiones matemáticas y sugerir uso del comando
    if (/^[\d+\-*/().\s]+$/.test(message.trim())) {
      return {
        suggestion: `💡 Tip: Usa /calc ${message} para cálculos más rápidos`,
        message
      };
    }
    return message;
  }
}

/**
 * Plugin: Traductor
 */
export class TranslatorPlugin extends Plugin {
  constructor() {
    super({
      id: 'translator',
      name: 'Traductor',
      description: 'Traduce texto entre diferentes idiomas',
      icon: '🌐',
      commands: ['/traducir', '/translate']
    });
    
    this.languages = {
      'es': 'Español',
      'en': 'Inglés',
      'fr': 'Francés',
      'de': 'Alemán',
      'it': 'Italiano',
      'pt': 'Portugués'
    };
  }

  async handleCommand(command, args) {
    if (args.length < 2) {
      return {
        type: 'translator',
        result: '❌ Uso: /traducir [idioma_destino] [texto]',
        error: true
      };
    }

    const targetLang = args[0].toLowerCase();
    const text = args.slice(1).join(' ');
    
    if (!this.languages[targetLang]) {
      return {
        type: 'translator',
        result: `❌ Idioma no soportado. Usa: ${Object.keys(this.languages).join(', ')}`,
        error: true
      };
    }

    // Aquí se integraría con una API de traducción
    // Por ahora retornamos un mensaje simulado
    return {
      type: 'translator',
      result: `🌐 Traduciendo a ${this.languages[targetLang]}...\n\nNota: Pregúntale a Gemini AI: "Traduce a ${this.languages[targetLang]}: ${text}"`,
      targetLang,
      text
    };
  }
}

/**
 * Plugin: Búsqueda Web
 */
export class WebSearchPlugin extends Plugin {
  constructor() {
    super({
      id: 'websearch',
      name: 'Búsqueda Web',
      description: 'Busca información en internet',
      icon: '🔍',
      commands: ['/buscar', '/search', '/google']
    });
  }

  async handleCommand(command, args) {
    const query = args.join(' ');
    
    if (!query) {
      return {
        type: 'websearch',
        result: '❌ Uso: /buscar [término de búsqueda]',
        error: true
      };
    }

    // Abrir búsqueda en nueva pestaña
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank');

    return {
      type: 'websearch',
      result: `🔍 Abriendo búsqueda para: "${query}"`,
      query
    };
  }
}

/**
 * Plugin: Generador de Código
 */
export class CodeGeneratorPlugin extends Plugin {
  constructor() {
    super({
      id: 'codegen',
      name: 'Generador de Código',
      description: 'Formatea y mejora código generado por Gemini',
      icon: '💻',
      commands: ['/code', '/codigo']
    });

    this.languages = ['javascript', 'python', 'java', 'html', 'css', 'sql', 'bash'];
  }

  async afterReceive(response) {
    // Detectar bloques de código en la respuesta
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    const codeBlocks = [];

    while ((match = codeBlockRegex.exec(response)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        code: match[2]
      });
    }

    if (codeBlocks.length > 0) {
      return {
        enhanced: true,
        response,
        codeBlocks,
        suggestion: '💡 Código detectado. Copia y usa los bloques de código fácilmente.'
      };
    }

    return response;
  }

  async handleCommand(command, args) {
    const language = args[0]?.toLowerCase();
    const description = args.slice(1).join(' ');

    if (!language || !description) {
      return {
        type: 'codegen',
        result: '❌ Uso: /code [lenguaje] [descripción]',
        error: true
      };
    }

    return {
      type: 'codegen',
      result: `💻 Solicitando código en ${language}...\n\nPregunta a Gemini: "Genera código en ${language} para: ${description}"`,
      language,
      description
    };
  }
}

/**
 * Plugin: Resumen de Texto
 */
export class SummarizerPlugin extends Plugin {
  constructor() {
    super({
      id: 'summarizer',
      name: 'Resumidor',
      description: 'Resume textos largos',
      icon: '📝',
      commands: ['/resumir', '/summary']
    });
  }

  async handleCommand(command, args) {
    const text = args.join(' ');
    
    if (!text || text.length < 100) {
      return {
        type: 'summarizer',
        result: '❌ Proporciona un texto más largo para resumir (mínimo 100 caracteres)',
        error: true
      };
    }

    return {
      type: 'summarizer',
      result: `📝 Resumiendo texto...\n\nPregunta a Gemini: "Resume el siguiente texto: ${text}"`,
      text
    };
  }
}

/**
 * Gestor de Plugins
 */
export class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.commandMap = new Map();
  }

  // Registrar un plugin
  registerPlugin(plugin) {
    if (!(plugin instanceof Plugin)) {
      throw new Error('El plugin debe extender la clase Plugin');
    }

    this.plugins.set(plugin.id, plugin);

    // Registrar comandos del plugin
    plugin.commands.forEach(cmd => {
      this.commandMap.set(cmd, plugin.id);
    });

    console.log(`✅ Plugin registrado: ${plugin.name}`);
    
    if (plugin.enabled) {
      plugin.onEnable();
    }
  }

  // Desregistrar plugin
  unregisterPlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.onDisable();
      
      // Remover comandos
      plugin.commands.forEach(cmd => {
        this.commandMap.delete(cmd);
      });
      
      this.plugins.delete(pluginId);
      console.log(`❌ Plugin desregistrado: ${plugin.name}`);
    }
  }

  // Obtener plugin por ID
  getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }

  // Obtener todos los plugins
  getAllPlugins() {
    return Array.from(this.plugins.values());
  }

  // Verificar si un mensaje es un comando
  isCommand(message) {
    const trimmed = message.trim();
    return trimmed.startsWith('/');
  }

  // Ejecutar comando
  async executeCommand(message) {
    const parts = message.trim().split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    const pluginId = this.commandMap.get(command);
    if (!pluginId) {
      return {
        type: 'error',
        result: `❌ Comando desconocido: ${command}\n\nComandos disponibles: ${Array.from(this.commandMap.keys()).join(', ')}`,
        error: true
      };
    }

    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.enabled) {
      return {
        type: 'error',
        result: `❌ Plugin ${pluginId} no disponible`,
        error: true
      };
    }

    try {
      return await plugin.handleCommand(command, args);
    } catch (error) {
      console.error(`Error ejecutando comando ${command}:`, error);
      return {
        type: 'error',
        result: `❌ Error ejecutando comando: ${error.message}`,
        error: true
      };
    }
  }

  // Procesar mensaje antes de enviar
  async processBeforeSend(message) {
    let processed = message;

    for (const plugin of this.plugins.values()) {
      if (plugin.enabled) {
        try {
          const result = await plugin.beforeSend(processed);
          if (result && typeof result === 'object') {
            processed = result.message || processed;
          }
        } catch (error) {
          console.error(`Error en plugin ${plugin.name}:`, error);
        }
      }
    }

    return processed;
  }

  // Procesar respuesta después de recibir
  async processAfterReceive(response) {
    let processed = response;

    for (const plugin of this.plugins.values()) {
      if (plugin.enabled) {
        try {
          const result = await plugin.afterReceive(processed);
          if (result) {
            processed = result;
          }
        } catch (error) {
          console.error(`Error en plugin ${plugin.name}:`, error);
        }
      }
    }

    return processed;
  }

  // Habilitar/deshabilitar plugin
  togglePlugin(pluginId, enabled) {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.enabled = enabled;
      if (enabled) {
        plugin.onEnable();
      } else {
        plugin.onDisable();
      }
    }
  }
}

// Instancia global del gestor de plugins
export const pluginManager = new PluginManager();

// Registrar plugins por defecto
pluginManager.registerPlugin(new CalculatorPlugin());
pluginManager.registerPlugin(new TranslatorPlugin());
pluginManager.registerPlugin(new WebSearchPlugin());
pluginManager.registerPlugin(new CodeGeneratorPlugin());
pluginManager.registerPlugin(new SummarizerPlugin());

export default pluginManager;
