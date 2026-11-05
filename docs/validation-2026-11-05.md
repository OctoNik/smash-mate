# Validasi alur SmashMate - 5 November 2026

## Ruang lingkup

Pemeriksaan kode, database Supabase proyek SmashMate, SDK dengan sesi akun demo, rendering HTTP build produksi lokal, serta interaksi browser. Pemeriksaan ini tidak menjamin aplikasi bebas dari seluruh bug. Domain Vercel tidak diberikan sehingga deployment hosting tidak diperiksa langsung.

Peran yang dicakup: tamu, Pemain, host, anggota/admin/pendiri komunitas, Mitra GOR aktif, Mitra yang wajib mengganti password awal, dan Operator.

## Hasil

| Pemeriksaan | Hasil |
| --- | --- |
| Regresi database/RLS | 61 dari 61 skenario lolos; seluruh data uji di-rollback |
| Integrasi SDK/Storage/Edge Functions dengan kredensial valid | 30 dari 30 pemeriksaan lolos |
| Login seluruh daftar akun demo yang diberikan | 15 berhasil, 2 kredensial ditolak |
| Rendering halaman dan redirect peran | 80 dari 80 pemeriksaan lolos |
| ESLint dan build produksi | Lolos setelah perubahan aplikasi |
| UI browser | Buat dan edit kegiatan; gabung/keluar, perubahan kuota, buka kembali/batalkan dialog; checkout nonaktif sebelum slot dipilih, aktif sesudah dipilih, nonaktif kembali saat slot dilepas |
| Kebersihan fixture integrasi | Akun mitra sementara, komunitas, GOR, gambar uji dan aktivitas UI telah dibersihkan |

## Bug yang diperbaiki

1. **Tombol submit mengabaikan `disabled`.** `SubmitButton` sekarang menggabungkan kondisi dari pemanggil dan status pending. Checkout tidak dapat dikirim sebelum jam bermain dipilih.
2. **Anggota baru dapat mengangkat diri menjadi admin komunitas melalui API.** RLS INSERT kini hanya mengizinkan peran `member`; pengangkatan admin tetap dilakukan pendiri melalui UPDATE.
3. **Pembatalan booking terjebak setelah aktivitas dibatalkan.** RPC sekarang memblokir aktivitas aktif dan undangan sparring pending, tetapi mengizinkan pembatalan setelah keduanya dibatalkan. Histori tetap disimpan dan stok shuttlecock dikembalikan.
4. **Jadwal aktivitas dapat berbeda dari booking lewat API.** Referensi kolom RLS diperjelas dan trigger memverifikasi host, status konfirmasi, jam mulai dan durasi booking. Indeks unik membatasi satu aktivitas aktif per booking.
5. **Kapasitas kegiatan dapat diperkecil di bawah jumlah peserta melalui API.** Trigger menolak kapasitas di bawah jumlah peserta termasuk host.
6. **Unggahan foto GOR/produk ditolak.** Nama kolom di kebijakan storage sebelumnya merujuk `venues.name`. Kini seluruh kebijakan memakai `storage.objects.name` secara eksplisit.
7. **Booking yang sedang berlangsung hilang dari daftar slot sibuk.** RPC ketersediaan sekarang memakai `ends_at > now()` sehingga booking yang sudah dimulai tetap dihitung.
8. **Pembatasan panel Mitra belum konsisten.** Halaman dan Server Actions Mitra memakai `requirePartnerAccount`; Pemain dan Operator diarahkan ke halaman perannya.
9. **RPC bergabung dapat dipanggil Mitra.** `join_activity` kini memeriksa peran Pemain selain identitas, jadwal, status, duplikasi dan kapasitas.
10. **Histori aktivitas batal dianggap masih memakai booking di formulir.** Daftar booking yang tersedia dan tautan dari booking kini hanya memperhitungkan aktivitas aktif.

Pesan kesalahan rating juga diperjelas: aktivitas harus sudah berakhir dan pasangan pemberi/penerima belum dinilai untuk aktivitas yang sama.

## Cakupan regresi database

- Tamu tidak dapat membaca rating privat atau bergabung.
- Host tidak dapat bergabung ke aktivitasnya sendiri; peserta dapat bergabung/keluar; duplikasi ditolak; pengguna lain tidak dapat mengubah kegiatan host.
- Rating hanya setelah selesai, oleh peserta/host, bukan ke diri sendiri; nilai di luar 1-5 dan duplikasi ditolak; penerima dapat membaca ratingnya, pengguna lain tidak.
- Komunitas: anggota biasa tidak bisa mempromosikan diri; pendiri dapat menunjuk admin; admin dapat menambah galeri tetapi tidak mengganti identitas komunitas.
- Booking multi-produk: total dihitung server, konflik waktu ditolak, stok raket diperiksa, shuttlecock berkurang dan pulih setelah pembatalan, pihak lain tidak bisa membaca/membayar/membatalkan booking.
- Host dapat mengaitkan aktivitas dengan booking terkonfirmasi; jadwal yang salah ditolak; aktivitas aktif menghalangi pembatalan; histori batal tetap ada setelah booking dibatalkan.
- Mitra dapat melihat booking GOR-nya, mengubah lapangan/stok, dan menambah periode tutup; Pemain tidak bisa mengubah produk Mitra; tanggal tutup tidak dapat dipesan.
- Sparring: kirim undangan, penolakan penerimaan oleh pengirim, penerimaan pengurus lawan, pembentukan aktivitas, penolakan penerimaan ganda, pengubahan deskripsi oleh pengurus dan penolakan pengguna luar.

## Cakupan integrasi langsung

Login dan refresh session; pembacaan aktivitas/peserta, katalog, booking pribadi dan rating profil; akses anonim; penolakan provisioning oleh Pemain; penolakan hapus akun dengan konfirmasi salah; pembuatan dan pembersihan komunitas; unggahan/baca/hapus identitas dan galeri; unggahan foto GOR; pembuatan Mitra oleh Operator; validasi password awal; penggantian password pada akun sementara; unggah/ganti/baca avatar pada akun sementara; setup/publikasi GOR; penghapusan akun sementara dengan password yang benar.

Tidak ada password atau token di skrip/report. Skrip menerima kredensial dari environment proses `QA_ACCOUNTS_JSON`. Nama fixture memakai prefix `qa-` dan UUID. Penghapusan positif hanya dilakukan pada akun khusus yang dibuat untuk pengujian, bukan akun demo lama.

## Kendala dan hal yang belum diverifikasi

- **Mitra Tangerang dan Bekasi:** login ditolak dengan password yang diberikan. Tidak dilakukan percobaan password berulang atau reset. Perlu password terbaru dari pemilik akun; ini belum terbukti sebagai bug aplikasi.
- Grogol dan Depok berhasil login tetapi masih memiliki `password_setup_required=true`; pengalihan ke halaman ganti password pertama adalah perilaku yang diharapkan.
- Pengiriman email konfirmasi dan pemulihan password ke mailbox nyata tidak diuji. UI lupa password masih berupa keterangan bahwa fitur akan tersedia.
- Checkout masih simulasi; tidak ada pembayaran uang, webhook gateway, atau refund sungguhan.
- Pemeriksaan dilakukan pada build produksi lokal dan backend Supabase, bukan seluruh perangkat/browser atau deployment Vercel.
- Halaman 404 yang dirender melalui streaming Next.js dapat mengembalikan status HTTP 200 setelah header terkirim. Tes memeriksa penanda/tampilan not-found selain status HTTP.
- Advisor Supabase masih memberi peringatan untuk 14 RPC `SECURITY DEFINER` yang sengaja dapat dipanggil akun terautentikasi; akses sensitifnya diuji. Leaked-password protection juga dilaporkan nonaktif. Semua tabel `public` yang diperiksa sudah memakai RLS. Ini bukan sertifikasi keamanan lengkap atau uji beban/penetrasi.

## Menjalankan ulang

1. Jalankan `npm ci`, `npm run lint`, `npm run build`, lalu `npm run start`.
2. Jalankan `supabase/tests/flow_validation.sql` melalui SQL Editor/MCP pada proyek demo. Script diakhiri `ROLLBACK`; jangan menghapus bagian rollback.
3. Sediakan `QA_ACCOUNTS_JSON` di environment proses: array objek dengan `label`, `email`, `password`, dan `role`. Jangan simpan nilai kredensial ke repository.
4. Jalankan `node --env-file=.env.local scripts/verify-demo-access.mjs`. Skrip ini membuat dan membersihkan fixture sementara; gunakan hanya proyek demo.
5. Jalankan `node --env-file=.env.local scripts/verify-routes.mjs` saat server lokal berjalan. Label `Arya`, `Dion`, `Senayan`, `Grogol`, dan `Operator` digunakan dalam pelaksanaan audit ini.

Tiga migrasi perbaikan sudah diterapkan ke backend pada audit ini dan disimpan di repository untuk reproduksi pada proyek baru.
