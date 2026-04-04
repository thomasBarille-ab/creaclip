import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlanType } from '@/types/database'

interface PlanFeatures {
  clipsPerMonth: number
  watermark: boolean
  searchByPrompt: boolean
  persona: boolean
  clipFilters: boolean
  customBranding: boolean
}

export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free:     { clipsPerMonth: 3,   watermark: true,  searchByPrompt: false, persona: false, clipFilters: false, customBranding: false },
  pro:      { clipsPerMonth: 40,  watermark: false, searchByPrompt: true,  persona: false, clipFilters: true,  customBranding: false },
  business: { clipsPerMonth: 150, watermark: false, searchByPrompt: true,  persona: false, clipFilters: true,  customBranding: true  },
}

export type PlanFeature = keyof PlanFeatures

export function getPlanLimits(plan: PlanType): PlanFeatures {
  return PLAN_FEATURES[plan] ?? PLAN_FEATURES.free
}

export function hasFeatureAccess(plan: PlanType, feature: PlanFeature): boolean {
  const limits = getPlanLimits(plan)
  const value = limits[feature]
  if (typeof value === 'boolean') return value
  return value > 0
}

export async function getMonthlyClipsUsed(supabase: SupabaseClient, userId: string): Promise<number> {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { count, error } = await supabase
    .from('clip_generations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', firstOfMonth)

  if (error) {
    console.error('Error counting monthly clips:', error)
    return 0
  }

  return count ?? 0
}

export async function canCreateClip(
  supabase: SupabaseClient,
  userId: string,
  plan: PlanType
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limits = getPlanLimits(plan)
  const used = await getMonthlyClipsUsed(supabase, userId)
  return {
    allowed: used < limits.clipsPerMonth,
    used,
    limit: limits.clipsPerMonth,
  }
}
