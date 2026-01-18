import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🏢 Rabat Ingatlanprojekt Követő
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Rabat környéki ingatlanfejlesztési projektek automatikus követése,
            térképes megjelenítéssel és befektetési potenciál értékeléssel
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-semibold mb-2">Automatikus keresés</h3>
              <p className="text-sm text-gray-600">
                30 percenként új projektek keresése
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-3">🗺️</div>
              <h3 className="font-semibold mb-2">Térkép nézet</h3>
              <p className="text-sm text-gray-600">
                Google Maps integráció
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold mb-2">Befektetési score</h3>
              <p className="text-sm text-gray-600">
                Automatikus értékelés 0-100 skálán
              </p>
            </div>
          </div>

          <div className="space-x-4">
            <Link
              href="/dashboard"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/auth"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
            >
              Bejelentkezés
            </Link>
          </div>

          <div className="mt-16 bg-white p-8 rounded-lg shadow-md text-left">
            <h2 className="text-2xl font-bold mb-4">Főbb funkciók</h2>
            <ul className="space-y-2 text-gray-700">
              <li>✅ Automatikus projekt keresés 30 percenként</li>
              <li>✅ RSS-szerű feed a legújabb projektekkel</li>
              <li>✅ Térkép nézet Google Maps-szel</li>
              <li>✅ Lokáció értékelés (egyetem, iskola, tömegközlekedés, stb.)</li>
              <li>✅ Árelemzés és trendek</li>
              <li>✅ Fejlesztői profil és értékelés</li>
              <li>✅ Építési fázis követés</li>
              <li>✅ Befektetési potenciál score (0-100)</li>
              <li>✅ Szűrők: ár, lokáció, fejlesztő, stb.</li>
              <li>✅ Email értesítések új projektekről</li>
              <li>✅ Heti riport automatikus küldése</li>
              <li>✅ Watchlist: kedvenc projektek mentése</li>
              <li>✅ Projektek összehasonlítása</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
