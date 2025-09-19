// Utilidad para convertir imágenes HEIC a JPEG

/**
 * Convierte una imagen HEIC/HEIF a JPEG (solo en el cliente)
 * @param file - Archivo de imagen HEIC/HEIF
 * @returns Promise<File> - Archivo convertido a JPEG
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  // Verificar si estamos en el cliente
  if (typeof window === 'undefined') {
    throw new Error('La conversión HEIC solo está disponible en el cliente');
  }

  try {
    console.log(`🔄 Convirtiendo HEIC/HEIF a JPEG: ${file.name}`);
    
    // Importar dinámicamente heic2any solo en el cliente
    const heic2any = (await import('heic2any')).default;
    
    // Convertir HEIC a Blob JPEG
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8 // Calidad del JPEG (0.1 - 1.0)
    }) as Blob;

    // Crear nuevo archivo con el blob convertido
    const convertedFile = new File(
      [convertedBlob], 
      file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      { 
        type: 'image/jpeg',
        lastModified: file.lastModified
      }
    );

    console.log(`✅ Conversión completada: ${file.name} -> ${convertedFile.name}`);
    console.log(`📏 Tamaño original: ${file.size} bytes, convertido: ${convertedFile.size} bytes`);
    
    return convertedFile;
  } catch (error) {
    console.error('❌ Error convirtiendo HEIC a JPEG:', error);
    throw new Error(`Error convirtiendo imagen HEIC: ${error}`);
  }
}

/**
 * Verifica si un archivo es HEIC/HEIF
 * @param file - Archivo a verificar
 * @returns boolean - True si es HEIC/HEIF
 */
export function isHeicFile(file: File): boolean {
  // Verificar por tipo MIME
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    return true;
  }
  
  // Verificar por extensión de archivo
  const extension = file.name.toLowerCase().split('.').pop();
  return extension === 'heic' || extension === 'heif';
}

/**
 * Procesa un archivo de imagen, convirtiendo HEIC a JPEG si es necesario
 * @param file - Archivo de imagen
 * @returns Promise<File> - Archivo procesado (original o convertido)
 */
export async function processImageFile(file: File): Promise<File> {
  // Si estamos en el servidor, no intentamos convertir HEIC
  if (typeof window === 'undefined') {
    console.log('🔄 Procesamiento en servidor: manteniendo archivo original');
    return file;
  }

  if (isHeicFile(file)) {
    console.log(`📱 Detectado archivo HEIC/HEIF de iPhone: ${file.name}`);
    return await convertHeicToJpeg(file);
  }
  
  return file;
}

/**
 * Lista de tipos de archivo permitidos (incluyendo HEIC/HEIF)
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg', 
  'image/jpg', 
  'image/png', 
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf'
];

/**
 * Verifica si un tipo de archivo es soportado
 * @param fileType - Tipo MIME del archivo
 * @returns boolean - True si es soportado
 */
export function isSupportedFileType(fileType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(fileType);
}
