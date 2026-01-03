/**
 * Universal file metadata interface
 */
export interface FileMeta {
  /** Unique identifier for the file */
  id: string
  /** Relative path to the file from upload directory */
  path: string
  /** MIME type of the file */
  mime: string
  /** File size in bytes */
  size: number
  /** Unix timestamp of creation */
  created: number
}

/**
 * Options for saving a file
 */
export interface FileSaveOptions {
  /** Subdirectory within upload directory (e.g., 'skins', 'gallery') */
  subDir: string
  /** Custom file extension (without dot), defaults to extension from mime type */
  extension?: string
}

/**
 * Interface for file storage service operations
 */
export interface IFileService {
  /**
   * Save a file to storage
   * @param data File data as Buffer
   * @param options Save options
   * @returns File metadata
   */
  saveFile(data: Buffer, options: FileSaveOptions): Promise<FileMeta>

  /**
   * Delete a file from storage
   * @param relativePath Relative path to the file
   * @returns true if file was deleted, false if not found
   */
  deleteFile(relativePath: string): Promise<boolean>

  /**
   * Read a file from storage
   * @param relativePath Relative path to the file
   * @returns File buffer or null if not found
   */
  readFile(relativePath: string): Promise<Buffer | null>

  /**
   * Check if a file exists
   * @param relativePath Relative path to the file
   * @returns true if file exists
   */
  fileExists(relativePath: string): Promise<boolean>

  /**
   * Get the absolute path to a file
   * @param relativePath Relative path to the file
   * @returns Absolute path
   */
  getAbsolutePath(relativePath: string): string
}
