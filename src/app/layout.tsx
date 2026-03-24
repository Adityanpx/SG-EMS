import type { Metadata } from 'next'
import { Inter, DM_Sans, Sora } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/context/ThemeContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
})

export const metadata: Metadata = {
  title: 'SG Infinity — Employee Management',
  description: 'Internal Employee Management System for SG Infinity',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${dmSans.variable} ${sora.variable} font-sans bg-white dark:bg-[#0f0f1a] text-slate-900 dark:text-slate-100 antialiased transition-colors duration-300`}>
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(30, 27, 75, 0.95)',
                color: '#e2e8f0',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '12px',
                backdropFilter: 'blur(12px)',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#6366f1', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#f43f5e', secondary: '#fff' },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
