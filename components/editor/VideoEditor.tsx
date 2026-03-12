'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import { Pencil, AlignLeft, Hash, Clock, TrendingUp, Crop, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { trimAndConcatSegments } from '@/lib/ffmpeg'
import { generateSrtForSegments } from '@/lib/generateSrt'
import { formatTime } from '@/lib/utils'
import { Input, Textarea, AlertBanner, ProgressBar, useToast } from '@/components/ui'
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
        onGenerate={handleGenerate}
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

      {/* Barre de progression */}
      {generating && (
        <div className="flex-shrink-0 px-4 py-2 bg-slate-900/50">
          <ProgressBar
            progress={generating.progress}
            label={t(STEP_LABEL_KEYS[generating.step])}
            sublabel={`${generating.progress}%`}
            icon={
              isDone
                ? <Check className="h-4 w-4" />
                : <Loader2 className="h-4 w-4 animate-spin" />
            }
          />
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
                <div className="space-y-2">
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
                    className="w-full accent-purple-500"
                  />
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
                <span className="flex items-center gap-1 font-bold text-purple-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {suggestion.score.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Séparateur gauche */}
        <div
          className="flex-shrink-0 w-1.5 cursor-col-resize bg-white/5 hover:bg-purple-500/30 active:bg-purple-500/50 transition-colors"
          onMouseDown={(e) => handleResizeStart('left', e)}
        />

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
          className="flex-shrink-0 w-1.5 cursor-col-resize bg-white/5 hover:bg-purple-500/30 active:bg-purple-500/50 transition-colors"
          onMouseDown={(e) => handleResizeStart('right', e)}
        />

        {/* Panneau droite : Sous-titres */}
        <div data-onboarding-editor="editor-subtitles" className="overflow-y-auto flex-shrink-0 p-4" style={{ width: rightWidth }}>
          <SubtitleEditor style={subtitleStyle} onChange={setSubtitleStyle} />
        </div>
      </div>

      {/* Séparateur timeline */}
      <div
        className="flex-shrink-0 h-1.5 cursor-row-resize bg-white/5 hover:bg-purple-500/30 active:bg-purple-500/50 transition-colors"
        onMouseDown={handleTimelineResizeStart}
      />

      {/* Timeline */}
      <div data-onboarding-editor="editor-timeline" className="flex-shrink-0" style={{ height: timelineHeight }}>
        <Timeline videoUrl={videoUrl} />
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
