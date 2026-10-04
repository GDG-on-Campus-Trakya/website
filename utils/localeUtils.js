import { defaultLocale } from '@/i18n/locales';

export function getLocaleCode(locale) {
  return locale === 'en' ? 'en-US' : 'tr-TR';
}

const STATIC_LABEL_MAPS = {
  eventCategory: {
    Conference: ['Konferans'],
    Workshop: ['Workshop', 'Atölye'],
    Training: ['Eğitim'],
    Seminar: ['Seminer'],
    Meetup: ['Meetup', 'Buluşma'],
    Other: ['Diğer']
  },
  ticketStatus: {
    Open: ['Açık', 'open'],
    Closed: ['Kapalı', 'closed'],
    Reviewing: ['İnceleniyor', 'reviewing']
  },
  ticketCategory: {
    Complaint: ['Şikayet', 'complaint'],
    Suggestion: ['Öneri', 'suggestion'],
    Other: ['Diğer', 'other']
  },
  projectStatus: {
    Active: ['active', 'Aktif'],
    Completed: ['completed', 'Tamamlanmış'],
    Paused: ['paused', 'Duraklatıldı']
  },
  visibility: {
    Visible: ['Görünür', 'visible'],
    Hidden: ['Gizli', 'hidden']
  }
};

const ACADEMIC_TERM_MAP = [
  ['Üniversitesi', 'University'],
  ['Fakültesi', 'Faculty'],
  ['Meslek Yüksekokulu', 'Vocational School'],
  ['Yüksekokulu', 'School'],
  ['Uygulamalı Bilimler', 'Applied Sciences'],
  ['Bilimler', 'Sciences'],
  ['Bilimi', 'Science'],
  ['Mühendisliği', 'Engineering'],
  ['Mühendislik', 'Engineering'],
  ['Teknolojisi', 'Technology'],
  ['Teknolojileri', 'Technologies'],
  ['Programcılığı', 'Programming'],
  ['Yazılım Geliştirme', 'Software Development'],
  ['Bilgisayar', 'Computer'],
  ['Elektrik-Elektronik', 'Electrical-Electronics'],
  ['Elektrik', 'Electrical'],
  ['Elektronik', 'Electronics'],
  ['Makine', 'Mechanical'],
  ['Mimarlık', 'Architecture'],
  ['İç Mimarlık', 'Interior Architecture'],
  ['Peyzaj Mimarlığı', 'Landscape Architecture'],
  ['Hemşirelik', 'Nursing'],
  ['Tıp', 'Medicine'],
  ['Diş Hekimliği', 'Dentistry'],
  ['Eczacılık', 'Pharmacy'],
  ['İlahiyat', 'Theology'],
  ['İletişim', 'Communication'],
  ['Tasarımı', 'Design'],
  ['Tarih', 'History'],
  ['Sanat', 'Art'],
  ['Sosyal Bilimler', 'Social Sciences'],
  ['Teknik Bilimler', 'Technical Sciences'],
  ['Fen', 'Science'],
  ['Eğitim', 'Education'],
  ['Sağlık', 'Health'],
  ['Spor Bilimleri', 'Sports Sciences'],
  ['İktisadi ve İdari Bilimler', 'Economics and Administrative Sciences'],
  ['İşletme', 'Business Administration'],
  ['Matematik', 'Mathematics'],
  ['Fizik', 'Physics'],
  ['Kimya', 'Chemistry'],
  ['Biyoloji', 'Biology'],
  ['Turizm', 'Tourism'],
  ['Muhasebe', 'Accounting'],
  ['Maliye', 'Public Finance'],
  ['Lojistik', 'Logistics'],
  ['Pazarlama', 'Marketing'],
  ['Bankacılık', 'Banking'],
  ['Sigortacılık', 'Insurance'],
  ['Uluslararası', 'International'],
  ['İlişkiler', 'Relations'],
  ['Yönetimi', 'Management'],
  ['Yönetim', 'Management'],
  ['Sistemleri', 'Systems'],
  ['Reklamcılık', 'Advertising'],
  ['Öğretmenliği', 'Teaching'],
  ['Rehberlik ve Psikolojik Danışmanlık', 'Guidance and Psychological Counseling'],
  ['Çocuk Gelişimi', 'Child Development'],
  ['İlk ve Acil Yardım', 'First and Emergency Aid'],
  ['Acil Yardım ve Afet Yönetimi', 'Emergency Aid and Disaster Management'],
  ['Fizyoterapi ve Rehabilitasyon', 'Physiotherapy and Rehabilitation'],
  ['Beslenme ve Diyetetik', 'Nutrition and Dietetics'],
  ['Yönetim Bilişim Sistemleri', 'Management Information Systems'],
  ['İngilizce', 'English'],
  ['Almanca', 'German'],
  ['Türkçe', 'Turkish']
];

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

export function localizeAcademicValue(value, locale = defaultLocale) {
  if (!value || locale !== 'en') {
    return value ?? '';
  }

  let translated = value;
  for (const [trTerm, enTerm] of ACADEMIC_TERM_MAP) {
    translated = translated.replaceAll(trTerm, enTerm);
  }

  translated = translated
    .replaceAll('(', '(')
    .replaceAll(' )', ')')
    .replaceAll('  ', ' ');

  return normalizeWhitespace(translated);
}

export function getLocalizedStaticLabel(
  value,
  locale = defaultLocale,
  labelType = null
) {
  if (value == null || locale !== 'en') {
    return value ?? '';
  }

  if (labelType && STATIC_LABEL_MAPS[labelType]) {
    const entry = Object.entries(STATIC_LABEL_MAPS[labelType]).find(
      ([, variants]) => variants.includes(value)
    );

    if (entry) {
      return entry[0];
    }
  }

  return localizeAcademicValue(String(value), locale);
}

export function getLocalizedField(
  record,
  baseKey,
  locale = defaultLocale,
  options = {}
) {
  if (!record) return '';

  const localizedKey =
    locale === 'en' ? `${baseKey}En` : `${baseKey}${locale.toUpperCase()}`;
  const localizedValue = record[localizedKey];

  if (typeof localizedValue === 'string' && localizedValue.trim()) {
    return localizedValue;
  }

  const fallbackValue = record[baseKey] ?? '';

  if (options.translateFallback && typeof fallbackValue === 'string') {
    return getLocalizedStaticLabel(
      fallbackValue,
      locale,
      options.labelType ?? null
    );
  }

  return fallbackValue;
}

export function formatLocalizedDate(date, locale, options) {
  return new Intl.DateTimeFormat(getLocaleCode(locale), options).format(
    new Date(date)
  );
}

/**
 * Adds the year to date options when the date falls in another year than today, so an item
 * from last year never reads as this year's. Pass the same timeZone the date is shown in.
 */
export function withYearIfNotCurrent(date, options = {}) {
  const yearOf = (value) =>
    new Intl.DateTimeFormat("en", { timeZone: options.timeZone, year: "numeric" }).format(
      new Date(value)
    );
  return yearOf(date) === yearOf(Date.now()) ? options : { ...options, year: "numeric" };
}
