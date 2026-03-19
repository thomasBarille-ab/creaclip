'use client'

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { CloudUpload, Film, X, CircleCheck, FileVideo, Upload, Cog } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadWithProgress } from '@/lib/uploadWithProgress'
import {
  cn,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  formatFileSize,
  generateStoragePath,
} from '@/lib/utils'
import { AlertBanner, Button, ProgressBar, useToast } from '@/components/ui'
import type { VideoInsert } from '@/types/database'

function generateThumbnailFromFile(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    const url = URL.createObjectURL(file)
    let captured = false

    const timeout = setTimeout(() => {
      if (!captured) {

        captureFrame()
      }
    }, 10000)

    function captureFrame() {
      if (captured) return
      captured = true
      clearTimeout(timeout)

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 360
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          video.src = ''
          if (blob && blob.size > 0) {
            resolve(blob)
          } else {
            reject(new Error('Canvas toBlob returned empty'))
          }
        },
        'image/jpeg',
        0.7
      )
    }

    video.onloadeddata = () => {
      if (isFinite(video.duration) && video.duration > 1) {
        video.currentTime = Math.min(1, video.duration * 0.1)
      } else {
        captureFrame()
      }
    }

    video.onseeked = () => captureFrame()

    video.onerror = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(url)
      reject(new Error('Video load failed'))
    }

    video.src = url
    video.load()
  })
}

export function VideoUploader() {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const toast = useToast()

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    setError(null)
    setSuccess(false)

    if (fileRejections.length > 0) {
      const code = fileRejections[0].errors[0]?.code
      if (code === 'file-too-large') {
        setError(t('upload.errorTooLarge'))
      } else if (code === 'file-invalid-type') {
        setError(t('upload.errorInvalidType'))
      } else {
        setError(t('upload.errorInvalidFile'))
      }
      return
    }

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_MIME_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    multiple: false,
    disabled: uploading || success,
  })

  async function handleUpload() {
    if (!file || uploading) return

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setError(t('upload.errorNotLoggedIn'))
        setUploading(false)
        return
      }

      const storagePath = generateStoragePath(session.user.id, file.name)

      const { error: uploadError } = await uploadWithProgress({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        bucket: 'videos',
        path: storagePath,
        file,
        token: session.access_token,
        onProgress: (percent) => setProgress(percent),
      })

      if (uploadError) {
        toast.error(uploadError)
        setError(uploadError)
        setUploading(false)
        return
      }

      setProgress(100)

      const title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')

      const videoInsert: VideoInsert = {
        user_id: session.user.id,
        title,
        original_filename: file.name,
        storage_path: storagePath,
        duration_seconds: null,
        file_size_bytes: file.size,
        status: 'uploaded',
        metadata: {},
      }

      const { data: video, error: dbError } = await supabase
        .from('videos')
        .insert(videoInsert)
        .select('id')
        .single()

      if (dbError) {
        toast.error(t('upload.errorSaving'))
        setError(t('upload.errorSaving'))
        setUploading(false)
        return
      }

      try {
        const thumbBlob = await generateThumbnailFromFile(file)
        const thumbPath = `${session.user.id}/thumbnails/${video.id}.jpg`
        const { error: thumbUploadError } = await supabase.storage.from('videos').upload(thumbPath, thumbBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        })
        if (thumbUploadError) { /* non-blocking */ }
      } catch { /* non-blocking */ }

      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(storagePath)

      fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
          storageUrl: publicUrl,
        }),
      }).catch(() => {})

      setUploading(false)
      setSuccess(true)
      toast.success(t('upload.toastSuccess'))
      setTimeout(() => router.push('/videos'), 2500)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('upload.errorUnexpected')
      toast.error(message)
      setError(message)
      setUploading(false)
    }
  }

  function removeFile() {
    setFile(null)
    setError(null)
    setProgress(0)
    setSuccess(false)
  }

  const currentStep = success ? 2 : uploading ? 1 : file ? 0 : -1
  const STEPS = [
    { key: 'select', labelKey: 'upload.stepSelect', icon: FileVideo },
    { key: 'upload', labelKey: 'upload.stepUpload', icon: Upload },
    { key: 'processing', labelKey: 'upload.stepProcessing', icon: Cog },
  ] as const

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((step, i) => {
          const StepIcon = step.icon
          const isCompleted = i < currentStep || (i === currentStep && success)
          const isActive = i === currentStep && !success
          return (
            <div key={step.key} className="flex items-center">
              {i > 0 && (
                <div
                  className={cn(
                    'h-0.5 w-12 sm:w-20 transition-colors duration-500',
                    i <= currentStep ? 'bg-orange-500' : 'bg-white/10'
                  )}
                />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500',
                    isCompleted
                      ? 'border-emerald-500 bg-emerald-500/20'
                      : isActive
                        ? 'border-orange-500 bg-orange-500/20 animate-pulse'
                        : 'border-white/20 bg-white/5'
                  )}
                >
                  {isCompleted ? (
                    <CircleCheck className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <StepIcon
                      className={cn(
                        'h-5 w-5',
                        isActive ? 'text-orange-400' : 'text-white/30'
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium',
                    isCompleted
                      ? 'text-emerald-400'
                      : isActive
                        ? 'text-orange-400'
                        : 'text-white/30'
                  )}
                >
                  {t(step.labelKey)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Dropzone */}
      {!success && (
        <div
          {...getRootProps()}
          className={cn(
            'relative flex min-h-[400px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-all duration-300',
            uploading && 'pointer-events-none',
            isDragActive
              ? 'border-orange-500 bg-orange-500/10 scale-[1.02] shadow-[0_0_40px_rgba(249,115,22,0.15)]'
              : 'border-white/20 hover:border-orange-500/50 hover:bg-white/5'
          )}
        >
          <input {...getInputProps()} />

          {/* Idle */}
          {!file && !uploading && (
            <div className="flex flex-col items-center gap-4 px-6">
              <div
                className={cn(
                  'rounded-2xl p-5 transition-all duration-300',
                  isDragActive
                    ? 'bg-orange-500/20 scale-110'
                    : 'bg-white/10'
                )}
              >
                {isDragActive ? (
                  <Film className="h-12 w-12 animate-bounce text-orange-400" />
                ) : (
                  <CloudUpload className="h-12 w-12 text-orange-400" />
                )}
              </div>
              {isDragActive ? (
                <p className="text-lg font-semibold text-orange-300">
                  {t('upload.dropzoneActive')}
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {t('upload.dropzone')}
                    </p>
                    <p className="mt-1 text-white/50">
                      {t('upload.browseFiles')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2">
                    <FileVideo className="h-4 w-4 text-white/40" />
                    <p className="text-sm font-medium text-white/50">
                      {t('upload.formats')}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* File selected */}
          {file && !uploading && (
            <div className="flex flex-col items-center gap-6 px-6">
              <div className="rounded-2xl bg-orange-500/20 p-5">
                <Film className="h-12 w-12 text-orange-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-white">{file.name}</p>
                <p className="mt-1 text-sm text-white/50">{formatFileSize(file.size)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUpload()
                  }}
                  icon={CloudUpload}
                  size="lg"
                >
                  {t('upload.importButton')}
                </Button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile()
                  }}
                  className="rounded-xl border border-white/20 bg-white/5 p-3 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Uploading */}
          {uploading && (
            <div className="flex w-full flex-col items-center gap-6 px-8">
              <div className="rounded-2xl bg-orange-500/20 p-5">
                <Film className="h-12 w-12 animate-pulse text-orange-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-white">{file?.name}</p>
                <p className="mt-1 text-sm text-white/50">
                  {progress < 100
                    ? t('upload.uploading', { progress })
                    : t('upload.saving')}
                </p>
              </div>
              <div className="h-3 w-full max-w-sm overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-600 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {error && <AlertBanner message={error} />}

      {/* Success */}
      {success && (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
          <div className="relative">
            <CircleCheck className="h-16 w-16 text-emerald-400 animate-[scale-in_0.5s_ease-out]" />
            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20" />
          </div>
          <div className="text-center">
            <p className="text-xl font-semibold text-white">
              {t('upload.successTitle')}
            </p>
            <p className="mt-2 text-white/60">
              {t('upload.successDesc')}
            </p>
            <p className="mt-1 text-sm text-white/40">
              {t('upload.successRedirect')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
