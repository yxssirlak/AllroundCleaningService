"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Database } from "@/lib/supabase/database.types";

type Product = Database["public"]["Tables"]["inventory_products"]["Row"];
type Movement = Database["public"]["Tables"]["inventory_movements"]["Row"] & {
  product: Pick<Product, "id" | "name" | "sku" | "unit"> | null;
};
type ProductOption = Pick<Product, "id" | "name" | "sku">;
type MovementPage = { movements: Movement[]; hasMore: boolean; error?: string };
type MovementFilters = {
  type: "" | "in" | "out";
  productId: string;
  fromDate: string;
  toDate: string;
};

const PAGE_SIZE = 30;

function dateStart(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toISOString();
}

function dateEndExclusive(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day + 1).toISOString();
}

async function readMovementPage(offset: number, filters: MovementFilters): Promise<MovementPage> {
  const params = new URLSearchParams({ offset: String(offset), limit: String(PAGE_SIZE) });
  if (filters.type) params.set("type", filters.type);
  if (filters.productId) params.set("productId", filters.productId);
  if (filters.fromDate) params.set("from", dateStart(filters.fromDate));
  if (filters.toDate) params.set("to", dateEndExclusive(filters.toDate));
  const response = await fetch(`/api/inventory/movements?${params.toString()}`, { cache: "no-store" });
  const payload = (await response.json()) as MovementPage;
  if (!response.ok) {
    throw new Error(payload.error ?? "De voorraadgeschiedenis kon niet worden opgehaald.");
  }
  return payload;
}

function formatMovementDate(value: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function InventoryMovementHistory() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [filters, setFilters] = useState<MovementFilters>({ type: "", productId: "", fromDate: "", toDate: "" });
  const [appliedFilters, setAppliedFilters] = useState<MovementFilters>({ type: "", productId: "", fromDate: "", toDate: "" });
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await readMovementPage(0, appliedFilters);
      setMovements(result.movements);
      setHasMore(result.hasMore);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "De voorraadgeschiedenis kon niet worden opgehaald.");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadFirstPage();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadFirstPage]);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const response = await fetch("/api/inventory/products", { cache: "no-store" });
        const result = (await response.json()) as { products?: ProductOption[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "De artikelen konden niet worden opgehaald.");
        if (active) setProducts(result.products ?? []);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "De artikelen konden niet worden opgehaald.");
      }
    }

    void loadProducts();
    return () => {
      active = false;
    };
  }, []);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    const emptyFilters: MovementFilters = { type: "", productId: "", fromDate: "", toDate: "" };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  }

  async function loadMore() {
    setLoadingMore(true);
    setError("");
    try {
      const result = await readMovementPage(movements.length, appliedFilters);
      setMovements((current) => [...current, ...result.movements]);
      setHasMore(result.hasMore);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Meer voorraadmutaties konden niet worden opgehaald.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <>
      <div className="inventory-list-heading full-history-heading">
        <div>
          <div className="eyebrow">MUTATIELOGBOEK</div>
          <h2>Alle mutaties</h2>
          <p>{movements.length ? `${movements.length} mutaties ${hasMore ? "geladen" : "gevonden"}` : "Volledige voorraadgeschiedenis."}</p>
        </div>
        <span className="history-icon" aria-hidden="true">↕</span>
      </div>

      <form className="movement-filters" onSubmit={applyFilters}>
        <label>
          <span className="field-label">Soort mutatie</span>
          <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value as MovementFilters["type"] }))}>
            <option value="">Alle mutaties</option>
            <option value="in">Ontvangsten</option>
            <option value="out">Afboekingen</option>
          </select>
        </label>
        <label>
          <span className="field-label">Artikel</span>
          <select value={filters.productId} onChange={(event) => setFilters((current) => ({ ...current, productId: event.target.value }))}>
            <option value="">Alle artikelen</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}{product.sku ? ` · ${product.sku}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">Vanaf</span>
          <input type="date" value={filters.fromDate} max={filters.toDate || undefined} onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))} />
        </label>
        <label>
          <span className="field-label">Tot en met</span>
          <input type="date" value={filters.toDate} min={filters.fromDate || undefined} onChange={(event) => setFilters((current) => ({ ...current, toDate: event.target.value }))} />
        </label>
        <div className="movement-filter-actions">
          <button className="primary-button" type="submit" disabled={loading}>Filteren</button>
          <button className="secondary-button" type="button" onClick={clearFilters} disabled={loading}>Wissen</button>
        </div>
      </form>

      {error ? <div className="inventory-alert inventory-alert-error history-page-error" role="alert">{error}</div> : null}
      {loading ? <div className="history-empty">Voorraadmutaties worden geladen…</div> : movements.length === 0 ? (
        <div className="history-empty">
          <strong>{Object.values(appliedFilters).some(Boolean) ? "Geen mutaties gevonden voor deze filters" : "Er zijn nog geen voorraadmutaties"}</strong>
          <span>{Object.values(appliedFilters).some(Boolean) ? "Pas de filters aan of wis ze om alle mutaties te bekijken." : "Na de eerste ontvangst of afboeking verschijnt de geschiedenis hier."}</span>
        </div>
      ) : (
        <>
          <div className="history-list full-history-list">
            {movements.map((movement) => (
              <article className="history-row" key={movement.id}>
                <span className={`history-type-icon ${movement.movement_type === "in" ? "history-in" : "history-out"}`} aria-hidden="true">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </span>
                <div className="history-product">
                  <strong>{movement.product?.name ?? "Artikel verwijderd"}</strong>
                  <span>{movement.note || (movement.movement_type === "in" ? "Goederen ontvangen" : "Goederen afgeboekt")}</span>
                </div>
                <time dateTime={movement.created_at}>{formatMovementDate(movement.created_at)}</time>
                <strong className={movement.movement_type === "in" ? "history-quantity history-quantity-in" : "history-quantity history-quantity-out"}>
                  {movement.movement_type === "in" ? "+" : "−"}{movement.quantity.toLocaleString("nl-NL")} {movement.product?.unit ?? ""}
                </strong>
              </article>
            ))}
          </div>
          {hasMore ? (
            <button className="secondary-button history-load-more" type="button" onClick={() => void loadMore()} disabled={loadingMore}>
              {loadingMore ? "Mutaties laden…" : "Meer mutaties laden"}
            </button>
          ) : null}
        </>
      )}
    </>
  );
}
