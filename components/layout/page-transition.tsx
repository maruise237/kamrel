"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { ReactNode, useEffect, useState } from "react"
import { KamrelLoader } from "@/components/ui/kamrel-loader"

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)

  useEffect(() => {
    setIsLoading(true)
    
    // Use requestAnimationFrame to ensure DOM is ready before state changes
    const animationFrame = requestAnimationFrame(() => {
      const timer = setTimeout(() => {
        setDisplayChildren(children)
        setIsLoading(false)
      }, 800)

      return () => clearTimeout(timer)
    })

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [pathname]) // Remove children from dependency array to prevent unnecessary re-renders

  return (
    <div className="relative min-h-screen">
      {/* Loading overlay - always in the same position in DOM tree */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <KamrelLoader size="lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content - always present in DOM tree */}
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
    </div>
  )
}