import Link from "@/components/loading-link";
import BrandLogo from "@/components/brand-logo";
import AccountMenu from "@/components/account-menu";
import { createClient } from "@/lib/supabase/server";
import { getAvatarUrl } from "@/lib/avatar";

export default async function AccountHeader({ name, email, user, active = "dashboard" }) {
  const avatarUrl = user?.user_metadata?.has_avatar ? await getAvatarUrl(await createClient(), user) : null;
  const role = user?.app_metadata?.smashmate_role;
  return (
    <header className="account-header sticky top-0 z-40 border-b border-court-950/8 backdrop-blur-xl">
      <div className="shell flex h-[76px] items-center justify-between gap-4">
        <BrandLogo href={role === "operator" ? "/operator" : role === "partner" ? "/partner" : "/dashboard"} />
        <nav className="account-nav hidden items-center gap-1 rounded-xl bg-white/80 p-1 text-xs font-bold sm:flex" aria-label="Navigasi utama">
          {role === "operator" ? <Link href="/operator" aria-current={active === "operator" ? "page" : undefined}>Panel operator</Link>
            : role === "partner" ? <><Link href="/partner" aria-current={active === "partner" ? "page" : undefined}>Kelola GOR</Link><Link href="/partner/bookings" aria-current={active === "partner-bookings" ? "page" : undefined}>Dashboard Booking</Link></>
              : <><Link href="/activities" aria-current={active === "activities" ? "page" : undefined}>Main Bareng</Link>
                <Link href="/venues" aria-current={active === "venues" ? "page" : undefined}>Sewa Lapangan</Link></>}
        </nav>
        <AccountMenu name={name} email={email} avatarUrl={avatarUrl} role={role} />
      </div>
    </header>
  );
}
