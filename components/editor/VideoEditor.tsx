'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { Pencil, AlignLeft, Hash, Clock, TrendingUp, Crop, Check, Loader2, AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, Scissors, Trash2, Undo2, Redo2, Play, Pause, RotateCcw, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { trimAndConcatSegments } from '@/lib/ffmpeg'
import { generateSrtForSegments } from '@/lib/generateSrt'
import { formatTime, cn } from '@/lib/utils'
import { Input, Textarea, AlertBanner, ProgressBar, ConfirmModal, useToast } from '@/components/ui'
import { CollapsibleBlock } from '@/components/CollapsibleBlock'
import { SubtitleEditor } from '@/components/SubtitleEditor'
import { EditorProvider, useEditor } from './EditorProvider'
import { EditorToolbar } from './toolbar/EditorToolbar'
import { EditorOnboardingOverlay } from './EditorOnboardingOverlay'
import { Timeline } from './timeline/Timeline'
import { EditorPreview } from './preview/EditorPreview'
import { DEFAULT_SUBTITLE_STYLE } from '@/types/subtitles'
import type { SubtitleStyle } from '@/types/subtitles'
import { getPlanLimits, canCreateClip } from '@/lib/plans'
import type { ClipSuggestion, ClipInsert, TranscriptionSegment, PlanType } from '@/types/database'
import type { TimelineSegment } from './types'

type GeneratingState = {
  step: 'creating' | 'loading-ffmpeg' | 'downloading' | 'processing' | 'uploading' | 'finalizing' | 'done'
  progress: number
}

const STEP_LABEL_KEYS: Record<GeneratingState['step'], string> = {
  creating: 'editor.steps.creating',
  'loading-ffmpeg': 'editor.steps.loadingFfmpeg',
  downloading: 'editor.steps.downloading',
  processing: 'editor.steps.processing',
  uploading: 'editor.steps.uploading',
  finalizing: 'editor.steps.finalizing',
  done: 'editor.steps.done',
}

interface VideoEditorProps {
  videoUrl: string
  suggestion: ClipSuggestion
  segments: TranscriptionSegment[]
  videoId: string
  userPlan?: PlanType
  onClose: () => void
  onGenerated: () => void
}

function TimelineActions({ generating }: { generating: boolean }) {
  const { t } = useTranslation()
  const { state, dispatch, segmentOffsets, totalDuration, canUndo, canRedo } = useEditor()
  const { segments, selectedSegmentId, playheadTime, playing } = state

  const canSplit = (() => {
    for (let i = 0; i < segments.length; i++) {
      const off = segmentOffsets[i]
      if (playheadTime > off.timelineStart && playheadTime < off.timelineEnd) {
        const seg = segments[i]
        const splitSourceTime = seg.sourceStart + (playheadTime - off.timelineStart)
        return splitSourceTime - seg.sourceStart >= 1 && seg.sourceEnd - splitSourceTime >= 1
      }
    }
    return false
  })()

  const canDelete = selectedSegmentId !== null && segments.length > 1

  return (
    <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 px-4 py-2">
      {/* Gauche : actions d'édition */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={!canUndo || generating}
          title={`${t('editor.toolbar.undo')} (Ctrl+Z)`}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all',
            canUndo && !generating
              ? 'bg-white/10 text-white hover:bg-white/15'
              : 'bg-white/5 text-white/30 cursor-not-allowed',
          )}
        >
          <Undo2 className="h-4 w-4" />
        </button>

        <button
          onClick={() => dispatch({ type: 'REDO' })}
          disabled={!canRedo || generating}
          title={`${t('editor.toolbar.redo')} (Ctrl+Y)`}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all',
            canRedo && !generating
              ? 'bg-white/10 text-white hover:bg-white/15'
              : 'bg-white/5 text-white/30 cursor-not-allowed',
          )}
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-px bg-white/10" />

        <button
          onClick={() => dispatch({ type: 'SPLIT_AT_PLAYHEAD' })}
          disabled={!canSplit || generating}
          title={`${t('editor.toolbar.split')} (S)`}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
            canSplit && !generating
              ? 'bg-white/10 text-white hover:bg-white/15'
              : 'bg-white/5 text-white/30 cursor-not-allowed',
          )}
        >
          <Scissors className="h-4 w-4" />
          {t('editor.toolbar.split')}
        </button>

        <button
          onClick={() => selectedSegmentId && dispatch({ type: 'DELETE_SEGMENT', id: selectedSegmentId })}
          disabled={!canDelete || generating}
          title={`${t('editor.toolbar.delete')} (Suppr)`}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
            canDelete && !generating
              ? 'bg-white/10 text-red-400 hover:bg-red-500/20'
              : 'bg-white/5 text-white/30 cursor-not-allowed',
          )}
        >
          <Trash2 className="h-4 w-4" />
          {t('editor.toolbar.delete')}
        </button>
      </div>

      {/* Droite : playback + timecode */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            dispatch({ type: 'SET_PLAYHEAD', time: 0 })
            dispatch({ type: 'SET_PLAYING', playing: false })
          }}
          title={t('editor.toolbar.undo') ? 'Retour au début' : 'Reset'}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={() => dispatch({ type: 'SET_PLAYING', playing: !playing })}
          title={`${playing ? 'Pause' : 'Lecture'} (Espace)`}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white transition-all hover:bg-white/20"
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
        </button>

        <span className="ml-1 text-xs text-white/50 tabular-nums">
          {formatTime(playheadTime)} / {formatTime(totalDuration)}
        </span>
      </div>
    </div>
  )
}

function EditorContent({
  videoUrl,
  suggestion,
  segments,
  videoId,
  userPlan = 'pro',
  onClose,
  onGenerated,
}: VideoEditorProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const toast = useToast()
  const { state, dispatch, totalDuration, segmentOffsets } = useEditor()

  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>(DEFAULT_SUBTITLE_STYLE)
  const [clipTitle, setClipTitle] = useState(suggestion.title)
  const [clipDescription, setClipDescription] = useState(suggestion.description)
  const [clipHashtags, setClipHashtags] = useState(suggestion.hashtags.join(', '))
  const [generating, setGenerating] = useState<GeneratingState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmGenerate, setShowConfirmGenerate] = useState(false)

  // Panneaux redimensionnables
  const [leftWidth, setLeftWidth] = useState(400)
  const [rightWidth, setRightWidth] = useState(440)
  const [timelineHeight, setTimelineHeight] = useState(160)
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingPanel = useRef<'left' | 'right' | null>(null)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)
  const draggingTimeline = useRef(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)

  const handleResizeStart = useCallback((panel: 'left' | 'right', e: React.MouseEvent) => {
    e.preventDefault()
    draggingPanel.current = panel
    dragStartX.current = e.clientX
    dragStartWidth.current = panel === 'left' ? leftWidth : rightWidth

    const handleMove = (ev: MouseEvent) => {
      if (!draggingPanel.current || !containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth
      const delta = ev.clientX - dragStartX.current
      const minPanel = 240
      const minCenter = 300

      if (draggingPanel.current === 'left') {
        const newLeft = Math.max(minPanel, dragStartWidth.current + delta)
        const maxLeft = containerWidth - rightWidth - minCenter
        setLeftWidth(Math.min(newLeft, maxLeft))
      } else {
        const newRight = Math.max(minPanel, dragStartWidth.current - delta)
        const maxRight = containerWidth - leftWidth - minCenter
        setRightWidth(Math.min(newRight, maxRight))
      }
    }

    const handleUp = () => {
      draggingPanel.current = null
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }, [leftWidth, rightWidth])

  const handleTimelineResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    draggingTimeline.current = true
    dragStartY.current = e.clientY
    dragStartHeight.current = timelineHeight

    const handleMove = (ev: MouseEvent) => {
      if (!draggingTimeline.current) return
      const delta = dragStartY.current - ev.clientY
      const newHeight = Math.max(140, Math.min(400, dragStartHeight.current + delta))
      setTimelineHeight(newHeight)
    }

    const handleUp = () => {
      draggingTimeline.current = false
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }, [timelineHeight])

  // Raccourcis clavier
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        dispatch({ type: 'UNDO' })
        return
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        dispatch({ type: 'REDO' })
        return
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          dispatch({ type: 'SET_PLAYING', playing: !state.playing })
          break
        case 'ArrowLeft':
          e.preventDefault()
          dispatch({
            type: 'SET_PLAYHEAD',
            time: Math.max(0, state.playheadTime - (e.shiftKey ? 5 : 1)),
          })
          break
        case 'ArrowRight':
          e.preventDefault()
          dispatch({
            type: 'SET_PLAYHEAD',
            time: Math.min(totalDuration, state.playheadTime + (e.shiftKey ? 5 : 1)),
          })
          break
        case 'KeyS':
          e.preventDefault()
          dispatch({ type: 'SPLIT_AT_PLAYHEAD' })
          break
        case 'Delete':
        case 'Backspace':
          if (state.selectedSegmentId && state.segments.length > 1) {
            e.preventDefault()
            dispatch({ type: 'DELETE_SEGMENT', id: state.selectedSegmentId })
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.playing, state.playheadTime, state.selectedSegmentId, state.segments.length, totalDuration, dispatch])

  // Segment sous le playhead (suit la position courante)
  const currentSegment = (() => {
    for (let i = 0; i < state.segments.length; i++) {
      const off = segmentOffsets[i]
      if (!off) continue
      if (state.playheadTime >= off.timelineStart && state.playheadTime <= off.timelineEnd) {
        return state.segments[i]
      }
    }
    return state.segments[0]
  })()

  const handleGenerate = useCallback(async () => {
    if (generating) return
    setGenerating({ step: 'creating', progress: 0 })
    setError(null)

    let clipId: string | null = null

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast.error(t('editor.errors.notLoggedIn'))
        setGenerating(null)
        return
      }

      // Vérifier la limite de clips avant tout traitement
      const clipCheck = await canCreateClip(supabase, session.user.id, userPlan)
      if (!clipCheck.allowed) {
        toast.error(t('plans.limitReached', { used: clipCheck.used, limit: clipCheck.limit }))
        setGenerating(null)
        return
      }

      const firstSeg = state.segments[0]
      const lastSeg = state.segments[state.segments.length - 1]

      const clipInsert: ClipInsert = {
        video_id: videoId,
        user_id: session.user.id,
        title: clipTitle.trim() || suggestion.title,
        description: clipDescription.trim() || suggestion.description,
        hashtags: clipHashtags.trim()
          ? clipHashtags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean)
          : suggestion.hashtags,
        start_time_seconds: firstSeg.sourceStart,
        end_time_seconds: lastSeg.sourceEnd,
        storage_path: null,
        thumbnail_path: null,
        subtitle_style: JSON.stringify(subtitleStyle),
        status: 'generating',
        virality_score: suggestion.score,
        suggestion_data: {
          title: suggestion.title,
          description: suggestion.description,
          hashtags: suggestion.hashtags,
          score: suggestion.score,
        },
      }

      const { data: clip, error: clipError } = await supabase
        .from('clips')
        .insert(clipInsert)
        .select('id')
        .single()

      if (clipError || !clip) {
        toast.error(t('editor.errors.createError'))
        setGenerating(null)
        return
      }

      clipId = clip.id

      setGenerating({ step: 'loading-ffmpeg', progress: 5 })

      // Générer le SRT multi-segments (seulement si le résultat est non-vide)
      let srtContent: string | null = null
      if (subtitleStyle.enabled && segments.length > 0) {
        const srt = generateSrtForSegments(segments, state.segments, segmentOffsets)
        if (srt.trim().length > 0) {
          srtContent = srt
        }
      }

      setGenerating({ step: 'downloading', progress: 10 })

      const { videoBlob, thumbnailBlob } = await trimAndConcatSegments({
        videoUrl,
        segments: state.segments,
        srtContent,
        subtitleStyle: subtitleStyle.enabled ? subtitleStyle : undefined,
        watermark: getPlanLimits(userPlan).watermark,
        onProgress: (p) => {
          // p est 0-100 de FFmpeg ; on mappe vers la plage 10-70 du progrès global
          const clamped = Math.max(0, Math.min(100, p))
          setGenerating({ step: 'processing', progress: 10 + Math.round(clamped * 0.6) })
        },
      })

      setGenerating({ step: 'uploading', progress: 75 })

      const clipStoragePath = `${session.user.id}/clips/${clip.id}.mp4`
      const thumbStoragePath = `${session.user.id}/thumbnails/clips/${clip.id}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(clipStoragePath, videoBlob, {
          contentType: 'video/mp4',
          upsert: true,
        })

      if (uploadError) {
        toast.error(t('editor.errors.uploadError'))
        throw new Error(t('editor.errors.uploadError'))
      }

      let finalThumbPath: string | null = null
      if (thumbnailBlob.size > 0) {
        const { error: thumbUploadError } = await supabase.storage
          .from('videos')
          .upload(thumbStoragePath, thumbnailBlob, {
            contentType: 'image/jpeg',
            upsert: true,
          })
        if (thumbUploadError) { /* non-blocking */ } else {
          finalThumbPath = thumbStoragePath
        }
      }

      setGenerating({ step: 'finalizing', progress: 90 })

      const response = await fetch('/api/clips/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipId: clip.id,
          storagePath: clipStoragePath,
          thumbnailPath: finalThumbPath,
        }),
      })

      if (!response.ok) {
        toast.error(t('editor.errors.finalizeError'))
        throw new Error(t('editor.errors.finalizeError'))
      }

      setGenerating({ step: 'done', progress: 100 })
      toast.success(t('editor.toastSuccess'))

      // Fire-and-forget : mise à jour du persona créateur (plan Business)
      fetch('/api/persona/update', { method: 'POST' }).catch(() => {})

      setTimeout(() => {
        onGenerated()
        router.push('/clips')
      }, 1500)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : t('editor.errors.generateError')
      setError(errMsg)
      toast.error(errMsg)

      if (clipId) {
        try {
          const supabase = createClient()
          await supabase.from('clips').update({ status: 'failed' }).eq('id', clipId)
        } catch { /* best-effort */ }
      }

      setGenerating(null)
    }
  }, [
    generating, state.segments, segmentOffsets, videoUrl, videoId, suggestion,
    clipTitle, clipDescription, clipHashtags, subtitleStyle, segments, onGenerated, router, toast, userPlan
  ])

  const isGenerating = generating !== null && generating.step !== 'done'
  const isDone = generating?.step === 'done'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      {/* Toolbar */}
      <EditorToolbar
        onClose={onClose}
        onGenerate={() => setShowConfirmGenerate(true)}
        generating={isGenerating}
        generatingDone={isDone}
        generatingLabel={generating ? t(STEP_LABEL_KEYS[generating.step]) : null}
        disabled={generating !== null}
      />

      {/* Watermark badge pour plan free */}
      {getPlanLimits(userPlan).watermark && (
        <div className="flex-shrink-0 px-4 py-1.5 bg-yellow-500/10 border-b border-yellow-500/20">
          <p className="text-xs text-yellow-300 text-center">
            {t('plans.watermarkNotice')}
          </p>
        </div>
      )}

      {/* Modal de confirmation avant génération */}
      <ConfirmModal
        open={showConfirmGenerate}
        onClose={() => setShowConfirmGenerate(false)}
        onConfirm={() => {
          setShowConfirmGenerate(false)
          handleGenerate()
        }}
        title={t('editor.confirmGenerate')}
        description={t('editor.confirmGenerateDesc', {
          duration: formatTime(totalDuration),
          segments: state.segments.length,
        }) + ' ' + (subtitleStyle.enabled ? t('editor.confirmGenerateSubtitles') : t('editor.confirmGenerateNoSubtitles')) + '.'}
        confirmLabel={t('editor.toolbar.generate')}
        confirmVariant="primary"
        icon={Sparkles}
      />

      {/* Modal de progression */}
      {generating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex flex-col items-center gap-3 text-center">
              {isDone ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-white">
                {t(STEP_LABEL_KEYS[generating.step])}
              </h3>
            </div>
            <ProgressBar
              progress={generating.progress}
              sublabel={`${generating.progress}%`}
            />
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="flex-shrink-0 px-4 py-2">
          <AlertBanner message={error} />
        </div>
      )}

      {/* Zone principale 3 colonnes */}
      <div ref={containerRef} className="flex-1 overflow-hidden flex">
        {/* Panneau gauche : Infos + Crop */}
        <div data-onboarding-editor="editor-left-panel" className="overflow-y-auto flex-shrink-0 p-4 space-y-4" style={{ width: leftWidth }}>
          <CollapsibleBlock title={t('editor.info.title')} icon={Pencil}>
            <div className="space-y-4">
              <Input
                icon={Pencil}
                label={t('editor.info.clipTitle')}
                value={clipTitle}
                onChange={(e) => setClipTitle(e.target.value)}
                placeholder={t('editor.info.clipTitlePlaceholder')}
                disabled={generating !== null}
                className="px-4 py-2.5 text-sm border-white/10"
              />
              <Textarea
                icon={AlignLeft}
                label={t('editor.info.description')}
                value={clipDescription}
                onChange={(e) => setClipDescription(e.target.value)}
                placeholder={t('editor.info.descriptionPlaceholder')}
                disabled={generating !== null}
                rows={3}
                className="px-4 py-2.5 text-sm border-white/10"
              />
              <Input
                icon={Hash}
                label={t('editor.info.hashtags')}
                value={clipHashtags}
                onChange={(e) => setClipHashtags(e.target.value)}
                placeholder={t('editor.info.hashtagsPlaceholder')}
                hint={t('editor.info.hashtagsHint')}
                disabled={generating !== null}
                className="px-4 py-2.5 text-sm border-white/10"
              />
            </div>
          </CollapsibleBlock>

          <CollapsibleBlock title={t('editor.crop.title')} icon={Crop}>
            <div className="space-y-3">
              <p className="text-xs text-white/40">
                {t('editor.crop.hint')}
              </p>
              {currentSegment && (
                <div className="space-y-3">
                  {/* Quick position buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: 0, label: t('editor.crop.left'), icon: AlignHorizontalJustifyStart },
                      { value: 0.5, label: t('editor.crop.center'), icon: AlignHorizontalJustifyCenter },
                      { value: 1, label: t('editor.crop.right'), icon: AlignHorizontalJustifyEnd },
                    ] as const).map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() =>
                          dispatch({
                            type: 'UPDATE_SEGMENT',
                            id: currentSegment.id,
                            updates: { cropX: value },
                          })
                        }
                        disabled={generating !== null}
                        className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                          currentSegment.cropX === value
                            ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                            : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Fine-tune slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>{t('editor.crop.horizontalPosition')}</span>
                      <span>{Math.round(currentSegment.cropX * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={currentSegment.cropX}
                      onChange={(e) => {
                        if (currentSegment) {
                          dispatch({
                            type: 'UPDATE_SEGMENT',
                            id: currentSegment.id,
                            updates: { cropX: Number(e.target.value) },
                          })
                        }
                      }}
                      disabled={generating !== null}
                      className="w-full accent-orange-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </CollapsibleBlock>

          {/* Info temps */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/50">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(suggestion.start)} → {formatTime(suggestion.end)}
              </span>
              {suggestion.score > 0 && (
                <span
                  className="flex items-center gap-1 font-bold text-orange-400 cursor-help"
                  title={t('common.viralityScoreTooltip')}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  {suggestion.score.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Séparateur gauche */}
        <div
          className="flex-shrink-0 w-2 cursor-col-resize bg-white/5 hover:bg-orange-500/30 active:bg-orange-500/50 transition-colors flex items-center justify-center group/resize"
          onMouseDown={(e) => handleResizeStart('left', e)}
        >
          <div className="flex flex-col gap-1 opacity-0 group-hover/resize:opacity-100 transition-opacity">
            <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
            <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
            <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
          </div>
        </div>

        {/* Centre : Preview */}
        <div data-onboarding-editor="editor-preview" className="overflow-hidden p-4 h-full flex-1 min-w-0">
          <EditorPreview
            videoUrl={videoUrl}
            subtitleStyle={subtitleStyle}
            transcriptionSegments={segments}
            showWatermark={getPlanLimits(userPlan).watermark}
          />
        </div>

        {/* Séparateur droite */}
        <div
          className="flex-shrink-0 w-2 cursor-col-resize bg-white/5 hover:bg-orange-500/30 active:bg-orange-500/50 transition-colors flex items-center justify-center group/resize"
          onMouseDown={(e) => handleResizeStart('right', e)}
        >
          <div className="flex flex-col gap-1 opacity-0 group-hover/resize:opacity-100 transition-opacity">
            <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
            <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
            <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
          </div>
        </div>

        {/* Panneau droite : Sous-titres */}
        <div data-onboarding-editor="editor-subtitles" className="overflow-y-auto flex-shrink-0 p-4" style={{ width: rightWidth }}>
          <SubtitleEditor style={subtitleStyle} onChange={setSubtitleStyle} />
        </div>
      </div>

      {/* Séparateur timeline */}
      <div
        className="flex-shrink-0 h-2 cursor-row-resize bg-white/5 hover:bg-orange-500/30 active:bg-orange-500/50 transition-colors flex items-center justify-center group/resize"
        onMouseDown={handleTimelineResizeStart}
      >
        <div className="flex gap-1 opacity-0 group-hover/resize:opacity-100 transition-opacity">
          <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
          <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
          <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
        </div>
      </div>

      {/* Timeline + actions */}
      <div data-onboarding-editor="editor-timeline" className="flex flex-shrink-0 flex-col border-t border-white/10 bg-slate-900/50 mb-4" style={{ height: timelineHeight }}>
        <TimelineActions generating={generating !== null} />
        <div className="flex-1 min-h-0">
          <Timeline videoUrl={videoUrl} />
        </div>
      </div>

      <EditorOnboardingOverlay />
    </div>
  )
}

export function VideoEditor(props: VideoEditorProps) {
  const initialSegments = useMemo<TimelineSegment[]>(
    () => [
      {
        id: crypto.randomUUID(),
        sourceStart: props.suggestion.start,
        sourceEnd: props.suggestion.end,
        cropX: 0.5,
      },
    ],
    [props.suggestion.start, props.suggestion.end]
  )

  return (
    <EditorProvider initialSegments={initialSegments}>
      <EditorContent {...props} />
    </EditorProvider>
  )
}
