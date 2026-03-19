'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Type,
  ALargeSmall,
  Palette,
  PaintBucket,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  CaseSensitive,
  CaseUpper,
  RectangleHorizontal,
  Save,
  X,
  BookmarkCheck,
  ChevronDown,
  Captions,
  Bold,
  Italic,
  Sun,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'
import {
  FONT_OPTIONS,
  FONT_SIZE_MAP,
  TEXT_COLOR_PRESETS,
  STROKE_COLOR_PRESETS,
  BG_COLOR_PRESETS,
  loadPresets,
  savePreset,
  deletePreset,
} from '@/types/subtitles'
import type { SubtitleStyle, SubtitlePreset } from '@/types/subtitles'

interface SubtitleEditorProps {
  style: SubtitleStyle
  onChange: (style: SubtitleStyle) => void
}

function AccordionSection({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string
  icon: React.ElementType
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 py-3 text-left"
      >
        <Icon className="h-3.5 w-3.5 text-white/40" />
        <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">{title}</span>
        <ChevronDown
          className={cn(
            'ml-auto h-3.5 w-3.5 text-white/30 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && <div className="pb-3 space-y-2.5">{children}</div>}
    </div>
  )
}

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: string
  selected: boolean
  onClick: () => void
}) {
  const isTransparent = color === 'transparent'
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-8 w-8 rounded-lg border-2 transition-all',
        selected ? 'border-orange-400 scale-110' : 'border-white/20 hover:border-white/40'
      )}
      style={{ backgroundColor: isTransparent ? undefined : color }}
    >
      {isTransparent && (
        <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">∅</div>
      )}
    </button>
  )
}

export function SubtitleEditor({ style, onChange }: SubtitleEditorProps) {
  const { t } = useTranslation()
  const [presets, setPresets] = useState<SubtitlePreset[]>([])
  const [saving, setSaving] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [open, setOpen] = useState(true)
  const toast = useToast()

  useEffect(() => {
    setPresets(loadPresets())
  }, [])

  function update<K extends keyof SubtitleStyle>(key: K, value: SubtitleStyle[K]) {
    onChange({ ...style, [key]: value })
  }

  function handleSavePreset() {
    if (!presetName.trim()) return
    const preset = savePreset(presetName.trim(), style)
    setPresets((prev) => [...prev, preset])
    setPresetName('')
    setSaving(false)
    toast.success(t('subtitles.presetSaved'))
  }

  function handleDeletePreset(id: string) {
    deletePreset(id)
    setPresets((prev) => prev.filter((p) => p.id !== id))
    toast.success(t('subtitles.presetDeleted'))
  }

  function handleApplyPreset(preset: SubtitlePreset) {
    onChange({ ...preset.style })
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
      {/* Header collapsible */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-5 text-left"
      >
        <Captions className="h-4 w-4 text-white/50" />
        <span className="text-sm font-semibold text-white">{t('subtitles.title')}</span>
        {/* Toggle ON/OFF */}
        <span
          onClick={(e) => { e.stopPropagation(); update('enabled', !style.enabled) }}
          className={cn(
            'ml-auto mr-2 cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors',
            style.enabled ? 'bg-orange-500/30 text-orange-200' : 'bg-white/10 text-white/40'
          )}
        >
          {style.enabled ? 'ON' : 'OFF'}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-white/40 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
      <div className="px-5 pb-5">
      {/* 1. Presets */}
      <AccordionSection title={t('subtitles.presets')} icon={BookmarkCheck} defaultOpen={true}>
        <div className="flex items-center justify-end">
          {!saving && (
            <button
              onClick={() => setSaving(true)}
              className="flex items-center gap-1 text-xs text-orange-400 transition-colors hover:text-orange-300"
            >
              <Save className="h-3 w-3" />
              {t('subtitles.savePreset')}
            </button>
          )}
        </div>

        {/* Formulaire de sauvegarde */}
        {saving && (
          <div className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              placeholder={t('subtitles.presetNamePlaceholder')}
              autoFocus
              className="flex-1 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-orange-500 focus:outline-none"
            />
            <button
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className="rounded-lg bg-orange-500/20 px-3 py-1.5 text-sm font-medium text-orange-300 transition-colors hover:bg-orange-500/30 disabled:opacity-40"
            >
              OK
            </button>
            <button
              onClick={() => { setSaving(false); setPresetName('') }}
              className="rounded-lg bg-white/10 px-2 py-1.5 text-white/40 transition-colors hover:bg-white/15 hover:text-white/60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Liste des presets */}
        {presets.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="group flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 transition-all hover:border-orange-500/30"
              >
                <button
                  onClick={() => handleApplyPreset(preset)}
                  className="flex items-center gap-1.5 py-1.5 pl-3 pr-1 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <span
                    className="h-3 w-3 rounded-full border border-white/20"
                    style={{ backgroundColor: preset.style.textColor }}
                  />
                  {preset.name}
                </button>
                <button
                  onClick={() => handleDeletePreset(preset.id)}
                  className="rounded-r-lg px-1.5 py-1.5 text-white/20 transition-colors hover:text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/30">{t('subtitles.noPresets')}</p>
        )}
      </AccordionSection>

      {style.enabled && (
        <>
          {/* 2. Police */}
          <AccordionSection title={t('subtitles.font')} icon={Type} defaultOpen={true}>
            <div className="grid grid-cols-3 gap-1.5">
              {FONT_OPTIONS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => update('fontFamily', font.value)}
                  className={cn(
                    'rounded-lg border px-2 py-1.5 text-xs transition-all truncate',
                    style.fontFamily === font.value
                      ? 'border-orange-500 bg-orange-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'
                  )}
                  style={{ fontFamily: `'${font.value}', sans-serif` }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </AccordionSection>

          {/* 3. Style (Taille + Bold/Italic + Casse) */}
          <AccordionSection title={t('subtitles.style')} icon={ALargeSmall} defaultOpen={true}>
            {/* Taille */}
            <div className="space-y-1.5">
              <span className="text-xs text-white/40">{t('subtitles.size')}</span>
              <div className="flex gap-2">
                {(Object.keys(FONT_SIZE_MAP) as SubtitleStyle['fontSize'][]).map((size) => (
                  <button
                    key={size}
                    onClick={() => update('fontSize', size)}
                    className={cn(
                      'flex-1 rounded-lg border py-2 text-sm font-medium transition-all',
                      style.fontSize === size
                        ? 'border-orange-500 bg-orange-500/20 text-white'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                    )}
                  >
                    {FONT_SIZE_MAP[size].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bold / Italic toggles */}
            <div className="flex gap-2">
              <button
                onClick={() => update('fontWeight', style.fontWeight === 'bold' ? 'normal' : 'bold')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm transition-all',
                  style.fontWeight === 'bold'
                    ? 'border-orange-500 bg-orange-500/20 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                )}
              >
                <Bold className="h-3.5 w-3.5" />
                {t('subtitles.bold')}
              </button>
              <button
                onClick={() => update('fontStyle', style.fontStyle === 'italic' ? 'normal' : 'italic')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm transition-all',
                  style.fontStyle === 'italic'
                    ? 'border-orange-500 bg-orange-500/20 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                )}
              >
                <Italic className="h-3.5 w-3.5" />
                {t('subtitles.italic')}
              </button>
            </div>

            {/* Casse */}
            <div className="flex gap-2">
              <button
                onClick={() => update('textTransform', 'none')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-sm transition-all',
                  style.textTransform === 'none'
                    ? 'border-orange-500 bg-orange-500/20 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                )}
              >
                <CaseSensitive className="h-3.5 w-3.5" />
                Aa
              </button>
              <button
                onClick={() => update('textTransform', 'uppercase')}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-sm transition-all',
                  style.textTransform === 'uppercase'
                    ? 'border-orange-500 bg-orange-500/20 text-white'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                )}
              >
                <CaseUpper className="h-3.5 w-3.5" />
                AA
              </button>
            </div>
          </AccordionSection>

          {/* 4. Couleurs (Texte + Contour) */}
          <AccordionSection title={t('subtitles.colors')} icon={Palette} defaultOpen={true}>
            {/* Couleur du texte */}
            <div className="space-y-1.5">
              <span className="text-xs text-white/40">{t('subtitles.textColor')}</span>
              <div className="flex flex-wrap gap-2">
                {TEXT_COLOR_PRESETS.map((color) => (
                  <ColorSwatch
                    key={color}
                    color={color}
                    selected={style.textColor === color}
                    onClick={() => update('textColor', color)}
                  />
                ))}
                <label className="relative">
                  <input
                    type="color"
                    value={style.textColor}
                    onChange={(e) => update('textColor', e.target.value)}
                    className="absolute inset-0 h-8 w-8 cursor-pointer opacity-0"
                  />
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-dashed border-white/20 text-xs text-white/40 hover:border-white/40">
                    +
                  </div>
                </label>
              </div>
            </div>

            {/* Contour */}
            <div className="space-y-1.5">
              <span className="text-xs text-white/40">{t('subtitles.stroke')}</span>
              <div className="flex flex-wrap gap-2">
                {STROKE_COLOR_PRESETS.map((color) => (
                  <ColorSwatch
                    key={color}
                    color={color}
                    selected={style.strokeColor === color}
                    onClick={() => update('strokeColor', color)}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/40">{t('subtitles.strokeWidth')}</span>
                <input
                  type="range"
                  min={0}
                  max={8}
                  step={1}
                  value={style.strokeWidth}
                  onChange={(e) => update('strokeWidth', Number(e.target.value))}
                  className="flex-1 accent-orange-500"
                />
                <span className="w-6 text-right text-xs text-white/50">{style.strokeWidth}</span>
              </div>
            </div>
          </AccordionSection>

          {/* 5. Ombre */}
          <AccordionSection title={t('subtitles.shadow')} icon={Sun} defaultOpen={false}>
            {/* Toggle ON/OFF */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => update('shadow', !style.shadow)}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  style.shadow ? 'bg-orange-500' : 'bg-white/20'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                    style.shadow && 'translate-x-5'
                  )}
                />
              </button>
              <span className="text-xs text-white/50">{style.shadow ? 'ON' : 'OFF'}</span>
            </div>

            {style.shadow && (
              <>
                {/* Couleur */}
                <div className="space-y-1.5">
                  <span className="text-xs text-white/40">{t('subtitles.shadowColor')}</span>
                  <div className="flex items-center gap-2">
                    <label className="relative">
                      <input
                        type="color"
                        value={style.shadowColor}
                        onChange={(e) => update('shadowColor', e.target.value)}
                        className="absolute inset-0 h-8 w-8 cursor-pointer opacity-0"
                      />
                      <div
                        className="h-8 w-8 rounded-lg border-2 border-white/20 hover:border-white/40"
                        style={{ backgroundColor: style.shadowColor }}
                      />
                    </label>
                    <span className="text-xs text-white/40">{style.shadowColor}</span>
                  </div>
                </div>

                {/* Blur */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40">{t('subtitles.shadowBlur')}</span>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={1}
                    value={style.shadowBlur}
                    onChange={(e) => update('shadowBlur', Number(e.target.value))}
                    className="flex-1 accent-orange-500"
                  />
                  <span className="w-6 text-right text-xs text-white/50">{style.shadowBlur}</span>
                </div>

                {/* Offset X */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40">{t('subtitles.shadowOffset')} X</span>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    step={1}
                    value={style.shadowOffsetX}
                    onChange={(e) => update('shadowOffsetX', Number(e.target.value))}
                    className="flex-1 accent-orange-500"
                  />
                  <span className="w-6 text-right text-xs text-white/50">{style.shadowOffsetX}</span>
                </div>

                {/* Offset Y */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40">{t('subtitles.shadowOffset')} Y</span>
                  <input
                    type="range"
                    min={-10}
                    max={10}
                    step={1}
                    value={style.shadowOffsetY}
                    onChange={(e) => update('shadowOffsetY', Number(e.target.value))}
                    className="flex-1 accent-orange-500"
                  />
                  <span className="w-6 text-right text-xs text-white/50">{style.shadowOffsetY}</span>
                </div>
              </>
            )}
          </AccordionSection>

          {/* 6. Position & Fond */}
          <AccordionSection title={t('subtitles.positionAndBg')} icon={MapPin} defaultOpen={true}>
            {/* Position */}
            <div className="flex gap-2">
              {([
                { value: 'top', labelKey: 'subtitles.positionTop', icon: AlignVerticalJustifyStart },
                { value: 'center', labelKey: 'subtitles.positionCenter', icon: AlignVerticalJustifyCenter },
                { value: 'bottom', labelKey: 'subtitles.positionBottom', icon: AlignVerticalJustifyEnd },
              ] as const).map(({ value, labelKey, icon: PosIcon }) => (
                <button
                  key={value}
                  onClick={() => update('position', value)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-sm transition-all',
                    style.position === value
                      ? 'border-orange-500 bg-orange-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                  )}
                >
                  <PosIcon className="h-3.5 w-3.5" />
                  {t(labelKey)}
                </button>
              ))}
            </div>

            {/* Fond */}
            <div className="space-y-1.5">
              <span className="text-xs text-white/40">{t('subtitles.background')}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => update('background', 'none')}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-sm transition-all',
                    style.background === 'none'
                      ? 'border-orange-500 bg-orange-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                  )}
                >
                  {t('subtitles.backgroundNone')}
                </button>
                <button
                  onClick={() => update('background', 'box')}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-sm transition-all',
                    style.background === 'box'
                      ? 'border-orange-500 bg-orange-500/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                  )}
                >
                  {t('subtitles.backgroundBox')}
                </button>
              </div>
            </div>

            {/* Couleur du fond (visible uniquement si box) */}
            {style.background === 'box' && (
              <div className="space-y-1.5">
                <span className="text-xs text-white/40">{t('subtitles.bgColor')}</span>
                <div className="flex flex-wrap gap-2">
                  {BG_COLOR_PRESETS.map((color) => (
                    <ColorSwatch
                      key={color}
                      color={color}
                      selected={style.backgroundColor === color}
                      onClick={() => update('backgroundColor', color)}
                    />
                  ))}
                </div>
              </div>
            )}
          </AccordionSection>
        </>
      )}
    </div>
      )}
    </div>
  )
}
