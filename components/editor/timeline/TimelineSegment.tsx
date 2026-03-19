'use client'

import { useCallback, useMemo } from 'react'
import { useEditor } from '../EditorProvider'
import { useTimelineDrag } from '@/hooks/useTimelineDrag'
import { useVideoThumbnails } from '@/hooks/useVideoThumbnails'
import { cn } from '@/lib/utils'
import type { TimelineSegment as TimelineSegmentType } from '../types'

interface TimelineSegmentProps {
  segment: TimelineSegmentType
  timelineStart: number
  videoUrl: string | null
}

export function TimelineSegment({ segment, timelineStart, videoUrl }: TimelineSegmentProps) {
  const { state, dispatch } = useEditor()
  const { pixelsPerSecond } = state.zoom
  const isSelected = state.selectedSegmentId === segment.id

  const duration = segment.sourceEnd - segment.sourceStart
  const width = duration * pixelsPerSecond
  const left = timelineStart * pixelsPerSecond

  // Thumbnails : ~1 tous les 80px
  const thumbnailTimes = useMemo(() => {
    const count = Math.max(1, Math.floor(width / 80))
    const step = duration / count
    const times: number[] = []
    for (let i = 0; i < count; i++) {
      times.push(segment.sourceStart + step * i + step / 2)
    }
    return times
  }, [segment.sourceStart, duration, width])

  const thumbnails = useVideoThumbnails(videoUrl, thumbnailTimes)

  // Drag handle gauche (trim start)
  const trimStartDrag = useTimelineDrag({
    onDrag: useCallback(
      (deltaX: number) => {
        const deltaTime = deltaX / pixelsPerSecond
        const newStart = segment.sourceStart + deltaTime
        dispatch({ type: 'TRIM_SEGMENT_START', id: segment.id, newSourceStart: newStart })
      },
      [pixelsPerSecond, segment.sourceStart, segment.id, dispatch]
    ),
  })

  // Drag handle droite (trim end)
  const trimEndDrag = useTimelineDrag({
    onDrag: useCallback(
      (deltaX: number) => {
        const deltaTime = deltaX / pixelsPerSecond
        const newEnd = segment.sourceEnd + deltaTime
        dispatch({ type: 'TRIM_SEGMENT_END', id: segment.id, newSourceEnd: newEnd })
      },
      [pixelsPerSecond, segment.sourceEnd, segment.id, dispatch]
    ),
  })

  return (
    <div
      className={cn(
        'absolute top-0 h-full rounded-lg overflow-hidden cursor-pointer transition-shadow',
        isSelected
          ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/20'
          : 'ring-1 ring-white/20 hover:ring-white/30'
      )}
      style={{ left, width: Math.max(width, 20) }}
      onClick={() => {
        dispatch({ type: 'SELECT_SEGMENT', id: segment.id })
      }}
    >
      {/* Thumbnails */}
      <div className="flex h-full bg-slate-800">
        {thumbnailTimes.map((time, i) => {
          const key = (Math.round(time * 2) / 2).toFixed(1)
          const thumb = thumbnails.get(key)
          return (
            <div
              key={i}
              className="flex-1 bg-slate-700"
              style={{
                backgroundImage: thumb ? `url(${thumb})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )
        })}
      </div>

      {/* Handle gauche */}
      <div
        className={cn(
          'absolute left-0 top-0 h-full w-2 cursor-col-resize transition-colors',
          isSelected ? 'bg-orange-500/60 hover:bg-orange-500/80' : 'bg-white/20 hover:bg-white/40'
        )}
        onMouseDown={trimStartDrag.onMouseDown}
      >
        <div className="absolute inset-y-0 left-0.5 w-px bg-white/50" />
      </div>

      {/* Handle droite */}
      <div
        className={cn(
          'absolute right-0 top-0 h-full w-2 cursor-col-resize transition-colors',
          isSelected ? 'bg-orange-500/60 hover:bg-orange-500/80' : 'bg-white/20 hover:bg-white/40'
        )}
        onMouseDown={trimEndDrag.onMouseDown}
      >
        <div className="absolute inset-y-0 right-0.5 w-px bg-white/50" />
      </div>
    </div>
  )
}
