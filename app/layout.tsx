import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { StackProvider, StackTheme } from "@stackframe/stack"
import { stackServerApp } from "@/stack/server"
import { GlobalLoadingProvider } from "@/components/layout/global-loading-provider"
import { PageTransition } from "@/components/layout/page-transition"

export const metadata: Metadata = {
  title: "Kamrel - Gestion de Projet Simplifiée | KamTech",
  description:
    "Kamrel : Gérez vos projets, pas votre logiciel. Solution de gestion de projet intuitive pour les entreprises africaines.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="dark" suppressHydrationWarning>
        <StackProvider app={stackServerApp}>
          <StackTheme theme="dark">
            <GlobalLoadingProvider>
              <PageTransition>
                {children}
              </PageTransition>
            </GlobalLoadingProvider>
          </StackTheme>
        </StackProvider>
      </body>
    </html>
  )
}
