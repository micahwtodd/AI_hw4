import { CampusPhoto } from '../components/CampusPhoto'

export function AboutPage() {
  return (
    <section className="page narrow">
      <CampusPhoto />
      <p className="eyebrow">Campus Customs</p>
      <h1>About Us</h1>
      <p>
        Campus Customs is a screen printing and embroidery company offering bespoke solutions and a broad
        range of promotional apparel for companies, institutions, clubs, teams, and events.
      </p>
      <p>Most of our items are locally sourced in New Haven, CT, surrounded by delicious pizza restaurants.</p>
      <p>We serve clients of all sizes and can meet your needs at any scale.</p>
      <p>Please call us to learn more about efficient and affordable solutions to promote your brand.</p>
    </section>
  )
}
