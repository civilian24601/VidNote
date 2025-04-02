/**
 * Enhanced Supabase Storage Helper with Detailed Logging
 * This module provides improved error handling and logging for Supabase storage operations
 */

import { logger } from './logger';
import { SupabaseClient } from '@supabase/supabase-js';

export interface StorageOptions {
  makePublic?: boolean;
  contentType?: string;
  cacheControl?: string;
}

class SupabaseStorageHelper {
  private supabase: SupabaseClient;
  
  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
    logger.supabase.info('SupabaseStorageHelper initialized');
  }
  
  /**
   * Validates Supabase storage buckets configuration
   * @returns Promise with validation result
   */
  async validateBuckets(): Promise<{
    valid: boolean;
    buckets: { name: string; exists: boolean; public: boolean }[];
    missingBuckets: string[];
  }> {
    const requiredBuckets = ['videos', 'thumbnails'];
    const result = {
      valid: true,
      buckets: [] as { name: string; exists: boolean; public: boolean }[],
      missingBuckets: [] as string[]
    };
    
    try {
      logger.supabase.info('Validating Supabase storage buckets');
      
      // List all available buckets
      const { data: buckets, error } = await this.supabase.storage.listBuckets();
      
      if (error) {
        logger.supabase.error('Failed to list storage buckets', { error });
        result.valid = false;
        return result;
      }
      
      // Check if each required bucket exists and is public
      for (const bucketName of requiredBuckets) {
        const bucket = buckets?.find(b => b.name === bucketName);
        
        if (!bucket) {
          logger.supabase.warn(`Required bucket "${bucketName}" is missing`, { buckets });
          result.missingBuckets.push(bucketName);
          result.buckets.push({ name: bucketName, exists: false, public: false });
          result.valid = false;
        } else {
          logger.supabase.info(`Found bucket "${bucketName}", public: ${bucket.public}`);
          result.buckets.push({ name: bucketName, exists: true, public: bucket.public });
          
          if (!bucket.public) {
            logger.supabase.warn(`Bucket "${bucketName}" is not public`, { bucket });
            result.valid = false;
          }
        }
      }
      
      return result;
    } catch (err) {
      logger.supabase.error('Unexpected error validating buckets', { err });
      result.valid = false;
      return result;
    }
  }
  
  /**
   * Create a storage bucket if it doesn't exist
   * @param bucketName Name of the bucket to create
   * @param isPublic Whether the bucket should be public (default true)
   */
  async createBucketIfNotExists(bucketName: string, isPublic = true): Promise<boolean> {
    try {
      logger.supabase.info(`Checking if bucket "${bucketName}" exists`);
      
      // Check if bucket exists
      const { data: bucket, error: getBucketError } = await this.supabase.storage.getBucket(bucketName);
      
      if (getBucketError && getBucketError.message !== 'Bucket not found') {
        logger.supabase.error(`Error checking bucket "${bucketName}"`, { error: getBucketError });
        return false;
      }
      
      // Create bucket if it doesn't exist
      if (!bucket) {
        logger.supabase.info(`Creating bucket "${bucketName}" (public: ${isPublic})`);
        const { data, error } = await this.supabase.storage.createBucket(bucketName, { public: isPublic });
        
        if (error) {
          logger.supabase.error(`Failed to create bucket "${bucketName}"`, { error });
          return false;
        }
        
        logger.supabase.info(`Successfully created bucket "${bucketName}"`);
        return true;
      }
      
      // If bucket exists but public setting doesn't match, log a warning
      if (bucket.public !== isPublic) {
        logger.supabase.warn(`Bucket "${bucketName}" exists but public setting (${bucket.public}) doesn't match requested (${isPublic})`);
      } else {
        logger.supabase.info(`Bucket "${bucketName}" already exists with correct settings`);
      }
      
      return true;
    } catch (err) {
      logger.supabase.error(`Unexpected error creating/checking bucket "${bucketName}"`, { err });
      return false;
    }
  }
  
  /**
   * Enhanced file upload to Supabase storage with detailed logging
   * @param bucketName The target bucket name
   * @param path Path where the file should be stored
   * @param file File to upload
   * @param options Upload options
   */
  async uploadFile(
    bucketName: string,
    path: string,
    file: File | Buffer,
    options: StorageOptions = {}
  ): Promise<{ success: boolean; url?: string; error?: any }> {
    try {
      const startTime = Date.now();
      logger.storage.info(`Starting upload to ${bucketName}/${path}`);
      
      const uploadOptions: any = {};
      if (options.contentType) uploadOptions.contentType = options.contentType;
      if (options.cacheControl) uploadOptions.cacheControl = options.cacheControl;
      
      // Perform the upload
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(path, file, uploadOptions);
      
      if (error) {
        logger.storage.error(`Upload failed for ${bucketName}/${path}`, { error });
        return { success: false, error };
      }
      
      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(bucketName)
        .getPublicUrl(path);
      
      const endTime = Date.now();
      logger.storage.info(`Upload successful for ${bucketName}/${path}`, {
        duration: `${endTime - startTime}ms`,
        path: data?.path
      });
      
      return { success: true, url: urlData.publicUrl };
    } catch (err) {
      logger.storage.error(`Unexpected error uploading to ${bucketName}/${path}`, { err });
      return { success: false, error: err };
    }
  }
  
  /**
   * Fetch file metadata from Supabase
   * @param bucketName Bucket name
   * @param path File path
   */
  async getFileMetadata(bucketName: string, path: string): Promise<any> {
    try {
      logger.storage.info(`Fetching metadata for ${bucketName}/${path}`);
      
      // List files in the directory to get the specific file
      const directoryPath = path.split('/').slice(0, -1).join('/');
      const fileName = path.split('/').pop();
      
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .list(directoryPath);
      
      if (error) {
        logger.storage.error(`Failed to list directory for metadata ${bucketName}/${directoryPath}`, { error });
        return { success: false, error };
      }
      
      const fileInfo = data?.find(file => file.name === fileName);
      
      if (!fileInfo) {
        logger.storage.warn(`File not found: ${bucketName}/${path}`);
        return { success: false, error: 'File not found' };
      }
      
      logger.storage.info(`Found metadata for ${bucketName}/${path}`);
      return { success: true, metadata: fileInfo };
    } catch (err) {
      logger.storage.error(`Unexpected error getting metadata for ${bucketName}/${path}`, { err });
      return { success: false, error: err };
    }
  }
  
  /**
   * Check if a file exists in storage
   * @param bucketName Bucket name
   * @param path File path
   */
  async fileExists(bucketName: string, path: string): Promise<boolean> {
    try {
      logger.storage.debug(`Checking if file exists: ${bucketName}/${path}`);
      
      const result = await this.getFileMetadata(bucketName, path);
      return result.success;
    } catch (err) {
      logger.storage.error(`Error checking file existence: ${bucketName}/${path}`, { err });
      return false;
    }
  }
  
  /**
   * List all files in a directory
   * @param bucketName Bucket name
   * @param prefix Directory prefix
   */
  async listFiles(bucketName: string, prefix: string = ''): Promise<{ success: boolean; files?: any[]; error?: any }> {
    try {
      logger.storage.info(`Listing files in ${bucketName}/${prefix}`);
      
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .list(prefix);
      
      if (error) {
        logger.storage.error(`Failed to list files in ${bucketName}/${prefix}`, { error });
        return { success: false, error };
      }
      
      logger.storage.info(`Found ${data?.length || 0} files in ${bucketName}/${prefix}`);
      return { success: true, files: data };
    } catch (err) {
      logger.storage.error(`Unexpected error listing files in ${bucketName}/${prefix}`, { err });
      return { success: false, error: err };
    }
  }
  
  /**
   * Delete a file from storage
   * @param bucketName Bucket name
   * @param path File path
   */
  async deleteFile(bucketName: string, path: string): Promise<{ success: boolean; error?: any }> {
    try {
      logger.storage.info(`Deleting file: ${bucketName}/${path}`);
      
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .remove([path]);
      
      if (error) {
        logger.storage.error(`Failed to delete file: ${bucketName}/${path}`, { error });
        return { success: false, error };
      }
      
      logger.storage.info(`Successfully deleted file: ${bucketName}/${path}`);
      return { success: true };
    } catch (err) {
      logger.storage.error(`Unexpected error deleting file: ${bucketName}/${path}`, { err });
      return { success: false, error: err };
    }
  }
  
  /**
   * Perform a health check on the storage system
   */
  async healthCheck(): Promise<{
    success: boolean;
    buckets: { name: string; status: 'ok' | 'error'; public: boolean }[];
    canUpload: boolean;
    canList: boolean;
    error?: any;
  }> {
    logger.supabase.info('Performing storage health check');
    
    const result = {
      success: true,
      buckets: [] as { name: string; status: 'ok' | 'error'; public: boolean }[],
      canUpload: false,
      canList: false
    };
    
    try {
      // Check buckets
      const bucketsCheck = await this.validateBuckets();
      result.success = bucketsCheck.valid;
      
      for (const bucket of bucketsCheck.buckets) {
        result.buckets.push({
          name: bucket.name,
          status: bucket.exists ? 'ok' : 'error',
          public: bucket.public
        });
      }
      
      // Only test uploads if buckets exist
      if (bucketsCheck.valid) {
        // Test upload to videos bucket
        const testData = Buffer.from([0, 1, 2, 3, 4]);
        const testPath = `health-check/test-${Date.now()}.bin`;
        
        const uploadResult = await this.uploadFile('videos', testPath, testData);
        result.canUpload = uploadResult.success;
        
        // Test listing
        const listResult = await this.listFiles('videos', 'health-check');
        result.canList = listResult.success;
        
        // Cleanup
        await this.deleteFile('videos', testPath);
      }
      
      logger.supabase.info('Storage health check completed', result);
      return result;
    } catch (err) {
      logger.supabase.error('Storage health check failed', { err });
      return {
        ...result,
        success: false,
        error: err
      };
    }
  }
}

export default SupabaseStorageHelper;