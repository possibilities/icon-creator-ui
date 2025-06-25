'use client'

import { useParams } from 'next/navigation'
import { FabContainer } from '@/components/fab-container'
import { SaveIconsModal } from '@/components/save-icons-modal'
import { SaveAnimationModal } from '@/components/save-animation-modal'
import { useState } from 'react'

export default function ShapeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const mode = params.mode as string
  const shapeName = params.shape as string

  const [isIconsModalOpen, setIsIconsModalOpen] = useState(false)
  const [isAnimationModalOpen, setIsAnimationModalOpen] = useState(false)

  const handleDownloadClick = () => {
    setIsIconsModalOpen(true)
  }

  const handleAnimationSaveClick = () => {
    setIsAnimationModalOpen(true)
  }

  return (
    <>
      {children}

      {mode && (
        <FabContainer
          mode={mode}
          onDownloadClick={handleDownloadClick}
          onAnimationSaveClick={handleAnimationSaveClick}
        />
      )}

      <SaveIconsModal
        isOpen={isIconsModalOpen}
        onClose={() => setIsIconsModalOpen(false)}
        shapeName={shapeName}
      />

      <SaveAnimationModal
        isOpen={isAnimationModalOpen}
        onClose={() => setIsAnimationModalOpen(false)}
        shapeName={shapeName}
      />
    </>
  )
}
