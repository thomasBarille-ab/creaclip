'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Film,
  Play,
  Download,
  Eye,
  TrendingUp,
  Clock,
  Loader2,
  Scissors,
  DownloadCloud,
  Pencil,
  Save,
  X,
  Share2,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { cn, formatTime } from '@/lib/utils'
import { PageHeader, EmptyState, Button, Input, Textarea, Badge, ConfirmModal, useToast } from '@/components/ui'
import { ClipPreviewModal } from '@/components/ClipPreviewModal'
import { PublishModal } from '@/components/PublishModal'
import { VideoThumbnail } from '@/components/VideoThumbnail'
import { useClipDownload } from '@/hooks/useClipDownload'
import type { ClipWithVideo } from '@/types/database'

export default function ClipsPage() {
  const { t } = useTranslation()
  const [clips, setClips] = useState<ClipWithVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [previewClip, setPreviewClip] = useState<ClipWithVideo | null>(null)
  const [publishClip, setPublishClip] = useState<ClipWithVideo | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editHashtags, setEditHashtags] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const { downloadingId, downloadClip } = useClipDownload()
  const toast = useToast()

  const loadClips = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('clips')
      .select('*, video:videos(title)')
      .eq('user_id', session.user.id)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })

    setClips((data as ClipWithVideo[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadClips()
  }, [loadClips])

  async function downloadAll() {
    const readyClips = clips.filter((c) => c.storage_path)
    for (const clip of readyClips) {
      await downloadClip(clip)
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  function startEditing(clip: ClipWithVideo) {
    setEditingId(clip.id)
    setEditTitle(clip.title)
    setEditDescription(clip.description ?? '')
    setEditHashtags(clip.hashtags.join(', '))
  }

  async function saveEdit(clipId: string) {
    setSavingId(clipId)
    try {
      const supabase = createClient()
      const hashtags = editHashtags.trim()
        ? editHashtags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
        : []

      const { error } = await supabase
        .from('clips')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          hashtags,
        })
        .eq('id', clipId)

      if (error) {
        toast.error(t('clips.updateError'))
        return
      }

      setClips((prev) =>
        prev.map((c) =>
          c.id === clipId
            ? { ...c, title: editTitle.trim(), description: editDescription.trim() || null, hashtags }
            : c
        )
      )
      setEditingId(null)
      toast.success(t('clips.clipUpdated'))
    } catch {
      toast.error(t('clips.updateError'))
    } finally {
      setSavingId(null)
    }
  }

  async function deleteClip(clip: ClipWithVideo) {
    setDeletingId(clip.id)
    setConfirmDeleteId(null)

    try {
      const supabase = createClient()

      // Supprimer fichier storage
      if (clip.storage_path) {
        await supabase.storage.from('videos').remove([clip.storage_path])
      }

      // Supprimer thumbnail
      if (clip.thumbnail_path) {
        await supabase.storage.from('videos').remove([clip.thumbnail_path])
      }

      // Supprimer row DB
      const { error } = await supabase.from('clips').delete().eq('id', clip.id)
      if (error) {
        toast.error(t('clips.deleteClipError'))
        return
      }

      setClips((prev) => prev.filter((c) => c.id !== clip.id))
      toast.success(t('clips.clipDeleted'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('clips.deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  const clipToDelete = clips.find((c) => c.id === confirmDeleteId)

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={t('clips.title')}
        subtitle={!loading ? (clips.length === 0 ? t('clips.noClips') : t('clips.clipCount', { count: clips.length })) : undefined}
        className="mb-8"
      >
        {clips.length > 1 && (
          <Button variant="secondary" icon={DownloadCloud} onClick={downloadAll}>
            {t('clips.downloadAll')}
          </Button>
        )}
      </PageHeader>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="aspect-[9/16] max-h-64 w-full bg-white/5" />
              <div className="p-5">
                <div className="mb-2 h-5 w-3/4 rounded bg-white/10" />
                <div className="mb-1 h-4 w-full rounded bg-white/5" />
                <div className="mb-4 h-4 w-2/3 rounded bg-white/5" />
                <div className="flex gap-2">
                  <div className="h-9 w-28 rounded-lg bg-white/5" />
                  <div className="h-9 w-28 rounded-lg bg-white/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grille de clips */}
      {!loading && clips.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {clips.map((clip) => {
            const duration = clip.end_time_seconds - clip.start_time_seconds

            return (
              <div
                key={clip.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-200 hover:border-purple-500/50"
              >
                {/* Thumbnail */}
                <button
                  onClick={() => setPreviewClip(clip)}
                  className="relative flex aspect-[9/16] max-h-64 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-purple-900/40 to-pink-900/40"
                >
                  {clip.thumbnail_path ? (
                    <VideoThumbnail storagePath={clip.thumbnail_path} className="h-full w-full" />
                  ) : (
                    <Film className="h-16 w-16 text-white/20" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                      <Play className="h-8 w-8 text-white" fill="white" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                    {formatTime(duration)}
                  </span>
                </button>

                {/* Info */}
                <div className="p-5">
                  {clip.video?.title && (
                    <p className="mb-1 truncate text-xs text-white/30">{clip.video.title}</p>
                  )}

                  {editingId === clip.id ? (
                    <div className="space-y-3">
                      <Input
                        label={t('clips.title_label')}
                        icon={Pencil}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="px-3 py-2 text-sm"
                      />
                      <Textarea
                        label={t('clips.description_label')}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        className="px-3 py-2 text-sm"
                      />
                      <Input
                        label={t('clips.hashtags')}
                        value={editHashtags}
                        onChange={(e) => setEditHashtags(e.target.value)}
                        placeholder="marketing, business, tips"
                        hint={t('clips.hashtagsHint')}
                        className="px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveEdit(clip.id)}
                          loading={savingId === clip.id}
                          disabled={!editTitle.trim()}
                          icon={Save}
                          size="sm"
                          className="flex-1"
                        >
                          {t('common.save')}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setEditingId(null)}
                          disabled={savingId === clip.id}
                          icon={X}
                          size="sm"
                        >
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="mb-1 text-xl font-bold text-white">{clip.title}</h3>
                      {clip.description && (
                        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-white/60">{clip.description}</p>
                      )}
                      {clip.hashtags.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-1.5">
                          {clip.hashtags.map((tag) => (
                            <Badge key={tag} variant="purple" className="px-2.5 py-0.5 text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(clip.start_time_seconds)} → {formatTime(clip.end_time_seconds)}
                        </span>
                        {clip.virality_score && (
                          <span className="flex items-center gap-1 font-bold text-purple-400">
                            <TrendingUp className="h-3.5 w-3.5" />
                            {clip.virality_score.toFixed(1)}
                          </span>
                        )}
                        <Badge className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">
                          9:16
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="secondary" onClick={() => setPreviewClip(clip)} icon={Eye} size="sm" className="w-full">
                          {t('common.preview')}
                        </Button>
                        <Button variant="secondary" onClick={() => startEditing(clip)} icon={Pencil} size="sm" className="w-full">
                          {t('common.edit')}
                        </Button>
                        <Button
                          onClick={() => downloadClip(clip)}
                          loading={downloadingId === clip.id}
                          icon={Download}
                          size="sm"
                          className="w-full"
                        >
                          {t('common.download')}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setPublishClip(clip)}
                          icon={Share2}
                          size="sm"
                          className="w-full"
                        >
                          {t('common.publish')}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setConfirmDeleteId(clip.id)}
                          loading={deletingId === clip.id}
                          disabled={deletingId === clip.id}
                          icon={Trash2}
                          size="sm"
                          className="col-span-2 w-full text-red-400 hover:bg-red-500/20 hover:text-red-300"
                        >
                          {t('common.delete')}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && clips.length === 0 && (
        <EmptyState
          icon={Scissors}
          title={t('clips.noClips')}
          description={t('clips.noClipsDesc')}
          actionLabel={t('clips.createFirst')}
          actionHref="/upload"
          actionIcon={Film}
          className="py-20"
        />
      )}

      <ClipPreviewModal
        clip={previewClip}
        onClose={() => setPreviewClip(null)}
        onPublish={() => {
          if (previewClip) {
            setPreviewClip(null)
            setPublishClip(previewClip)
          }
        }}
      />
      <PublishModal clip={publishClip} onClose={() => setPublishClip(null)} />

      {clipToDelete && (
        <ConfirmModal
          open={!!confirmDeleteId}
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={() => deleteClip(clipToDelete)}
          title={t('clips.deleteClip')}
          description={t('clips.deleteClipDesc', { title: clipToDelete.title })}
          warning={t('common.irreversible')}
          confirmLabel={t('common.delete')}
          icon={Trash2}
        />
      )}
    </div>
  )
}
