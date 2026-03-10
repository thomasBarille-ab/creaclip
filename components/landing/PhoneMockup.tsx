'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SUBTITLE_LINES = [
  { words: ['Et', 'c\'est', 'exactement', 'comme', 'ça', 'que', 'j\'ai', 'doublé', 'mon', 'audience'] },
  { words: ['Le', 'secret', 'c\'est', 'la', 'régularité', 'sur', 'les', 'réseaux'] },
  { words: ['Arrêtez', 'de', 'poster', 'sans', 'stratégie', ',', 'ça', 'marche', 'pas'] },
]

export function PhoneMockup() {
  const [lineIndex, setLineIndex] = useState(0)
  const [highlightIndex, setHighlightIndex] = useState(0)

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setHighlightIndex((prev) => {
        const currentLine = SUBTITLE_LINES[lineIndex]
        if (prev >= currentLine.words.length - 1) return prev
        return prev + 1
      })
    }, 250)

    const lineInterval = setInterval(() => {
      setLineIndex((prev) => (prev + 1) % SUBTITLE_LINES.length)
      setHighlightIndex(0)
    }, 2500)

    return () => {
      clearInterval(wordInterval)
      clearInterval(lineInterval)
    }
  }, [lineIndex])

  return (
    <div className="relative mx-auto w-[260px] sm:w-[280px]">
      {/* Phone frame */}
      <div
        className="relative overflow-hidden rounded-[2.5rem] border-4 border-slate-700 bg-slate-900 shadow-2xl shadow-orange-500/20"
        style={{ aspectRatio: '9/16' }}
      >
        {/* Notch */}
        <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-800" />

        {/* Video background — warm studio lighting */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2d1a0f] via-[#1e150e] to-[#141010]" />
        {/* Background bokeh lights */}
        <div className="absolute left-[15%] top-[8%] h-3 w-3 rounded-full bg-amber-400/20 blur-[3px]" />
        <div className="absolute right-[20%] top-[12%] h-2 w-2 rounded-full bg-orange-400/15 blur-[2px]" />
        <div className="absolute left-[25%] top-[15%] h-2 w-2 rounded-full bg-amber-400/10 blur-[2px]" />
        <div className="absolute right-[30%] top-[6%] h-2.5 w-2.5 rounded-full bg-amber-300/15 blur-[3px]" />
        {/* Key light glow */}
        <div className="absolute left-1/2 top-[22%] h-40 w-40 -translate-x-1/2 rounded-full bg-amber-400/[0.07] blur-3xl" />

        {/* Person silhouette — stylized shadow figure */}
        <motion.div
          animate={{ y: [0, -1.5, 0, 1, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/2 top-[15%] -translate-x-1/2"
        >
          {/* Head + hair */}
          <div className="relative mx-auto h-[42px] w-[38px]">
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#3d2e1a] to-[#2d2015]" />
            <div className="absolute -left-0.5 -right-0.5 top-0 h-[22px] rounded-t-full bg-[#1a1210]" />
            {/* Face highlight — rim light */}
            <div className="absolute bottom-1 left-1 right-2 top-[40%] rounded-full bg-gradient-to-br from-[#d4a574]/60 to-[#b8895c]/40" />
            <div className="absolute right-0 top-[30%] h-[60%] w-[6px] rounded-full bg-amber-300/10 blur-[1px]" />
          </div>
          {/* Neck */}
          <div className="mx-auto h-[10px] w-[14px] bg-gradient-to-b from-[#c4956e]/40 to-transparent" />
          {/* Torso — hoodie/shirt */}
          <div className="relative mx-auto -mt-0.5 h-[120px] w-[120px] overflow-hidden rounded-t-[45%]">
            <div className="absolute inset-0 bg-gradient-to-b from-[#5e2d1f] to-[#40251a]" />
            {/* Shirt neckline */}
            <div className="absolute left-1/2 top-0 h-4 w-8 -translate-x-1/2 rounded-b-full bg-[#c4956e]/25" />
            {/* Fabric folds */}
            <div className="absolute left-[30%] top-[30%] h-16 w-px bg-white/[0.04]" />
            <div className="absolute right-[35%] top-[25%] h-20 w-px bg-white/[0.03]" />
            {/* Light catch on shoulder */}
            <div className="absolute right-2 top-2 h-8 w-4 rounded-full bg-amber-300/[0.06] blur-sm" />
          </div>
        </motion.div>

        {/* Vignette overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,transparent_40%,rgba(0,0,0,0.4)_100%)]" />

        {/* Top UI - like/share overlay */}
        <div className="absolute right-3 top-12 z-10 flex flex-col items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
              <span className="text-[10px]">&#10084;</span>
            </div>
            <span className="mt-0.5 text-[8px] font-semibold text-white/70">24.5K</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
              <span className="text-[10px]">&#128172;</span>
            </div>
            <span className="mt-0.5 text-[8px] font-semibold text-white/70">1.2K</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
              <span className="text-[10px]">&#8599;</span>
            </div>
            <span className="mt-0.5 text-[8px] font-semibold text-white/70">Share</span>
          </div>
        </div>

        {/* Author info bottom-left */}
        <div className="absolute bottom-16 left-3 z-10">
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-500" />
            <span className="text-[9px] font-bold text-white">@marie_crypto</span>
          </div>
          <p className="mt-1 max-w-[140px] text-[8px] leading-tight text-white/60">
            Comment j'ai doublé mon audience en 30 jours &#128640; #growth #content
          </p>
        </div>

        {/* Subtitles with karaoke effect */}
        <div className="absolute bottom-[88px] left-3 right-3 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={lineIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="rounded-lg bg-black/60 px-3 py-2 text-center backdrop-blur-sm"
            >
              <p className="flex flex-wrap justify-center gap-x-1.5 text-[11px] font-black uppercase leading-relaxed">
                {SUBTITLE_LINES[lineIndex].words.map((word, i) => (
                  <span
                    key={`${lineIndex}-${i}`}
                    className={`transition-colors duration-150 ${
                      i <= highlightIndex
                        ? 'text-orange-400 drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]'
                        : 'text-white/50'
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="h-0.5 rounded-full bg-white/20">
            <motion.div
              className="h-full rounded-full bg-white/80"
              animate={{ width: ['30%', '75%'] }}
              transition={{ duration: 7.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </div>
      </div>

      {/* Floating card — AI Score */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute -right-16 top-16 rounded-xl border border-white/10 bg-slate-800/90 px-3 py-2 shadow-lg backdrop-blur-sm sm:-right-20"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20">
            <span className="text-xs">&#9733;</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Score viral</p>
            <p className="text-sm font-bold text-orange-400">9.2/10</p>
          </div>
        </div>
      </motion.div>

      {/* Floating card — Generated clips */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute -left-14 top-36 rounded-xl border border-white/10 bg-slate-800/90 px-3 py-2 shadow-lg backdrop-blur-sm sm:-left-16"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20">
            <span className="text-xs">&#9889;</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Générés</p>
            <p className="text-sm font-bold text-amber-400">4 clips</p>
          </div>
        </div>
      </motion.div>

    </div>
  )
}
