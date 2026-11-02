import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bot, CircleAlert, LockKeyhole } from "lucide-react";
import { getCurrentUser, getDisplayName, isAuthConfigured } from "@/lib/auth";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isAuthConfigured()) {
    return (
      <main className="setup-page">
        <div className="setup-card">
          <Link className="brand" href="/">
            <span className="brand-mark"><Bot size={18} /></span>
            orbit<span className="brand-light">.support</span>
          </Link>
          <div className="setup-icon"><LockKeyhole size={22} /></div>
          <div className="eyebrow">ONE LAST SETUP STEP</div>
          <h1>Connect your workspace.</h1>
          <p>
            Add your Scalekit credentials to <code>.env.local</code> to enable
            sign-in and securely manage your support sites.
          </p>
          <div className="setup-note">
            <CircleAlert size={16} />
            <span>See <code>.env.example</code> for the required variables and callback URL.</span>
          </div>
          <Link className="button button-dark" href="/">Back to home <ArrowLeft size={15} /></Link>
        </div>
      </main>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return <DashboardClient displayName={getDisplayName(user)} />;
}
