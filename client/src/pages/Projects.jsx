import { useMemo, useState } from 'react';
import { PROJECTS, CATEGORIES } from '../data/projects';

export default function Projects() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROJECTS.filter(
      (p) =>
        (category === 'All' || p.category === category) &&
        (!q || p.title.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [category, query]);

  return (
    <>
      <header className="page-head">
        <h1>Projects</h1>
        <p className="muted">A few things I have built while learning full-stack development.</p>
      </header>

      <div className="toolbar">
        <div className="chips" role="tablist" aria-label="Filter by category">
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        <input className="search" type="search" placeholder="Search by name or tech..."
          value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search projects" />
      </div>

      {visible.length === 0 ? (
        <div className="empty card">
          <div className="empty-icon">🔎</div>
          <p>No projects match your search.</p>
        </div>
      ) : (
        <section className="grid grid-3">
          {visible.map((p) => (
            <article key={p.id} className="card project">
              <div className="project-top">
                <span className="project-emoji">{p.emoji}</span>
                <span className="badge badge-soft">{p.category}</span>
              </div>
              <h3>{p.title}</h3>
              <p className="muted">{p.description}</p>
              <div className="tag-row">
                {p.tags.map((t) => <span key={t} className="tag">{t}</span>)}
              </div>
              <a className="btn btn-ghost btn-sm" href={p.repo} target="_blank" rel="noopener noreferrer">
                View on GitHub ↗
              </a>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
