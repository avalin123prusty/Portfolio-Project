import Link from 'next/link';

export default function SiteFooter({ about }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p>© {new Date().getFullYear()} {about?.name || 'Ava Lin Prusty'}. Built with intention.</p>
        <div className="footer-links">
          {about?.socialLinks?.github && <a href={about.socialLinks.github} target="_blank" rel="noreferrer">GitHub ↗</a>}
          {about?.socialLinks?.linkedin && <a href={about.socialLinks.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
          <Link href="/contact">Say hello ↗</Link>
        </div>
      </div>
    </footer>
  );
}