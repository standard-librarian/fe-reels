// PII scrubbing for Amplitude event properties.
//
// A key-name blocklist alone is NOT enough — it leaks phone numbers three ways:
// a drifted key the list doesn't know (`seller_contact`), a number embedded in a
// URL value (`wa.me/<digits>`), and nested objects. So this scrubs on TWO layers,
// recursively: (1) drop known-sensitive keys, and (2) redact phone/email-shaped
// *values* wherever they appear. The enrichment plugin runs this on every event,
// so it's the single choke point all properties pass through.

const SENSITIVE_KEYS = new Set([
  'phone', 'phonenumber', 'phonenumbers', 'additionalnumbers', 'mobile', 'tel',
  'sellerphone', 'sellerphonenumber', 'contactno', 'contactnumber', 'contact',
  'whatsapp', 'wa', 'email', 'emailaddress', 'civilid', 'nationalid', 'otp',
  'password', 'creditcard', 'cardnumber', 'bankaccount', 'iban',
])

const normalizeKey = (key: string): string => key.replace(/[\s_-]/g, '').toLowerCase()

/** True when a property key names something we must never send to Amplitude. */
export const isSensitiveKey = (key: string): boolean => SENSITIVE_KEYS.has(normalizeKey(key))

const REDACTED = '[redacted]'

// Value-level redaction. Deliberately conservative about bare digit runs so it
// never mangles a numeric ListingID: we only redact numbers that carry a clear
// *phone* signal — an international `+` prefix, a `wa.me`/`tel:`/`mailto:` URL,
// or space/dash-grouped digit blocks (how phone numbers, not IDs, are written).
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi
const CONTACT_URL_RE = /(?:https?:\/\/)?wa\.me\/\+?[\d\s()-]{5,}|tel:\+?[\d\s()-]{5,}|mailto:\S+|(?:whatsapp|fb-messenger|fb-messenger):\/\/\S*/gi
const INTL_PHONE_RE = /\+\d[\d\s()-]{6,}\d/g
const GROUPED_PHONE_RE = /\b\d{3,4}[\s-]\d{3,4}(?:[\s-]\d{2,4})?\b/g

const scrubString = (value: string): string =>
  value
    .replace(EMAIL_RE, REDACTED)
    .replace(CONTACT_URL_RE, REDACTED)
    .replace(INTL_PHONE_RE, REDACTED)
    .replace(GROUPED_PHONE_RE, REDACTED)

type Props = Record<string, unknown>

const isPlainObject = (value: unknown): value is Props =>
  !!value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype

const scrubValue = (value: unknown): unknown => {
  if (typeof value === 'string') return scrubString(value)
  if (Array.isArray(value)) return value.map(scrubValue)
  if (isPlainObject(value)) return sanitizeProperties(value)
  return value
}

/** Drop sensitive keys and redact PII-shaped values, recursively. */
export function sanitizeProperties(properties: Props | undefined): Props | undefined {
  if (!properties) return properties
  return Object.entries(properties).reduce<Props>((acc, [key, value]) => {
    if (!isSensitiveKey(key)) acc[key] = scrubValue(value)
    return acc
  }, {})
}
