import { useState } from 'react';
import Field from '../components/Field';
import { useToast } from '../context/ToastContext';
import { SITE } from '../data/site';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(f) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Please enter your name';
  if (!EMAIL_REGEX.test(f.email.trim())) e.email = 'Enter a valid email address';
  if (f.message.trim().length < 10) e.message = 'Message must be at least 10 characters';
  return e;
}

export default function Contact() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSending(true);
    // Demo only: there is no contact endpoint in the backend, so we simulate sending.
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    toast.success('Thanks! Your message has been sent.');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <>
      <header className="page-head">
        <h1>Contact</h1>
        <p className="muted">Questions, feedback or ideas? Send a message.</p>
      </header>

      <section className="contact-layout">
        <form className="card form-card" onSubmit={onSubmit} noValidate>
          <Field label="Your name" name="name" value={form.name} onChange={onChange}
            error={errors.name} placeholder="Jane Doe" autoComplete="name" />
          <Field label="Email" name="email" type="email" value={form.email} onChange={onChange}
            error={errors.email} placeholder="you@example.com" autoComplete="email" />
          <Field as="textarea" rows={5} label="Message" name="message" value={form.message}
            onChange={onChange} error={errors.message} maxLength={500}
            hint={`${form.message.length}/500`} placeholder="Write your message..." />
          <button className="btn btn-primary" type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Send message'}
          </button>
        </form>

        <aside className="card info-card">
          <h3>Get in touch</h3>
          <ul className="info-list">
            <li><span>📧</span><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
            <li><span>💻</span><a href={SITE.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><span>💼</span><a href={SITE.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            <li><span>🎓</span><span>{SITE.institute}</span></li>
          </ul>
        </aside>
      </section>
    </>
  );
}
