import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { sendContact } from '../lib/contact.js'

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

export default function ContactForm() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | done | fallback
  const [error, setError] = useState('')

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const contactEmail = t('contact.info.email')

  const mailtoHref = () => {
    const subject = encodeURIComponent(form.subject || t('contact.form.title'))
    const body = encodeURIComponent(
      `${form.name}\n${form.email}\n\n${form.message}`,
    )
    return `mailto:${contactEmail}?subject=${subject}&body=${body}`
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError(t('contact.form.errName'))
    if (!isValidEmail(form.email)) return setError(t('contact.form.errEmail'))
    if (!form.message.trim()) return setError(t('contact.form.errMessage'))

    setStatus('sending')
    try {
      await sendContact({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      })
      setStatus('done')
    } catch (err) {
      // Backend saknas → erbjud mailto-fallback istället för ett hårt fel.
      if (err.message === 'contact-not-configured') {
        setStatus('fallback')
      } else {
        setStatus('idle')
        setError(t('contact.form.errFailed'))
      }
    }
  }

  if (status === 'done') {
    return <p className="form-success">{t('contact.form.success')}</p>
  }

  return (
    <form className="contact-form" onSubmit={submit} noValidate>
      <h2>{t('contact.form.title')}</h2>

      <label className="field">
        <span>{t('contact.form.name')}</span>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          autoComplete="name"
        />
      </label>
      <label className="field">
        <span>{t('contact.form.email')}</span>
        <input
          type="email"
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
          autoComplete="email"
        />
      </label>
      <label className="field">
        <span>{t('contact.form.subject')}</span>
        <input
          type="text"
          value={form.subject}
          onChange={(e) => set({ subject: e.target.value })}
        />
      </label>
      <label className="field">
        <span>{t('contact.form.message')}</span>
        <textarea
          rows={5}
          value={form.message}
          onChange={(e) => set({ message: e.target.value })}
        />
      </label>

      {error && <p className="form-error">{error}</p>}

      {status === 'fallback' ? (
        <p className="form-note">
          {t('contact.form.fallback')}{' '}
          <a href={mailtoHref()}>{contactEmail}</a>
        </p>
      ) : (
        <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? t('contact.form.sending') : t('contact.form.send')}
        </button>
      )}

      <p className="form-privacy">
        {t('contact.form.privacy')}{' '}
        <Link to="/datenschutz">{t('privacyPage.title')}</Link>
      </p>
    </form>
  )
}
