// Kartlägg i18n-språkkod till en Intl-locale för tal- och prisformatering.
const localeMap = {
  de: 'de-DE',
  sv: 'sv-SE',
  en: 'en-GB',
}

export function intlLocale(lang) {
  return localeMap[lang] || 'de-DE'
}

// Formatera EUR-pris utan decimaler, t.ex. "1.200 €" (de) / "€1,200" (en).
export function formatPrice(amount, lang) {
  return new Intl.NumberFormat(intlLocale(lang), {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}
