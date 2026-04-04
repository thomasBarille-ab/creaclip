'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Upload,
  Film,
  Scissors,
  Clock,
  Loader2,
  TrendingUp,
  ArrowRight,
  CircleAlert,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { createClient } from '@/lib/supabase/client'
import { cn, formatTime } from '@/lib/utils'
import { VIDEO_STATUS_KEYS, VIDEO_STATUS_COLORS } from '@/lib/constants'
import { getPlanLimits } from '@/lib/plans'
import { EmptyState, Badge } from '@/components/ui'
import { VideoThumbnail } from '@/components/VideoThumbnail'
import { OnboardingOverlay } from '@/components/OnboardingOverlay'
import { useBatchSignedUrls } from '@/hooks/useBatchSignedUrls'
import { DashboardHeader } from '@/components/DashboardHeader'
import type { Video, ClipWithVideo, PlanType } from '@/types/database'

interface Stats {
  totalVideos: number
  readyClips: number
  processingJobs: number
}

const STAT_CARDS = [
  { key: 'totalVideos' as const, labelKey: 'dashboard.statVideos', icon: Film, color: 'bg-orange-500/20', iconColor: 'text-orange-400' },
  { key: 'readyClips' as const, labelKey: 'dashboard.statClips', icon: Scissors, color: 'bg-amber-500/20', iconColor: 'text-amber-400' },
  { key: 'processingJobs' as const, labelKey: 'dashboard.statProcessing', icon: Loader2, color: 'bg-blue-500/20', iconColor: 'text-blue-400' },
]

export default function DashboardPage() {
  const { t } = useTranslation()
  const [videos, setVideos] = useState<Video[]>([])
  const [clips, setClips] = useState<ClipWithVideo[]>([])
  const [stats, setStats] = useState<Stats>({ totalVideos: 0, readyClips: 0, processingJobs: 0 })
  const [loading, setLoading] = useState(true)
  const [userPlan, setUserPlan] = useState<PlanType>('free')
  const [monthlyClipsUsed, setMonthlyClipsUsed] = useState(0)
  const [userName, setUserName] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [videosRes, clipsRes, readyClipsCountRes, jobsRes, profileRes, monthlyClipsRes] = await Promise.all([
      supabase
        .from('videos')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('clips')
        .select('*, video:videos(title)')
        .eq('user_id', session.user.id)
        .eq('status', 'ready')
        .order('created_at', { ascending: false })
        .limit(4),
      supabase
        .from('clips')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('status', 'ready'),
      supabase
        .from('processing_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .in('status', ['pending', 'processing']),
      supabase
        .from('profiles')
        .select('plan, full_name')
        .eq('id', session.user.id)
        .single(),
      supabase
        .from('clip_generations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('created_at', firstOfMonth),
    ])

    const videosList = (videosRes.data ?? []) as Video[]
    const clipsList = (clipsRes.data ?? []) as ClipWithVideo[]

    setVideos(videosList)
    setClips(clipsList)
    setStats({
      totalVideos: videosList.length,
      readyClips: readyClipsCountRes.count ?? 0,
      processingJobs: jobsRes.count ?? 0,
    })
    setUserPlan((profileRes.data?.plan as PlanType) ?? 'free')
    setUserName(profileRes.data?.full_name ?? null)
    setMonthlyClipsUsed(monthlyClipsRes.count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()

    function onFocus() { loadData() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [loadData])

  const limits = getPlanLimits(userPlan)
  const clipsPerMonth = limits.clipsPerMonth
  const ratio = clipsPerMonth > 0 ? monthlyClipsUsed / clipsPerMonth : 0
  const isWarning = ratio > 0.8
  const isFull = clipsPerMonth > 0 && monthlyClipsUsed >= clipsPerMonth

  // Batch-fetch all thumbnail URLs in a single call
  const thumbnailPaths = useMemo(() => {
    const paths: string[] = []
    for (const video of videos) {
      if (video.status === 'ready') {
        paths.push(`${video.user_id}/thumbnails/${video.id}.jpg`)
      }
    }
    for (const clip of clips) {
      if (clip.thumbnail_path) {
        paths.push(clip.thumbnail_path)
      }
    }
    return paths
  }, [videos, clips])
  const signedUrlMap = useBatchSignedUrls(thumbnailPaths)

  return (
    <>
      <style jsx>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.4); }
          50% { box-shadow: 0 0 20px 4px rgba(234, 88, 12, 0.2); }
        }
        @keyframes count-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(14deg); }
          50% { transform: rotate(-8deg); }
          75% { transform: rotate(14deg); }
        }
        .animate-fade-in-up-1 { animation: fade-in-up 0.5s ease-out 0.1s both; }
        .animate-fade-in-up-2 { animation: fade-in-up 0.5s ease-out 0.2s both; }
        .animate-fade-in-up-3 { animation: fade-in-up 0.5s ease-out 0.3s both; }
        .animate-fade-in-up-4 { animation: fade-in-up 0.5s ease-out 0.4s both; }
        .animate-count-up { animation: count-up 0.4s ease-out both; }
        .animate-pulse-glow { animation: pulse-glow 2.5s ease-in-out infinite; }
        .animate-wave { animation: wave 1.5s ease-in-out 0.5s 2; display: inline-block; transform-origin: 70% 70%; }
        .skeleton-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="mx-auto max-w-5xl space-y-8">
        {/* ═══ Hero Zone ═══ */}
        <section className="animate-fade-in-up-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                {userName
                  ? t('dashboard.greeting', { name: userName })
                  : t('dashboard.greetingNoName')
                }
                {' '}<span className="animate-wave">👋</span>
              </h1>
              <p className="mt-1 text-sm text-white/40">{t('dashboard.today')}</p>
            </div>
            <DashboardHeader />
          </div>

          {/* Stats pills + Quota bar */}
          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center" data-onboarding="stats">
            {/* Stats pills */}
            <div className="flex flex-wrap gap-3">
              {STAT_CARDS.map(({ key, labelKey, icon: Icon, color, iconColor }, i) => (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
                  style={{ animationDelay: `${0.15 + i * 0.08}s` }}
                >
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', color)}>
                    <Icon className={cn('h-4 w-4', iconColor, key === 'processingJobs' && stats.processingJobs > 0 && 'animate-spin')} />
                  </div>
                  {loading ? (
                    <div className="h-6 w-8 animate-pulse rounded bg-white/10" />
                  ) : (
                    <div className="animate-count-up" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                      <p className="text-lg font-bold leading-none text-white">{stats[key]}</p>
                    </div>
                  )}
                  <p className="text-xs text-white/50">{t(labelKey)}</p>
                </div>
              ))}
            </div>

            {/* Quota compact */}
            {!loading && (
              <div className={cn(
                'flex flex-1 items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-sm',
                isWarning ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 bg-white/5'
              )}>
                <div className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                  isWarning ? 'bg-red-500/20' : 'bg-emerald-500/20'
                )}>
                  {isWarning ? (
                    <CircleAlert className="h-4 w-4 text-red-400" />
                  ) : (
                    <Scissors className="h-4 w-4 text-emerald-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/50">{t('plans.monthlyClips')}</p>
                    <p className={cn('text-xs font-bold', isWarning ? 'text-red-400' : 'text-white')}>
                      {monthlyClipsUsed}/{clipsPerMonth}
                    </p>
                  </div>
                  {clipsPerMonth > 0 && (
                    <div className="mt-1.5 h-1.5 rounded-full bg-white/10">
                      <div
                        className={cn(
                          'h-1.5 rounded-full transition-all',
                          isFull
                            ? 'bg-red-600'
                            : isWarning
                              ? 'bg-red-500'
                              : 'bg-gradient-to-r from-orange-500 to-amber-500'
                        )}
                        style={{ width: `${Math.min(100, ratio * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                {userPlan === 'free' && (
                  <Link
                    href="/settings"
                    className="shrink-0 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-3 py-1.5 text-[10px] font-semibold text-white transition-transform hover:scale-105"
                  >
                    {t('plans.upgrade')}
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ═══ Quick Actions ═══ */}
        <div data-onboarding="quick-actions" className="animate-fade-in-up-2 grid gap-4 md:grid-cols-2">
          <Link
            href="/upload"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
          >
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/10" />

            <div className="relative flex items-start justify-between">
              <div>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <strong className="mb-1 block text-white">{t('dashboard.uploadVideo')}</strong>
                <span className="text-sm text-white/80">{t('dashboard.uploadVideoDesc')}</span>
              </div>
              <ArrowRight className="h-5 w-5 translate-x-0 text-white/0 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white/80" />
            </div>
          </Link>

          <Link
            href="/clips"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:border-orange-500/50 hover:shadow-xl"
          >
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />

            <div className="relative flex items-start justify-between">
              <div>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                  <Scissors className="h-6 w-6 text-orange-400" />
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <strong className="block text-white">{t('dashboard.myClips')}</strong>
                  {!loading && stats.readyClips > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {stats.readyClips}
                    </span>
                  )}
                </div>
                <span className="text-sm text-slate-400">{t('dashboard.myClipsDesc')}</span>
              </div>
              <ArrowRight className="h-5 w-5 translate-x-0 text-white/0 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white/60" />
            </div>
          </Link>
        </div>

        {/* ═══ Recent Videos ═══ */}
        <section className="animate-fade-in-up-3">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-gradient-to-b from-orange-500 to-amber-500" />
              <h2 className="text-xl font-semibold text-white">{t('dashboard.recentVideos')}</h2>
            </div>
            {videos.length > 0 && (
              <Link href="/videos" className="flex items-center gap-1 text-sm text-orange-400 transition-colors hover:text-orange-300">
                {t('common.seeAll')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {loading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="relative aspect-square bg-white/5">
                    <div className="skeleton-shimmer absolute inset-0" />
                    {/* Skeleton badge top-left */}
                    <div className="absolute left-1.5 top-1.5 h-4 w-12 rounded-full bg-white/10" />
                    {/* Skeleton duration bottom-right */}
                    <div className="absolute bottom-1.5 right-1.5 h-4 w-10 rounded-md bg-white/10" />
                  </div>
                  <div className="p-3">
                    <div className="mb-1.5 h-4 w-3/4 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && videos.length === 0 && (
            <EmptyState
              icon={Film}
              title={t('dashboard.noVideos')}
              description={t('dashboard.noVideosDesc')}
              actionLabel={t('dashboard.import')}
              actionHref="/upload"
              actionIcon={Upload}
              className="py-12"
            />
          )}

          {!loading && videos.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {videos.map((video) => (
                <Link
                  key={video.id}
                  href="/videos"
                  className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-500/30 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-orange-600/5"
                >
                  <div className="relative aspect-square overflow-hidden bg-white/5">
                    {video.status === 'processing' ? (
                      <div className="flex h-full w-full items-center justify-center bg-orange-500/10">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
                      </div>
                    ) : video.status === 'failed' ? (
                      <div className="flex h-full w-full items-center justify-center bg-red-500/10">
                        <CircleAlert className="h-8 w-8 text-red-400" />
                      </div>
                    ) : (
                      <VideoThumbnail storagePath={`${video.user_id}/thumbnails/${video.id}.jpg`} signedUrl={signedUrlMap[`${video.user_id}/thumbnails/${video.id}.jpg`]} className="h-full w-full" />
                    )}

                    <Badge
                      variant={video.status === 'ready' ? 'emerald' : video.status === 'processing' ? 'blue' : video.status === 'failed' ? 'red' : 'yellow'}
                      className="absolute left-1.5 top-1.5 px-2 py-0.5 text-[10px] backdrop-blur-sm"
                    >
                      {t(VIDEO_STATUS_KEYS[video.status])}
                    </Badge>

                    {video.duration_seconds && (
                      <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                        {formatTime(video.duration_seconds)}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5">
                    <p className="truncate text-sm font-medium text-white">{video.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ═══ Latest Clips ═══ */}
        <section className="animate-fade-in-up-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 rounded-full bg-gradient-to-b from-orange-500 to-amber-500" />
              <h2 className="text-xl font-semibold text-white">{t('dashboard.latestClips')}</h2>
            </div>
            {clips.length > 0 && (
              <Link href="/clips" className="flex items-center gap-1 text-sm text-orange-400 transition-colors hover:text-orange-300">
                {t('common.seeAll')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {loading && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="relative aspect-square bg-white/5">
                    <div className="skeleton-shimmer absolute inset-0" />
                    {/* Skeleton source badge top-left */}
                    <div className="absolute left-1.5 top-1.5 h-4 w-16 rounded-full bg-white/10" />
                    {/* Skeleton duration bottom-right */}
                    <div className="absolute bottom-1.5 right-1.5 h-4 w-10 rounded-md bg-white/10" />
                    {/* Skeleton virality bottom-left */}
                    <div className="absolute bottom-1.5 left-1.5 h-4 w-8 rounded-md bg-white/10" />
                  </div>
                  <div className="p-3">
                    <div className="mb-1.5 h-4 w-3/4 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && clips.length === 0 && (
            <EmptyState
              icon={Scissors}
              title={t('dashboard.noClips')}
              description={t('dashboard.noClipsDesc')}
              className="py-12"
            />
          )}

          {!loading && clips.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {clips.map((clip) => {
                const duration = clip.end_time_seconds - clip.start_time_seconds
                return (
                  <Link
                    key={clip.id}
                    href="/clips"
                    className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-500/30 hover:bg-white/[0.07] hover:shadow-lg hover:shadow-orange-600/5"
                  >
                    <div className="relative aspect-square overflow-hidden bg-white/5">
                      {clip.thumbnail_path ? (
                        <VideoThumbnail storagePath={clip.thumbnail_path} signedUrl={signedUrlMap[clip.thumbnail_path]} className="h-full w-full" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-orange-500/10">
                          <Scissors className="h-8 w-8 text-orange-400/40" />
                        </div>
                      )}

                      {clip.video?.title && (
                        <span className="absolute left-1.5 top-1.5 max-w-[calc(100%-12px)] truncate rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/70 backdrop-blur-sm">
                          {clip.video.title}
                        </span>
                      )}

                      <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                        {formatTime(duration)}
                      </span>

                      {clip.virality_score && (
                        <span className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded-md bg-orange-500/80 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                          <TrendingUp className="h-2.5 w-2.5" />
                          {clip.virality_score.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="p-2.5">
                      <p className="truncate text-sm font-medium text-white">{clip.title}</p>
                      {clip.hashtags.length > 0 && (
                        <p className="mt-1 truncate text-xs text-orange-300/60">
                          {clip.hashtags.slice(0, 3).map((t) => `#${t}`).join(' ')}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <OnboardingOverlay />
      </div>
    </>
  )
}
