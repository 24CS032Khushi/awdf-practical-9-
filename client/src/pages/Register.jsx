import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Field from '../components/Field';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Register() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/tasks" replace />;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!EMAIL_REGEX.test(form.email.trim())) found.email = 'Enter a valid email address';
    if (form.password.length < 6) found.password = 'Password must be at least 6 characters';
    else if (form.password.length > 72) found.password = 'Password must be at most 72 characters';
    if (form.confirm !== form.password) found.confirm = 'Passwords do not match';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      toast.success('Account created! Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-wrap">
      <form className="card auth-card" onSubmit={onSubmit} noValidate>
        <div className="auth-icon">🚀</div>
        <h1>Create your account</h1>
        <p className="muted">It only takes a few seconds.</p>
        <Field label="Name (optional)" name="name" value={form.name} onChange={onChange}
          placeholder="Jane Doe" autoComplete="name" />
        <Field label="Email" name="email" type="email" value={form.email} onChange={onChange}
          error={errors.email} placeholder="you@example.com" autoComplete="email" />
        <Field label="Password" name="password" type="password" value={form.password} onChange={onChange}
          error={errors.password} hint="At least 6 characters" autoComplete="new-password" />
        <Field label="Confirm password" name="confirm" type="password" value={form.confirm} onChange={onChange}
          error={errors.confirm} autoComplete="new-password" />
        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Sign up'}
        </button>
        <p className="auth-foot">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </section>
  );
}
