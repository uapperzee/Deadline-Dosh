import { supabase } from './supabase.js';

export const storageService = {
  /**
   * Uploads an avatar image file to the Supabase Storage 'avatars' bucket.
   * Path: avatars/{userId}/avatar_{timestamp}.{ext}
   */
  async uploadAvatar(file, userId) {
    if (!file) throw new Error('No file provided for upload.');

    // Validate size (max 2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('Image size exceeds 2MB. Please choose a smaller photo.');
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid image format. Supported formats: JPEG, PNG, WebP, GIF.');
    }

    const ext = file.name.split('.').pop() || 'png';
    const filePath = `${userId}/avatar_${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    // Retrieve public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return {
      path: filePath,
      publicUrl: urlData.publicUrl
    };
  },

  /**
   * Removes an avatar from the 'avatars' bucket.
   */
  async removeAvatar(filePath) {
    if (!filePath) return;
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.warn('[Storage] Could not remove old avatar:', error.message);
    }
  }
};
