'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export function SocialProof() {
  const { t } = useTranslation()

  const TESTIMONIALS = [
    {
      name: t('landing.socialProof.testimonial1Name'),
      handle: t('landing.socialProof.testimonial1Handle'),
      followers: t('landing.socialProof.testimonial1Followers'),
      quote: t('landing.socialProof.testimonial1Quote'),
      stats: [t('landing.socialProof.testimonial1Stat1'), t('landing.socialProof.testimonial1Stat2')],
    },
    {
      name: t('landing.socialProof.testimonial2Name'),
      handle: t('landing.socialProof.testimonial2Handle'),
      followers: t('landing.socialProof.testimonial2Followers'),
      quote: t('landing.socialProof.testimonial2Quote'),
      stats: [t('landing.socialProof.testimonial2Stat1'), t('landing.socialProof.testimonial2Stat2')],
    },
    {
      name: t('landing.socialProof.testimonial3Name'),
      handle: t('landing.socialProof.testimonial3Handle'),
      followers: t('landing.socialProof.testimonial3Followers'),
      quote: t('landing.socialProof.testimonial3Quote'),
      stats: [t('landing.socialProof.testimonial3Stat1'), t('landing.socialProof.testimonial3Stat2')],
    },
  ]

  const STATS = [
    { value: t('landing.socialProof.stat1Value'), label: t('landing.socialProof.stat1Label') },
    { value: t('landing.socialProof.stat2Value'), label: t('landing.socialProof.stat2Label') },
    { value: t('landing.socialProof.stat3Value'), label: t('landing.socialProof.stat3Label') },
    { value: t('landing.socialProof.stat4Value'), label: t('landing.socialProof.stat4Label') },
  ]

  return (
    <section className="bg-slate-950 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-16 text-center text-5xl font-bold text-white">
          {t('landing.socialProof.title')}
        </h2>

        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mb-16 grid gap-8 md:grid-cols-3"
        >
          {TESTIMONIALS.map((testimonial) => (
            <motion.div
              key={testimonial.name}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="mb-4 flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-orange-500 to-amber-500" />
                <div>
                  <strong className="block text-white">{testimonial.name}</strong>
                  <span className="text-sm text-slate-400">
                    {testimonial.handle} &middot; {testimonial.followers}
                  </span>
                </div>
              </div>

              <p className="mb-4 text-slate-300">&laquo; {testimonial.quote} &raquo;</p>

              <div className="flex gap-4 text-sm text-slate-400">
                {testimonial.stats.map((stat) => (
                  <span key={stat}>{stat}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mb-2 bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-4xl font-bold text-transparent">
                {stat.value}
              </div>
              <div className="text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
