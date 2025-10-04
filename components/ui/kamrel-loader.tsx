"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface KamrelLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
  text?: string
}

export function KamrelLoader({ 
  size = 'md', 
  className, 
  showText = true, 
  text = "KAMREL" 
}: KamrelLoaderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-4", className)}>
      {/* Animated Logo/Icon */}
      <div className="relative">
        <div className={cn(
          "relative rounded-full border-4 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-spin",
          sizeClasses[size]
        )}>
          <div className="absolute inset-1 rounded-full bg-background"></div>
        </div>
        
        {/* Inner pulsing dot */}
        <div className={cn(
          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse",
          size === 'sm' ? 'w-2 h-2' : 
          size === 'md' ? 'w-3 h-3' : 
          size === 'lg' ? 'w-4 h-4' : 'w-6 h-6'
        )}></div>
      </div>

      {/* Animated Text */}
      {showText && (
        <div className="flex items-center space-x-1">
          {text.split('').map((letter, index) => (
            <span
              key={index}
              className={cn(
                "font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse",
                textSizeClasses[size]
              )}
              style={{
                animationDelay: `${index * 0.1}s`,
                animationDuration: '1.5s'
              }}
            >
              {letter}
            </span>
          ))}
        </div>
      )}

      {/* Loading dots */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-bounce"
            style={{
              animationDelay: `${index * 0.2}s`,
              animationDuration: '1s'
            }}
          ></div>
        ))}
      </div>
    </div>
  )
}

// Full screen loader overlay
export function KamrelFullScreenLoader({ 
  isLoading, 
  text = "Chargement en cours...",
  subText = "Veuillez patienter"
}: {
  isLoading: boolean
  text?: string
  subText?: string
}) {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-6 p-8 rounded-lg bg-card border shadow-lg">
        <KamrelLoader size="lg" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{text}</h3>
          <p className="text-sm text-muted-foreground">{subText}</p>
        </div>
      </div>
    </div>
  )
}

// Skeleton loader for content
export function KamrelSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} />
  )
}

// Card skeleton
export function KamrelCardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-4">
      <KamrelSkeleton className="h-4 w-3/4" />
      <KamrelSkeleton className="h-4 w-1/2" />
      <KamrelSkeleton className="h-20 w-full" />
      <div className="flex space-x-2">
        <KamrelSkeleton className="h-8 w-16" />
        <KamrelSkeleton className="h-8 w-16" />
      </div>
    </div>
  )
}

// List skeleton
export function KamrelListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
          <KamrelSkeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <KamrelSkeleton className="h-4 w-3/4" />
            <KamrelSkeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}