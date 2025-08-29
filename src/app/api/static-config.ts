// 🚀 Configuración para APIs en modo estático
// Este archivo maneja las configuraciones necesarias para el export estático

export const API_CONFIG = {
  // URLs base para las APIs
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://tu-dominio.com/api' 
    : 'http://localhost:3000/api',
  
  // Configuración de CORS para APIs externas
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://tu-dominio.com'] 
      : ['http://localhost:3000'],
    credentials: true
  },
  
  // Timeouts para requests
  timeout: 30000,
  
  // Headers por defecto
  headers: {
    'Content-Type': 'application/json',
  }
};

// Función para manejar errores de API en modo estático
export const handleStaticApiError = (error: any) => {
  console.error('API Error in static mode:', error);
  return {
    success: false,
    error: 'API no disponible en modo estático',
    details: 'Esta funcionalidad requiere un servidor Node.js'
  };
};

// Función para simular respuestas de API en modo estático
export const createStaticResponse = (data: any) => {
  return {
    success: true,
    data,
    message: 'Respuesta simulada en modo estático',
    timestamp: new Date().toISOString()
  };
};
