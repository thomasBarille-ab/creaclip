'use client'

import { useState } from 'react'
import { Button, Input } from '@/components/ui'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function handleSendTest() {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Erreur réseau' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-white">Test Email</h1>

        <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
          <div>
            <label className="mb-2 block text-sm text-white/70">
              Votre Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/70">
              Votre Nom
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <Button
            onClick={handleSendTest}
            loading={loading}
            disabled={!email}
            className="w-full"
          >
            Envoyer Email de Test
          </Button>

          {result && (
            <div
              className={`rounded-lg p-4 ${
                result.success
                  ? 'bg-green-500/10 text-green-300'
                  : 'bg-red-500/10 text-red-300'
              }`}
            >
              <pre className="text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-3 text-lg font-semibold text-white">
            Instructions
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-white/70">
            <li>Entrez votre email</li>
            <li>Cliquez "Envoyer"</li>
            <li>Vérifiez votre boîte mail</li>
            <li>Vous devriez recevoir l'email de bienvenue CreaClip</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
