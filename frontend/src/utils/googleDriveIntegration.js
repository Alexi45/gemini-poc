/**
 * Integración con Google Drive
 * Permite exportar conversaciones directamente a Google Drive
 */

// Configuración de Google Drive API
const GOOGLE_DRIVE_CONFIG = {
  clientId: 'YOUR_GOOGLE_CLIENT_ID', // Reemplazar con tu Client ID
  apiKey: 'YOUR_GOOGLE_API_KEY', // Reemplazar con tu API Key
  scope: 'https://www.googleapis.com/auth/drive.file',
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
};

let gapiLoaded = false;
let gisLoaded = false;
let tokenClient = null;

/**
 * Cargar la API de Google
 */
export const loadGoogleAPI = () => {
  return new Promise((resolve, reject) => {
    // Cargar gapi
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.onload = () => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: GOOGLE_DRIVE_CONFIG.apiKey,
          discoveryDocs: GOOGLE_DRIVE_CONFIG.discoveryDocs
        });
        gapiLoaded = true;
        checkAndResolve();
      });
    };
    document.body.appendChild(gapiScript);

    // Cargar Google Identity Services
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.onload = () => {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_DRIVE_CONFIG.clientId,
        scope: GOOGLE_DRIVE_CONFIG.scope,
        callback: '', // Se define en requestAccessToken
      });
      gisLoaded = true;
      checkAndResolve();
    };
    document.body.appendChild(gisScript);

    function checkAndResolve() {
      if (gapiLoaded && gisLoaded) {
        resolve();
      }
    }
  });
};

/**
 * Solicitar autorización del usuario
 */
export const requestAccessToken = () => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google API not loaded'));
      return;
    }

    tokenClient.callback = (response) => {
      if (response.error) {
        reject(response);
      } else {
        resolve(response);
      }
    };

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

/**
 * Verificar si el usuario está autenticado
 */
export const isAuthenticated = () => {
  return window.gapi?.client?.getToken() != null;
};

/**
 * Cerrar sesión
 */
export const signOut = () => {
  const token = window.gapi?.client?.getToken();
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
  }
};

/**
 * Exportar conversación a Google Drive como documento de texto
 */
export const exportToGoogleDrive = async (messages, conversationId, fileName) => {
  try {
    if (!isAuthenticated()) {
      await requestAccessToken();
    }

    // Crear contenido del archivo
    let content = `Conversación: ${conversationId}\n`;
    content += `Exportado: ${new Date().toLocaleString()}\n`;
    content += '='.repeat(80) + '\n\n';

    messages.forEach((msg, index) => {
      const role = msg.role === 'user' ? 'TÚ' : 'GEMINI AI';
      const timestamp = new Date(msg.timestamp).toLocaleString();
      
      content += `[${index + 1}] ${role} - ${timestamp}\n`;
      content += '-'.repeat(80) + '\n';
      content += `${msg.text}\n\n`;
    });

    // Crear metadata del archivo
    const fileMetadata = {
      name: fileName || `conversacion_${conversationId}_${Date.now()}.txt`,
      mimeType: 'text/plain'
    };

    const file = new Blob([content], { type: 'text/plain' });
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    form.append('file', file);

    // Subir a Google Drive
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: new Headers({ 
          Authorization: 'Bearer ' + window.gapi.client.getToken().access_token 
        }),
        body: form
      }
    );

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        fileId: result.id,
        fileName: result.name,
        webViewLink: `https://drive.google.com/file/d/${result.id}/view`
      };
    } else {
      throw new Error(result.error?.message || 'Error al subir archivo');
    }

  } catch (error) {
    console.error('Error exportando a Google Drive:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Listar archivos recientes en Google Drive
 */
export const listRecentFiles = async (maxResults = 10) => {
  try {
    if (!isAuthenticated()) {
      await requestAccessToken();
    }

    const response = await window.gapi.client.drive.files.list({
      pageSize: maxResults,
      fields: 'files(id, name, mimeType, createdTime, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc',
      q: "mimeType='text/plain' and name contains 'conversacion'"
    });

    return {
      success: true,
      files: response.result.files || []
    };

  } catch (error) {
    console.error('Error listando archivos:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Crear carpeta en Google Drive
 */
export const createFolder = async (folderName = 'Gemini Chat Conversations') => {
  try {
    if (!isAuthenticated()) {
      await requestAccessToken();
    }

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const response = await window.gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: 'id, name'
    });

    return {
      success: true,
      folderId: response.result.id,
      folderName: response.result.name
    };

  } catch (error) {
    console.error('Error creando carpeta:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Exportar a carpeta específica
 */
export const exportToFolder = async (messages, conversationId, folderId, fileName) => {
  try {
    if (!isAuthenticated()) {
      await requestAccessToken();
    }

    // Similar a exportToGoogleDrive pero con folderId
    let content = `Conversación: ${conversationId}\n`;
    content += `Exportado: ${new Date().toLocaleString()}\n`;
    content += '='.repeat(80) + '\n\n';

    messages.forEach((msg, index) => {
      const role = msg.role === 'user' ? 'TÚ' : 'GEMINI AI';
      const timestamp = new Date(msg.timestamp).toLocaleString();
      
      content += `[${index + 1}] ${role} - ${timestamp}\n`;
      content += '-'.repeat(80) + '\n';
      content += `${msg.text}\n\n`;
    });

    const fileMetadata = {
      name: fileName || `conversacion_${conversationId}_${Date.now()}.txt`,
      mimeType: 'text/plain',
      parents: [folderId]
    };

    const file = new Blob([content], { type: 'text/plain' });
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: new Headers({ 
          Authorization: 'Bearer ' + window.gapi.client.getToken().access_token 
        }),
        body: form
      }
    );

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        fileId: result.id,
        fileName: result.name,
        webViewLink: `https://drive.google.com/file/d/${result.id}/view`
      };
    } else {
      throw new Error(result.error?.message || 'Error al subir archivo');
    }

  } catch (error) {
    console.error('Error exportando a carpeta:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  loadGoogleAPI,
  requestAccessToken,
  isAuthenticated,
  signOut,
  exportToGoogleDrive,
  listRecentFiles,
  createFolder,
  exportToFolder
};
