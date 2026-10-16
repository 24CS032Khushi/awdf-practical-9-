import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SITE } from '../data/site';

const FEATURES = [
  { icon: '🔐', title: 'Secure by design', text: 'Passwords hashed with bcrypt and sessions protected with expiring JWT tokens.' },
  { icon: '⚡', title: 'Fast loading', text: 'Route-based code splitting with React.lazy() — pages download only when you visit them.' },
  { icon: '📊', title: 'Smart analytics', text: 'Charts for your task progress, loaded only when you open the analytics panel.' },
  { icon: '🛡️', title: 'Validated input', text: 'Every request is checked on the server before it ever reaches the database.' },
];

const STACK = ['React 18', 'Vite', 'React Router', 'Node.js', 'Express', 'MongoDB', 'JWT', 'bcrypt'];

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <section className="hero">
        <span className="pill">🎓 {SITE.course}</span>
        <h1>
          {SITE.tagline.split('.')[0]}. <span className="gradient-text">Finish it.</span>
        </h1>
        <p className="hero-sub">
          {SITE.name} is a full-stack task manager built with React, Express and MongoDB —
          optimised with code splitting and lazy loading.
        </p>
        <div className="hero-cta">
          {user ? (
            <Link to="/tasks" className="btn btn-primary btn-lg">Open my tasks →</Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">Get started free</Link>
              <Link to="/login" className="btn btn-ghost btn-lg">I have an account</Link>
            </>
          )}
        </div>
      </section>

      <section className="grid grid-4">
        {FEATURES.map((f) => (
          <article key={f.title} className="card feature">
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p className="muted">{f.text}</p>
          </article>
        ))}
      </section>

      <section className="card stack-card">
        <h2>Built with</h2>
        <div className="tag-row">
          {STACK.map((s) => <span key={s} className="tag">{s}</span>)}
        </div>
      </section>
    </>
  );
}
