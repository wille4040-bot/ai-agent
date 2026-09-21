import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

// Sätter <title>, meta-description, Open Graph och canonical per sida.
// Ingen extra dependency – uppdaterar document.head direkt.
function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export default function Seo({ title, description }) {
  const { t } = useTranslation()
  const siteName = t('site.name')

  useEffect(() => {
    const full = title ? `${title} · ${siteName}` : siteName
    document.title = full
    if (description) upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:site_name', siteName)
    upsertMeta('property', 'og:title', full)
    if (description) upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', 'website')

    const url = window.location.origin + window.location.pathname
    upsertMeta('property', 'og:url', url)
    upsertLink('canonical', url)
  }, [title, description, siteName])

  return null
}
