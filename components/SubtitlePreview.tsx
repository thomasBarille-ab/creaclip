'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FONT_SIZE_MAP } from '@/types/subtitles'
import type { SubtitleStyle } from '@/types/subtitles'
import type { TranscriptionSegment } from '@/types/database'
import type { CropTimelineConfig } from '@/components/CropTimelineEditor'

interface SubtitlePreviewProps {
  videoUrl: string
  startSeconds: number
  endSeconds: number
  segments: TranscriptionSegment[]
  style: SubtitleStyle
  cropTimeline?: CropTimelineConfig
}

export function SubtitlePreview({
  videoUrl,
  startSeconds,
  endSeconds,
  segments,
  style,
  cropTimeline,
}: SubtitlePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [relativeTime, setRelativeTime] = useState(0)
  const [containerWidth, setContainerWidth] = useState(300)
  const [ready, setReady] = useState(false)

  // Mesurer la largeur du container pour le scaling des fonts
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Seek au début du clip quand la vidéo est prête
  const handleLoadedData = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = startSeconds
    setReady(true)
  }, [startSeconds])

  // Sync du temps relatif + boucle
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const relative = video.currentTime - startSeconds
    setRelativeTime(Math.max(0, relative))

    // Boucler quand on atteint la fin du clip
    if (video.currentTime >= endSeconds) {
      video.currentTime = startSeconds
      if (!playing) {
        video.pause()
      }
    }
  }, [startSeconds, endSeconds, playing])

  function togglePlay() {
    const video = videoRef.current
    if (!video) return

    if (playing) {
      video.pause()
      setPlaying(false)
    } else {
      video.play()
      setPlaying(true)
    }
  }

  function restart() {
    const video = videoRef.current
    if (!video) return
    video.currentTime = startSeconds
    setRelativeTime(0)
    if (playing) {
      video.play()
    }
  }

  // Trouver le segment actif
  const activeSegment = useMemo(() => {
    if (!style.enabled) return null
    return segments.find((seg) => relativeTime >= seg.start && relativeTime <= seg.end) ?? null
  }, [segments, relativeTime, style.enabled])

  // Calculer le texte affiché
  const displayText = useMemo(() => {
    if (!activeSegment) return null
    let text = activeSegment.text
    if (style.textTransform === 'uppercase') {
      text = text.toUpperCase()
    }
    return text
  }, [activeSegment, style.textTransform])

  // Calculer les styles CSS du sous-titre
  const scale = containerWidth / 1080
  const fontSize = Math.max(12, FONT_SIZE_MAP[style.fontSize].canvas * scale)
  const strokeWidth = Math.max(1, style.strokeWidth * scale)

  const subtitleCss: React.CSSProperties = {
    fontFamily: `'${style.fontFamily}', sans-serif`,
    fontSize: `${fontSize}px`,
    fontWeight: style.fontWeight ?? 'bold',
    fontStyle: style.fontStyle ?? 'normal',
    color: style.textColor,
    textAlign: 'center',
    lineHeight: 1.3,
    padding: style.background === 'box' ? `${4 * scale}px ${12 * scale}px` : undefined,
    backgroundColor: style.background === 'box' ? style.backgroundColor : undefined,
    borderRadius: style.background === 'box' ? `${6 * scale}px` : undefined,
    WebkitTextStroke: style.strokeWidth > 0 ? `${strokeWidth}px ${style.strokeColor}` : undefined,
    paintOrder: 'stroke fill',
    textShadow: style.shadow
      ? `${(style.shadowOffsetX ?? 2) * scale}px ${(style.shadowOffsetY ?? 2) * scale}px ${(style.shadowBlur ?? 4) * scale}px ${style.shadowColor ?? '#000000'}`
      : undefined,
  }

  // Position du container de sous-titres
  const positionClass =
    style.position === 'top'
      ? 'top-[8%]'
      : style.position === 'center'
        ? 'top-1/2 -translate-y-1/2'
        : 'bottom-[8%]'

  // Calculer la position de crop active en fonction du temps
  const activeCropX = useMemo(() => {
    if (!cropTimeline?.enabled || cropTimeline.segments.length === 0) return 0.5
    const sorted = [...cropTimeline.segments].sort((a, b) => a.time - b.time)
    let active = sorted[0]
    for (const seg of sorted) {
      if (relativeTime >= seg.time) active = seg
      else break
    }
    return active.cropX
  }, [cropTimeline, relativeTime])

  const duration = endSeconds - startSeconds
  const progressPercent = duration > 0 ? (relativeTime / duration) * 100 : 0

  return (
    <div className="flex flex-col gap-3">
      {/* Container vidéo 9:16 */}
      <div
        ref={containerRef}
        className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl bg-black"
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="h-full w-full object-cover"
          style={{
            objectPosition: cropTimeline?.enabled ? `${activeCropX * 100}% 50%` : undefined,
          }}
          muted
          playsInline
          preload="auto"
          onLoadedData={handleLoadedData}
          onTimeUpdate={handleTimeUpdate}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
        />

        {/* Overlay sous-titre */}
        {displayText && (
          <div
            className={cn(
              'absolute left-0 right-0 flex justify-center px-3',
              positionClass
            )}
          >
            <span style={subtitleCss}>{displayText}</span>
          </div>
        )}

        {/* Play/Pause overlay */}
        {ready && !playing && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
          >
            <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
              <Play className="h-8 w-8 text-white" fill="white" />
            </div>
          </button>
        )}

        {/* Loading */}
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          </div>
        )}
      </div>

      {/* Contrôles */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          disabled={!ready}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:opacity-40"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          onClick={restart}
          disabled={!ready}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        {/* Barre de progression */}
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-150"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
