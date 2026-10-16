import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="empty card not-found">
      <div className="big-404">404</div>
      <h2>Page not found</h2>
      <p className="muted">The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn-primary">Back to home</Link>
    </section>
  );
}
