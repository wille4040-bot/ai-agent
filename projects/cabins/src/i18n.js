import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import de from './locales/de.json'
import sv from './locales/sv.json'
import en from './locales/en.json'

// Tillgängliga språk. Tyska är standard.
export const LANGUAGES = [
  { code: 'de', label: 'DE' },
  { code: 'sv', label: 'SV' },
  { code: 'en', label: 'EN' },
]

const STORAGE_KEY = 'cabins.lang'

function getInitialLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && LANGUAGES.some((l) => l.code === stored)) return stored
  } catch {
    // localStorage kan saknas (privat läge m.m.) – falla tillbaka på standard.
  }
  return 'de'
}

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    sv: { translation: sv },
    en: { translation: en },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
})

// Persistera valt språk och håll <html lang> uppdaterat.
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    // Ignorera om lagring inte är tillgänglig.
  }
  document.documentElement.lang = lng
})

document.documentElement.lang = i18n.language

export default i18n
