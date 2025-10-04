"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { ReactNode, useEffect, useState } from "react"
import { KamrelFullScreenLoader } from "@/components/ui/kamrel-loader"

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)

  useEffect(() => {
    setIsLoading(true)
    
    // Délai pour l'animation de chargement KAMREL
    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [pathname, children])

  if (isLoading) {
    return <KamrelFullScreenLoader />
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.3,
          ease: "easeInOut"
        }}
        className="min-h-screen"
      >
        {displayChildren}
      </motion.div>
    </AnimatePresence>
  )
}