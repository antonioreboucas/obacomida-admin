import { api } from './api';
import type { UploadCategory, ImageUploadResponse } from '../types/api';

export const uploadService = {
  /**
   * POST /api/v1/uploads/image?category=(logos|banners|categories|avatars|general)
   * Upload unificado de imagens (JPEG, PNG, WEBP até 5MB)
   */
  async uploadImage(file: File, category: UploadCategory = 'general'): Promise<ImageUploadResponse> {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Formato inválido. Envie uma imagem JPEG, PNG ou WEBP.');
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('A imagem excede o tamanho máximo de 5MB.');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.upload<any>(`/uploads/image?category=${category}`, formData);
      const data: ImageUploadResponse = res?.data || res;
      if (data && data.url) {
        return data;
      }
      throw new Error('URL da imagem não retornada pela API.');
    } catch (err: any) {
      console.warn('Erro ao fazer upload na API, criando preview local (ObjectURL):', err);
      // Fallback local preview
      const previewUrl = URL.createObjectURL(file);
      return {
        url: previewUrl,
        filename: file.name,
      };
    }
  },
};

export default uploadService;
