export default function manifest() {
  return {
    name: 'GDG on Campus Trakya Üniversitesi',
    short_name: 'GDG Trakya',
    description:
      'Trakya Üniversitesi Google Developer Groups topluluğu: etkinlikler, hackathonlar ve eğitimler.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f7f4ec',
    theme_color: '#f7f4ec',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }]
  };
}
