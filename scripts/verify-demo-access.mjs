// Credentials are supplied in-memory through QA_ACCOUNTS_JSON, never committed.
// This integration check creates only marked disposable fixtures and removes them.
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const accounts = JSON.parse(process.env.QA_ACCOUNTS_JSON || "[]");
if (!accounts.length) throw new Error("Supply QA_ACCOUNTS_JSON through the process environment.");
const client = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const results = [];
const sessions = new Map();
const marker = `qa-${randomUUID()}`;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCioAAAAASUVORK5CYII=", "base64");
function assert(value, message) { if (!value) throw new Error(message); }
function ok(response) { if (response.error) throw new Error(response.error.message); return response.data; }
async function check(name, run) {
  try { await run(); results.push({ name, status: "PASS" }); }
  catch (error) { results.push({ name, status: "FAIL", detail: error.message }); }
}
async function uploadCheck(s, bucket, path, replace = false) {
  try {
    ok(await s.storage.from(bucket).upload(path, png, { contentType: "image/png" }));
    if (replace) ok(await s.storage.from(bucket).upload(path, png, { contentType: "image/png", upsert: true }));
    if (bucket === "smashmate-avatars") {
      assert(ok(await s.storage.from(bucket).createSignedUrl(path, 60))?.signedUrl, "No signed avatar URL");
    } else {
      const url = s.storage.from(bucket).getPublicUrl(path).data.publicUrl;
      assert((await fetch(url)).ok, "Uploaded public image is not readable");
    }
  } finally { ok(await s.storage.from(bucket).remove([path])); }
}

for (const account of accounts) {
  const s = client();
  await check(`login ${account.label}`, async () => {
    const { user } = ok(await s.auth.signInWithPassword({ email: account.email, password: account.password }));
    assert((user.app_metadata?.smashmate_role || "player") === account.role, "Unexpected account role");
    ok(await s.auth.refreshSession());
    sessions.set(account.label, { s, user });
  });
  if (!sessions.has(account.label)) await s.auth.signOut({ scope: "local" });
}

const player = sessions.get("Arya");
const partner = sessions.get("Senayan");
const operator = sessions.get("Operator");
const anon = client();
await check("anonymous cannot read ratings", async () => {
  const r = await anon.from("activity_ratings").select("id");
  assert(r.error || r.data.length === 0, "Anonymous rating disclosure");
});
if (player) {
  const { s, user } = player;
  await check("player reads activities and attendance", async () => {
    ok(await s.from("activities").select("id,title,activity_participants(user_id,display_name)").limit(5));
  });
  await check("player reads GOR catalog and equipment", async () => {
    ok(await s.from("venues").select("id,name,courts(id,price_per_hour),venue_products(id,stock)").eq("status", "active").limit(5));
  });
  await check("player reads own booking history", async () => {
    const rows = ok(await s.from("court_bookings").select("id,player_id,court_booking_items(product_name,quantity)").limit(20));
    assert(rows.every(row => row.player_id === user.id), "Other player's booking visible");
  });
  await check("player reads received profile ratings", async () => {
    ok(await s.from("activity_ratings").select("id,reviewer_id,stars,created_at,activity_id,activities(title,host_id,host_name,starts_at,activity_participants(user_id,display_name))").eq("recipient_id", user.id));
  });
  await check("avatar rejects unsupported object path", async () => {
    const r = await s.storage.from("smashmate-avatars").upload(`${user.id}/${marker}.png`, png, { contentType: "image/png" });
    assert(r.error, "Unexpected avatar path accepted");
  });
  await check("player cannot provision partner", async () => {
    const r = await s.functions.invoke("provision-partner", { body: { action: "create", email: `${marker}@smashmate.test` } });
    assert(r.error, "Player unexpectedly allowed to provision");
  });
  await check("delete-account rejects missing confirmation", async () => {
    const r = await s.functions.invoke("delete-account", { body: { confirmation: "INVALID", password: "not-the-account-password" } });
    assert(r.error || r.data?.message !== "Akun berhasil dihapus.", "Invalid delete request accepted");
  });
  let community;
  await check("community profile identity gallery and cleanup", async () => {
    try {
      community = ok(await s.from("communities").insert({ owner_id: user.id, owner_name: "QA owner", name: marker, city: "QA", description: "Disposable validation fixture" }).select("id").single());
      ok(await s.from("community_members").insert({ community_id: community.id, user_id: user.id, display_name: "QA owner" }));
      ok(await s.from("communities").update({ description: "QA updated description" }).eq("id", community.id));
      await uploadCheck(s, "community-identity", `${community.id}/avatar-${marker}.png`);
      const path = `${community.id}/${marker}.png`;
      try {
        ok(await s.storage.from("community-media").upload(path, png, { contentType: "image/png" }));
        const photo = ok(await s.from("community_photos").insert({ community_id: community.id, image_path: path }).select("id").single());
        ok(await s.from("community_photos").delete().eq("id", photo.id));
      } finally { ok(await s.storage.from("community-media").remove([path])); }
    } finally {
      if (community) ok(await s.from("communities").delete().eq("id", community.id));
    }
  });
}
if (partner) {
  await check("partner reads own venue bookings and stock", async () => {
    const { s, user } = partner;
    const venue = ok(await s.from("venues").select("id,courts(id),venue_products(id,stock)").eq("owner_id", user.id).limit(1).single());
    ok(await s.from("court_bookings").select("id,court_booking_items(product_name,quantity)").eq("venue_id", venue.id).limit(5));
    await uploadCheck(s, "venue-products", `${venue.id}/venues/${marker}.png`);
  });
}
if (operator) {
  const temp = client();
  let tempAccount;
  let tempPassword;
  await check("operator provisions temporary partner", async () => {
    const r = await operator.s.functions.invoke("provision-partner", { body: { action: "create", email: `${marker}@smashmate.test` } });
    const data = ok(r);
    assert(data?.ok && data.initialPassword, "Partner provisioning not successful");
    tempPassword = data.initialPassword;
    const signed = ok(await temp.auth.signInWithPassword({ email: data.email, password: tempPassword }));
    tempAccount = signed.user;
    assert(tempAccount.app_metadata?.password_setup_required === true, "First-login password gate missing");
  });
  if (tempAccount) {
    await check("avatar upload replace signed read and removal on disposable account", () => uploadCheck(temp, "smashmate-avatars", `${tempAccount.id}/avatar`, true));
    await check("temporary partner password validation and setup", async () => {
      const weak = await temp.functions.invoke("provision-partner", { body: { action: "set_password", password: "weak" } });
      assert(!weak.data?.ok, "Weak password accepted");
      const password = `QA!${randomUUID()}aA7`;
      const data = ok(await temp.functions.invoke("provision-partner", { body: { action: "set_password", password } }));
      assert(data?.ok, "Password setup failed");
      tempPassword = password;
      const { user } = ok(await temp.auth.signInWithPassword({ email: tempAccount.email, password }));
      assert(user.app_metadata.password_setup_required === false, "Password gate not cleared");
    });
    await check("temporary partner publishes and updates own GOR", async () => {
      const venue = ok(await temp.from("venues").select("id").eq("owner_id", tempAccount.id).single());
      ok(await temp.rpc("publish_venue_complete", {
        p_venue_id: venue.id, p_name: marker, p_description: "Disposable QA venue", p_rules: "QA", p_address: "QA venue address Jakarta",
        p_maps_url: "https://www.google.com/maps/", p_contact_phone: "", p_open_time: "06:00", p_close_time: "22:00", p_open_weekdays: [0,1,2,3,4,5,6],
        p_courts: [{ name: "QA court", price: 100000 }], p_products: [{ kind: "racket_rental", name: "QA racket", description: "QA", price: 10000, stock: 2 }],
      }));
      const saved = ok(await temp.from("venues").select("status").eq("id", venue.id).single());
      assert(saved.status === "active", "Venue not published");
      ok(await temp.from("venues").update({ description: "QA updated" }).eq("id", venue.id));
    });
    await check("delete temporary partner with password confirmation", async () => {
      ok(await temp.auth.signInWithPassword({ email: tempAccount.email, password: tempPassword }));
      const data = ok(await temp.functions.invoke("delete-account", { body: { confirmation: "HAPUS", password: tempPassword } }));
      assert(data?.message === "Akun berhasil dihapus.", "Disposable partner deletion failed");
    });
  }
}
for (const { s } of sessions.values()) await s.auth.signOut({ scope: "local" });
console.log(JSON.stringify({ results, passed: results.filter(r => r.status === "PASS").length, failed: results.filter(r => r.status === "FAIL").length, fixtureMarker: marker }, null, 2));
process.exitCode = results.some(r => r.status === "FAIL") ? 1 : 0;
