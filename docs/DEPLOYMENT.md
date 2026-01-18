# Telepítési Útmutató

Ez a dokumentum lépésről lépésre végigvezet a Rabat Ingatlanprojekt Követő alkalmazás telepítésén.

## Előfeltételek

Mielőtt elkezdenéd, szükséged lesz:

- GitHub account
- Vercel account (regisztrálj GitHub-bal)
- Supabase account (regisztrálj GitHub-bal)
- Google Cloud account (Maps API-hoz)
- Anthropic account (Claude API-hoz)
- Resend account (email-ekhez) - opcionális

**Becsült telepítési idő: 15-20 perc**

---

## 1. Lépés: GitHub Repository létrehozása

1. Menj a GitHub-ra és jelentkezz be
2. Kattints a `New repository` gombra
3. Repository név: `rabat-property-tracker`
4. Válaszd a `Private` opciót (ajánlott)
5. NE jelöld be a "Initialize with README" opciót
6. Kattints a `Create repository` gombra

7. A lokális gépeden:

```bash
# Lépj be a projekt könyvtárba
cd /path/to/rabat-property-tracker

# Inicializáld a git repo-t
git init

# Add hozzá az összes fájlt
git add .

# Commitolj
git commit -m "Initial commit"

# Add meg a remote repo-t (cseréld ki a your-username-et!)
git remote add origin https://github.com/your-username/rabat-property-tracker.git

# Push-old fel
git branch -M main
git push -u origin main
```

---

## 2. Lépés: Supabase projekt létrehozása

1. Menj a [Supabase](https://supabase.com) oldalra
2. Kattints a `Start your project` gombra
3. Jelentkezz be GitHub-bal
4. Kattints a `New project` gombra

### Projekt beállítások:

- **Organization**: Válaszd ki vagy hozz létre egyet
- **Name**: `rabat-property-tracker`
- **Database Password**: Generálj egy biztonságos jelszót (mentsd el!)
- **Region**: Válaszd a legközelebbit (pl. Frankfurt)
- **Pricing Plan**: Free

5. Kattints a `Create new project` gombra
6. Várj 2-3 percet, amíg a projekt létrejön

### Adatbázis séma létrehozása:

1. A Supabase Dashboard-on menj a `SQL Editor` menüpontba (bal oldali menü)
2. Kattints a `New query` gombra
3. Nyisd meg a `infrastructure/supabase-schema.sql` fájlt a projekt mappádból
4. Másold be a teljes tartalmát a SQL Editor-ba
5. Kattints a `Run` gombra (vagy CTRL+Enter)
6. Várj, amíg lefut (kb. 5-10 másodperc)
7. Ha minden jól ment, látnod kell: "Success. No rows returned"

### API kulcsok kimásolása:

1. Menj a `Settings` → `API` menüpontba
2. Másold ki és mentsd el a következőket:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public** key: `eyJhbGc...` (hosszú string)
   - **service_role** key: `eyJhbGc...` (hosszú string, ezt ne oszd meg senkivel!)

### Authentication beállítása:

1. Menj az `Authentication` → `Providers` menüpontba
2. Engedélyezd az **Email** provider-t (alapból engedélyezve)
3. Opcionálisan engedélyezd a **Google** provider-t:
   - Kövesd a Supabase útmutatóját Google OAuth beállításához
   - Szükséges: Google Cloud projekt és OAuth credentials

---

## 3. Lépés: Google Maps API beállítása

1. Menj a [Google Cloud Console](https://console.cloud.google.com)-ra
2. Jelentkezz be Google account-oddal

### Projekt létrehozása (ha még nincs):

1. Kattints a felső menüben a projekt kiválasztóra
2. Kattints a `New Project` gombra
3. Név: `Rabat Property Tracker`
4. Kattints a `Create` gombra

### API-k engedélyezése:

1. Menj a `APIs & Services` → `Library` menüpontba
2. Keresd meg és engedélyezd a következő API-kat:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**

### API Key létrehozása:

1. Menj a `APIs & Services` → `Credentials` menüpontba
2. Kattints a `Create Credentials` → `API Key` gombra
3. Másold ki az API key-t (mentsd el!)

### API Key korlátozása (FONTOS!):

1. Kattints az újonnan létrehozott API key mellett lévő ceruza ikonra
2. **Application restrictions**:
   - Válaszd a `HTTP referrers (web sites)` opciót
   - Add hozzá:
     - `http://localhost:3000/*` (lokális fejlesztéshez)
     - `https://your-app.vercel.app/*` (majd add meg később, amikor van)
3. **API restrictions**:
   - Válaszd a `Restrict key` opciót
   - Válaszd ki:
     - Maps JavaScript API
     - Places API
     - Geocoding API
4. Kattints a `Save` gombra

### Billing beállítása:

1. Menj a `Billing` menüpontba
2. Kösd össze egy billing account-tal (hitelkártya szükséges)
3. **NE AGGÓDJ**: Google ad $200 ingyenes kreditet havonta, ami általában elég

---

## 4. Lépés: Anthropic Claude API

1. Menj az [Anthropic Console](https://console.anthropic.com)-ra
2. Regisztrálj vagy jelentkezz be
3. Menj a `API Keys` menüpontba
4. Kattints a `Create Key` gombra
5. Név: `Rabat Property Tracker`
6. Másold ki az API key-t (mentsd el!)
7. **Fontos**: Add meg a billing info-kat (hitelkártya)
   - Becsült költség: $5-20/hó (használat függő)

---

## 5. Lépés: Resend Email (Opcionális)

Ha szeretnél email értesítéseket, használd a Resend-et (egyszerűbb mint SendGrid):

1. Menj a [Resend](https://resend.com) oldalra
2. Regisztrálj
3. Menj az `API Keys` menüpontba
4. Kattints a `Create API Key` gombra
5. Másold ki az API key-t

### Domain beállítás (később):

- Ha van saját domain-ed, add meg a DNS rekordokat
- Ha nincs, használhatod a Resend teszt domain-jét: `onboarding@resend.dev`

---

## 6. Lépés: Vercel Deployment

1. Menj a [Vercel](https://vercel.com) oldalra
2. Jelentkezz be GitHub-bal
3. Kattints az `Add New` → `Project` gombra
4. Importáld a `rabat-property-tracker` repo-t

### Build beállítások:

- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: Alapértelmezett (ne változtasd)
- **Output Directory**: Alapértelmezett (ne változtasd)

### Environment Variables beállítása:

Kattints az `Environment Variables` dropdown-ra és add meg az összeset:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
NOTIFICATION_EMAIL_FROM=notifications@yourdomain.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CRON_SECRET=valami_random_string_itt
```

**CRON_SECRET generálása:**

Terminálban futtasd:
```bash
openssl rand -base64 32
```

Vagy használj online generátort: https://generate-secret.vercel.app/32

5. Kattints a `Deploy` gombra
6. Várj 2-3 percet, amíg a deployment elkészül

### Deployment URL frissítése:

1. A deployment után kapsz egy URL-t: `https://your-app.vercel.app`
2. Menj vissza a Vercel Project Settings → Environment Variables-hoz
3. Frissítsd a `NEXT_PUBLIC_APP_URL` értékét az új URL-re
4. Redeploy az alkalmazást (Deployments → ⋯ → Redeploy)

### Google Maps API referrer frissítése:

1. Menj vissza a Google Cloud Console-ra
2. Credentials → API Key → Edit
3. Add hozzá a HTTP referrer-hez: `https://your-app.vercel.app/*`
4. Save

---

## 7. Lépés: Cron Job beállítása

A Vercel automatikusan beállítja a cron job-ot a `vercel.json` alapján. Ellenőrzés:

1. Vercel Dashboard → Project → Settings → Cron Jobs
2. Látnod kell:
   - Path: `/api/cron/search-properties`
   - Schedule: `*/30 * * * *` (minden 30 percben)

### Manuális teszt:

Futtasd le manuálisan a cron job-ot:

```bash
curl -X GET "https://your-app.vercel.app/api/cron/search-properties" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Ha minden jól megy, választ kapsz:
```json
{
  "success": true,
  "totalFound": 5,
  "newPropertiesAdded": 3,
  "executionTimeMs": 15234
}
```

---

## 8. Lépés: Első bejelentkezés és teszt

1. Menj a deployed app URL-re: `https://your-app.vercel.app`
2. Kattints a `Bejelentkezés` gombra
3. Regisztrálj egy új account-ot
4. Erősítsd meg az email címedet (Supabase emailt küld)
5. Jelentkezz be

### Ellenőrizd:

- [ ] Dashboard betölt
- [ ] Projektek listája megjelenik (ha a cron job már futott)
- [ ] Térkép betölt
- [ ] Szűrők működnek
- [ ] Watchlist működik (csillag ikon)

---

## 9. Lépés: Email értesítések tesztelése

1. Menj a Settings oldalra
2. Engedélyezd az email értesítéseket
3. Várj egy új projektre vagy triggereld manuálisan

---

## Troubleshooting

### Probléma: "Database error" a bejelentkezésnél

**Megoldás:**
1. Ellenőrizd a Supabase URL és key-eket
2. Ellenőrizd, hogy a SQL schema lefutott-e
3. Supabase Dashboard → Table Editor → ellenőrizd, hogy léteznek-e a táblák

### Probléma: Térkép nem tölt be

**Megoldás:**
1. Ellenőrizd a Google Maps API key-t
2. Ellenőrizd, hogy a 3 API engedélyezve van-e
3. Ellenőrizd a billing account-ot
4. Ellenőrizd a HTTP referrer beállítást

### Probléma: Cron job nem fut

**Megoldás:**
1. Vercel Dashboard → Deployments → Logs
2. Ellenőrizd a `CRON_SECRET` környezeti változót
3. Várj 30 percet az első futásra
4. Próbáld meg manuálisan (curl parancs)

### Probléma: "ANTHROPIC_API_KEY is not set"

**Megoldás:**
1. Vercel Dashboard → Settings → Environment Variables
2. Ellenőrizd, hogy az `ANTHROPIC_API_KEY` be van-e állítva
3. Redeploy az alkalmazást

---

## Következő lépések

Miután minden működik:

1. **Testre szabás:**
   - Állítsd be az email értesítési preferenciáidat
   - Mentsd el a kedvenc projektjeidet
   - Állítsd be a szűrőket

2. **Kollégák meghívása:**
   - Oszd meg az app URL-t
   - Regisztrálhatnak saját account-tal
   - Minden felhasználó saját watchlist-et és beállításokat kap

3. **Monitorozás:**
   - Vercel Analytics: Látod a látogatók számát
   - Supabase Dashboard: Látod az adatbázis használatát
   - Google Cloud Console: Látod a Maps API használatot

4. **Költségek figyelése:**
   - Vercel: Ingyenes legfeljebb 100GB bandwidth-ig
   - Supabase: Ingyenes legfeljebb 500MB DB-ig
   - Google Maps: $200/hó kredit
   - Anthropic: Figyeld a használatot

---

## Hasznos linkek

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com
- **Google Cloud Console**: https://console.cloud.google.com
- **Anthropic Console**: https://console.anthropic.com
- **Resend Dashboard**: https://resend.com/dashboard

---

## Segítségkérés

Ha bármi problémád van:

1. Ellenőrizd a logs-okat:
   - Vercel: Deployments → Logs
   - Supabase: Logs Explorer
   - Browser: Console (F12)

2. Nézd meg a GitHub Issues-t

3. Kérdezz a fejlesztőtől

---

**Gratulálok! Az alkalmazás élesben van! 🎉**
