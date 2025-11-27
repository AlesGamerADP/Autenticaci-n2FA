import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Llave - Autenticación con 2FA',
  description: 'Sistema de autenticación con autenticación de dos factores',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}

