import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import AccountMenu from "@/components/account-menu";
import { createClient } from "@/lib/supabase/server";
import { getAvatarUrl } from "@/lib/avatar";

export default async function AccountHeader({ name, email, user, active = "dashboard" }) {
  const avatarUrl = user?.user_metadata?.has_avatar ? await getAvatarUrl(await createClient(), user) : null;
  return (
    <header className="account-header sticky top-0 z-40 border-b border-court-950/8 backdrop-blur-xl">
      <div className="shell flex h-[76px] items-center justify-between gap-4">
        <BrandLogo href="/dashboard" />
        <nav className="account-nav hidden items-center gap-1 rounded-xl bg-white/80 p-1 text-xs font-bold lg:flex" aria-label="Navigasi akun">
          <Link href="/dashboard" aria-current={active === "dashboard" ? "page" : undefined}>Dashboard</Link>
          <Link href="/activities" aria-current={active === "activities" ? "page" : undefined}>Aktivitas</Link>
          <Link href="/equipment" aria-current={active === "equipment" ? "page" : undefined}>Perlengkapan</Link>
          <Link href="/ratings" aria-current={active === "ratings" ? "page" : undefined}>Rating</Link>
          <Link href="/feedback" aria-current={active === "feedback" ? "page" : undefined}>Feedback</Link>
        </nav>
        <AccountMenu name={name} email={email} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
