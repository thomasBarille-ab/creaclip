import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Video upload constants
export const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500 Mo
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
  'video/mp2t': ['.mts', '.m2ts'],
}
export const ALLOWED_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mts', '.m2ts']

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 o'
  const k = 1024
  const sizes = ['o', 'Ko', 'Mo', 'Go']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function generateStoragePath(userId: string, fileName: string): string {
  const timestamp = Date.now()
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/${timestamp}-${sanitized}`
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function getDaysRemaining(createdAt: string, retentionDays: number): number {
  const created = new Date(createdAt)
  const expiresAt = new Date(created.getTime() + retentionDays * 24 * 60 * 60 * 1000)
  const now = new Date()
  const diffMs = expiresAt.getTime() - now.getTime()
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000))
}
