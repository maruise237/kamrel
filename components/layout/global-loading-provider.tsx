"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { KamrelFullScreenLoader } from "@/components/ui/kamrel-loader"

interface GlobalLoadingContextType {
  isLoading: boolean
  setLoading: (loading: boolean) => void
  showLoader: (duration?: number) => void
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined)

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext)
  if (!context) {
    throw new Error("useGlobalLoading must be used within a GlobalLoadingProvider")
  }
  return context
}

interface GlobalLoadingProviderProps {
  children: ReactNode
}

export function GlobalLoadingProvider({ children }: GlobalLoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false)

  const setLoading = (loading: boolean) => {
    setIsLoading(loading)
  }

  const showLoader = (duration = 1000) => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, duration)
  }

  return (
    <GlobalLoadingContext.Provider value={{ isLoading, setLoading, showLoader }}>
      {isLoading && <KamrelFullScreenLoader />}
      {children}
    </GlobalLoadingContext.Provider>
  )
}