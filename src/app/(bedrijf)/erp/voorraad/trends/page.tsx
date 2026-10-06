import Link from "next/link";
import { redirect } from "next/navigation";
import BusinessSidebar from "@/components/business-sidebar";
import BusinessTopbarTools from "@/components/business-topbar-tools";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ConsumptionChart, { type ConsumptionSeries, type MonthlyConsumptionPoint } from "./consumption-chart";

const PAGE_SIZE = 1000;
const INSIGHT_THRESHOLD = 1.5;

type InventoryMovement = {
  product_id: string;
  quantity: number;
  created_at: string;
};

type InventoryProduct = {
  id: string;
  name: string;
  unit: string;
};

type MonthlyProductConsumption = InventoryProduct & {
  total: number;
  monthly: Map<string, number>;
};

type ConsumptionInsight = {
  id: string;
  name: string;
  unit: string;
  current: number;
  average: number;
  increase: number;
};

function getMonthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(monthKey: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("nl-NL", { ...options, timeZone: "UTC" })
    .format(new Date(`${monthKey}-01T00:00:00.000Z`));
}

async function loadConsumptionData(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, index) => {
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1));
    return getMonthKey(month);
  });
  const startDate = `${months[0]}-01T00:00:00.000Z`;
  const endMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const endDate = `${getMonthKey(endMonth)}-01T00:00:00.000Z`;

  const productsPromise = supabase
    .from("inventory_products")
    .select("id, name, unit");
  const movementsPromise = (async () => {
    const movements: InventoryMovement[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("inventory_movements")
        .select("product_id, quantity, created_at")
        .eq("movement_type", "out")
        .gte("created_at", startDate)
        .lt("created_at", endDate)
        .order("created_at", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Afboekingen ophalen mislukt: ${error.message}`);
      }

      movements.push(...data);
      if (data.length < PAGE_SIZE) break;
    }
    return movements;
  })();

  const [{ data: products, error: productsError }, movements] = await Promise.all([
    productsPromise,
    movementsPromise,
  ]);
  if (productsError) {
    throw new Error(`Artikelen ophalen mislukt: ${productsError.message}`);
  }

  const productsById = new Map<string, InventoryProduct>(
    (products ?? []).map((product) => [product.id, product]),
  );
  const consumptionByProduct = new Map<string, MonthlyProductConsumption>();

  for (const movement of movements) {
    const product = productsById.get(movement.product_id);
    if (!product) {
      throw new Error(`Geen artikelgegevens gevonden voor voorraadmutatie ${movement.product_id}.`);
    }

    const month = getMonthKey(new Date(movement.created_at));
    let summary = consumptionByProduct.get(product.id);
    if (!summary) {
      summary = { ...product, total: 0, monthly: new Map() };
      consumptionByProduct.set(product.id, summary);
    }
    summary.total += movement.quantity;
    summary.monthly.set(month, (summary.monthly.get(month) ?? 0) + movement.quantity);
  }

  const rankedProducts = [...consumptionByProduct.values()]
    .sort((left, right) => right.total - left.total);
  const chartData: MonthlyConsumptionPoint[] = months.map((month) => {
    const point: MonthlyConsumptionPoint = {
      month,
      label: formatMonth(month, { month: "short", year: "2-digit" }),
    };
    for (const product of rankedProducts) {
      point[product.id] = product.monthly.get(month) ?? 0;
    }
    return point;
  });

  const currentMonth = months[months.length - 1];
  const previousMonths = months.slice(0, -1);
  const insights: ConsumptionInsight[] = rankedProducts.flatMap((product) => {
    const current = product.monthly.get(currentMonth) ?? 0;
    const average = previousMonths.reduce(
      (sum, month) => sum + (product.monthly.get(month) ?? 0),
      0,
    ) / previousMonths.length;
    if (average <= 0 || current <= average * INSIGHT_THRESHOLD) return [];

    return [{
      id: product.id,
      name: product.name,
      unit: product.unit,
      current,
      average,
      increase: ((current - average) / average) * 100,
    }];
  }).sort((left, right) => right.increase - left.increase);

  const series: ConsumptionSeries[] = rankedProducts.map(({ id, name, unit }) => ({ id, name, unit }));
  return {
    months,
    chartData,
    series,
    insights,
    movementCount: movements.length,
    productCount: rankedProducts.length,
  };
}

export default async function InventoryTrendsPage() {
  if (!isSupabaseConfigured()) {
    redirect("/erp/voorraad");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    console.error("Trends & Inzichten kon de aanmelding niet controleren:", error.message);
  }
  if (error || !data?.claims?.sub) {
    redirect("/login?next=%2Ferp%2Fvoorraad%2Ftrends");
  }

  const { data: isMember, error: membershipError } = await supabase.rpc("is_inventory_member");
  if (membershipError) {
    console.error("Toegang tot Trends & Inzichten kon niet worden gecontroleerd:", membershipError.message);
    redirect("/erp/voorraad");
  }
  if (!isMember) {
    redirect("/erp/voorraad");
  }

  const email = typeof data.claims.email === "string" ? data.claims.email : "Ingelogde gebruiker";
  let report: Awaited<ReturnType<typeof loadConsumptionData>> | null = null;
  let loadError = false;
  try {
    report = await loadConsumptionData(supabase);
  } catch (caught) {
    console.error("Trends & Inzichten laden mislukt:", caught);
    loadError = true;
  }

  const lastMonth = report?.months[report.months.length - 1];
  const currentMonthLabel = lastMonth
    ? formatMonth(lastMonth, { month: "long", year: "numeric" })
    : "";

  return (
    <div className="portal inventory-portal">
      <BusinessSidebar currentPage="inventory-trends" accountLabel="Ingelogd" accountDetail={email} />
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <Link href="/dashboard">Allround</Link>
            <span className="breadcrumb-divider">/</span><span>ERP</span>
            <span className="breadcrumb-divider">/</span>
            <Link href="/erp/voorraad">Voorraad</Link>
            <span className="breadcrumb-divider">/</span><strong>Trends & Inzichten</strong>
          </div>
          <BusinessTopbarTools accountName={email} />
        </header>
        <div className="dashboard-content inventory-content inventory-trends-content">
          <Link className="secondary-button inventory-back-link" href="/erp/voorraad">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5m7 7-7-7 7-7" />
            </svg>
            Terug naar voorraad
          </Link>
          <section className="welcome-row inventory-welcome inventory-create-welcome">
            <div>
              <div className="eyebrow">ERP · MAGAZIJNANALYSE</div>
              <h1>Trends & Inzichten</h1>
              <p>Ontdek verbruikspatronen en opvallende veranderingen in de afgelopen 12 maanden.</p>
            </div>
          </section>

          {loadError || !report ? (
            <div className="panel trends-error" role="alert">
              De verbruiksgegevens konden niet worden opgehaald. Probeer het later opnieuw.
            </div>
          ) : (
            <>
              <section className="trends-summary-grid" aria-label="Samenvatting verbruik">
                <article className="panel trends-summary-card">
                  <span className="trends-summary-label">Afboekingen in 12 maanden</span>
                  <strong>{report.movementCount.toLocaleString("nl-NL")}</strong>
                  <span className="trends-summary-detail">Geregistreerde verbruiksmutaties</span>
                </article>
                <article className="panel trends-summary-card">
                  <span className="trends-summary-label">Artikelen met verbruik</span>
                  <strong>{report.productCount.toLocaleString("nl-NL")}</strong>
                  <span className="trends-summary-detail">Met minimaal één afboeking</span>
                </article>
                <article className="panel trends-summary-card">
                  <span className="trends-summary-label">Periode</span>
                  <strong className="trends-period-value">12 maanden</strong>
                  <span className="trends-summary-detail">Tot en met {currentMonthLabel}</span>
                </article>
              </section>

              <section className="panel trends-panel" aria-labelledby="consumption-chart-title">
                <div className="trends-section-heading">
                  <div>
                    <div className="eyebrow">VERBRUIK PER ARTIKEL</div>
                    <h2 id="consumption-chart-title">Meest verbruikte artikelen</h2>
                    <p>Vergelijk maximaal vijf artikelen tegelijk. Standaard zijn de vijf meest verbruikte artikelen geselecteerd.</p>
                  </div>
                </div>
                <ConsumptionChart data={report.chartData} series={report.series} />
                <p className="trends-chart-note">
                  Elke artikelreeks gebruikt de eigen eenheid van het artikel. Verbruikaantallen met verschillende eenheden zijn niet rechtstreeks onderling vergelijkbaar.
                </p>
              </section>

              <section className="panel trends-panel insights-panel" aria-labelledby="insights-title">
                <div className="trends-section-heading">
                  <div>
                    <div className="eyebrow">SEIZOENSPATRONEN</div>
                    <h2 id="insights-title">Opvallende Trends</h2>
                    <p>Deze maand vergeleken met het gemiddelde van de 11 voorgaande maanden.</p>
                  </div>
                </div>
                {report.insights.length ? (
                  <div className="trends-insight-list">
                    {report.insights.map((insight) => (
                      <article className="trends-insight-card" key={insight.id}>
                        <span className="trends-insight-icon" aria-hidden="true">!</span>
                        <div className="trends-insight-copy">
                          <strong>{insight.name}</strong>
                          <span>
                            Deze maand {insight.current.toLocaleString("nl-NL")} {insight.unit} afgeboekt; dat is {insight.increase.toLocaleString("nl-NL", { maximumFractionDigits: 0 })}% hoger dan het maandgemiddelde van {insight.average.toLocaleString("nl-NL", { maximumFractionDigits: 1 })} {insight.unit}.
                          </span>
                        </div>
                        <span className="trends-insight-badge">Piek deze maand</span>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="trends-insight-empty">
                    <strong>Geen opvallende pieken gevonden</strong>
                    <span>Er zijn geen artikelen waarvan het verbruik deze maand meer dan 50% boven het gemiddelde ligt.</span>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
