import type { Metadata } from 'next'
import './globals.css'
import { NavigationMenu } from "@/components/ui/navigation-menu"
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CyberBot - SOC Analyst Platform',
  description: 'Advanced SOC analyst dashboard for real-time security monitoring',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <NavigationMenu />
        {children}
      </body>
    </html>
  )
}