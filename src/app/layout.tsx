import type { Metadata } from 'next'
import Script from 'next/script'
import { ThemeProvider } from '@/lib/theme-provider'
import { KeyboardShortcutsButton } from '@/components/keyboard-shortcuts-button'
import { KeyboardShortcutsProvider } from '@/lib/keyboard-shortcuts-context'
import { MoreMenu } from '@/components/more-menu'
import './globals.css'
import './debug.css'
import './x3dom.css'

export const metadata: Metadata = {
  title: '3D Icon Creator',
  description: '3D Icon Creator',
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
      </head>
      <body>
        <ThemeProvider>
          <KeyboardShortcutsProvider>
            <div className='flex h-screen'>
              <div className='ml-[25%] w-3/4 h-screen'>{children}</div>
              <div className='fixed top-4 right-4 z-50'>
                <MoreMenu />
              </div>
              <KeyboardShortcutsButton />
            </div>
          </KeyboardShortcutsProvider>
        </ThemeProvider>
        <Script src='/vendor/x3dom.js' strategy='beforeInteractive' />
      </body>
    </html>
  )
}
