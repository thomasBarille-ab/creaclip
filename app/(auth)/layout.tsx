import Link from 'next/link'

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 px-4">
      {/* Logo */}
      <Link href="/" className="mb-10">
        <span className="text-3xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Crea
          </span>
          <span className="text-white">Clip</span>
        </span>
      </Link>

      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
