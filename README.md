# SmashMate

Prototipe aplikasi badminton: mabar, sesi latihan, event, rating antar peserta, permintaan sewa raket atau beli shuttlecock, profil, dan feedback.

## Teknologi

- Next.js App Router, React, JavaScript/JSX
- Tailwind CSS
- Supabase Auth, PostgreSQL, dan Storage
- npm

## Setup lokal

1. Salin `.env.example` ke `.env.local` dan isi URL serta publishable key dari Supabase.
2. Ketiga migrasi di [`supabase/migrations`](supabase/migrations) sudah diterapkan ke proyek Supabase SmashMate pada 28 Oktober 2026. Untuk proyek Supabase baru, jalankan berurutan: `smashmate_mvp`, `smashmate_ratings`, lalu `smashmate_history_hardening`. Migrasi ini membuat tabel, bucket foto privat, Row Level Security, dan fungsi bisnis.
3. Jalankan `npm install`, lalu `npm run dev`.
4. Buka `http://localhost:3000`.

Penghapusan akun memakai Supabase Edge Function `delete-account` yang sudah diterapkan pada proyek SmashMate. Kunci admin tetap tersimpan di lingkungan Supabase dan tidak perlu disalin ke `.env.local`. Untuk proyek Supabase baru, deploy [`supabase/functions/delete-account/index.js`](supabase/functions/delete-account/index.js) dengan verifikasi JWT aktif.

## Batas prototipe

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
