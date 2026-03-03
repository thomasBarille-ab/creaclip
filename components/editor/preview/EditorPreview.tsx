'use client'

import { useRef, useEffect, useCallback, useState, useMemo, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditor } from '../EditorProvider'
import { CropOverlay } from './CropOverlay'
import { PreviewControls } from './PreviewControls'
import { FONT_SIZE_MAP } from '@/types/subtitles'
import { cn } from '@/lib/utils'
import type { SubtitleStyle } from '@/types/subtitles'
import type { TranscriptionSegment } from '@/types/database'

interface EditorPreviewProps {
  videoUrl: string
  subtitleStyle: SubtitleStyle
  transcriptionSegments: TranscriptionSegment[]
  showWatermark?: boolean
}

export function EditorPreview({ videoUrl, subtitleStyle, transcriptionSegments, showWatermark }: EditorPreviewProps) {
  const { t } = useTranslation()
  const { state, dispatch, totalDuration, segmentOffsets } = useEditor()
  const { segments, playing } = state

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const rafRef = useRef<number>(0)
  const seekingRef = useRef(false)
  const activeSegmentIndexRef = useRef(0)
  const previewContainerRef = useRef<HTMLDivElement>(null)

  const [mode, setMode] = useState<'crop' | 'preview'>('crop')
  const [containerDims, setContainerDims] = useState({ width: 0, height: 0 })
  const [videoDims, setVideoDims] = useState({ width: 0, height: 0 })

  // Mesurer les dimensions du container
  useEffect(() => {
    const el = previewContainerRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerDims({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Mesurer les dimensions natives de la vidéo
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleLoaded = () => {
      setVideoDims({ width: video.videoWidth, height: video.videoHeight })
    }
    video.addEventListener('loadeddata', handleLoaded)
    if (video.videoWidth > 0) handleLoaded()
    return () => video.removeEventListener('loadeddata', handleLoaded)
  }, [videoUrl])

  // CropX du segment sous le playhead
  const playheadCropX = (() => {
    for (let i = 0; i < segments.length; i++) {
      const off = segmentOffsets[i]
      if (!off) continue
      if (state.playheadTime >= off.timelineStart && state.playheadTime <= off.timelineEnd) {
        return segments[i].cropX
      }
    }
    return segments[0]?.cropX ?? 0.5
  })()

  // Calculer la position du crop box 9:16 en mode cadrage
  const cropBoxRect = useMemo(() => {
    const { width: cw, height: ch } = containerDims
    const { width: vw, height: vh } = videoDims
    if (cw <= 0 || ch <= 0 || vw <= 0 || vh <= 0) return null

    const videoAspect = vw / vh
    const containerAspect = cw / ch
    let displayW: number, displayH: number, offsetX: number, offsetY: number
    if (videoAspect > containerAspect) {
      displayW = cw
      displayH = cw / videoAspect
      offsetX = 0
      offsetY = (ch - displayH) / 2
    } else {
      displayH = ch
      displayW = ch * videoAspect
      offsetX = (cw - displayW) / 2
      offsetY = 0
    }

    const cropWidthFraction = Math.min((9 / 16) / videoAspect, 1)
    const cropBoxW = displayW * cropWidthFraction
    const cropBoxH = displayH
    const maxOffset = displayW - cropBoxW
    const cropBoxX = offsetX + playheadCropX * maxOffset

    return { left: cropBoxX, top: offsetY, width: cropBoxW, height: cropBoxH }
  }, [containerDims, videoDims, playheadCropX])

  // Refs miroir pour accès stable dans RAF
  const segmentsRef = useRef(segments)
  const segmentOffsetsRef = useRef(segmentOffsets)
  const totalDurationRef = useRef(totalDuration)
  segmentsRef.current = segments
  segmentOffsetsRef.current = segmentOffsets
  totalDurationRef.current = totalDuration

  const timelineToSourcePosition = useCallback(
    (time: number) => {
      for (let i = 0; i < segmentsRef.current.length; i++) {
        const off = segmentOffsetsRef.current[i]
        if (!off) continue
        if (time >= off.timelineStart && time <= off.timelineEnd) {
          const relativeTime = time - off.timelineStart
          return { segmentIndex: i, sourceTime: segmentsRef.current[i].sourceStart + relativeTime }
        }
      }
      if (segmentsRef.current.length > 0) {
        const lastSeg = segmentsRef.current[segmentsRef.current.length - 1]
        return { segmentIndex: segmentsRef.current.length - 1, sourceTime: lastSeg.sourceEnd }
      }
      return null
    },
    []
  )

  // Synchroniser la vidéo quand le playhead change (hors lecture)
  useEffect(() => {
    if (playing || seekingRef.current) return
    const video = videoRef.current
    if (!video) return

    const pos = timelineToSourcePosition(state.playheadTime)
    if (!pos) return

    if (Math.abs(video.currentTime - pos.sourceTime) > 0.1) {
      seekingRef.current = true
      activeSegmentIndexRef.current = pos.segmentIndex

      const handleSeeked = () => {
        seekingRef.current = false
        video.removeEventListener('seeked', handleSeeked)
      }
      video.addEventListener('seeked', handleSeeked)
      video.currentTime = pos.sourceTime
    }
  }, [state.playheadTime, playing, timelineToSourcePosition])

  // Boucle de lecture
  useEffect(() => {
    const video = videoRef.current

    if (!playing) {
      cancelAnimationFrame(rafRef.current)
      if (video && !video.paused) video.pause()
      return
    }

    if (!video) return

    const pos = timelineToSourcePosition(state.playheadTime)
    if (pos) {
      activeSegmentIndexRef.current = pos.segmentIndex
      if (Math.abs(video.currentTime - pos.sourceTime) > 0.2) {
        video.currentTime = pos.sourceTime
      }
      video.play().catch(() => {
        dispatch({ type: 'SET_PLAYING', playing: false })
      })
    }

    const tick = () => {
      if (!video || video.paused) return

      const currentTime = video.currentTime
      const segs = segmentsRef.current
      const offs = segmentOffsetsRef.current
      const td = totalDurationRef.current
      const activeIdx = activeSegmentIndexRef.current

      if (activeIdx >= 0 && activeIdx < segs.length) {
        const seg = segs[activeIdx]
        const off = offs[activeIdx]

        if (off) {
          const relTime = Math.max(0, currentTime - seg.sourceStart)
          const newPlayheadTime = Math.min(off.timelineEnd, off.timelineStart + relTime)

          if (currentTime >= seg.sourceEnd - 0.05) {
            const nextIdx = activeIdx + 1
            if (nextIdx < segs.length) {
              activeSegmentIndexRef.current = nextIdx
              video.currentTime = segs[nextIdx].sourceStart
            } else {
              video.pause()
              dispatch({ type: 'SET_PLAYING', playing: false })
              dispatch({ type: 'SET_PLAYHEAD', time: td })
              return
            }
          }

          dispatch({ type: 'SET_PLAYHEAD', time: newPlayheadTime })
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, dispatch, timelineToSourcePosition])

  // ── Sous-titres : même logique que SubtitlePreview ──

  // Convertir playhead → temps source absolu
  const sourceTime = useMemo(() => {
    for (let i = 0; i < state.segments.length; i++) {
      const off = segmentOffsets[i]
      if (!off) continue
      if (state.playheadTime >= off.timelineStart && state.playheadTime <= off.timelineEnd) {
        return state.segments[i].sourceStart + (state.playheadTime - off.timelineStart)
      }
    }
    return null
  }, [state.playheadTime, state.segments, segmentOffsets])

  // Trouver le segment de transcription actif
  const activeTranscription = useMemo(() => {
    if (!subtitleStyle.enabled || sourceTime === null) return null
    return transcriptionSegments.find(
      (s) => sourceTime >= s.start && sourceTime <= s.end
    ) ?? null
  }, [subtitleStyle.enabled, sourceTime, transcriptionSegments])

  const displayText = useMemo(() => {
    if (!activeTranscription) return null
    const text = activeTranscription.text
    return subtitleStyle.textTransform === 'uppercase' ? text.toUpperCase() : text
  }, [activeTranscription, subtitleStyle.textTransform])

  // Largeur de référence pour le scaling des sous-titres
  const subtitleRefWidth = mode === 'crop' && cropBoxRect ? cropBoxRect.width : containerDims.width
  const scale = subtitleRefWidth / 1080
  const fontSize = Math.max(12, FONT_SIZE_MAP[subtitleStyle.fontSize].canvas * scale)
  const strokeWidth = Math.max(1, subtitleStyle.strokeWidth * scale)

  const subtitleCss: CSSProperties = {
    fontFamily: `'${subtitleStyle.fontFamily}', sans-serif`,
    fontSize: `${fontSize}px`,
    fontWeight: 'bold',
    color: subtitleStyle.textColor,
    textAlign: 'center',
    lineHeight: 1.3,
    padding: subtitleStyle.background === 'box' ? `${4 * scale}px ${12 * scale}px` : undefined,
    backgroundColor: subtitleStyle.background === 'box' ? subtitleStyle.backgroundColor : undefined,
    borderRadius: subtitleStyle.background === 'box' ? `${6 * scale}px` : undefined,
    WebkitTextStroke: subtitleStyle.strokeWidth > 0 ? `${strokeWidth}px ${subtitleStyle.strokeColor}` : undefined,
    paintOrder: 'stroke fill',
  }

  const positionClass =
    subtitleStyle.position === 'top'
      ? 'top-[8%]'
      : subtitleStyle.position === 'center'
        ? 'top-1/2 -translate-y-1/2'
        : 'bottom-[8%]'

  return (
    <div className="flex h-full flex-col items-center gap-2">
      {/* Mode toggle */}
      <div className="flex-shrink-0 flex rounded-lg bg-white/5 p-0.5">
        <button
          onClick={() => setMode('crop')}
          className={cn(
            'rounded-md px-3 py-1 text-xs font-medium transition-all',
            mode === 'crop' ? 'bg-purple-500/30 text-purple-200' : 'text-white/40 hover:text-white/60'
          )}
        >
          {t('editor.preview.crop')}
        </button>
        <button
          onClick={() => setMode('preview')}
          className={cn(
            'rounded-md px-3 py-1 text-xs font-medium transition-all',
            mode === 'preview' ? 'bg-purple-500/30 text-purple-200' : 'text-white/40 hover:text-white/60'
          )}
        >
          {t('editor.preview.preview')}
        </button>
      </div>

      {/* Video container */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden">
        <div
          ref={previewContainerRef}
          className={cn(
            'relative',
            mode === 'crop'
              ? 'w-full max-h-full aspect-video'
              : 'overflow-hidden rounded-lg'
          )}
          style={mode === 'preview' ? { aspectRatio: '9/16', maxHeight: '100%', height: '100%' } : undefined}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className={cn(
              'h-full w-full rounded-lg',
              mode === 'crop' ? 'object-contain' : 'object-cover'
            )}
            style={mode === 'preview' ? { objectPosition: `${playheadCropX * 100}% center` } : undefined}
            playsInline
            preload="auto"
          />
          {mode === 'crop' && <CropOverlay videoRef={videoRef} />}

          {/* Overlay sous-titres — positionné dans le crop box en mode cadrage */}
          {subtitleStyle.enabled && displayText && (
            mode === 'crop' && cropBoxRect ? (
              <div
                className="absolute pointer-events-none z-10 overflow-hidden"
                style={{ left: cropBoxRect.left, top: cropBoxRect.top, width: cropBoxRect.width, height: cropBoxRect.height }}
              >
                <div className={cn('absolute left-0 right-0 flex justify-center px-3', positionClass)}>
                  <span style={subtitleCss}>{displayText}</span>
                </div>
              </div>
            ) : mode === 'preview' ? (
              <div className={cn('absolute left-0 right-0 flex justify-center px-3 pointer-events-none z-10', positionClass)}>
                <span style={subtitleCss}>{displayText}</span>
              </div>
            ) : null
          )}

          {/* Watermark overlay (free plan) */}
          {showWatermark && (
            mode === 'crop' && cropBoxRect ? (
              <div
                className="absolute pointer-events-none z-10 overflow-hidden"
                style={{ left: cropBoxRect.left, top: cropBoxRect.top, width: cropBoxRect.width, height: cropBoxRect.height }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-white/30 font-bold select-none"
                    style={{ fontSize: `${Math.max(10, 36 * scale)}px` }}
                  >
                    Made with CreaClip
                  </span>
                </div>
              </div>
            ) : mode === 'preview' ? (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <span
                  className="text-white/30 font-bold select-none"
                  style={{ fontSize: `${Math.max(10, 36 * scale)}px` }}
                >
                  Made with CreaClip
                </span>
              </div>
            ) : null
          )}
        </div>
      </div>

      <PreviewControls />
    </div>
  )
}
