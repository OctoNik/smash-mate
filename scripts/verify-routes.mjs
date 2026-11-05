// HTTP rendering/role-guard checks against a running local production build.
// QA_ACCOUNTS_JSON is process-only; no tokens or passwords are printed or saved.
import { createServerClient } from "@supabase/ssr";
const base = process.env.QA_BASE_URL || "http://localhost:3000";
const accounts = JSON.parse(process.env.QA_ACCOUNTS_JSON || "[]");
const results = [];
function assert(value, message) { if (!value) throw new Error(message); }
const badPage = /Internal Server Error|Application error:|Rating belum dapat dimuat|Riwayat rating belum dapat dimuat|Daftar GOR belum dapat dimuat|Riwayat booking belum dapat dimuat|Data aktivitas belum tersedia/;
async function visit(label, path, expected, cookies = "", status = 200) {
  try {
    const r = await fetch(base + path, { headers: cookies ? { cookie: cookies } : {}, redirect: "manual", signal: AbortSignal.timeout(45000) });
    const body = await r.text();
    // Streaming Next.js responses may have sent 200 before notFound() resolves.
    const streamedNotFound = status === 404 && r.status === 200 &&
      (body.includes("NEXT_HTTP_ERROR_FALLBACK;404") || body.includes("This page could not be found"));
    assert(r.status === status || streamedNotFound, `HTTP ${r.status}, expected ${status}`);
    if (expected) assert(body.includes(expected), `Missing expected content: ${expected}`);
    assert(!badPage.test(body), "Page displays an application/data error");
    results.push({ name: `${label} ${path}`, status: "PASS" });
  } catch (e) { results.push({ name: `${label} ${path}`, status: "FAIL", detail: e.message }); }
}
async function redirectCheck(label, path, target, cookie = "") {
  try {
    const r = await fetch(base + path, { headers: cookie ? { cookie } : {}, redirect: "manual", signal: AbortSignal.timeout(45000) });
    const body = await r.text();
    const location = r.headers.get("location") || "";
    assert((location.includes(target) && [303,307,308].includes(r.status)) ||
      (body.includes("NEXT_REDIRECT") && body.includes(target)) ||
      (body.includes('http-equiv="refresh"') && body.includes(target)), "Expected role/login redirect not found");
    results.push({ name: `${label} blocked ${path}`, status: "PASS" });
  } catch (e) { results.push({ name: `${label} blocked ${path}`, status: "FAIL", detail: e.message }); }
}
for (const [path,content] of [["/","SmashMate"],["/login","Masuk ke lapangan"],["/register","Mulai bermain"]]) await visit("guest",path,content);
await redirectCheck("guest","/auth/callback?code=qa-invalid","/login");
for (const path of ["/dashboard","/activities","/venues","/ratings","/profile","/bookings","/communities","/partner","/operator"]) await redirectCheck("guest",path,"/login");
for (const a of accounts) {
  const jar = new Map();
  const s = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{
    cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>{for(const {name,value} of values)jar.set(name,value);}},
  });
  const auth = await s.auth.signInWithPassword({email:a.email,password:a.password});
  if (auth.error) { results.push({name:`${a.label} route login`,status:"FAIL",detail:"Invalid login credentials"}); continue; }
  const cookie=[...jar].map(([k,v])=>`${k}=${v}`).join("; ");
  if (a.role === "player") {
    for (const [path,text] of [["/dashboard","Halo"],["/activities","Temukan teman bermain"],["/activities?view=mine","Aktivitas saya"],["/activities?view=finished","Selesai"],["/activities?view=create","Buat aktivitas"],["/venues","Cari lapangan badminton"],["/venues?q=Senayan&gear=racket&max_price=150000","Senayan"],["/bookings","Booking saya"],["/communities","Komunitas"],["/ratings","Rating pemain"],["/profile","Rating saya"],["/profile?rating_page=999999","Rating saya"]]) await visit(a.label,path,text,cookie);
    const activities = await s.from("activities").select("id").is("cancelled_at",null).limit(1);
    if (activities.data?.[0]) await visit(a.label,`/activities/${activities.data[0].id}`,"Pemain yang ikut",cookie);
    const venues = await s.from("venues").select("id").eq("status","active").limit(1);
    if (venues.data?.[0]) await visit(a.label,`/venues/${venues.data[0].id}`,"Pilih lapangan",cookie);
    const communities = await s.from("communities").select("id").limit(1);
    if (communities.data?.[0]) for (const tab of ["profile","members","activities","gallery"]) await visit(a.label,`/communities/${communities.data[0].id}?tab=${tab}`,"Komunitas",cookie);
    await redirectCheck(a.label,"/operator","/dashboard",cookie);
    await redirectCheck(a.label,"/partner","/dashboard",cookie);
    await redirectCheck(a.label,"/partner/setup","/dashboard",cookie);
    await visit(a.label,"/activities/not-a-uuid",null,cookie,404);
    await visit(a.label,"/venues/not-a-uuid",null,cookie,404);
    await visit(a.label,"/communities/not-a-uuid",null,cookie,404);
  } else if (auth.data.user.app_metadata.password_setup_required) {
    await visit(a.label,"/partner/password","kata sandi",cookie);
    for(const path of ["/partner","/activities","/profile","/venues"]) await redirectCheck(a.label,path,"/partner/password",cookie);
  } else if (a.role === "partner") {
    for (const [path,text] of [["/partner","Kelola"],["/partner/bookings","Dashboard Booking"],["/settings","Pengaturan akun"]]) await visit(a.label,path,text,cookie);
    for (const path of ["/activities","/venues","/ratings"]) await redirectCheck(a.label,path,"/partner",cookie);
    await redirectCheck(a.label,"/profile","/settings",cookie);
  } else if (a.role === "operator") {
    await visit(a.label,"/operator","Buat akun Mitra GOR",cookie);
    await visit(a.label,"/settings","Pengaturan akun",cookie);
    await redirectCheck(a.label,"/partner","/operator",cookie);
    for (const path of ["/activities","/venues","/ratings"]) await redirectCheck(a.label,path,"/operator",cookie);
    await redirectCheck(a.label,"/profile","/settings",cookie);
  }
  await s.auth.signOut({scope:"local"});
}
console.log(JSON.stringify({results,passed:results.filter(r=>r.status==="PASS").length,failed:results.filter(r=>r.status==="FAIL").length},null,2));
process.exitCode=results.some(r=>r.status==="FAIL")?1:0;
