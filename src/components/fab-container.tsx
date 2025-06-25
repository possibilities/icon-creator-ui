'use client'

import { useState, useEffect, useRef } from 'react'
import { Image as ImageIcon, Video } from 'lucide-react'
import { cn } from '@/lib/utils'

type AnimationState = 'hidden' | 'entering' | 'active' | 'exiting'

interface FabContainerProps {
  mode: string
  onDownloadClick: () => void
  onAnimationSaveClick: () => void
}

export function FabContainer({
  mode,
  onDownloadClick,
  onAnimationSaveClick,
}: FabContainerProps) {
  const [downloadState, setDownloadState] = useState<AnimationState>('hidden')
  const [animationState, setAnimationState] = useState<AnimationState>('hidden')

  const prevModeRef = useRef<string | null>(null)

  useEffect(() => {
    if (prevModeRef.current === null) {
      prevModeRef.current = mode
      if (mode === 'scene') {
        setDownloadState('entering')
        setTimeout(() => setDownloadState('active'), 300)
      } else if (mode === 'motion') {
        setAnimationState('entering')
        setTimeout(() => setAnimationState('active'), 300)
      }
      return
    }

    if (prevModeRef.current === mode) return
    prevModeRef.current = mode

    if (mode === 'scene') {
      if (animationState === 'active') {
        setAnimationState('exiting')
        setTimeout(() => {
          setAnimationState('hidden')
          setTimeout(() => {
            setDownloadState('entering')
            setTimeout(() => setDownloadState('active'), 300)
          }, 100)
        }, 300)
      } else {
        setDownloadState('entering')
        setTimeout(() => setDownloadState('active'), 300)
      }
    } else if (mode === 'motion') {
      if (downloadState === 'active') {
        setDownloadState('exiting')
        setTimeout(() => {
          setDownloadState('hidden')
          setTimeout(() => {
            setAnimationState('entering')
            setTimeout(() => setAnimationState('active'), 300)
          }, 100)
        }, 300)
      } else {
        setAnimationState('entering')
        setTimeout(() => setAnimationState('active'), 300)
      }
    }
  }, [mode, animationState, downloadState])

  const fabClasses = cn(
    'group relative inline-flex items-center gap-3 px-5 py-3 rounded-full',
    'border-2 border-primary/50 bg-background/80 backdrop-blur-sm',
    'shadow-lg shadow-black/5',
    'transition-all duration-300 ease-out',
    'hover:scale-105 hover:border-primary hover:bg-primary/10',
    'hover:shadow-xl hover:shadow-primary/20',
    'active:scale-95',
    'whitespace-nowrap',
  )

  const getAnimationClass = (state: AnimationState) => {
    switch (state) {
      case 'entering':
        return 'animate-fab-grow-in'
      case 'active':
        return 'animate-none opacity-100 scale-100 translate-y-0'
      case 'exiting':
        return 'animate-fab-shrink-out opacity-100'
      case 'hidden':
        return 'opacity-0 scale-0 translate-y-2 pointer-events-none'
    }
  }

  return (
    <div className='fixed bottom-6 right-6 z-20'>
      {downloadState !== 'hidden' && (
        <button
          onClick={onDownloadClick}
          className={cn(fabClasses, 'flex', getAnimationClass(downloadState))}
          aria-label='Save icon'
          disabled={downloadState === 'exiting'}
        >
          <ImageIcon
            className='h-5 w-5 text-primary transition-transform duration-300 group-hover:-translate-y-0.5 flex-shrink-0'
            aria-hidden='true'
          />
          <span className='text-sm font-medium text-foreground'>
            Save Icons
          </span>
        </button>
      )}

      {animationState !== 'hidden' && (
        <button
          onClick={onAnimationSaveClick}
          className={cn(fabClasses, 'flex', getAnimationClass(animationState))}
          aria-label='Save animation'
          disabled={animationState === 'exiting'}
        >
          <Video className='h-5 w-5 text-primary transition-transform duration-300 group-hover:-translate-y-0.5 flex-shrink-0' />
          <span className='text-sm font-medium text-foreground'>
            Save Animation
          </span>
        </button>
      )}
    </div>
  )
}
