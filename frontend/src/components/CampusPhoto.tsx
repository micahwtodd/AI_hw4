import { useEffect, useState } from 'react'

type CampusPhotoProps = {
  tall?: boolean
}

const SCENES = [
  {
    src: '/campus/old-campus-autumn.jpg',
    place: 'Old Campus',
    credit: 'Francisco Anzola, CC BY 2.0',
    href: 'https://commons.wikimedia.org/wiki/File:Yale_Campus_Green_(4138541531).jpg',
  },
  {
    src: '/campus/harkness-tower.jpg',
    place: 'Harkness Tower',
    credit: 'public domain, via Wikimedia Commons',
    href: 'https://commons.wikimedia.org/wiki/File:Yale_Harkness_Tower_2.JPG',
  },
  {
    src: '/campus/sterling.jpg',
    place: 'Sterling Memorial Library',
    credit: 'Adam Jones, CC BY-SA 2.0',
    href: 'https://commons.wikimedia.org/wiki/File:Facade_of_Sterling_Memorial_Library_-_Yale_University_-_New_Haven_-_CT_-_USA_(7088650351).jpg',
  },
  {
    src: '/campus/beinecke.jpg',
    place: 'Beinecke Library',
    credit: 'Ragesoss, public domain',
    href: 'https://commons.wikimedia.org/wiki/File:Yale_Beinecke_Library.JPG',
  },
]

export function CampusPhoto({ tall = false }: CampusPhotoProps) {
  const [index, setIndex] = useState(0)
  const scene = SCENES[index]

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SCENES.length)
    }, 7000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <figure className={tall ? 'campus-photo tall' : 'campus-photo'}>
      <img key={scene.src} src={scene.src} alt="" />
      <figcaption>
        {scene.place}. <a href={scene.href}>{scene.credit}</a>.
      </figcaption>
    </figure>
  )
}
