# SmashMate

SmashMate adalah prototipe platform badminton untuk mata kuliah **Technopreneurship**. Konsepnya menggabungkan pencarian partner, aktivitas bersama, booking lapangan Mitra GOR, sewa raket, dan pembelian shuttlecock dalam satu aplikasi. Alurnya mendemonstrasikan gagasan dalam Business Model Lean Canvas (BMLC).

## Fitur saat ini

- Registrasi, konfirmasi email, login, logout, profil pemain, foto profil, dan penghapusan akun.
- Pembuatan dan partisipasi dalam mabar, sesi latihan, dan event, termasuk rating antar peserta setelah bermain.
- Profil coach sebagai fitur tambahan akun pemain, serta komunitas yang dapat mengadakan event.
- Direktori Mitra GOR dan booking lapangan oleh host, termasuk sewa raket per sesi dan pembelian shuttlecock per slop dalam satu booking. Mitra dapat menambahkan foto produk.
- Panel Mitra GOR untuk jumlah dan harga lapangan, deskripsi, lokasi Google Maps, katalog, dan daftar booking atas nama pemain.
- Panel operator internal untuk membuat akun Mitra GOR secara langsung. Lima akun Mitra awal sudah terhubung ke GOR masing-masing. Pendaftaran publik hanya membuat akun pemain.
- Checkout simulasi tanpa perpindahan uang, feedback, serta indikator loading pada formulir dan navigasi.

## Tech stack

| Bagian | Teknologi |
| --- | --- |
| Bahasa | JavaScript dan JSX |
| Framework | Next.js 16.4.3 dengan App Router |
| Antarmuka | React 19.3.1 |
| Styling | Tailwind CSS 4.3.3 dan CSS kustom |
| Backend aplikasi | Next.js Server Actions, Route Handlers, dan Supabase Edge Functions |
| Database | PostgreSQL melalui Supabase |
| Autentikasi | Supabase Auth dengan email dan password |
| Penyimpanan foto | Supabase Storage |
| Kontrol akses database | Row Level Security (RLS) |
| Integrasi Supabase | `@supabase/supabase-js` 2.118.0 dan `@supabase/ssr` 0.12.7 |
| Target hosting | Vercel |
| Version control | Git dan GitHub |
| Package manager | npm |
| Pemeriksaan kode | ESLint 9.39.5 dengan eslint-config-next 16.4.3 |
| Build bundler | Webpack melalui Next.js |

## Menjalankan lokal

1. Salin `.env.example` menjadi `.env.local` dan isi URL serta publishable key Supabase.
2. Jalankan `npm ci`, lalu `npm run dev` (gunakan `npm.cmd` jika PowerShell membatasi skrip npm).
3. Buka `http://localhost:3000`.
4. Untuk proyek Supabase baru, terapkan seluruh file di [`supabase/migrations`](supabase/migrations) sesuai urutan nama. Semua migrasi sudah diterapkan pada proyek SmashMate saat ini.
5. Deploy [`delete-account`](supabase/functions/delete-account/index.js) dan [`provision-partner`](supabase/functions/provision-partner/index.js) dengan verifikasi JWT aktif. Kunci admin hanya berada di lingkungan Edge Function, bukan di frontend. Fungsi lama `invite-partner` dinonaktifkan.

## Alur akun

- **Pemain:** daftar, konfirmasi email, lalu gunakan dashboard. Coach adalah profil tambahan dalam akun pemain; paket premium belum dirancang.
- **Operator:** administrator Supabase menetapkan `app_metadata.smashmate_role = "operator"` pada akun internal. Akun operator proyek saat ini sudah ditetapkan. Masuk ulang agar token memuat peran baru, lalu buka `/operator`.
- **Mitra GOR:** operator membuat akun dengan email yang belum terdaftar dan menerima kata sandi awal sekali. Operator memberikannya langsung kepada Mitra. Saat login pertama, Mitra wajib mengganti kata sandi di `/partner/password`, lalu melengkapi GOR di `/partner/setup`. Mitra tidak dapat mendaftar langsung. Lima GOR awal sudah terisi dan masing-masing dimiliki akun Mitra; setelah mengganti kata sandi, Mitra langsung masuk ke panelnya.

## Data awal GOR

Proyek Supabase saat ini berisi 5 GOR untuk uji coba: GOR Kencana Grogol, Karawaci Badminton Center, Senayan Shuttle Arena, Bekasi Racket Hall, dan Depok Smash Court. Nama ini digunakan sebagai data contoh, bukan klaim kemitraan dengan tempat nyata. Total ada **15 lapangan** dan **20 item perlengkapan**. Setiap GOR memiliki dua pilihan merek raket sewa dan dua pilihan merek shuttlecock. Harga raket berlaku per sesi booking dan stoknya berarti jumlah raket. Shuttlecock dijual per slop (12 buah pada data awal) dan stoknya berarti jumlah slop. Harga dan stok berbeda menurut GOR serta merek.

File [`supabase/seed/20261103_initial_venues.sql`](supabase/seed/20261103_initial_venues.sql) berisi data awal tersebut dan hanya dijalankan sekali pada proyek baru. Pada proyek Supabase SmashMate saat ini, kelima akun Mitra sudah dibuat dan GOR sudah dipasangkan. Tombol khusus untuk pembuatan massal akun awal telah dihapus; operator tetap dapat membuat satu akun Mitra baru melalui `/operator`.

## Alur host dan data aktivitas

Host memilih GOR, lapangan, waktu, raket sewa, dan shuttlecock pada satu formulir booking. Setelah checkout simulasi dikonfirmasi, host dapat membuat mabar, latihan, atau event menggunakan booking tersebut. Peserta hanya perlu bergabung ke aktivitas dan tidak membuat pesanan perlengkapan sendiri. Pembelian shuttlecock terpisah sudah dinonaktifkan.

Data uji coba saat ini mencakup 10 akun pemain, 2 profil coach, 3 komunitas, 8 aktivitas (termasuk dua lomba), 39 partisipasi, dan 8 booking host. File [`supabase/seed/20261103_active_sample_data.sql`](supabase/seed/20261103_active_sample_data.sql) berisi profil dan kegiatan tersebut tanpa password; jalankan hanya sekali setelah akun pemainnya tersedia. Nama akun dan aktivitas adalah data contoh untuk prototipe. Tidak ada rating atau ulasan buatan.

Tidak ada email undangan untuk Mitra. Akun yang dibuat operator langsung dapat dipakai dengan kata sandi awal. Konfirmasi email pemain umum tetap menggunakan pengaturan URL Supabase Auth; sebelum hosting, arahkan **Site URL** dan **Redirect URLs** ke domain aplikasi.

## Batas prototipe

- Checkout mengonfirmasi booking host tanpa penagihan uang. Slot lapangan dan stok shuttlecock tetap dihitung di database.
- Profil coach dibuat sendiri oleh pemain dan belum melalui verifikasi sertifikasi.
- Kelima GOR serta seluruh harga dan stok awal adalah data contoh untuk tugas; belum ada ulasan buatan. GOR Mitra lain dapat ditambahkan oleh operator.
- Sewa raket dan pembelian shuttlecock hanya tersedia sebagai tambahan booking lapangan oleh host.
- Pencarian partner menggunakan daftar aktivitas; matchmaking otomatis, rekomendasi AI, payment gateway, dan monetisasi belum tersedia.
- Rating tersedia setelah jadwal aktivitas dimulai. Moderasi rating belum tersedia.
- Jadwal ditampilkan dalam WIB.

## Validasi

Versi dependensi dikunci di `package.json` dan `package-lock.json`; gunakan `npm ci` untuk instalasi yang konsisten dengan deployment. ESLint tetap pada 9.39.5 karena plugin bawaan `eslint-config-next` 16.4.3 belum mendukung ESLint 10.

```bash
npm run lint
npm run build
```

Aturan booking, konflik slot, harga, stok, checkout, pembatalan, dan akses data telah diuji dalam transaksi database yang di-rollback. Data awal juga diuji untuk harga gabungan lapangan, raket, dan shuttlecock beserta pengurangan serta pemulihan stok. Seluruh aktivitas uji coba telah diverifikasi memakai booking yang dimiliki host pada waktu yang sama.
