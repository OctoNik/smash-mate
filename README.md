# SmashMate

Platform badminton untuk menemukan partner atau lawan bermain, membuat pertandingan, dan memesan lapangan beserta perlengkapannya.

## Tech stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Supabase
- npm

## Menjalankan secara lokal

1. Salin `.env.example` menjadi `.env.local`.
2. Isi URL dan publishable key dari Supabase Project Settings.
3. Instal dependensi dengan `npm install`.
4. Jalankan aplikasi dengan `npm run dev`.
5. Buka `http://localhost:3000`.

## Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Jangan commit `.env.local` atau service-role key ke GitHub.

## Perintah utama

```bash
npm run dev
npm run lint
npm run build
npm start
```
