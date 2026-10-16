export default function PageLoader({ label = 'Loading page...' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="spinner" />
      <p>{label}</p>
      <div className="skeleton-stack" aria-hidden="true">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
      </div>
    </div>
  );
}
