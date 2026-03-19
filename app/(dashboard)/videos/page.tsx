'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Upload,
  Clock,
  Loader2,
  Sparkles,
  Trash2,
  Play,
  HardDrive,
  Calendar,
  Scissors,
  ChevronDown,
  TrendingUp,
  Download,
  Eye,
  CircleAlert,
  RefreshCw,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { cn, formatTime, formatFileSize, formatDate } from '@/lib/utils'
import { VIDEO_STATUS_KEYS, VIDEO_STATUS_COLORS } from '@/lib/constants'
import { EmptyState, Badge, ConfirmModal, useToast } from '@/components/ui'
import { ClipPreviewModal } from '@/components/ClipPreviewModal'
import { VideoThumbnail } from '@/components/VideoThumbnail'
import { useClipDownload } from '@/hooks/useClipDownload'
import type { VideoWithClips, Clip } from '@/types/database'

export default function VideosPage() {
  const { t } = useTranslation()
  const [videos, setVideos] = useState<VideoWithClips[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [transcribingId, setTranscribingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null)
  const [previewClip, setPreviewClip] = useState<Clip | null>(null)
  const [deletingClipId, setDeletingClipId] = useState<string | null>(null)
  const [confirmDeleteClipId, setConfirmDeleteClipId] = useState<string | null>(null)
  const { downloadingId, downloadClip } = useClipDownload()
  const toast = useToast()

  const loadVideos = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('videos')
      .select('*, clips(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    setVideos((data as VideoWithClips[]) ?? [])
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  // Polling auto quand des vidéos sont en cours de traitement
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const hasProcessing = videos.some((v) => v.status === 'processing' || v.status === 'uploaded')

    if (hasProcessing && !pollingRef.current) {
      pollingRef.current = setInterval(() => loadVideos(true), 5000)
    } else if (!hasProcessing && pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [videos, loadVideos])

  async function deleteVideo(video: VideoWithClips) {
    setDeletingId(video.id)
    setConfirmDeleteId(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: clips } = await supabase
        .from('clips')
        .select('id, storage_path')
        .eq('video_id', video.id)

      if (clips && clips.length > 0) {
        const clipPaths = clips
          .map((c) => c.storage_path)
          .filter(Boolean) as string[]

        if (clipPaths.length > 0) {
          await supabase.storage.from('videos').remove(clipPaths)
        }

        await supabase.from('clips').delete().eq('video_id', video.id)
      }

      await supabase.from('transcriptions').delete().eq('video_id', video.id)
      await supabase.from('processing_jobs').delete().eq('video_id', video.id)

      if (video.storage_path) {
        await supabase.storage.from('videos').remove([video.storage_path])
      }

      await supabase.from('videos').delete().eq('id', video.id)
      setVideos((prev) => prev.filter((v) => v.id !== video.id))
      toast.success(t('videos.videoDeleted'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('videos.deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  async function transcribeVideo(videoId: string) {
    setTranscribingId(videoId)

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      })

      if (response.ok) {
        toast.success(t('videos.transcriptionStarted'))
        await loadVideos()
      } else {
        const result = await response.json()

        toast.error(result.error ?? t('videos.transcriptionError'))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('videos.transcriptionError'))
    } finally {
      setTranscribingId(null)
    }
  }

  async function deleteClip(clip: Clip) {
    setDeletingClipId(clip.id)
    setConfirmDeleteClipId(null)

    try {
      const supabase = createClient()

      if (clip.storage_path) {
        await supabase.storage.from('videos').remove([clip.storage_path])
      }

      if (clip.thumbnail_path) {
        await supabase.storage.from('videos').remove([clip.thumbnail_path])
      }

      const { error } = await supabase.from('clips').delete().eq('id', clip.id)
      if (error) {
        toast.error(t('videos.deleteClipError'))
        return
      }

      setVideos((prev) =>
        prev.map((v) =>
          v.id === clip.video_id
            ? { ...v, clips: (v.clips ?? []).filter((c) => c.id !== clip.id) }
            : v
        )
      )
      toast.success(t('videos.clipDeleted'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('videos.deleteError'))
    } finally {
      setDeletingClipId(null)
    }
  }

  const clipToDelete = videos
    .flatMap((v) => v.clips ?? [])
    .find((c) => c.id === confirmDeleteClipId)

  const videoToDelete = videos.find((v) => v.id === confirmDeleteId)

  return (
    <>
      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.4); }
          50% { box-shadow: 0 0 20px 4px rgba(234, 88, 12, 0.2); }
        }
        .animate-fade-in-up-1 { animation: fade-in-up 0.5s ease-out 0.1s both; }
        .animate-fade-in-up-2 { animation: fade-in-up 0.5s ease-out 0.2s both; }
        .animate-fade-in-up-3 { animation: fade-in-up 0.5s ease-out 0.3s both; }
        .animate-pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
        .skeleton-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="mx-auto max-w-5xl space-y-8">
        {/* ═══ Hero Header ═══ */}
        <div className="animate-fade-in-up-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">{t('videos.title')}</h1>
            {!loading && (
              <p className="mt-1 text-sm text-white/40">
                {videos.length === 0 ? t('videos.noVideos') : t('videos.videoCount', { count: videos.length })}
              </p>
            )}
          </div>
          <Link
            href="/upload"
            className="animate-pulse-glow flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-orange-600/20 transition-transform hover:scale-105"
          >
            <Upload className="h-5 w-5" />
            {t('videos.importVideo')}
          </Link>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="animate-fade-in-up-2 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white/10">
                    <div className="skeleton-shimmer absolute inset-0" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 h-5 w-1/3 rounded bg-white/10" />
                    <div className="flex gap-3">
                      <div className="h-3 w-16 rounded bg-white/5" />
                      <div className="h-3 w-12 rounded bg-white/5" />
                      <div className="h-3 w-20 rounded bg-white/5" />
                    </div>
                  </div>
                  <div className="h-7 w-24 rounded-full bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Liste des vidéos */}
        {!loading && videos.length > 0 && (
          <div className="animate-fade-in-up-2 space-y-4">
            {videos.map((video, i) => {
              const readyClips = (video.clips ?? []).filter((c) => c.status === 'ready')
              const clipCount = readyClips.length
              const isDeleting = deletingId === video.id
              const isTranscribing = transcribingId === video.id
              const isExpanded = expandedVideoId === video.id

              return (
                <div
                  key={video.id}
                  className={cn(
                    'group overflow-hidden rounded-2xl border bg-white/5 transition-all duration-300',
                    isDeleting
                      ? 'border-red-500/30 opacity-50'
                      : 'border-white/10 hover:-translate-y-0.5 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-600/5'
                  )}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-start gap-4 p-5">
                    {/* Miniature */}
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                      {video.status === 'processing' || isTranscribing ? (
                        <div className="flex h-full w-full items-center justify-center bg-orange-500/20">
                          <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                        </div>
                      ) : video.status === 'failed' ? (
                        <div className="flex h-full w-full items-center justify-center bg-red-500/20">
                          <CircleAlert className="h-6 w-6 text-red-400" />
                        </div>
                      ) : (
                        <VideoThumbnail storagePath={`${video.user_id}/thumbnails/${video.id}.jpg`} className="h-full w-full rounded-xl" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-3">
                        <h3 className="truncate text-lg font-semibold text-white">
                          {video.title}
                        </h3>
                        <Badge
                          variant={video.status === 'ready' ? 'emerald' : video.status === 'processing' ? 'blue' : video.status === 'failed' ? 'red' : 'yellow'}
                        >
                          {isTranscribing ? t('videos.transcription') : t(VIDEO_STATUS_KEYS[video.status])}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/40">
                        <span className="flex items-center gap-1.5">
                          <HardDrive className="h-3.5 w-3.5" />
                          {formatFileSize(video.file_size_bytes)}
                        </span>
                        {video.duration_seconds && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(video.duration_seconds)}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(video.created_at)}
                        </span>
                        {clipCount > 0 && (
                          <button
                            onClick={() => setExpandedVideoId(isExpanded ? null : video.id)}
                            className="flex items-center gap-1.5 text-orange-400 transition-colors hover:text-orange-300"
                          >
                            <Scissors className="h-3.5 w-3.5" />
                            {clipCount} clip{clipCount > 1 ? 's' : ''}
                            <ChevronDown
                              className={cn(
                                'h-3.5 w-3.5 transition-transform duration-200',
                                isExpanded && 'rotate-180'
                              )}
                            />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {video.status === 'failed' && (
                        <button
                          onClick={() => transcribeVideo(video.id)}
                          disabled={isTranscribing || isDeleting}
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white transition-all',
                            'bg-orange-500/20 hover:bg-orange-500/30',
                            (isTranscribing || isDeleting) && 'opacity-50'
                          )}
                        >
                          {isTranscribing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">{t('videos.retry')}</span>
                        </button>
                      )}

                      {video.status === 'uploaded' && (
                        <button
                          onClick={() => transcribeVideo(video.id)}
                          disabled={isTranscribing || isDeleting}
                          className={cn(
                            'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white transition-all',
                            'bg-blue-500/20 hover:bg-blue-500/30',
                            (isTranscribing || isDeleting) && 'opacity-50'
                          )}
                        >
                          {isTranscribing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">{t('videos.transcribe')}</span>
                        </button>
                      )}

                      {video.status === 'ready' && (
                        <Link
                          href={`/clips/create/${video.id}`}
                          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-3 py-2 text-sm font-semibold text-white transition-transform hover:scale-105"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span className="hidden sm:inline">{t('videos.createClips')}</span>
                        </Link>
                      )}

                      <button
                        onClick={() => setConfirmDeleteId(video.id)}
                        disabled={isDeleting}
                        className={cn(
                          'rounded-lg p-2 text-white/30 transition-colors hover:bg-red-500/20 hover:text-red-400',
                          isDeleting && 'opacity-50'
                        )}
                        title={t('common.delete')}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Dropdown clips */}
                  {isExpanded && clipCount > 0 && (
                    <div className="border-t border-white/10 bg-white/[0.02]">
                      <div className="px-5 py-3">
                        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/30">
                          {t('videos.generatedClips', { count: clipCount })}
                        </p>
                        <div className="space-y-2">
                          {readyClips.map((clip) => {
                            const clipDuration = clip.end_time_seconds - clip.start_time_seconds
                            return (
                              <div
                                key={clip.id}
                                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 transition-all duration-300 hover:bg-white/[0.07]"
                              >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/15">
                                  <Scissors className="h-4 w-4 text-orange-400" />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-white">
                                    {clip.title}
                                  </p>
                                  <div className="flex items-center gap-3 text-xs text-white/40">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTime(clipDuration)}
                                    </span>
                                    {clip.virality_score && (
                                      <span className="flex items-center gap-1 font-bold text-orange-400">
                                        <TrendingUp className="h-3 w-3" />
                                        {clip.virality_score.toFixed(1)}
                                      </span>
                                    )}
                                    {clip.hashtags.length > 0 && (
                                      <span className="hidden text-white/30 sm:inline">
                                        {clip.hashtags.slice(0, 3).map((t) => `#${t}`).join(' ')}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-1.5">
                                  <button
                                    onClick={() => setPreviewClip(clip)}
                                    className="rounded-lg p-2 text-white/30 transition-colors hover:bg-white/10 hover:text-white/60"
                                    title={t('common.preview')}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => downloadClip(clip)}
                                    disabled={downloadingId === clip.id}
                                    className="rounded-lg p-2 text-white/30 transition-colors hover:bg-orange-500/20 hover:text-orange-400"
                                    title={t('common.download')}
                                  >
                                    {downloadingId === clip.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteClipId(clip.id)}
                                    disabled={deletingClipId === clip.id}
                                    className="rounded-lg p-2 text-white/30 transition-colors hover:bg-red-500/20 hover:text-red-400"
                                    title={t('common.delete')}
                                  >
                                    {deletingClipId === clip.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && videos.length === 0 && (
          <div className="animate-fade-in-up-2">
            <EmptyState
              icon={Upload}
              title={t('videos.noVideos')}
              description={t('videos.importDesc')}
              actionLabel={t('videos.importVideo')}
              actionHref="/upload"
              actionIcon={Upload}
              className="py-20"
            />
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {videoToDelete && (
          <ConfirmModal
            open={!!confirmDeleteId}
            onClose={() => setConfirmDeleteId(null)}
            onConfirm={() => deleteVideo(videoToDelete)}
            title={t('videos.deleteVideo')}
            description={t('videos.deleteVideoDesc', { title: videoToDelete.title })}
            warning={t('common.irreversible')}
            confirmLabel={t('common.delete')}
            icon={Trash2}
          />
        )}

        {/* Modal de confirmation de suppression clip */}
        {clipToDelete && (
          <ConfirmModal
            open={!!confirmDeleteClipId}
            onClose={() => setConfirmDeleteClipId(null)}
            onConfirm={() => deleteClip(clipToDelete)}
            title={t('videos.deleteClip')}
            description={t('videos.deleteClipDesc', { title: clipToDelete.title })}
            warning={t('common.irreversible')}
            confirmLabel={t('common.delete')}
            icon={Trash2}
          />
        )}

        {/* Modal preview clip */}
        <ClipPreviewModal clip={previewClip} onClose={() => setPreviewClip(null)} />
      </div>
    </>
  )
}
