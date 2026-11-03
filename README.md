# SmashMate

SmashMate adalah prototipe platform badminton untuk mata kuliah **Technopreneurship**. Konsepnya menggabungkan pencarian partner, aktivitas bersama, booking lapangan Mitra GOR, sewa raket, dan pembelian shuttlecock dalam satu aplikasi. Alurnya mendemonstrasikan gagasan dalam Business Model Lean Canvas (BMLC).

## Fitur saat ini

- Registrasi, konfirmasi email, login, logout, profil pemain, foto profil, dan penghapusan akun.
- Pembuatan dan partisipasi dalam mabar, sesi latihan, dan event, termasuk rating antar peserta setelah bermain.
- Profil coach sebagai fitur tambahan akun pemain, serta komunitas yang dapat mengadakan event.
- Direktori Mitra GOR, booking lapangan, sewa raket saat booking, dan katalog pembelian shuttlecock dengan foto, stok, serta harga.
- Panel Mitra GOR untuk jumlah dan harga lapangan, deskripsi, lokasi Google Maps, katalog, dan daftar booking atas nama pemain.
- Panel operator internal untuk membuat akun Mitra GOR secara langsung. Pendaftaran publik hanya membuat akun pemain.
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
- **Mitra GOR:** operator membuat akun dengan email yang belum terdaftar dan menerima kata sandi awal sekali. Operator memberikannya langsung kepada Mitra. Saat login pertama, Mitra wajib mengganti kata sandi di `/partner/password`, lalu melengkapi GOR di `/partner/setup`. Mitra tidak dapat mendaftar langsung.

Tidak ada email undangan untuk Mitra. Akun yang dibuat operator langsung dapat dipakai dengan kata sandi awal. Konfirmasi email pemain umum tetap menggunakan pengaturan URL Supabase Auth; sebelum hosting, arahkan **Site URL** dan **Redirect URLs** ke domain aplikasi.

## Batas prototipe

- Checkout mengonfirmasi booking atau pesanan tanpa penagihan uang. Slot lapangan dan stok shuttlecock tetap dihitung di database.
- Profil coach dibuat sendiri oleh pemain dan belum melalui verifikasi sertifikasi.
- GOR dan katalog akan kosong sampai operator membuat akun Mitra dan Mitra mengisi data. Tidak ada GOR atau ulasan contoh buatan.
- Sewa raket hanya tersedia sebagai tambahan booking lapangan dan dihitung per sesi.
- Pencarian partner menggunakan daftar aktivitas; matchmaking otomatis, rekomendasi AI, payment gateway, dan monetisasi belum tersedia.
- Rating tersedia setelah jadwal aktivitas dimulai. Moderasi rating belum tersedia.
- Jadwal ditampilkan dalam WIB.

## Validasi

Versi dependensi dikunci di `package.json` dan `package-lock.json`; gunakan `npm ci` untuk instalasi yang konsisten dengan deployment. ESLint tetap pada 9.39.5 karena plugin bawaan `eslint-config-next` 16.4.3 belum mendukung ESLint 10.

```bash
npm run lint
npm run build
```

Aturan booking, konflik slot, harga, stok, checkout, pembatalan, dan akses data telah diuji dalam transaksi database yang di-rollback. Pengujian pembuatan akun Mitra secara penuh memerlukan email Mitra baru dan sesi operator pada aplikasi lokal.
