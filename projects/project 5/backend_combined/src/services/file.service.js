import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { ApiError } from '../utils/ApiError.js';

export class FileService {
  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.tasksDir = path.join(this.uploadsDir, 'tasks');
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    this.allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  }

  async ensureUploadDirs() {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }

    try {
      await fs.access(this.tasksDir);
    } catch {
      await fs.mkdir(this.tasksDir, { recursive: true });
    }
  }

  validateFile(file) {
    if (!file) {
      throw new ApiError(400, 'No file uploaded');
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      throw new ApiError(400, `File size exceeds maximum limit of ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new ApiError(400, 'Invalid file type. Only JPEG, PNG, and WebP images are allowed');
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      throw new ApiError(400, 'Invalid file extension');
    }

    return true;
  }

  generateSecureFilename(originalFilename) {
    const ext = path.extname(originalFilename);
    const randomString = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${randomString}${ext}`;
  }

  sanitizeFilename(filename) {
    // Remove any path traversal attempts and special characters
    return filename
      .replace(/\.\./g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  async saveTaskScreenshot(file, taskId) {
    try {
      await this.ensureUploadDirs();
      this.validateFile(file);

      const secureFilename = this.generateSecureFilename(file.originalname);
      const filePath = path.join(this.tasksDir, secureFilename);

      // Save file to disk
      await fs.writeFile(filePath, file.buffer);

      // Generate URL (adjust based on your server configuration)
      const fileUrl = `/uploads/tasks/${secureFilename}`;

      return {
        url: fileUrl,
        filename: secureFilename,
        originalName: this.sanitizeFilename(file.originalname),
        mimeType: file.mimetype,
        size: file.size,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Failed to save file: ${error.message}`);
    }
  }

  async deleteFile(fileUrl) {
    try {
      // Extract filename from URL
      const filename = path.basename(fileUrl);
      const filePath = path.join(this.tasksDir, filename);

      // Check if file exists
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        return true;
      } catch {
        // File doesn't exist, that's okay
        return false;
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  getFileUrl(filename) {
    return `/uploads/tasks/${filename}`;
  }
}

export default new FileService();
