import { join, dirname } from 'pathe'
import { promises as fsp } from 'node:fs'
import { v4 as uuidv4 } from 'uuid'
import type { IFileService, FileMeta, FileSaveOptions } from '~/interfaces/file.service'

/**
 * Default implementation of file storage service
 */
class FileService implements IFileService {
  private uploadDir: string

  constructor(uploadDir: string) {
    this.uploadDir = uploadDir
  }

  /**
   * Generate a unique file path with nested directories for better file system performance
   * @param subDir Subdirectory name
   * @param extension File extension
   * @returns Relative path
   */
  private generateFilePath(subDir: string, extension: string): string {
    const hex = uuidv4().replace(/-/g, '')
    return `${subDir}/${hex.slice(0, 2)}/${hex.slice(2, 4)}/${hex.slice(4, 6)}/${hex}.${extension}`
  }

  async saveFile(data: Buffer, options: FileSaveOptions): Promise<FileMeta> {
    const extension = options.extension || 'bin'
    const relPath = this.generateFilePath(options.subDir, extension)
    const absPath = join(this.uploadDir, relPath)

    // Create directories and write file
    await fsp.mkdir(dirname(absPath), { recursive: true })
    await fsp.writeFile(absPath, data)

    return {
      id: uuidv4(),
      path: relPath,
      mime: this.getMimeFromExtension(extension),
      size: data.length,
      created: Math.floor(Date.now() / 1000)
    }
  }

  async deleteFile(relativePath: string): Promise<boolean> {
    const absPath = join(this.uploadDir, relativePath)
    try {
      await fsp.rm(absPath, { force: true })
      // Clean up empty parent directories
      await this.cleanEmptyDirs(dirname(absPath))
      return true
    } catch (err: any) {
      if (err.code === 'ENOENT') return false
      throw err
    }
  }

  async readFile(relativePath: string): Promise<Buffer | null> {
    const absPath = join(this.uploadDir, relativePath)
    try {
      return await fsp.readFile(absPath)
    } catch (err: any) {
      if (err.code === 'ENOENT') return null
      throw err
    }
  }

  async fileExists(relativePath: string): Promise<boolean> {
    const absPath = join(this.uploadDir, relativePath)
    try {
      await fsp.access(absPath)
      return true
    } catch {
      return false
    }
  }

  getAbsolutePath(relativePath: string): string {
    return join(this.uploadDir, relativePath)
  }

  /**
   * Recursively clean up empty directories
   */
  private async cleanEmptyDirs(dirPath: string): Promise<void> {
    // Don't go above the upload directory
    if (!dirPath.startsWith(this.uploadDir) || dirPath === this.uploadDir) {
      return
    }

    try {
      const entries = await fsp.readdir(dirPath)
      if (entries.length === 0) {
        await fsp.rmdir(dirPath)
        // Recursively check parent
        await this.cleanEmptyDirs(dirname(dirPath))
      }
    } catch {
      // Directory might not exist or not be accessible
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeFromExtension(extension: string): string {
    const mimeMap: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bin': 'application/octet-stream'
    }
    return mimeMap[extension.toLowerCase()] || 'application/octet-stream'
  }
}

// Singleton instance
let fileServiceInstance: FileService | null = null

/**
 * Get the file service instance
 * @returns FileService instance
 */
export function useFileService(): IFileService {
  if (!fileServiceInstance) {
    const { uploadDir = './uploads' } = useRuntimeConfig()
    fileServiceInstance = new FileService(uploadDir)
  }
  return fileServiceInstance
}

/**
 * Delete multiple files
 * @param paths Array of relative paths
 */
export async function deleteFiles(paths: string[]): Promise<void> {
  const service = useFileService()
  await Promise.all(paths.map(path => service.deleteFile(path)))
}

/**
 * Recursively removes empty directories inside given root
 * @param root Root directory to clean
 */
export async function removeEmptyDirs(root: string): Promise<void> {
  try {
    const entries = await fsp.readdir(root, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(root, entry.name)
      if (entry.isDirectory()) {
        await removeEmptyDirs(fullPath)
        const remaining = await fsp.readdir(fullPath)
        if (remaining.length === 0) {
          await fsp.rmdir(fullPath)
        }
      }
    }
  } catch {
    // Directory might not exist
  }
}
