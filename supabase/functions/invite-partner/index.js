import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

const secretKey = () => {
  try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}").default ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); }
  catch { return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); }
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const secret = secretKey();
  if (!url || !secret) return json({ error: "Server configuration missing" }, 500);
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user || user.app_metadata?.smashmate_role !== "operator") {
    return json({ error: "Forbidden" }, 403);
  }

  let input;
  try { input = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const email = String(input?.email ?? "").trim().toLowerCase();
  const venueName = String(input?.venueName ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
      venueName.length < 3 || venueName.length > 100) {
    return json({ error: "Email atau nama GOR tidak valid" }, 400);
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: venueName, role: "partner" },
    redirectTo: "http://localhost:3000/invite",
  });
  if (inviteError || !invited.user) {
    return json({ error: "Undangan gagal. Gunakan alamat email baru yang belum terdaftar." }, 409);
  }
  const { error: roleError } = await admin.auth.admin.updateUserById(invited.user.id, {
    app_metadata: { smashmate_role: "partner" },
  });
  if (roleError) {
    await admin.auth.admin.deleteUser(invited.user.id);
    return json({ error: "Peran mitra gagal ditetapkan" }, 500);
  }
  const { error: venueError } = await admin.from("venues").insert({
    owner_id: invited.user.id, name: venueName, status: "draft",
  });
  if (venueError) {
    await admin.auth.admin.deleteUser(invited.user.id);
    return json({ error: "GOR awal gagal dibuat" }, 500);
  }
  return json({ ok: true });
});
