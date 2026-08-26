# Masters — React Native ilova uchun texnik topshiriq

Ushbu hujjat `Masters-front` (web, Vite + React + antd) loyihasini tahlil qilish asosida
tayyorlangan. Maqsad — bir xil backend/API'dan foydalanuvchi alohida React Native
mobil ilova yaratish uchun kerakli barcha texnik ma'lumotni bir joyga jamlash.

> Backend butunlay mustaqil REST API (`/api/v1/...`) — web frontend faqat uning
> bitta client'i. Demak RN ilovasi ham xuddi shu backend'ga ikkinchi client sifatida
> ulanadi, backend tomonda hech narsani o'zgartirish shart emas.

---

## 1. Umumiy arxitektura

| Qatlam | Web'da qanday | RN'da qanday bo'ladi |
|---|---|---|
| API client | `axios` + `@tanstack/react-query` | Xuddi shunday — ikkalasi ham RN'da ishlaydi, o'zgarishsiz |
| Auth token saqlash | `zustand/persist` → `localStorage` | `zustand/persist` + `AsyncStorage` yoki `expo-secure-store` |
| Realtime chat | Native `WebSocket` | RN'ning o'zidagi `WebSocket` API — bir xil, portlashga hojat yo'q |
| Push notification | Firebase Web SDK (FCM) | `@react-native-firebase/messaging` yoki Expo Notifications |
| Xarita | Yandex Maps JS SDK | `react-native-maps` yoki WebView + Yandex Maps JS |
| UI komponentlar | Ant Design + Tailwind CSS | **Qaytadan yoziladi** — RN Paper / Tamagui / NativeWind + custom |
| Navigatsiya | `@tanstack/react-router` | React Navigation yoki Expo Router |
| i18n | `react-i18next` + JSON fayllar | `react-i18next` (yoki `i18next` + RN backend) — JSON fayllar shu ko'yicha ko'chiriladi |
| Fayl yuklash | `<input type=file>` | `expo-image-picker` / `react-native-image-picker` |

### Qayta ishlatiladigan qatlamlar (deyarli o'zgarishsiz ko'chiriladi)

Bu fayllar sof TypeScript, DOM'ga bog'liq emas — RN loyihasiga to'g'ridan-to'g'ri
ko'chirib qo'yish mumkin (yoki umumiy npm paket qilib chiqarish mumkin):

- `src/constants/endpoints.ts` — barcha API endpoint'lar
- `src/types/**` — barcha TS interfeys/enum'lar (request/response shape'lari)
- `src/services/**` — react-query hook'lari (`useXxxQuery` / `useXxxMutation`)
- `src/utils/**` — narx/sana formatlash va h.k.
- `public/locales/{uz,ru,en}/*.json` — tarjimalar

---

## 2. Auth oqimi

**Base URL**: `{APP_API_URL}/api/v1`

### Token turlari
- `access` / `refresh` — JWT juftlik, `POST /auth/login/` va h.k. orqali olinadi
- Har bir so'rovga `Authorization: Bearer <access>` header qo'shiladi

### Endpoint'lar (`ENDPOINTS.AUTH`)
| Endpoint | Vazifasi |
|---|---|
| `POST /auth/login/` | `{ phone, password }` → `{ access, refresh }` |
| `POST /auth/register/` | Ro'yxatdan o'tish → SMS OTP yuboradi (token qaytarmaydi) |
| `POST /auth/register-simple/` | OTP'siz test rejimi (token qaytaradi) |
| `POST /auth/phone-auth/` | Parolsiz — backend parol generatsiya qiladi, bir marta qaytaradi |
| `POST /auth/verify-otp/` | `{ phone, code }` → `{ access, refresh }` — ro'yxatdan o'tishni yakunlaydi |
| `POST /auth/resend-otp/` | `{ phone }` |
| `POST /auth/refresh/` | `{ refresh }` → yangi `access` (va ehtimol yangi `refresh`) |
| `POST /auth/forgot-password/` | `{ phone }` |
| `POST /auth/reset-password/` | `{ phone, code, new_password, new_password2 }` |
| `POST /auth/logout/` | — |

### Refresh/401 mantig'i (`src/lib/axios/interceptors.ts`dan ko'chiriladi)
1. Har qanday so'rov `401` qaytarsa va u login/register/refresh kabi "public auth"
   endpoint'lardan bo'lmasa → avtomatik `POST /auth/refresh/` chaqiriladi.
2. Refresh paytida kelgan boshqa so'rovlar navbatga qo'yiladi (`pendingQueue`),
   refresh tugagach ular yangi token bilan qayta yuboriladi.
3. Refresh o'zi ham muvaffaqiyatsiz bo'lsa → foydalanuvchi logout qilinadi.
4. Login/register/OTP kabi so'rovlardan kelgan `401` — bu shunchaki "login/parol
   noto'g'ri", global logout'ni ishga tushirmaydi.

### Foydalanuvchi turlari (`EUserType`)
```ts
enum EUserType { CLIENT = "CLIENT", WORKER = "WORKER" }
```
Tashkilot (`organization`) alohida modul — bitta `WORKER` bir nechta a'zoli
tashkilotga tegishli bo'lishi mumkin (`ORGANIZATION.*` endpoint'lari).

---

## 3. Ekranlar ro'yxati (route → vazifa)

Web'dagi `src/constants/routes.ts`dan olingan — RN'da navigatsiya tuzilmasi shu
asosda qurilishi tavsiya etiladi (Stack + Tab navigator kombinatsiyasi).

### Ochiq (auth talab qilmaydi)
- Bosh sahifa / landing
- Mutaxassislar katalogi + detail (`masters-catalog/:guid`)
- Tashkilotlar katalogi + detail
- Xizmatlar ro'yxati + detail
- "Mutaxassis bo'lish" (become-worker) landing
- Tezkor ariza (quick-apply, guest uchun)
- Elonlar katalogi (applications)
- Foydalanish shartlari, yuridik yordam

### Auth
- Login, Register, OTP tasdiqlash, Parolni tiklash
- Master onboarding, Tashkilot onboarding (ro'yxatdan o'tgach profil to'ldirish)

### Himoyalangan — Worker (mutaxassis)
- Dashboard, Daromadlar (earnings), Portfolio

### Himoyalangan — umumiy
- Mening buyurtmalarim (orders/my), Buyurtma shartnomasi, Escrow holati
- Mening elonlarim, Elon yaratish/tahrirlash/detail
- Elonga taklif detail, Taklif kelishuvi (offer agreement)
- Mijoz profili (customer detail)
- Profil, Profilni tahrirlash, Balans tarixi
- Bildirishnomalar
- Chat ro'yxati + xona
- Kurslar ro'yxati + detail

---

## 4. Asosiy biznes oqim (Application → Offer → Order → Escrow)

```
1. Mijoz (CLIENT) elon (application) yaratadi
   POST /application/create/  { title, category, description, address,
                                 budget_from, budget_to, payment_type: "escrow"|"direct", ... }

2. Mutaxassis (WORKER) elonga taklif yuboradi
   POST /application/offer/create/  { application, price, comment }

3. Mijoz taklifni qabul qiladi → order yaratiladi
   POST /application/offer/accept/{offer_guid}/  → IOfferAcceptResponse (order guid bilan)

4a. payment_type === "escrow" bo'lsa:
    POST /payments/escrow/create/  — mijoz pulni platformada "qulflaydi"
    Ish tugagach: POST /application/order/customer-complete/{guid}/ — pul masterga o'tadi

4b. payment_type === "direct" bo'lsa:
    To'lov tomonlar o'rtasida to'g'ridan-to'g'ri, platformadan tashqarida

5. Master ishni tugatadi: POST /application/order/master-finish/{guid}/
6. Mijoz tasdiqlaydi:      POST /application/order/customer-complete/{guid}/
7. Ikki tomon ham baho qoldirishi mumkin (REVIEW / CUSTOMER_REVIEW endpoint'lari)
```

**Status maydonlari** (`TOrderStatus`):
`new → accepted → contract_signed → in_progress → awaiting_confirmation → completed`
(yoki istalgan bosqichda `cancelled`)

**Muhim**: `payment_type` faqat elon yaratilganda bir marta belgilanadi va
o'zgarmaydi — RN'dagi "ariza yaratish" wizard'i ham shu tanlovni bosqichlardan
biri sifatida saqlab qolishi kerak.

---

## 5. Realtime chat (WebSocket)

```
wss://<api-host>/ws/chat/?token=<access_token>
```

- Ulanish **account-scoped**, xona bo'yicha emas — bitta socket barcha chat
  xonalari uchun ishlatiladi.
- Backend ~5 soniyada majburiy uzib qo'yadi (ma'lum, backend xatosi emas) —
  shuning uchun **agressiv qayta ulanish** (auto-reconnect) shart.
- Kelayotgan xabar payload'i **rasman hujjatlashtirilmagan** — web tarafda
  himoyalangan (defensive) parsing ishlatilgan: xabar `message`/`data`/`payload`/
  `chat_message`/`result` kalitlaridan birortasi ichida bo'lishi mumkin, sender
  ham turlicha joylashishi mumkin. RN tomonda ham xuddi shunday moslashuvchan
  parser yozish tavsiya etiladi (`src/lib/chatSocket.ts`dagi
  `pickMessageCandidate` / `extractChatRef` / `extractSenderId` funksiyalariga
  qarang — deyarli o'zgarishsiz ko'chiriladi).

### REST chat endpoint'lari (tarix, boshlash va h.k.)
| Endpoint | Vazifasi |
|---|---|
| `GET /chat/list/` | Chatlar ro'yxati |
| `POST /chat/start/` | Yangi chat boshlash (masterga yozish) |
| `GET /chat/{guid}/messages/` | Xabarlar tarixi |
| `POST /chat/message/create/` | Xabar yuborish (REST orqali, WS — real-time yetkazish uchun) |
| `POST /chat/image/create/` | Rasm yuborish |
| `POST /chat/{guid}/read/` | O'qildi deb belgilash |
| `GET /chat/unread-summary/` | O'qilmagan xabarlar soni |

---

## 6. Push notification

- Backend allaqachon **android/ios uchun tayyor**:
  `POST /device-token/register/  { token: string, platform: "web"|"android"|"ios" }`
- Web'da Firebase Web SDK (FCM) ishlatilgan (`src/lib/firebase/firebase.ts`).
  RN'da: `@react-native-firebase/messaging` bilan FCM token olib, xuddi shu
  endpoint'ga `platform: "android"` yoki `"ios"` bilan yuboriladi — backend
  tomonda o'zgarish kerak emas.
- Login bo'lgan har bir sessiyada token qayta ro'yxatdan o'tkaziladi (rotatsiya
  bo'lgan holatlarni yopish uchun) — `src/app/PushNotifications.tsx`dagi
  mantiqni takrorlash tavsiya etiladi.
- Bildirishnoma turlari (`ENotificationType` + kengaytirilgan ro'yxat —
  `notifications.tsx`dagi `NOTIF_TYPE_STYLE`): `new_application`,
  `admin_broadcast`, `admin_direct`, `application_accepted`,
  `application_completed`, `application_cancelled`, `new_offer`,
  `offer_accepted`, `review_new`, `payment_received`.

---

## 7. Katalog/filtr endpoint'lari va parametrlar

### Mutaxassislar katalogi
`GET /workers` yoki loyihada haqiqatda ishlatiladigan asosiy endpoint —
`IMasterCatalogListFilters`:
```ts
{ category?: number[]; region?: number|null; district?: number|null;
  price_min?: number|null; price_max?: number|null; min_rating?: number|null;
  q?: string; organization?: string|null; sort?: "top_rated" }
```

### Elonlar katalogi
`IApplicationsListFilters`:
```ts
{ category?: number[]; region?: number|null; district?: number|null;
  price_min?: number|null; price_max?: number|null;
  date_from?: string|null; date_to?: string|null; q?: string;
  sort?: "most_offers" }
```

### Manzil kaskadi (viloyat → tuman)
```
GET /address/region-list/
GET /address/district-list/?region=<guid>
```

### Kategoriya kaskadi (yo'nalish → toifa → qo'shimcha ishlar)
```
GET /jobs/base-category/list/
GET /jobs/category/list/
GET /jobs/base-category-additional-work/list/?category=<guid>
```

---

## 8. UI/UX ko'chirish bo'yicha eslatmalar

- **Til**: uz/ru/en — 3 tilning JSON fayllari tayyor (`public/locales/`), faqat
  RN'dagi i18n konfiguratsiyasiga ulash kerak.
- **Tungi rejim (dark mode)**: web'da `document.documentElement`ga `.dark`
  klass qo'shish orqali ishlaydi (`useDarkClass.ts`) — RN'da `useColorScheme()`
  + o'z theme kontekstingiz bilan almashtiriladi.
- **Fayl yuklash**: profil rasmi, portfolio, hujjatlar, intro video — bir nechta
  joyda bor (`FILES.UPLOAD`, `FILES.UPLOAD_MULTIPLE`). RN'da kamera/galereya
  ruxsatlari (`expo-image-picker` yoki native permission'lar) qo'shimcha ishlaydi.
  Video yuklash hajmi cheklovlariga alohida e'tibor bering (mobil tarmoqda).
  
  **Diqqat**: agar RN alohida loyiha bo'lsa (npm workspace/monorepo emas),
  `src/services/**` fayllaridagi ba'zi mutatsiyalar (rasm/hujjat yuklash) veb
  `File`/`FormData` API'siga tayanadi — bu qismlarni RN'ning `FormData` +
  `{ uri, type, name }` obyekt formatiga moslab qayta yozish kerak bo'ladi
  (endpoint va payload maydonlari o'zgarmaydi, faqat fayl objekti tuzilishi).
- **Xarita**: manzil tanlash (location picker) va xaritada ko'rish hozir Yandex
  Maps JS SDK orqali (`src/lib/yandexMaps.ts`, `MapLocationPicker/`) — bu eng
  ko'p qayta ishlanadigan qism. Variantlar: (a) `react-native-maps` +
  Yandex/Google tiles, (b) WebView ichida mavjud web location-picker sahifasini
  ochish (tezroq, lekin "hybrid" tuyg'u beradi).

---

## 9. Tavsiya etilgan bosqichlar (milestone'lar)

1. **Poydevor**: RN loyiha skeleton (Expo tavsiya etiladi — OTA update, push,
   kamera/galereya setup osonroq), navigatsiya, theme, i18n ulash
2. **Auth**: login/register/OTP/forgot-password + token saqlash (SecureStore) +
   axios interceptor (refresh/401 mantig'i)
3. **Katalog**: mutaxassislar va elonlar ro'yxati + filtr + detail sahifalar
4. **Ariza oqimi**: elon yaratish wizard'i, taklif yuborish/qabul qilish
5. **To'lov**: escrow yaratish, balans, tranzaksiyalar tarixi
6. **Chat**: WebSocket ulanish + REST tarix + push bilan integratsiya
7. **Profil**: portfolio, hujjatlar, intro video, statistikalar
8. **Bildirishnomalar**: ro'yxat + push notification handling (foreground/background)
9. **Sayqal**: dark mode, xarita integratsiyasi, offline holatlar, deep linking

---

## 10. Ochiq savollar (loyihani boshlashdan oldin hal qilinishi kerak)

- [ ] RN framework: **Expo** (tezroq boshlash, push/kamera tayyor) yoki **bare
      React Native** (native modul erkinligi ko'proq)?
- [ ] Navigatsiya: React Navigation yoki Expo Router?
- [ ] UI kit: NativeWind (Tailwind uslubi saqlanadi) + custom komponentlar,
      yoki tayyor kit (Tamagui / RN Paper / Gluestack)?
- [ ] Kod almashish strategiyasi: shunchaki fayllarni ko'chirib qo'yishmi, yoki
      `services`/`types`/`utils`ni alohida npm paket (monorepo, masalan pnpm
      workspace) qilib ikkala loyiha ham import qilishimi? Ikkinchisi uzoq
      muddatda API o'zgarishlarini ikki joyda qo'lda sinxronlashdan qutqaradi.
- [ ] Xarita: Yandex Maps RN'da rasman qo'llab-quvvatlanmaydi — qaysi
      alternativ tanlanadi?
