import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import InventoryWorkspace from "./inventory-workspace";

function SetupRequired() {
  return (
    <main className="inventory-setup">
      <div className="inventory-setup-card">
        <span className="inventory-setup-icon">!</span>
        <div className="eyebrow">ERP · VOORRAADBEHEER</div>
        <h1>Koppel eerst je beveiligde voorraadadministratie</h1>
        <p>
          Artikelen en voorraadmutaties worden pas opgeslagen nadat Supabase,
          gebruikersaanmelding en de databasetabellen zijn ingesteld.
        </p>
        <ol>
          <li>Maak een Supabase-project aan en kopieer <code>.env.example</code> naar <code>.env.local</code>.</li>
          <li>Vul de Supabase project-URL en publishable key in.</li>
          <li>Voer <code>supabase/migrations/20261005160000_inventory.sql</code> uit in de SQL Editor.</li>
          <li>Schakel openbare registratie uit en nodig alleen vertrouwde gebruikers uit via Supabase Auth.</li>
          <li>Voeg je account toe aan de magazijntoegangslijst met de instructie in de README.</li>
        </ol>
        <Link className="primary-button" href="/dashboard">Terug naar dashboard</Link>
      </div>
    </main>
  );
}

export default async function InventoryPage() {
  if (!isSupabaseConfigured()) {
    return <SetupRequired />;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    console.error("Voorraadpagina kon de aanmelding niet controleren:", error.message);
  }

  if (error || !data?.claims?.sub) {
    redirect("/login?next=%2Ferp%2Fvoorraad");
  }

  const { data: isMember, error: membershipError } = await supabase.rpc("is_inventory_member");

  if (membershipError) {
    console.error("Toegang tot het magazijn kon niet worden gecontroleerd:", membershipError.message);
    return (
      <main className="inventory-setup">
        <div className="inventory-setup-card">
          <span className="inventory-setup-icon">!</span>
          <div className="eyebrow">ERP · VOORRAADBEHEER</div>
          <h1>De magazijndatabase is nog niet volledig ingesteld</h1>
          <p>Controleer of de voorraadmigratie is uitgevoerd in je Supabase-project.</p>
          <Link className="primary-button" href="/dashboard">Terug naar dashboard</Link>
        </div>
      </main>
    );
  }

  if (!isMember) {
    return (
      <main className="inventory-setup">
        <div className="inventory-setup-card">
          <span className="inventory-setup-icon">!</span>
          <div className="eyebrow">ERP · VOORRAADBEHEER</div>
          <h1>Je account heeft nog geen magazijntoegang</h1>
          <p>Vraag de beheerder van Allround Cleaning Service om je account aan de magazijntoegangslijst toe te voegen.</p>
          <Link className="primary-button" href="/dashboard">Terug naar dashboard</Link>
        </div>
      </main>
    );
  }

  const email = typeof data.claims.email === "string" ? data.claims.email : "Ingelogde gebruiker";

  return <InventoryWorkspace email={email} />;
}
