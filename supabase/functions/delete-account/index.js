import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const json = (status, message) => new Response(JSON.stringify({ message }), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

const defaultKey = (name, fallback) => {
  try { return JSON.parse(Deno.env.get(name) ?? "{}").default ?? Deno.env.get(fallback); }
  catch { return Deno.env.get(fallback); }
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return json(405, "Metode tidak didukung.");

  const token = /^Bearer (\S+)$/i.exec(request.headers.get("Authorization") ?? "")?.[1];
  if (!token) return json(401, "Sesi tidak valid.");

  let body;
  try { body = await request.json(); } catch { return json(400, "Permintaan tidak valid."); }
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password || password.length > 256 || body?.confirmation !== "HAPUS") {
    return json(400, "Konfirmasi dan kata sandi diperlukan.");
  }

  const url = Deno.env.get("SUPABASE_URL");
  const publishableKey = defaultKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
  const secretKey = defaultKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !publishableKey || !secretKey) return json(503, "Layanan akun belum siap.");

  const admin = createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const publicClient = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user?.email) return json(401, "Sesi tidak valid.");

  const { data: reauth, error: passwordError } = await publicClient.auth.signInWithPassword({ email: user.email, password });
  if (passwordError || reauth.user?.id !== user.id) return json(403, "Kata sandi tidak sesuai.");

  const { error: avatarError } = await admin.storage.from("smashmate-avatars").remove([`${user.id}/avatar`]);
  if (avatarError) return json(500, "Foto profil belum dapat dihapus. Coba lagi.");

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return json(500, "Akun belum dapat dihapus. Coba lagi.");
  return json(200, "Akun berhasil dihapus.");
});
