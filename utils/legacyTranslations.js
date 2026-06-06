import { defaultLocale } from '@/i18n/locales';

const EXACT_TRANSLATIONS = {
  'Yükleniyor...': 'Loading...',
  'Loading...': 'Loading...',
  'Giriş yapmanız gerekiyor...': 'You need to sign in...',
  'Giriş yapmalısınız!': 'You need to sign in!',
  'Bu sayfaya erişim için giriş yapmanız gerekiyor':
    'You need to sign in to access this page.',
  'Erişim Reddedildi': 'Access Denied',
  'Admin Panel': 'Admin Panel',
  'Admin Paneli': 'Admin Panel',
  'Admin Paneline Dön': 'Back to Admin Panel',
  'Admin Paneline Geri Dön': 'Back to Admin Panel',
  'Quiz Yönetimine Dön': 'Back to Quiz Management',
  'Quiz Yönetimi': 'Quiz Management',
  'Oyun Geçmişi': 'Game History',
  'Dosya Yükleme': 'File Upload',
  'İptal': 'Cancel',
  'Kaydet': 'Save',
  'Kaydediliyor...': 'Saving...',
  'Düzenle': 'Edit',
  'Güncelle': 'Update',
  'Sil': 'Delete',
  'Oluştur': 'Create',
  'Kaldır': 'Remove',
  'Aç': 'Open',
  'İndir': 'Download',
  'Gönder': 'Send',
  'Gönderiliyor...': 'Sending...',
  'Paylaş': 'Share',
  'Paylaşılıyor...': 'Sharing...',
  'Yeni Post': 'New Post',
  'Sosyal Medya': 'Social',
  'Etkinlik Fotoğrafları': 'Event Photos',
  'Çekiliş Sonuçları': 'Raffle Results',
  'Filtre:': 'Filter:',
  'Henüz çekiliş sonucu yok': 'No raffle results yet',
  'Daha Fazla Yükle': 'Load More',
  'Henüz bilet bulunmuyor': 'No tickets yet',
  'Yeni Bilet Oluştur': 'Create New Ticket',
  'Formu Gizle': 'Hide Form',
  'Bilet Gönder': 'Send Ticket',
  'Dosyalar Yükleniyor...': 'Uploading Files...',
  'Gönderiliyor...': 'Sending...',
  'Bileti Yeniden Aç': 'Reopen Ticket',
  'Yeniden Aç': 'Reopen',
  'Açılıyor...': 'Reopening...',
  'Mesaj İçeriği': 'Message Content',
  'Yanıt yazın...': 'Write a reply...',
  'Yanıt': 'Reply',
  'Yorumlar yüklenirken hata oluştu!': 'Failed to load comments!',
  'Beğeni işlemi başarısız!': 'Like action failed!',
  'Yorum eklendi!': 'Comment added!',
  'Yorum eklenirken hata oluştu!': 'Failed to add comment!',
  'Post başarıyla silindi!': 'Post deleted successfully!',
  'Yorum başarıyla silindi!': 'Comment deleted successfully!',
  'Yorum silinirken hata oluştu!': 'Failed to delete comment!',
  'İşlem başarısız!': 'Action failed!',
  'Şu anda fotoğraf paylaşabileceğiniz aktif etkinlik yok.':
    'There are no active events available for photo sharing right now.',
  'Etkinlik Seçimi *': 'Event Selection *',
  'Etkinlik seçin': 'Select an event',
  'Açıklama (İsteğe Bağlı)': 'Description (Optional)',
  'Postunuz hakkında bir şeyler yazın...': 'Write something about your post...',
  'Resim seç veya sürükle': 'Select or drag an image',
  'JPG, PNG, HEIC (Max 10MB - Otomatik sıkıştırılır)':
    'JPG, PNG, HEIC (Max 10MB - Automatically compressed)',
  'Duyuru Bilgileri': 'Announcement Details',
  'Yazar': 'Author',
  'Yayınlanma': 'Published',
  'Güncellenme': 'Updated',
  'Paylaş': 'Share',
  'Son Duyurular': 'Recent Announcements',
  'Test yükleniyor...': 'Loading test...',
  'Testler yükleniyor...': 'Loading tests...',
  'Test bulunamadı': 'Test not found',
  'Testlere Dön': 'Back to Tests',
  'Sonucun Hazır!': 'Your Result Is Ready!',
  'Testi Tekrar Çöz': 'Retake the Test',
  'Diğer Testlere Bak': 'Browse Other Tests',
  'Kişilik Testleri': 'Personality Tests',
  'Hangi teste katılmak istersin?': 'Which test would you like to take?',
  'Henüz test yok': 'No tests yet',
  'Sonuç bulunamadı': 'No results found',
  'Oyuna Katıl': 'Join Game',
  'Bir şeyler ters gitti': 'Something went wrong',
  'Sayfa yüklenirken bir hata oluştu. Lütfen tekrar deneyin.':
    'An error occurred while loading the page. Please try again.',
  'Yeni Oyuna Katıl': 'Join a New Game'
};

const REGEX_TRANSLATIONS = [
  [/^(\d+) duyuru güncellendi!$/, '$1 announcements updated!'],
  [/^(\d+) aktif etkinlik mevcut$/, '$1 active events available'],
  [/^Tüm Etkinlikler \((\d+) fotoğraf\)$/, 'All Events ($1 photos)'],
  [/^\((\d+) fotoğraf\)$/, '($1 photos)'],
  [/^Seçilen Dosyalar \((\d+)\/3\)$/, 'Selected Files ($1/3)'],
  [/^Tüm Sponsorlar \((\d+)\)$/, 'All Sponsors ($1)'],
  [/^Tüm Projeler \((\d+)\)$/, 'All Projects ($1)'],
  [/^Tüm Etkinlikler \((\d+)\)$/, 'All Events ($1)'],
  [/^Arşiv \((\d+)\)$/, 'Archive ($1)'],
  [/^Tüm Kullanıcılar \((\d+)\)$/, 'All Users ($1)'],
  [/^Tüm Biletler \((\d+)\)$/, 'All Tickets ($1)'],
  [/^Tüm Postlar \((\d+)\)$/, 'All Posts ($1)'],
  [/^Visible Posts \((\d+)\)$/, 'Visible Posts ($1)'],
  [/^Görünür Postlar \((\d+)\)$/, 'Visible Posts ($1)'],
  [/^Gizli Postlar \((\d+)\)$/, 'Hidden Posts ($1)'],
  [/^Etkinlik Postları \((\d+)\)$/, 'Event Posts ($1)'],
  [/^Doğru! \+(\d+) puan$/, 'Correct! +$1 points'],
  [/^Sıralamanız: #(\d+)$/, 'Your Rank: #$1'],
  [/^(\d+) \/ (\d+) soru cevaplandı$/, '$1 / $2 questions answered']
];

function preserveWhitespace(original, translated) {
  const match = original.match(/^(\s*)(.*?)(\s*)$/s);
  if (!match) return translated;
  return `${match[1]}${translated}${match[3]}`;
}

export function translateLegacyText(
  text,
  locale = defaultLocale,
  { allowPartial = true } = {}
) {
  if (locale !== 'en' || typeof text !== 'string') {
    return text;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return text;
  }

  if (EXACT_TRANSLATIONS[trimmed]) {
    return preserveWhitespace(text, EXACT_TRANSLATIONS[trimmed]);
  }

  for (const [pattern, replacement] of REGEX_TRANSLATIONS) {
    if (pattern.test(trimmed)) {
      return preserveWhitespace(text, trimmed.replace(pattern, replacement));
    }
  }

  if (!allowPartial) {
    return text;
  }

  let translated = trimmed;
  const partialReplacements = [
    ['Yükleniyor...', 'Loading...'],
    ['Erişim Reddedildi', 'Access Denied'],
    ['Admin Paneline Dön', 'Back to Admin Panel'],
    ['Geri Dön', 'Go Back'],
    ['Yönetimi', 'Management'],
    ['Yönetim', 'Management'],
    ['Duyurular', 'Announcements'],
    ['Duyuru', 'Announcement'],
    ['Etkinlikler', 'Events'],
    ['Etkinlik', 'Event'],
    ['Projeler', 'Projects'],
    ['Proje', 'Project'],
    ['Kullanıcılar', 'Users'],
    ['Kullanıcı', 'User'],
    ['Kayıtlar', 'Registrations'],
    ['Biletler', 'Tickets'],
    ['Bilet', 'Ticket'],
    ['Çekilişler', 'Raffles'],
    ['Çekiliş', 'Raffle'],
    ['Sosyal', 'Social'],
    ['Dosya', 'File'],
    ['Yükleme', 'Upload'],
    ['Soru', 'Question'],
    ['Sorular', 'Questions'],
    ['Sonuçları', 'Results'],
    ['Sonuçlar', 'Results'],
    ['Sonucu', 'Result'],
    ['Başlat', 'Start'],
    ['Başlamayı Bekliyor', 'Waiting to Start'],
    ['Katıl', 'Join'],
    ['Paylaş', 'Share'],
    ['Oluştur', 'Create'],
    ['Güncelle', 'Update'],
    ['Düzenle', 'Edit'],
    ['Sil', 'Delete'],
    ['Gizle', 'Hide'],
    ['Göster', 'Show'],
    ['Açık', 'Open'],
    ['Kapalı', 'Closed'],
    ['İnceleniyor', 'Reviewing'],
    ['Şikayet', 'Complaint'],
    ['Öneri', 'Suggestion'],
    ['Diğer', 'Other'],
    ['Yorum', 'Comment'],
    ['Yanıt', 'Reply'],
    ['Giriş yapmanız gerekiyor', 'You need to sign in'],
    ['Lütfen', 'Please'],
    ['Henüz', 'No'],
    ['bulunmuyor', 'available'],
    ['bulunamadı', 'not found'],
    ['başarıyla', 'successfully'],
    ['hata oluştu', 'an error occurred']
  ];

  for (const [source, target] of partialReplacements) {
    translated = translated.replaceAll(source, target);
  }

  return translated === trimmed ? text : preserveWhitespace(text, translated);
}
