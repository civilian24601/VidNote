import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const uploadVideo = async (file: File, userId: number) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
    
  if (error) {
    throw error;
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('videos')
    .getPublicUrl(fileName);
    
  return urlData.publicUrl;
};

export const deleteVideoFromStorage = async (videoUrl: string) => {
  const fileName = videoUrl.split('/').pop();
  if (!fileName) return;
  
  const { error } = await supabase.storage
    .from('videos')
    .remove([fileName]);
    
  if (error) {
    throw error;
  }
  
  return true;
};
