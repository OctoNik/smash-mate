import AccountHeader from "@/components/account-header";
import { requirePlayerAccount } from "@/lib/account";

export const instant = false;

export default async function ActivitiesLayout({ children }) {
  const { user, name } = await requirePlayerAccount();
  return <div className="dashboard-shell min-h-screen">
    <AccountHeader name={name} email={user.email ?? ""} user={user} active="activities" />
    {children}
  </div>;
}
