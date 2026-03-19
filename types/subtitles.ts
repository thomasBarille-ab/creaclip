export interface SubtitleStyle {
  enabled: boolean
  fontFamily: string
  fontSize: 'small' | 'medium' | 'large'
  textColor: string
  strokeColor: string
  strokeWidth: number
  position: 'top' | 'center' | 'bottom'
  textTransform: 'none' | 'uppercase'
  background: 'none' | 'box'
  backgroundColor: string
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  shadow: boolean
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
}

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  enabled: true,
  fontFamily: 'Arial',
  fontSize: 'medium',
  textColor: '#FFFFFF',
  strokeColor: '#000000',
  strokeWidth: 4,
  position: 'bottom',
  textTransform: 'none',
  background: 'none',
  backgroundColor: 'rgba(0,0,0,0.6)',
  fontWeight: 'bold',
  fontStyle: 'normal',
  shadow: false,
  shadowColor: '#000000',
  shadowBlur: 4,
  shadowOffsetX: 2,
  shadowOffsetY: 2,
}

export const FONT_OPTIONS = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Courier New', label: 'Courier' },
  { value: 'Trebuchet MS', label: 'Trebuchet' },
  { value: 'Comic Sans MS', label: 'Comic Sans' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Bebas Neue', label: 'Bebas Neue' },
  { value: 'Oswald', label: 'Oswald' },
] as const

export const BG_COLOR_PRESETS = [
  'rgba(0,0,0,0.6)',
  'rgba(0,0,0,0.8)',
  'rgba(255,255,255,0.3)',
  'rgba(255,0,0,0.4)',
  'rgba(0,0,255,0.4)',
  'rgba(128,0,128,0.4)',
]

export const FONT_SIZE_MAP: Record<SubtitleStyle['fontSize'], { canvas: number; label: string }> = {
  small: { canvas: 36, label: 'S' },
  medium: { canvas: 48, label: 'M' },
  large: { canvas: 62, label: 'L' },
}

export const TEXT_COLOR_PRESETS = [
  '#FFFFFF',
  '#FFFF00',
  '#00FFFF',
  '#00FF00',
  '#FF4444',
  '#FF69B4',
]

export const STROKE_COLOR_PRESETS = [
  '#000000',
  '#1a1a2e',
  '#0d0d0d',
  '#1e3a5f',
  '#3b0a0a',
  'transparent',
]

// ── Presets ──

export interface SubtitlePreset {
  id: string
  name: string
  style: SubtitleStyle
}

const STORAGE_KEY = 'clipforge:subtitle-presets'

export function loadPresets(): SubtitlePreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SubtitlePreset[]
  } catch {
    return []
  }
}

export function savePreset(name: string, style: SubtitleStyle): SubtitlePreset {
  const presets = loadPresets()
  const preset: SubtitlePreset = {
    id: crypto.randomUUID(),
    name,
    style: { ...style },
  }
  presets.push(preset)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  return preset
}

export function deletePreset(id: string): void {
  const presets = loadPresets().filter((p) => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}
