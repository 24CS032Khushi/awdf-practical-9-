import { useId } from 'react';

// Reusable labelled input/textarea with inline error + hint
export default function Field({ label, error, hint, as: Tag = 'input', ...props }) {
  const id = useId();
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <Tag id={id} aria-invalid={Boolean(error)} {...props} />
      {error ? <span className="field-error" role="alert">{error}</span>
        : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}
