import { useLocation } from 'react-router-dom'
import { CampusPhoto } from '../components/CampusPhoto'

export function HomePage() {
  const location = useLocation()
  const notice = (location.state as { notice?: string } | null)?.notice

  return (
    <section className="page">
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <CampusPhoto tall />
      <div className="narrow intro">
        <p className="eyebrow">Campus Customs</p>
        <h1>Home</h1>
        <p>
          Campus Customs was founded in 1975 when the Cobden family started a Yale University memorabilia retail
          store near the campus. Founded on exceptional customer service and ethical business practices, we strive to
          build long-lasting relationships with our clients, because that's what matters most.
        </p>
        <p>
          Our capabilities now include large-scale screen printing and embroidery, web store design and online
          fulfillment, graphic design, and complete event merchandise services. Our local production facility
          allows for quick processing times so we can serve you faster, with a personal touch. We can't promise
          every delivery will come with a slice of New Haven Pizza, but it sure might feel like it.
        </p>
        <p>-The Cobden Brothers</p>
      </div>
    </section>
  )
}
