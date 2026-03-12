import { NextResponse } from 'next/server'
import Replicate from 'replicate'
import { createClient } from '@/lib/supabase/server'
import { parseSrt } from '@/lib/parseSrt'
import type { ProcessingJobInsert } from '@/types/database'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

export async function POST(request: Request) {
  let supabase
  try {
    supabase = await createClient()
  } catch (err) {
    console.error('[transcribe] Supabase client error:', err)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }

  // 1. Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    console.error('[transcribe] Auth error:', authError)
  }

  if (!user) {
    console.error('[transcribe] No user found — cookies may not be forwarded')
    return NextResponse.json(
      { error: 'Vous devez être connecté' },
      { status: 401 }
    )
  }

  // 2. Parse body
  let videoId: string
  try {
    const body = await request.json()
    videoId = body.videoId
  } catch {
    return NextResponse.json(
      { error: 'Corps de la requête invalide' },
      { status: 400 }
    )
  }

  if (!videoId) {
    return NextResponse.json(
      { error: 'Le paramètre videoId est requis' },
      { status: 400 }
    )
  }

  // 3. Récupérer la vidéo + vérifier ownership
  const { data: video, error: videoError } = await supabase
    .from('videos')
    .select('id, user_id, storage_path')
    .eq('id', videoId)
    .eq('user_id', user.id)
    .single()

  if (videoError || !video) {
    console.error('[transcribe] Video fetch error:', videoError, '| videoId:', videoId, '| userId:', user.id)
    return NextResponse.json(
      { error: 'Vidéo introuvable ou accès non autorisé' },
      { status: 404 }
    )
  }

  // 4. Obtenir signed URL depuis Supabase Storage
  const { data: signedUrl, error: urlError } = await supabase.storage
    .from('videos')
    .createSignedUrl(video.storage_path, 3600) // 1h

  if (urlError || !signedUrl) {
    console.error('[transcribe] Signed URL error:', urlError)
    return NextResponse.json(
      { error: 'Impossible de générer un lien vers le fichier vidéo' },
      { status: 500 }
    )
  }

  // 5. Créer job de tracking
  const jobInsert: ProcessingJobInsert = {
    user_id: user.id,
    video_id: video.id,
    clip_id: null,
    job_type: 'transcription',
    status: 'processing',
    progress_percent: 0,
    error_message: null,
    started_at: new Date().toISOString(),
    completed_at: null,
  }

  const { data: job, error: jobError } = await supabase
    .from('processing_jobs')
    .insert(jobInsert)
    .select('id')
    .single()

  if (jobError) {
    console.error('[transcribe] Job creation error:', jobError)
    return NextResponse.json(
      { error: 'Erreur lors de la création du job de transcription' },
      { status: 500 }
    )
  }

  // 6. Mettre la vidéo en status 'processing'
  await supabase
    .from('videos')
    .update({ status: 'processing' })
    .eq('id', video.id)

  try {
    // 7. Appeler Replicate Whisper
    const output = await replicate.run(
      'openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2',
      {
        input: {
          audio: signedUrl.signedUrl,
          model: 'large-v3',
          language: 'fr',
          transcription: 'srt',
        },
      }
    ) as { transcription?: string }

    const srtString = output?.transcription ?? ''

    if (!srtString) {
      throw new Error('Replicate n\'a retourné aucune transcription')
    }

    // 8. Parser SRT → segments
    const segments = parseSrt(srtString)
    const fullText = segments.map((s) => s.text).join(' ')

    // 9. Sauvegarder dans table transcriptions
    const { error: transcriptionError } = await supabase
      .from('transcriptions')
      .insert({
        video_id: video.id,
        full_text: fullText,
        segments,
        language: 'fr',
        confidence_score: null,
      })

    if (transcriptionError) {
      console.error('Transcription save error:', transcriptionError)
      throw new Error("Erreur lors de l'enregistrement de la transcription")
    }

    // 10. Update statuses → completed / ready
    await supabase
      .from('processing_jobs')
      .update({
        status: 'completed',
        progress_percent: 100,
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    await supabase
      .from('videos')
      .update({ status: 'ready' })
      .eq('id', video.id)

    return NextResponse.json({
      success: true,
      data: {
        fullText,
        segments,
        segmentCount: segments.length,
      },
    })
  } catch (error) {
    console.error('Transcription error:', error)

    // Marquer le job comme failed
    await supabase
      .from('processing_jobs')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Erreur inconnue',
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    // Marquer la vidéo comme failed
    await supabase
      .from('videos')
      .update({ status: 'failed' })
      .eq('id', video.id)

    return NextResponse.json(
      { error: 'Erreur lors de la transcription de la vidéo' },
      { status: 500 }
    )
  }
}
