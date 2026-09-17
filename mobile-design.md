# Web mobile dizaynini React Native'ga o'tkazish

Bu fayl hozirgi web ilovada (`src/`) mobile viewport uchun qilingan dizaynni
React Native loyihasiga qanday o'tkazish kerakligini tushuntiradi: qaysi
component nimaga mos keladi, qanday kutubxona bilan almashtiriladi, va
qaysi qiymatlarni (rang, o'lcham, radius) olib ketish kerak.

## 1. Umumiy mapping jadvali

| Web (React + Tailwind + antd) | React Native muqobili |
|---|---|
| `div`, `span`, `h1` | `View`, `Text` |
| `className="..."` (Tailwind) | `StyleSheet.create({...})` yoki NativeWind (`className` RN'da ham ishlaydi) |
| `@tanstack/react-router` (`Link`, `useRouter`) | `React Navigation` (`useNavigation`, `<Link>` yo'q — `navigation.navigate()`) |
| `antd` (`Avatar`, `Badge`, `Skeleton`) | RN uchun mos kutubxona: `react-native-paper` / o'zingiz yozgan primitivlar |
| `lucide-react` iconlari | `lucide-react-native` (bir xil ikonalar, bir xil nomlar — `size`, `strokeWidth` propslari saqlanadi) |
| `position: fixed`, `sticky` | `position: "absolute"` + SafeAreaView / `react-native-safe-area-context` |
| `backdrop-filter: blur()` | `expo-blur` (`<BlurView intensity={...} tint="light|dark" />`) |
| `env(safe-area-inset-bottom/top)` | `useSafeAreaInsets()` (`react-native-safe-area-context`) |
| CSS `box-shadow` | RN `shadow*` proplari (iOS) + `elevation` (Android) |
| Zustand store'lar (`useMobileHeaderStore`, auth, va h.k.) | **O'zgarishsiz qoladi** — Zustand RN'da ham ishlaydi |
| `i18next` / `react-i18next` | **O'zgarishsiz qoladi** |
| `services/*` (axios so'rovlari, query hook'lar) | **Deyarli o'zgarishsiz qoladi** (faqat token saqlash `AsyncStorage`ga o'tadi) |

**Xulosa:** UI qatlami (JSX + style) qayta yoziladi, lekin **mantiq qatlami**
(stores, services, types, i18n, validatsiya) katta qismi ko'chirib olinadi.

## 2. Mobil ekranning uchta asosiy qatlami

Hozirgi web mobile dizayni uchta doimiy elementdan iborat — bularning har
biri RN'da alohida component bo'ladi:

### a) Pastki tab bar — `MobileTabBar`
Manba: [MobileTabBar.tsx](../src/components/layout/MobileTabBar/MobileTabBar.tsx)

- Suzuvchi (floating) shisha pill — ekranning pastki chetiga yopishmaydi,
  hamma tomondan bo'shliq bilan ajratilgan
- To'liq radius: `28px`
- Faqat login qilgan foydalanuvchilarga ko'rinadi (guest'larda yo'q)
- 5 ta band: Asosiy, Buyurtmalar, **o'rtada ko'tarilgan "+" tugma** (e'lon
  joylash), Ko'proq, Profil (foydalanuvchi avatari)
- Aktiv tab — icon orqasida to'ldirilgan pill (badge) + rang o'zgarishi
- Ranglar: aktiv `#059669` (emerald-600) / dark rejimda `#34d399`
- Blur: `backdrop-blur-2xl` + tint (`bg-white/75` light, `bg-[#1c1f2a]/80` dark)
- Shadow: `0 10px 32px rgba(15,23,42,0.16)`

**RN'da:**
```
<View style={{ position: "absolute", bottom: insets.bottom + 8, left: 16, right: 16 }}>
  <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={styles.pill}>
    {/* 5 ta tab, xuddi shu tartibda */}
  </BlurView>
</View>
```
Markazdagi "+" tugma `position: absolute`, `top: -20` bilan pill ustidan
ko'tarilgan holda chiziladi — xuddi web'dagidek.

### b) Yuqori sahifa sarlavhasi — `MobilePageHeader`
Manba: [MobilePageHeader.tsx](../src/components/layout/MobilePageHeader/MobilePageHeader.tsx)

- Har sahifa o'z sarlavhasini markazga chiqaradi (chap/o'ng slot doim bir xil
  kenglikda — `w-10` — shu sabab title har doim aniq markazda turadi)
- Standart chap: orqaga qaytish strelkasi (`ChevronLeft`, `router.history.back()`)
- O'ng: qo'ng'iroq (bildirishnoma) badge bilan, faqat login qilganlarda
- Fade-out shisha fon: blur pastga tushgan sari yo'qoladi (`maskImage` gradient)
- Sarlavha yuklanmagan bo'lsa — skeleton (bo'sh joy emas)

**RN'da:** `react-navigation`ning `headerShown: false` qilib, o'zingizning
custom header component'ni har ekranga qo'yasiz (yoki `Stack.Screen options`
orqali umumiy header beriladi). Markazlashtirish uchun ikkala tomon fixed
`width: 40` bo'lishi kerak — bu web'dagi bilan bir xil trik.

### c) Umumiy layout — `PublicLayout` / `UserLayout`
Manba: [PublicLayout.tsx](../src/components/layout/PublicLayout/PublicLayout.tsx)

Tartib: `Navbar (faqat desktop) → MobilePageHeader → <content> → Footer
(faqat desktop) → MobileTabBar`. Login qilgan foydalanuvchida content pastda
qo'shimcha padding oladi (`pb-20`) — chunki tab bar float qilib ustidan
yopib qo'yadi.

**RN'da:** bu `RootLayout`/`Stack Navigator` + har ekran ostida qo'shimcha
`paddingBottom` (tab bar balandligi + safe area) kerak bo'ladi.

## 3. Rang va tema tizimi

Manba: [colors.ts](../src/styles/theme/colors.ts)

```ts
light: { colorPrimary: "#16a34a", colorBgLayout: "#f5f5f5", colorBgContainer: "#ffffff" }
dark:  { colorPrimary: "#22c55e", colorBgLayout: "#181b24", colorBgContainer: "#232733" }
```

RN'da bu qiymatlarni bitta `theme.ts` fayliga ko'chirib, Context yoki
Zustand orqali `isDark` holatiga qarab tanlash kifoya — mantiq bir xil,
faqat antd `theme.useToken()` o'rniga o'z Context'ingiz ishlatiladi.

Muhim: tab bar va header'dagi emerald ranglar (`#059669` / `#34d399`)
`colorPrimary`dan farq qiladi — bu ataylab qilingan "action" rangi, uni
alohida token sifatida saqlash tavsiya etiladi (masalan `colorAccent`).

## 4. Boshlash tartibi (tavsiya)

1. `theme/colors.ts` qiymatlarini RN loyihaga ko'chirish
2. Safe-area + navigation skeleton qurish (Stack + Tab Navigator)
3. `MobileTabBar` — eng ko'zga tashlanadigan, birinchi qilinsa dizayn
   tezda "tanish" ko'rinadi
4. `MobilePageHeader` — umumiy header sifatida
5. Ekran-ekran content (bittadan sahifa: Applications/Asosiy, keyin
   Buyurtmalar, Profil...)

## 5. Nima ko'chmaydi, qaytadan yoziladi

- Barcha `className` bilan yozilgan Tailwind stillar — RN'da `StyleSheet`
  yoki NativeWind bilan qayta yoziladi (mantiq, o'lcham, rang qiymatlari
  saqlanadi, faqat sintaksis o'zgaradi)
- `backdrop-filter`, CSS gradient mask — RN'da `expo-blur` + `MaskedView`
  bilan almashtiriladi (soddaroq variant: shunchaki qattiq fon + shadow,
  agar blur effekt unchalik muhim bo'lmasa)
- Antd componentlari (`Avatar`, `Badge`, `Skeleton`) — RN uchun mos
  kutubxona tanlanadi yoki o'zingiz yozasiz
