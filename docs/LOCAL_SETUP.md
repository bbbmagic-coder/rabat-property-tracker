# 🏠 Lokális Telepítés - Docker Compose

Ez az útmutató leírja, hogyan futtathatod az alkalmazást a saját gépeden Docker Compose-zal, **Supabase nélkül**.

## Előnyök

✅ **Egyszerűbb**: Nem kell Supabase account  
✅ **Gyorsabb**: Lokális adatbázis  
✅ **Ingyenes**: Minden a gépeden fut  
✅ **Offline**: Internet csak az AI kereséshez kell  
✅ **Teljes kontroll**: Látod mi történik  

## Előfeltételek

- Docker Desktop telepítve
- API kulcsok:
  - Google Maps API key
  - Anthropic API key
  - (Opcionális) Resend API key

**Becsült telepítési idő: 5-10 perc**

---

## 1. Lépés: Docker Desktop telepítése

### Windows/Mac:
1. Töltsd le: https://www.docker.com/products/docker-desktop
2. Telepítsd
3. Indítsd el a Docker Desktop-ot
4. Várj, amíg elindul (taskbar icon zöld)

### Linux:
```bash
# Docker Engine telepítése
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose telepítése
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# User hozzáadása a docker csoporthoz
sudo usermod -aG docker $USER
newgrp docker
```

---

## 2. Lépés: API kulcsok beszerzése

### Google Maps API
1. Menj a [Google Cloud Console](https://console.cloud.google.com)-ra
2. Hozz létre projektet
3. Engedélyezd: Maps JavaScript API, Places API, Geocoding API
4. Hozz létre API key-t
5. **Fontos**: Korlátozd HTTP referrer-rel: `http://localhost:3000/*`

### Anthropic Claude API
1. Menj az [Anthropic Console](https://console.anthropic.com)-ra
2. Hozz létre API key-t
3. Másold ki

### Resend (Opcionális - email-ekhez)
1. Menj a [Resend](https://resend.com)-ra
2. Hozz létre API key-t
3. Másold ki

---

## 3. Lépés: Környezeti változók beállítása

Hozz létre egy `.env` fájlt a projekt gyökér könyvtárában:

```bash
# Linux/Mac
cp .env.example .env

# Windows
copy .env.example .env
```

Nyisd meg a `.env` fájlt és töltsd ki:

```env
# Google Maps (KÖTELEZŐ)
GOOGLE_MAPS_API_KEY=AIzaSy...

# Anthropic (KÖTELEZŐ)
ANTHROPIC_API_KEY=sk-ant-...

# Email (OPCIONÁLIS)
RESEND_API_KEY=re_...
NOTIFICATION_EMAIL_FROM=notifications@localhost

# Cron secret (generálj egy random stringet)
CRON_SECRET=valami-random-string-ide

# NextAuth secret (generálj egy random stringet)
NEXTAUTH_SECRET=masik-random-string-ide
```

**Random string generálása:**

Linux/Mac:
```bash
openssl rand -base64 32
```

Windows (PowerShell):
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([guid]::NewGuid().ToString()))
```

Vagy használj online generátort: https://generate-secret.vercel.app/32

---

## 4. Lépés: Alkalmazás indítása

```bash
# Projekt könyvtárba lépés
cd rabat-property-tracker

# Konténerek indítása
docker-compose up -d

# Logok követése (opcionális)
docker-compose logs -f
```

**Mit csinál ez?**
1. Létrehoz egy PostgreSQL+PostGIS adatbázist
2. Futtatja az SQL schema-t (táblák, indexek, seed adatok)
3. Elindítja a Next.js frontend-et
4. Elindít egy cron simulatort (30 percenként keres projekteket)

**Első indítás:** 2-3 percet várj, amíg minden felépül.

---

## 5. Lépés: Alkalmazás megnyitása

Nyisd meg a böngészőben: **http://localhost:3000**

✅ Ha betölt az oldal, minden működik!

---

## 6. Lépés: Első projektek

A cron job **30 percenként** automatikusan keres új projekteket.

**Manuális keresés indítása (ha nem akarsz várni):**

```bash
# Terminálban
curl -X GET "http://localhost:3000/api/cron/search-properties" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Vagy egyszerűen nyisd meg böngészőben (authentication nélkül is működik lokálisan):
```
http://localhost:3000/api/cron/search-properties
```

---

## 7. Lépés: Regisztráció és bejelentkezés

1. Menj a **http://localhost:3000/auth** oldalra
2. Regisztrálj (email + jelszó)
3. Jelentkezz be

**Megjegyzés**: Lokális verzióban nincs email megerősítés, azonnal használhatod.

---

## Konténerek kezelése

### Állapot ellenőrzése
```bash
docker-compose ps
```

### Logok megtekintése
```bash
# Összes konténer
docker-compose logs -f

# Csak frontend
docker-compose logs -f frontend

# Csak adatbázis
docker-compose logs -f postgres

# Csak cron
docker-compose logs -f cron-simulator
```

### Leállítás
```bash
docker-compose down
```

### Újraindítás
```bash
docker-compose restart
```

### Teljes törlés (adatbázissal együtt)
```bash
docker-compose down -v
```

### Újraépítés (ha kódot módosítottál)
```bash
docker-compose up -d --build
```

---

## Adatbázis elérése

### Kapcsolódás psql-lel
```bash
docker-compose exec postgres psql -U postgres -d rabat_tracker
```

### Adatok megtekintése
```sql
-- Összes projekt
SELECT id, title, district, investment_score FROM properties;

-- Összes fejlesztő
SELECT name, rating, total_projects FROM developers;

-- Keresési napló
SELECT * FROM search_logs ORDER BY created_at DESC LIMIT 10;
```

### Adatbázis backup
```bash
docker-compose exec postgres pg_dump -U postgres rabat_tracker > backup.sql
```

### Adatbázis visszatöltés
```bash
docker-compose exec -T postgres psql -U postgres rabat_tracker < backup.sql
```

---

## Hibaelhárítás

### Port már használatban (3000 vagy 5432)

**Probléma**: `Error: Port 3000 already in use`

**Megoldás 1** - Más port használata:

Módosítsd a `docker-compose.yml`-t:
```yaml
frontend:
  ports:
    - "3001:3000"  # Host port 3001, container port 3000
```

**Megoldás 2** - Meglévő folyamat leállítása:

Windows:
```powershell
# Port használó folyamat keresése
netstat -ano | findstr :3000
# Folyamat leállítása (PID-el)
taskkill /PID <PID> /F
```

Linux/Mac:
```bash
# Port használó folyamat keresése
lsof -i :3000
# Folyamat leállítása
kill -9 <PID>
```

### Adatbázis nem indul el

```bash
# Logok ellenőrzése
docker-compose logs postgres

# Konténer újraindítása
docker-compose restart postgres

# Ha továbbra sem működik, töröld és hozd újra létre
docker-compose down -v
docker-compose up -d
```

### Frontend nem éri el az adatbázist

```bash
# Ellenőrizd, hogy a postgres konténer fut-e
docker-compose ps

# Hálózat ellenőrzése
docker-compose exec frontend ping postgres

# Ha nem működik, építsd újra
docker-compose down
docker-compose up -d --build
```

### Cron job nem keres projekteket

```bash
# Ellenőrizd a cron konténer logjait
docker-compose logs -f cron-simulator

# Manuálisan futtasd a keresést
curl -X GET "http://localhost:3000/api/cron/search-properties" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Ha 401 Unauthorized, ellenőrizd a CRON_SECRET-et a .env-ben
```

### Google Maps nem tölt be

1. Ellenőrizd a API key-t a `.env`-ben
2. Ellenőrizd, hogy a 3 API engedélyezve van-e a Google Cloud-ban
3. Ellenőrizd a HTTP referrer korlátozást: `http://localhost:3000/*`
4. Ellenőrizd a billing account státuszát

---

## Teljesítmény optimalizálás

### Több CPU/RAM allokálása Docker-nek

**Docker Desktop → Settings → Resources:**
- CPUs: 4 (ajánlott)
- Memory: 4 GB (ajánlott)

### Fejlesztői mód kikapcsolása (production build)

Ha gyorsabb betöltést szeretnél:

Módosítsd a `docker-compose.yml`-t:
```yaml
frontend:
  environment:
    NODE_ENV: production
  command: sh -c "npm run build && npm start"
```

---

## Költségek

Lokális verzióban:
- ✅ Hosting: **Ingyenes** (a saját gépeden fut)
- ✅ Adatbázis: **Ingyenes** (lokális PostgreSQL)
- ⚠️ Google Maps: **$200/hó kredit** (általában elég)
- ⚠️ Anthropic: **~$5-20/hó** (használat függő)
- ✅ Email: **Ingyenes** (ha használod a Resend-et, 3000/hó)

**Összesen**: ~$5-20/hó (csak az AI keresés)

---

## Frissítés

Ha új verziót töltesz le:

```bash
# Leállítás
docker-compose down

# Kód frissítése (git pull vagy új fájlok)
git pull

# Újraépítés és indítás
docker-compose up -d --build
```

---

## Production deployment

Ha végül online szeretnéd futtatni:

1. Használd a Vercel + Supabase verziót (lásd `docs/DEPLOYMENT.md`)
2. Vagy host-old Docker-rel VPS-en (DigitalOcean, AWS, stb.)

**VPS hosting Docker-rel:**
```bash
# VPS-en
git clone https://github.com/your-username/rabat-property-tracker.git
cd rabat-property-tracker
cp .env.example .env
# Töltsd ki a .env-et
docker-compose -f docker-compose.prod.yml up -d
```

---

## Összefoglalás

| Lépés | Parancs | Idő |
|-------|---------|-----|
| 1. Docker Desktop | Telepítés | 5 perc |
| 2. API kulcsok | Google + Anthropic | 5 perc |
| 3. .env beállítás | `cp .env.example .env` | 2 perc |
| 4. Indítás | `docker-compose up -d` | 3 perc |
| 5. Megnyitás | http://localhost:3000 | azonnal |
| **Összesen** | | **15 perc** |

---

## Hasznos parancsok összefoglalva

```bash
# Indítás
docker-compose up -d

# Leállítás
docker-compose down

# Logok
docker-compose logs -f

# Újraindítás
docker-compose restart

# Adatbázis shell
docker-compose exec postgres psql -U postgres -d rabat_tracker

# Manuális cron futtatás
curl http://localhost:3000/api/cron/search-properties

# Teljes törlés
docker-compose down -v
```

---

**Gratulálok! Az alkalmazás fut a gépeden! 🎉**

**Next steps:**
1. Várd meg az első projekteket (30 perc)
2. Regisztrálj és jelentkezz be
3. Nézd meg a Dashboard-ot
4. Add hozzá a kedvenceidhez
5. Állítsd be a szűrőket

**Ha bármi nem világos**: `docs/DEPLOYMENT.md` (online verzió) vagy kérdezz!
