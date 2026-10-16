import { SITE } from '../data/site';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>© {new Date().getFullYear()} {SITE.name} · {SITE.owner}</span>
        <span className="muted">{SITE.course} · {SITE.institute}</span>
      </div>
    </footer>
  );
}
