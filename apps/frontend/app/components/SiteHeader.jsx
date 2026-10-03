import Link from 'next/link';

const links = [
  ['About', '/about'],
  ['Work', '/projects'],
  ['Journal', '/blog'],
  ['Contact', '/contact']
];

export default function SiteHeader({ name = 'Ava Lin Prusty' }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="wordmark" href="/" aria-label={`${name} home`}>
          <span className="wordmark-icon">A</span><span>{name}</span>
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <Link className="header-availability" href="/contact"><span /> Available for select work</Link>
      </div>
    </header>
  );
}