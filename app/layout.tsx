import type { Metadata } from 'next'
import { Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Vision Board — あなたの時間軸に、夢を貼ろう',
  description: '5つの時間軸でビジョンを可視化するタイムラインビジョンボード',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${cormorant.variable} h-full`}>
      <body className="h-full">
        {children}
      </body>
    </html>
  )
}
