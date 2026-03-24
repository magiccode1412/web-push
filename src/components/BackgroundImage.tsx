import { useEffect, useState } from 'react'

interface BackgroundImageProps {
  imageUrl?: string
}

export function BackgroundImage({ imageUrl: propImageUrl }: BackgroundImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('')

  useEffect(() => {
    const storedBg = localStorage.getItem('background_image')
    const imageUrl = storedBg || propImageUrl || ''

    setCurrentImageUrl(imageUrl)

    if (!imageUrl) {
      setImageLoaded(false)
      return
    }

    const img = new Image()
    img.onload = () => setImageLoaded(true)
    img.onerror = () => setImageLoaded(false)
    img.src = imageUrl
  }, [propImageUrl])

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        background: currentImageUrl && imageLoaded
          ? `url(${currentImageUrl}) center/cover no-repeat`
          : 'transparent',
        opacity: currentImageUrl && imageLoaded ? '0.08' : '1',
      }}
    />
  )
}
