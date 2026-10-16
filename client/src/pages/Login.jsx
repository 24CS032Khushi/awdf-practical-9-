import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import Field from '../components/Field';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/tasks';
  if (user) return <Navigate to={from} replace />;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!EMAIL_REGEX.test(form.email.trim())) found.email = 'Enter a valid email address';
    if (!form.password) found.password = 'Password is required';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back!');
      // <Navigate> above redirects automatically once `user` is set
    } catch (err) {
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-wrap">
      <form className="card auth-card" onSubmit={onSubmit} noValidate>
        <div className="auth-icon">🔐</div>
        <h1>Welcome back</h1>
        <p className="muted">Log in to manage your tasks.</p>
        <Field label="Email" name="email" type="email" value={form.email} onChange={onChange}
          error={errors.email} placeholder="you@example.com" autoComplete="email" />
        <Field label="Password" name="password" type="password" value={form.password} onChange={onChange}
          error={errors.password} placeholder="Your password" autoComplete="current-password" />
        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
        <p className="auth-foot">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </section>
  );
}
