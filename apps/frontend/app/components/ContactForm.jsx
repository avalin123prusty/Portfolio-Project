'use client';

import { useState } from 'react';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function ContactForm() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setStatus('');
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Message could not be sent.');
      formElement.reset();
      setStatus('Message received. I’ll be in touch soon.');
    } catch (error) {
      setStatus(error.message || 'The service is unavailable. Please try again later.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="contact-form-row">
        <label>Your name<input name="name" autoComplete="name" minLength="2" maxLength="120" required /></label>
        <label>Email address<input name="email" type="email" autoComplete="email" maxLength="254" required /></label>
      </div>
      <label>What are you working on?<textarea name="message" rows="6" minLength="10" maxLength="5000" required /></label>
      <div className="contact-submit-row"><button type="submit" className="button button-dark" disabled={busy}>{busy ? 'Sending…' : 'Send message'} <span aria-hidden="true">↗</span></button><p role="status" aria-live="polite">{status}</p></div>
    </form>
  );
}