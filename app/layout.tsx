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
  metadataBase: new URL('https://vision-board-v2-ivory.vercel.app'),
  title: 'Vision Board — あなたの時間軸に、夢を貼ろう',
  description: '5つの時間軸でビジョンを可視化するタイムラインビジョンボード',
  openGraph: {
    title: 'Vision Board — あなたの時間軸に、夢を貼ろう',
    description: '5つの時間軸でビジョンを可視化するタイムラインビジョンボード',
    url: 'https://vision-board-v2-ivory.vercel.app',
    siteName: 'Vision Board',
    images: [{ url: '/ogp.png', width: 1330, height: 908 }],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vision Board — あなたの時間軸に、夢を貼ろう',
    description: '5つの時間軸でビジョンを可視化するタイムラインビジョンボード',
    images: ['/ogp.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${cormorant.variable} h-full`} suppressHydrationWarning>
      <body className="h-full">
        {children}
      </body>
    </html>
  )
}
