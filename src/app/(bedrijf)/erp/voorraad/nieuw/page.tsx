import Link from "next/link";
import { redirect } from "next/navigation";
import BusinessSidebar from "@/components/business-sidebar";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import NewInventoryProductForm from "./new-inventory-product-form";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewInventoryProductPage({ searchParams }: PageProps) {
  if (!isSupabaseConfigured()) {
    redirect("/erp/voorraad");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    console.error("Nieuwe artikelpagina kon de aanmelding niet controleren:", error.message);
  }

  if (error || !data?.claims?.sub) {
    redirect("/login?next=%2Ferp%2Fvoorraad%2Fnieuw");
  }

  const { data: isMember, error: membershipError } = await supabase.rpc("is_inventory_member");
  if (membershipError) {
    console.error("Toegang tot het magazijn kon niet worden gecontroleerd:", membershipError.message);
    redirect("/erp/voorraad");
  }
  if (!isMember) {
    redirect("/erp/voorraad");
  }

  const params = await searchParams;
  const barcode = typeof params.barcode === "string" ? params.barcode.slice(0, 128) : "";
  const returnPath = params.returnTo === "/erp/voorraad" ? params.returnTo : "/erp/voorraad";
  const email = typeof data.claims.email === "string" ? data.claims.email : "Ingelogde gebruiker";

  return (
    <div className="portal inventory-portal">
      <BusinessSidebar currentPage="inventory" accountLabel="Ingelogd" accountDetail={email} />
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <Link href="/dashboard">Allround</Link>
            <span className="breadcrumb-divider">/</span><span>ERP</span>
            <span className="breadcrumb-divider">/</span>
            <Link href="/erp/voorraad">Voorraad</Link>
            <span className="breadcrumb-divider">/</span><strong>Nieuw artikel</strong>
          </div>
        </header>

        <div className="dashboard-content inventory-content inventory-create-content">
          <Link className="secondary-button inventory-back-link" href={returnPath}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5m7 7-7-7 7-7" />
            </svg>
            Terug naar voorraad
          </Link>
          <section className="welcome-row inventory-welcome inventory-create-welcome">
            <div>
              <div className="eyebrow">ERP · MAGAZIJNBEHEER</div>
              <h1>Nieuw artikel toevoegen</h1>
              <p>Registreer de artikelgegevens. Daarna kun je het artikel scannen en voorraad boeken.</p>
            </div>
          </section>
          <section className="panel product-create-panel">
            <NewInventoryProductForm initialBarcode={barcode} returnPath={returnPath} />
          </section>
        </div>
      </main>
    </div>
  );
}
