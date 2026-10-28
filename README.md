# SmashMate

SmashMate adalah prototipe platform badminton berbasis web yang dikembangkan untuk mata kuliah **Technopreneurship**. Project ini berangkat dari kesulitan pemain menemukan partner dengan jadwal dan tingkat kemampuan yang sesuai, serta hambatan pemain pemula yang belum memiliki raket atau circle bermain tetap.

Konsep bisnis SmashMate menggabungkan pencarian partner, booking lapangan mitra, dan informasi rental raket dalam satu platform. Implementasi saat ini berfokus pada alur pemain: membuat dan mengikuti aktivitas badminton, memberi rating, serta mengajukan kebutuhan perlengkapan. Prototipe ini menjadi dasar demonstrasi dan pengujian awal konsep bisnis dalam Business Model Lean Canvas (BMLC).

## Fitur saat ini

- Registrasi, login, dan logout menggunakan email dan password.
- Profil pemain dengan nama, level bermain, dan foto profil.
- Pembuatan dan partisipasi dalam mabar, sesi latihan, serta event komunitas dengan jadwal dan batas peserta.
- Rating antar peserta setelah jadwal aktivitas dimulai.
- Pengajuan dan pembatalan permintaan sewa raket atau pembelian shuttlecock.
- Pengiriman feedback dan penghapusan akun.
- Indikator loading pada tombol formulir dan navigasi halaman.

## Tech stack

| Bagian | Teknologi |
| --- | --- |
| Bahasa | JavaScript dan JSX |
| Framework | Next.js 16.4.3 dengan App Router |
| Antarmuka | React 19.3.1 |
| Styling | Tailwind CSS 4.3.3 dan CSS kustom |
| Backend aplikasi | Next.js Server Actions dan Route Handlers |
| Database | PostgreSQL melalui Supabase |
| Autentikasi | Supabase Auth dengan email dan password |
| Penyimpanan foto profil | Supabase Storage |
| Penghapusan akun | Supabase Edge Functions |
| Kontrol akses database | Row Level Security (RLS) |
| Integrasi Supabase | `@supabase/supabase-js` 2.118.0 dan `@supabase/ssr` 0.12.7 |
| Target hosting | Vercel |
| Version control | Git dan GitHub |
| Package manager | npm |
| Pemeriksaan kode | ESLint 9.39.5 dengan eslint-config-next 16.4.3 |
| Build bundler | Webpack melalui Next.js |

## Setup lokal

1. Salin `.env.example` ke `.env.local` dan isi URL serta publishable key dari Supabase.
2. Ketiga migrasi di [`supabase/migrations`](supabase/migrations) sudah diterapkan ke proyek Supabase SmashMate pada 28 Oktober 2026. Untuk proyek Supabase baru, jalankan berurutan: `smashmate_mvp`, `smashmate_ratings`, lalu `smashmate_history_hardening`. Migrasi ini membuat tabel, bucket foto privat, Row Level Security, dan fungsi bisnis.
3. Jalankan `npm ci`, lalu `npm run dev` (gunakan `npm.cmd` jika PowerShell membatasi skrip npm).
4. Buka `http://localhost:3000`.

Penghapusan akun memakai Supabase Edge Function `delete-account` yang sudah diterapkan pada proyek SmashMate. Kunci admin tetap tersimpan di lingkungan Supabase dan tidak perlu disalin ke `.env.local`. Untuk proyek Supabase baru, deploy [`supabase/functions/delete-account/index.js`](supabase/functions/delete-account/index.js) dengan verifikasi JWT aktif.

## Batas prototipe

- Seluruh akun masih berperan sebagai pemain. Dashboard admin dan pengelola lapangan/toko belum tersedia; fitur host belum dibatasi membership premium.
- Pencarian partner masih melalui daftar aktivitas yang dipilih pengguna. Matchmaking otomatis dan rekomendasi AI belum tersedia.
- Booking lapangan mitra, payment gateway, admin fee, dan monetisasi belum diimplementasikan.
- Permintaan perlengkapan menyimpan kebutuhan pemain. Belum ada stok, harga, mitra, pembayaran, atau pemenuhan pesanan. Status yang tersedia adalah terkirim dan dibatalkan.
- Sesi latihan dapat dibuat pengguna; verifikasi identitas coach belum tersedia.
- Rating tersedia untuk peserta aktivitas setelah jadwal dimulai. Aplikasi belum memiliki waktu selesai aktivitas atau moderasi rating.
- Aktivitas menggunakan waktu WIB pada form dan tampilan.
- Email confirmation dan URL redirect perlu diatur di Supabase Authentication sesuai domain hosting saat aplikasi diterbitkan.

## Validasi

Versi dependensi dikunci di `package.json` dan `package-lock.json`; gunakan `npm ci` untuk instalasi yang konsisten dengan deployment. ESLint tetap pada 9.39.5 karena plugin React, import, dan aksesibilitas bawaan `eslint-config-next` 16.4.3 belum mendukung ESLint 10. Peringatan deprecated ESLint saat instalasi masih dapat muncul sampai plugin tersebut mendukung versi baru.

```bash
npm run lint
npm run build
```

Aturan database sudah diuji lewat transaksi yang di-rollback: kepemilikan data, kapasitas aktivitas, penolakan host bergabung, rating antar peserta, penolakan rating ganda, dan penolakan rating dari bukan peserta. Untuk pengujian UI secara menyeluruh, buat dua akun uji. Dengan akun A buat aktivitas; dengan akun B bergabung, keluar, dan beri rating setelah jadwal aktivitas. Uji juga permintaan perlengkapan, feedback, unggah avatar, dan pembatasan halaman saat logout. Gunakan akun uji khusus sebelum menguji penghapusan akun.
