import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ReBASE 369 - 宿泊予約管理システム",
  description: "効率的な宿泊予約管理を実現するシステム",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
          <footer className="border-t py-6 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
              <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} ReBASE 369 予約システム</p>
              <p className="text-sm text-muted-foreground">Version 1.0.0</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
