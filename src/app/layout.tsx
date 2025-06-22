import type { Metadata } from 'next'
import Script from 'next/script'
import { ThemeProvider } from '@/lib/theme-provider'
import ThemeSwitcher from '@/components/theme-switcher'
import './globals.css'
import './debug.css'

export const metadata: Metadata = {
  title: 'Icon Creator',
  description: 'Icon Creator',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        {/* See: https://chatgpt.com/c/681ca606-b550-8001-88c7-84fe99e7dcaf */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href='https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=optional'
          rel='stylesheet'
        />
        <link rel='stylesheet' href='/vendor/x3dom.css' />
      </head>
      <body>
        <ThemeProvider>
          <ThemeSwitcher />
          <div className='flex h-screen'>
            <div className='ml-[25%] w-3/4 h-screen'>{children}</div>
          </div>
        </ThemeProvider>
        <Script src='/vendor/x3dom.js' strategy='beforeInteractive' />
      </body>
    </html>
  )
}
