# 🏢 Rabat Ingatlanprojekt Követő

Webes alkalmazás Rabat környéki ingatlanfejlesztési projektek automatikus követésére, térképes megjelenítéssel és befektetési potenciál értékeléssel.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Funkciók

- 🔍 **Automatikus keresés** - 30 percenként keres új ingatlanprojekteket
- 📰 **RSS-szerű feed** - Kronológikus projekt lista
- 🗺️ **Térkép nézet** - Google Maps integráció Rabat térképpel
- 📍 **Lokáció értékelés** - Automatikus pontozás (egyetem, iskola, tömegközlekedés, stb.)
- 💰 **Árelemzés** - Ár/m² követés és trendek
- 👷 **Fejlesztői profil** - Fejlesztők nyomonkövetése
- 🏗️ **Építési fázis** - Projekt állapot követés
- 📊 **Befektetési score** - Automatikus pontozás 0-100 skálán
- 🔍 **Szűrők** - Ár, lokáció, fejlesztő, stb.
- 📧 **Email értesítések** - Új projektek, változások
- 📈 **Heti riport** - Automatikus összesítő
- ⭐ **Watchlist** - Kedvenc projektek mentése
- ⚖️ **Összehasonlítás** - Projektek egymás melletti összehasonlítása

## 🚀 Gyors telepítés

### Opció 1: 🐳 Docker Lokális (Egyszerűbb!)

**Becsült idő: 10-15 perc**

**Előfeltételek:**
- Docker Desktop
- Google Maps API key
- Anthropic API key

```bash
# 1. Clone repository
git clone https://github.com/your-username/rabat-property-tracker.git
cd rabat-property-tracker

# 2. Környezeti változók beállítása
cp .env.example .env
# Töltsd ki: GOOGLE_MAPS_API_KEY és ANTHROPIC_API_KEY

# 3. Docker indítása
docker-compose up -d

# 4. Nyisd meg: http://localhost:3000
```

**📖 Részletes útmutató: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)**

**Előnyök:**
- ✅ Nem kell Supabase/Vercel account
- ✅ Minden lokálisan fut
- ✅ Gyorsabb fejlesztés
- ✅ Teljes kontroll

---

### Opció 2: ☁️ Vercel + Supabase (Production-ready!)

**Becsült idő: 15-20 perc**

**Előfeltételek:**
- GitHub account
- Vercel account (ingyenes)
- Supabase account (ingyenes)
- Google Cloud account (Maps API)
- Anthropic API key (Claude)

**Telepítési lépések:**

1. **Supabase beállítás** - Projekt + SQL séma
2. **Google Maps API** - 3 API engedélyezés + key
3. **Anthropic API** - API key létrehozás
4. **Vercel deployment** - Repo import + env vars
5. **Deploy** - Automatikus

**📖 Részletes telepítési útmutató: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

**Előnyök:**
- ✅ Online elérhető bárhonnan
- ✅ Automatikus scaling
- ✅ Professional deployment
- ✅ Megosztható kollégákkal

## 🛠️ Technológiai stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Maps**: Google Maps API

### Backend
- **Runtime**: Next.js API Routes (Serverless)
- **Database**: Supabase (PostgreSQL + PostGIS)
- **Authentication**: Supabase Auth
- **AI**: Anthropic Claude API
- **Email**: Resend

### Infrastructure
- **Hosting**: Vercel
- **Cron Jobs**: Vercel Cron
- **Storage**: Supabase Storage

## 📁 Projekt struktúra

```
rabat-property-tracker/
├── frontend/                    # Next.js alkalmazás
│   ├── src/
│   │   ├── app/                # Next.js 15 App Router
│   │   │   ├── api/            # API routes
│   │   │   │   ├── cron/       # Cron job endpoints
│   │   │   │   ├── properties/ # Property API
│   │   │   │   └── watchlist/  # Watchlist API
│   │   │   ├── dashboard/      # Dashboard pages
│   │   │   ├── layout.tsx      # Root layout
│   │   │   └── page.tsx        # Home page
│   │   ├── components/         # React komponensek
│   │   │   ├── ui/             # UI komponensek (shadcn/ui)
│   │   │   ├── property/       # Property komponensek
│   │   │   ├── map/            # Térkép komponensek
│   │   │   └── filters/        # Szűrő komponensek
│   │   ├── lib/                # Utility funkciók
│   │   │   ├── supabase.ts     # Supabase client
│   │   │   └── utils.ts        # Helper funkciók
│   │   └── types/              # TypeScript típusok
│   ├── public/                 # Statikus fájlok
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.js
├── infrastructure/             # Deployment konfigok
│   ├── supabase-schema.sql    # Adatbázis séma
│   └── vercel.json            # Vercel konfig + cron
├── docs/                       # Dokumentáció
│   ├── DEPLOYMENT.md          # Telepítési útmutató
│   └── API.md                 # API dokumentáció (coming soon)
└── README.md                   # Ez a fájl
```

## 🔑 Környezeti változók

A frontend `.env.local` fájlban (lásd `.env.example`):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Email (Resend)
RESEND_API_KEY=re_...
NOTIFICATION_EMAIL_FROM=notifications@yourdomain.com

# App konfig
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CRON_SECRET=random_secret_here
```

## 🚦 API Endpoints

### Properties
- `GET /api/properties` - Lista összes projektről (szűrőkkel)
- `GET /api/properties/[id]` - Egy projekt részletei

### Watchlist
- `GET /api/watchlist` - User watchlist lekérése
- `POST /api/watchlist` - Projekt hozzáadása
- `DELETE /api/watchlist` - Projekt eltávolítása

### Cron (protected)
- `GET /api/cron/search-properties` - Új projektek keresése
- `GET /api/cron/send-weekly-reports` - Heti riportok küldése

## 📊 Befektetési Score Algoritmus

A befektetési potenciál score (0-100) az alábbi tényezők alapján számolódik:

| Tényező | Súly | Leírás |
|---------|------|--------|
| **Lokáció** | 40% | Távolság kulcsfontosságú helyektől (egyetem, iskola, tömegközlekedés, stb.) |
| **Ár** | 20% | Összehasonlítás a környék átlagárával |
| **Fejlesztő** | 20% | Múltbeli projektek minősége, határidők tartása |
| **Infrastruktúra** | 10% | Jövőbeli fejlesztések a környéken |
| **Projekt állapot** | 10% | Építési fázis és várható befejezés |

## 📈 Adatforrások

Az alkalmazás az alábbi forrásokból gyűjt adatokat:

- **Ingatlanportálok**: Mubawab.ma, Avito.ma, Sarouty.ma
- **Hírek**: Medias24.com, LesEco.ma, Le360.ma, Challenge.ma
- **Hivatalos**: Fejlesztői cégek hivatalos oldalai
- **Google Places**: POI adatok (iskolák, plázák, stb.)

## 💰 Költségbecslés

Ingyenes tier-ekkel (1-10 felhasználó):

| Szolgáltatás | Ingyenes Limit | Várható Költség |
|--------------|----------------|-----------------|
| Vercel | 100GB bandwidth/hó | **Ingyenes** |
| Supabase | 500MB DB, 2GB transfer | **Ingyenes** |
| Google Maps | $200 kredit/hó | **Ingyenes** |
| Anthropic | Usage-based | **$5-20/hó** |
| Resend | 3000 email/hó | **Ingyenes** |

**Összesen**: ~$5-20/hó (főleg Anthropic használat)

## 🔧 Fejlesztés lokálisan

```bash
# Frontend könyvtárba lépés
cd frontend

# Függőségek telepítése
npm install

# .env.local fájl létrehozása
cp .env.example .env.local
# Töltsd ki a környezeti változókat!

# Development szerver indítása
npm run dev

# Nyisd meg: http://localhost:3000
```

## 🧪 Teszt adatok

A Supabase séma tartalmaz seed adatokat:

- 5 fejlesztő cég
- 7 fontos hely Rabatban (egyetemek, strandok, stb.)
- Példa property-ket a cron job fog hozzáadni

## 🐛 Troubleshooting

### Database error
- Ellenőrizd a Supabase URL és key-eket
- Futtasd le a SQL schema-t
- Ellenőrizd a táblák létezését (Table Editor)

### Térkép nem tölt be
- Ellenőrizd a Google Maps API key-t
- Engedélyezd a 3 API-t (Maps, Places, Geocoding)
- Állítsd be a billing account-ot
- Korlátozd HTTP referrer-rel

### Cron job nem fut
- Ellenőrizd a `CRON_SECRET` környezeti változót
- Várj 30 percet az első futásra
- Nézd meg a Vercel Logs-ot
- Próbáld manuálisan (curl)

**Részletes hibaelhárítás: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#troubleshooting)**

## 🤝 Hozzájárulás

Jelenleg ez egy privát projekt, de örömmel fogadunk visszajelzéseket és javaslatokat!

## 📝 License

MIT License - Lásd a [LICENSE](LICENSE) fájlt

## 👨‍💻 Szerző

Készítette: Claude AI + Balazs  
Verzió: 1.0.0  
Utolsó frissítés: 2026. január

## 🔗 Hasznos linkek

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://app.supabase.com)
- [Google Cloud Console](https://console.cloud.google.com)
- [Anthropic Console](https://console.anthropic.com)
- [Resend Dashboard](https://resend.com/dashboard)

---

**Ha problémád van, először nézd meg a [DEPLOYMENT.md](docs/DEPLOYMENT.md) fájlt!**
