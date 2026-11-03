import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

const secretKey = () => {
  try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); }
  catch { return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); }
};

const initialPartners = [
  { email: "mitra.grogol@smashmate-demo.test", venue: "GOR Kencana Grogol" },
  { email: "mitra.tangerang@smashmate-demo.test", venue: "Karawaci Badminton Center" },
  { email: "mitra.senayan@smashmate-demo.test", venue: "Senayan Shuttle Arena" },
  { email: "mitra.bekasi@smashmate-demo.test", venue: "Bekasi Racket Hall" },
  { email: "mitra.depok@smashmate-demo.test", venue: "Depok Smash Court" },
];

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const token = /^Bearer (\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return json({ error: "Sesi tidak valid." }, 401);
  const url = Deno.env.get("SUPABASE_URL");
  const secret = secretKey();
  if (!url || !secret) return json({ error: "Layanan akun belum siap." }, 503);

  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return json({ error: "Sesi tidak valid." }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Permintaan tidak valid." }, 400); }

  if (body?.action === "create_initial_partners") {
    if (user.app_metadata?.smashmate_role !== "operator") return json({ error: "Akses operator diperlukan." }, 403);
    const { data: venues, error: venueError } = await admin.from("venues")
      .select("id,name,owner_id,status").in("name", initialPartners.map((item) => item.venue));
    if (venueError || venues?.length !== initialPartners.length ||
        venues.some((venue) => venue.owner_id !== user.id || venue.status !== "active")) {
      return json({ ok: false, error: "Kelima GOR awal harus aktif dan masih dimiliki operator." });
    }
    const created = [];
    const transferred = [];
    const credentials = [];
    try {
      for (const item of initialPartners) {
        const password = crypto.randomUUID().replaceAll("-", "");
        const { data: account, error: createError } = await admin.auth.admin.createUser({
          email: item.email, password, email_confirm: true,
          user_metadata: { full_name: `Mitra ${item.venue}` },
        });
        if (createError || !account.user) throw new Error(`Akun ${item.venue} gagal dibuat.`);
        created.push(account.user.id);
        const { error: roleError } = await admin.auth.admin.updateUserById(account.user.id, {
          app_metadata: { ...account.user.app_metadata, smashmate_role: "partner", password_setup_required: true },
        });
        if (roleError) throw new Error(`Peran ${item.venue} gagal disimpan.`);
        const venue = venues.find((candidate) => candidate.name === item.venue);
        const { data: moved, error: moveError } = await admin.from("venues")
          .update({ owner_id: account.user.id }).eq("id", venue.id).eq("owner_id", user.id)
          .select("id").maybeSingle();
        if (moveError || !moved) throw new Error(`Kepemilikan ${item.venue} gagal dipindahkan.`);
        transferred.push(venue.id);
        credentials.push({ email: item.email, initialPassword: password, venue: item.venue });
      }
      return json({ ok: true, credentials });
    } catch (error) {
      let ownershipRestored = true;
      for (const venueId of transferred.reverse()) {
        const { error: restoreError } = await admin.from("venues").update({ owner_id: user.id }).eq("id", venueId);
        if (restoreError) ownershipRestored = false;
      }
      if (ownershipRestored) {
        for (const userId of created.reverse()) await admin.auth.admin.deleteUser(userId);
      }
      return json({ ok: false, error: ownershipRestored
        ? String(error.message ?? error)
        : "Pembuatan akun terhenti. Hubungi admin untuk memeriksa kepemilikan GOR sebelum mencoba lagi." });
    }
  }

  if (body?.action === "create") {
    if (user.app_metadata?.smashmate_role !== "operator") return json({ error: "Akses operator diperlukan." }, 403);
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return json({ ok: false, error: "Email Mitra tidak valid." });
    }
    const initialPassword = crypto.randomUUID().replaceAll("-", "");
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email, password: initialPassword, email_confirm: true,
      user_metadata: { full_name: email.split("@")[0] },
    });
    if (createError || !created.user) {
      return json({ ok: false, error: "Akun gagal dibuat. Gunakan email yang belum terdaftar." });
    }
    const { error: roleError } = await admin.auth.admin.updateUserById(created.user.id, {
      app_metadata: { ...created.user.app_metadata, smashmate_role: "partner", password_setup_required: true },
    });
    if (roleError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ ok: false, error: "Peran Mitra gagal ditetapkan." });
    }
    const { error: venueError } = await admin.from("venues").insert({
      owner_id: created.user.id, name: "GOR belum diisi", status: "draft",
    });
    if (venueError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ ok: false, error: "Profil GOR awal gagal dibuat." });
    }
    return json({ ok: true, email, initialPassword });
  }

  if (body?.action === "set_password") {
    if (user.app_metadata?.smashmate_role !== "partner" ||
        user.app_metadata?.password_setup_required !== true) {
      return json({ error: "Akun Mitra tidak memerlukan pengaturan kata sandi." }, 403);
    }
    const password = String(body.password ?? "");
    if (password.length < 12 || password.length > 128) {
      return json({ ok: false, error: "Kata sandi baru harus 12–128 karakter." });
    }
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password,
      app_metadata: { ...user.app_metadata, smashmate_role: "partner", password_setup_required: false },
    });
    if (updateError) return json({ ok: false, error: "Kata sandi belum dapat disimpan." });
    return json({ ok: true });
  }
  return json({ error: "Aksi tidak valid." }, 400);
});
