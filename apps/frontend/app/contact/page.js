import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import ContactForm from '../components/ContactForm';
import { getAbout } from '../../lib/api';

export const metadata = { title: 'Contact | Ava Lin Prusty', description: 'Start a conversation about your next project.' };

export default async function ContactPage() {
  const about = await getAbout();
  return <><SiteHeader name={about?.name} /><main><section className="inner-hero contact-hero"><p className="eyebrow">CONTACT / THE FIRST STEP</p><h1>Have a good<br /><em>one in mind?</em></h1><p>Share a little about what you are building. I’ll get back to you as soon as I can.</p></section><section className="section-wrap contact-layout"><div className="contact-aside"><p className="eyebrow">DIRECT LINE</p>{about?.email && <a href={`mailto:${about.email}`}>{about.email} ↗</a>}<p>{about?.location || 'Available worldwide'}</p><span>Usually replies within 2 business days.</span></div><ContactForm /></section></main><SiteFooter about={about} /></>;
}