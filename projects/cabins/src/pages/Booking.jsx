import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { cabins, getCabin } from '../data/cabins.js'
import { bookingOptions } from '../data/options.js'
import { computeTotal, endDate, toISODate } from '../lib/pricing.js'
import { formatPrice, intlLocale } from '../lib/format.js'
import { startCheckout } from '../lib/checkout.js'
import Seo from '../components/Seo.jsx'

const WEEK_CHOICES = [1, 2, 3, 4]

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function Booking() {
  const { t, i18n } = useTranslation()
  const [params] = useSearchParams()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    cabinId: params.get('cabin') || '',
    startISO: '',
    weeks: 1,
    optionIds: [],
    name: '',
    email: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const cabin = getCabin(form.cabinId)

  const totals = useMemo(
    () =>
      computeTotal({
        pricePerWeek: cabin?.pricePerWeek || 0,
        weeks: form.weeks,
        optionIds: form.optionIds,
      }),
    [cabin, form.weeks, form.optionIds],
  )

  const end = endDate(form.startISO, form.weeks)
  const dateFmt = new Intl.DateTimeFormat(intlLocale(i18n.language), {
    dateStyle: 'medium',
  })
  const steps = t('booking.steps', { returnObjects: true })
  const stepLabels = Array.isArray(steps) ? steps : []

  const toggleOption = (id) =>
    set({
      optionIds: form.optionIds.includes(id)
        ? form.optionIds.filter((o) => o !== id)
        : [...form.optionIds, id],
    })

  const next = () => {
    setError('')
    if (step === 0) {
      if (!form.cabinId) return setError(t('booking.errors.cabin'))
      if (!form.startISO) return setError(t('booking.errors.start'))
    }
    setStep((s) => Math.min(s + 1, 2))
  }
  const back = () => {
    setError('')
    setStep((s) => Math.max(s - 1, 0))
  }

  const pay = async () => {
    setError('')
    if (!form.name.trim()) return setError(t('booking.errors.name'))
    if (!isValidEmail(form.email)) return setError(t('booking.errors.email'))

    setSubmitting(true)
    try {
      const { url } = await startCheckout({
        cabinId: form.cabinId,
        weeks: form.weeks,
        startDate: form.startISO,
        endDate: toISODate(end),
        optionIds: form.optionIds,
        guestName: form.name.trim(),
        guestEmail: form.email.trim(),
        locale: i18n.language,
        successUrl: `${window.location.origin}/booking/success`,
        cancelUrl: `${window.location.origin}/booking/cancelled`,
      })
      window.location.href = url
    } catch (err) {
      setSubmitting(false)
      setError(
        err.message === 'checkout-not-configured'
          ? t('booking.errors.notConfigured')
          : t('booking.errors.failed'),
      )
    }
  }

  return (
    <section className="container section booking">
      <Seo title={t('seo.booking.title')} description={t('seo.booking.description')} />
      <h1>{t('booking.title')}</h1>

      {/* Steg-indikator */}
      <ol className="stepper">
        {stepLabels.map((label, i) => (
          <li
            key={i}
            className={
              'stepper-item' +
              (i === step ? ' is-active' : '') +
              (i < step ? ' is-done' : '')
            }
          >
            <span className="stepper-num">{i + 1}</span>
            <span className="stepper-label">{label}</span>
          </li>
        ))}
      </ol>

      <div className="booking-grid">
        <div className="booking-form">
          {step === 0 && (
            <fieldset className="fieldset">
              <legend>{t('booking.step1.title')}</legend>

              <label className="field">
                <span>{t('booking.step1.cabin')}</span>
                <select
                  value={form.cabinId}
                  onChange={(e) => set({ cabinId: e.target.value })}
                >
                  <option value="">{t('booking.step1.chooseCabin')}</option>
                  {cabins.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {formatPrice(c.pricePerWeek, i18n.language)}{' '}
                      {t('booking.summary.perWeek')}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>{t('booking.step1.start')}</span>
                <input
                  type="date"
                  min={toISODate(new Date())}
                  value={form.startISO}
                  onChange={(e) => set({ startISO: e.target.value })}
                />
              </label>

              <label className="field">
                <span>{t('booking.step1.weeks')}</span>
                <select
                  value={form.weeks}
                  onChange={(e) => set({ weeks: Number(e.target.value) })}
                >
                  {WEEK_CHOICES.map((w) => (
                    <option key={w} value={w}>
                      {t('booking.weeks', { count: w })}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset className="fieldset">
              <legend>{t('booking.step2.title')}</legend>
              <p className="lead">{t('booking.step2.intro')}</p>
              <ul className="option-list">
                {bookingOptions.map((opt) => (
                  <li key={opt.id} className="option-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={form.optionIds.includes(opt.id)}
                        onChange={() => toggleOption(opt.id)}
                      />
                      <span className="option-name">{t(`options.${opt.id}`)}</span>
                      <span className="option-price">
                        {formatPrice(opt.price, i18n.language)}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset className="fieldset">
              <legend>{t('booking.step3.title')}</legend>
              <label className="field">
                <span>{t('booking.step3.name')}</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set({ name: e.target.value })}
                  autoComplete="name"
                />
              </label>
              <label className="field">
                <span>{t('booking.step3.email')}</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set({ email: e.target.value })}
                  autoComplete="email"
                />
              </label>
              <p className="pay-note">{t('booking.step3.payWith')}</p>
            </fieldset>
          )}

          {error && <p className="form-error">{error}</p>}

          <div className="booking-actions">
            {step > 0 && (
              <button type="button" className="btn btn-ghost" onClick={back}>
                {t('booking.back')}
              </button>
            )}
            {step < 2 ? (
              <button type="button" className="btn btn-primary" onClick={next}>
                {t('booking.next')}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={pay}
                disabled={submitting}
              >
                {t('booking.step3.pay')}
              </button>
            )}
          </div>
        </div>

        {/* Sammanfattning – en total genom hela flödet */}
        <aside className="booking-summary">
          <h2>{t('booking.summary.title')}</h2>
          <dl className="summary-list">
            <div>
              <dt>{t('booking.summary.cabin')}</dt>
              <dd>{cabin ? cabin.name : '—'}</dd>
            </div>
            <div>
              <dt>{t('booking.summary.period')}</dt>
              <dd>{t('booking.weeks', { count: form.weeks })}</dd>
            </div>
            <div>
              <dt>{t('booking.summary.arrival')}</dt>
              <dd>{form.startISO ? dateFmt.format(new Date(form.startISO)) : '—'}</dd>
            </div>
            <div>
              <dt>{t('booking.summary.departure')}</dt>
              <dd>{end ? dateFmt.format(end) : '—'}</dd>
            </div>
            <div>
              <dt>{t('booking.summary.extras')}</dt>
              <dd>
                {form.optionIds.length
                  ? form.optionIds.map((id) => t(`options.${id}`)).join(', ')
                  : t('booking.summary.none')}
              </dd>
            </div>
          </dl>

          <div className="summary-totals">
            <div className="summary-row">
              <span>{t('booking.summary.cabinTotal')}</span>
              <span>{formatPrice(totals.cabinTotal, i18n.language)}</span>
            </div>
            <div className="summary-row">
              <span>{t('booking.summary.optionsTotal')}</span>
              <span>{formatPrice(totals.optionsTotal, i18n.language)}</span>
            </div>
            <div className="summary-row summary-total">
              <span>{t('booking.summary.total')}</span>
              <span>{formatPrice(totals.total, i18n.language)}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
