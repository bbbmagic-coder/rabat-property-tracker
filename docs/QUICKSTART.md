# 🚀 Gyors Kezdés - 5 Perc

Ha nincs időd a teljes telepítési útmutatóra, itt van a minimum, amivel el tudsz indulni:

## 1️⃣ Létrehozások (5 perc)

1. **GitHub**: Fork this repo
2. **Supabase**: New project → Run SQL schema
3. **Google Maps**: Enable APIs → Get API key
4. **Anthropic**: Get API key
5. **Vercel**: Import project → Add env vars → Deploy

## 2️⃣ Környezeti változók (copy-paste)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CRON_SECRET=$(openssl rand -base64 32)
```

## 3️⃣ Ellenőrzés (1 perc)

- [ ] App URL-re kattintasz → Oldal betölt
- [ ] Regisztrálsz → Email érkezik
- [ ] Bejelentkezel → Dashboard látszik
- [ ] 30 perc múlva → Első projektek megjelennek

## ❗ Ha valami nem működik

1. **Logs**: Vercel Dashboard → Deployments → Logs
2. **Database**: Supabase Dashboard → Table Editor → Check tables exist
3. **API Keys**: Double-check all environment variables

## 📖 Részletek

Ha bármi nem világos: [DEPLOYMENT.md](DEPLOYMENT.md)

---

**⏱️ Most már csak várnod kell 30 percet, hogy a cron job lefusson és az első projektek megjelenjenek!**
