'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { useEditor } from '../EditorProvider'
import { TimelineRuler } from './TimelineRuler'
import { TimelineSegment } from './TimelineSegment'
import { TimelinePlayhead } from './TimelinePlayhead'
import { TimelineControls } from './TimelineControls'

interface TimelineProps {
  videoUrl: string | null
}

export function Timeline({ videoUrl }: TimelineProps) {
  const { state, dispatch, totalDuration, segmentOffsets } = useEditor()
  const { pixelsPerSecond } = state.zoom
  const scrollRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const isDraggingRef = useRef(false)

  // Refs pour accès stable dans les listeners
  const ppsRef = useRef(pixelsPerSecond)
  ppsRef.current = pixelsPerSecond
  const totalDurationRef = useRef(totalDuration)
  totalDurationRef.current = totalDuration

  // Auto-fit : ajuster le zoom pour que la timeline remplisse le container
  useEffect(() => {
    if (totalDuration > 0 && containerWidth > 0) {
      const padding = 32
      const fitPps = (containerWidth - padding) / totalDuration
      dispatch({ type: 'SET_ZOOM', zoom: { pixelsPerSecond: Math.max(10, fitPps) } })
    }
  }, [containerWidth, totalDuration, dispatch])

  const contentWidth = totalDuration * pixelsPerSecond

  // Mesurer la largeur du container
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Convertir clientX → temps timeline
  const getTimeFromClientX = useCallback((clientX: number): number => {
    const el = scrollRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    const paddingLeft = parseFloat(getComputedStyle(el).paddingLeft) || 0
    const x = clientX - rect.left - paddingLeft + el.scrollLeft
    return Math.max(0, Math.min(totalDurationRef.current, x / ppsRef.current))
  }, [])

  // Scrub : mousedown sur la zone timeline
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Ne pas intercepter les trim handles et le playhead triangle
    const target = e.target as HTMLElement
    if (target.closest('.cursor-col-resize') || target.closest('.cursor-grab')) return

    e.preventDefault()
    e.stopPropagation()

    // Capturer le pointer pour recevoir tous les moves même hors de l'élément
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    isDraggingRef.current = true

    const time = getTimeFromClientX(e.clientX)
    dispatch({ type: 'SET_PLAYHEAD', time })
  }, [getTimeFromClientX, dispatch])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    e.preventDefault()
    const time = getTimeFromClientX(e.clientX)
    dispatch({ type: 'SET_PLAYHEAD', time })
  }, [getTimeFromClientX, dispatch])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* Zone timeline */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-hidden px-4 py-2 cursor-pointer touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="relative" style={{ width: contentWidth, minWidth: '100%' }}>
          {/* Ruler */}
          <TimelineRuler />

          {/* Lane de segments */}
          <div className="relative mt-1" style={{ height: 52 }}>
            {state.segments.map((seg, i) => (
              <div key={seg.id} data-segment>
                <TimelineSegment
                  segment={seg}
                  timelineStart={segmentOffsets[i]?.timelineStart ?? 0}
                  videoUrl={videoUrl}
                />
              </div>
            ))}

            {/* Playhead */}
            <TimelinePlayhead />
          </div>

          {/* Controls dans le flow de la timeline */}
          <TimelineControls containerWidth={containerWidth} />
        </div>
      </div>
    </div>
  )
}
