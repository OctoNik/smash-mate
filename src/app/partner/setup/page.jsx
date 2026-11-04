import { redirect } from "next/navigation";
import AccountHeader from "@/components/account-header";
import PartnerSetupForm from "@/components/partner-setup-form";
import { requireAccount } from "@/lib/account";

export const instant = false;

export default async function PartnerSetupPage({ searchParams }) {
  const { supabase, user, name } = await requireAccount();
  const { error } = await searchParams;
  const { data: venue } = await supabase.from("venues").select("id,name,status")
    .eq("owner_id", user.id).order("created_at").limit(1).maybeSingle();
  if (!venue) redirect("/partner");
  if (venue.status === "active") redirect("/partner");
  return <div className="dashboard-shell min-h-screen">
    <AccountHeader name={name} email={user.email ?? ""} user={user} active="partner" />
    <main className="shell max-w-3xl py-10 sm:py-14">
      <p className="eyebrow">Mitra GOR terverifikasi</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Lengkapi GOR Anda</h1>
      <p className="mt-3 text-sm leading-7 text-court-950/65">Isi profil, aturan, jam buka, lapangan beserta harga, katalog, dan foto sebelum GOR diterbitkan. Semua data tetap dapat diperbarui setelah setup.</p>
      {error && <p role="alert" className="profile-message error">{error}</p>}
      <PartnerSetupForm venue={venue} />
    </main>
  </div>;
}
