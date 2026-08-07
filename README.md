# Voia Mobile

Voia'nın Android ve iOS uygulaması. Proje TypeScript, React Native 0.86 ve Expo SDK 57
üzerinde çalışır. Uygulama Expo Go yerine native modülleri de destekleyen Development Build
yaklaşımını kullanır.

## Takım çalışma düzeni

Bu repository yalnızca mobil ekibinin sorumluluğundadır. `main` yayınlanabilir kararlı dal olarak
korunur; günlük geliştirme doğrudan `main` üzerinde yapılmaz.

Önerilen akış:

1. Her görev için `develop` dalından yeni bir branch açılır.
2. Branch adı kısa ve görev odaklı olur: `feature/day-11-reminder-list`,
   `fix/login-navigation` veya `chore/update-dependencies`.
3. İş bitince `develop` dalına Pull Request açılır. En az bir ekip üyesi incelemeden merge yapılmaz.
4. `develop` belirli bir sürüm için hazır olduğunda `main` dalına ayrı bir Pull Request açılır.
5. `main` üzerinde doğrudan push ve force push kapalı tutulur; merge, testler başarılı olduktan sonra
   yapılır.

Commit mesajları mümkün olduğunca şu biçimde yazılır:

```text
feat(mobile): add reminder list
fix(auth): prevent duplicate home navigation
test(profile): cover preference persistence
docs: update mobile setup notes
```

Pull Request açıklamasında değişikliğin amacı, etkilenen ekran/katman, backend bağımlılığı ve test
sonucu belirtilir. Bir PR tek bir konuya odaklanır; büyük işler küçük PR'lara bölünür.

`npm run validate` çalışmadan PR açılmaz. `.env` ve gerçek anahtarlar commit edilmez; ekip üyeleri
`.env.example` dosyasını kendi yerel `.env.local` dosyalarına kopyalar.

## Gün 1–10 mobil ilerleme özeti

- **1. gün:** Expo/React Native/TypeScript projesi, development build, Android ortamı, lint,
  format, typecheck ve Jest temeli kuruldu; ilk debug APK üretildi.
- **2. gün:** Domain, application, infrastructure, composition ve presentation katmanları ayrıldı;
  mock/API repository seçimi tek composition root'a alındı.
- **3. gün:** ER şeması mobil modellere eşlendi; DTO mapper'ları, sürümlü kalıcı mock veritabanı,
  dil/kullanıcı/ayar/cihaz/reminder modelleri ve hata senaryoları oluşturuldu.
- **4. gün:** Voia'nın açık tema renk, spacing, radius, gölge, tipografi ve erişilebilirlik token'ları
  oluşturuldu; sistem fontu korunarak ThemeProvider bağlandı.
- **5. gün:** Ortak Button, TextField, Card, Badge, Chip, Modal, Toast ve StateView bileşenleri;
  auth/app stack'leri ve temel tab navigasyonu tamamlandı.
- **6. gün:** Bootstrap, splash, SecureStore session, logout, rota koruması ve refresh coordinator
  eklendi.
- **7. gün:** Giriş, şifre sıfırlama, yeni şifre ve Google girişinin UI/API sınırı hazırlandı;
  loading, validasyon ve hata durumları eklendi.
- **8. gün:** Kayıt akışı, parola kuralları, kalıcı mock hesap store'u ve kayıt sonrası session akışı
  tamamlandı; Google credential exchange sınırı tanımlandı.
- **9. gün:** Telefon OTP, cooldown/deneme sınırı, installation ID, cihaz-session bağı, logout
  temizliği ve ürün dili düzenlemeleri tamamlandı.
- **10. gün:** Profil, dil/timezone/il tercihleri, bildirim varsayılanları, çıkış ve hesap silme
  onayları tamamlandı. Mock/API sınırı korunarak gerçek backend geçişine hazırlandı.

Günlük ayrıntılı planlama belgeleri bu repository'ye dahil edilmez; ekip içi çalışma alanında tutulur.

## Başlangıç

Gereksinimler:

- Node.js 22.13 veya üzeri (bu bilgisayarda Node.js 24.18.0 ile doğrulandı)
- npm
- Android Studio, Android SDK 36, NDK 27.1, CMake, Ninja ve JDK 17
- iOS geliştirmek için ayrıca macOS ve Xcode 26.4 veya üzeri

Kurulum:

```bash
npm install
cp .env.example .env.local
npm run validate
```

Android Development Build:

```bash
npm run android
```

Doğrulanan debug APK çıktısı: `android/app/build/outputs/apk/debug/app-debug.apk`.

Uygulama cihazda bir kez kurulduktan sonra günlük geliştirme sunucusu:

```bash
npm start
```

## Kontrol komutları

- `npm run typecheck`: TypeScript tip kontrolü
- `npm run lint`: ESLint ve Prettier kural kontrolü
- `npm run format`: otomatik kod biçimlendirme
- `npm test`: Jest birim testleri
- `npm run validate`: yukarıdaki salt-okunur kontrollerin tamamı

Yerel ortam değişkenleri, API adresi ve backend sözleşmesi ekip planlama alanındaki ortak belgelerde
tutulur; bu repository'nin çalışma talimatları ve güncel mobil kapsamı bu README'de yer alır.
