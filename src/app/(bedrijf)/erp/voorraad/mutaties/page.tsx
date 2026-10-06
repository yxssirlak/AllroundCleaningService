import Link from "next/link";
import { redirect } from "next/navigation";
import BusinessSidebar from "@/components/business-sidebar";
import BusinessTopbarTools from "@/components/business-topbar-tools";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import InventoryMovementHistory from "./inventory-movement-history";

export default async function InventoryMovementsPage() {
  if (!isSupabaseConfigured()) {
    redirect("/erp/voorraad");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    console.error("Voorraadgeschiedenis kon de aanmelding niet controleren:", error.message);
  }

  if (error || !data?.claims?.sub) {
    redirect("/login?next=%2Ferp%2Fvoorraad%2Fmutaties");
  }

  const { data: isMember, error: membershipError } = await supabase.rpc("is_inventory_member");
  if (membershipError) {
    console.error("Toegang tot de voorraadgeschiedenis kon niet worden gecontroleerd:", membershipError.message);
    redirect("/erp/voorraad");
  }
  if (!isMember) {
    redirect("/erp/voorraad");
  }

  const email = typeof data.claims.email === "string" ? data.claims.email : "Ingelogde gebruiker";

  return (
    <div className="portal inventory-portal">
      <BusinessSidebar currentPage="inventory-history" accountLabel="Ingelogd" accountDetail={email} />
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <Link href="/dashboard">Allround</Link>
            <span className="breadcrumb-divider">/</span><span>ERP</span>
            <span className="breadcrumb-divider">/</span>
            <Link href="/erp/voorraad">Voorraad</Link>
            <span className="breadcrumb-divider">/</span><strong>Mutaties</strong>
          </div>
          <BusinessTopbarTools accountName={email} />
        </header>

        <div className="dashboard-content inventory-content inventory-history-content">
          <Link className="secondary-button inventory-back-link" href="/erp/voorraad">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5m7 7-7-7 7-7" />
            </svg>
            Terug naar voorraad
          </Link>
          <section className="welcome-row inventory-welcome inventory-create-welcome">
            <div>
              <div className="eyebrow">ERP · MAGAZIJNBEHEER</div>
              <h1>Voorraadmutaties</h1>
              <p>Bekijk alle ontvangsten en afboekingen, van nieuw naar oud.</p>
            </div>
          </section>
          <section className="panel inventory-full-history-panel">
            <InventoryMovementHistory />
          </section>
        </div>
      </main>
    </div>
  );
}
