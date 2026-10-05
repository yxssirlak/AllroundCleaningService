"use client";

import { useCallback, useEffect, useState } from "react";
import type { Database } from "@/lib/supabase/database.types";

type Product = Database["public"]["Tables"]["inventory_products"]["Row"];
type Movement = Database["public"]["Tables"]["inventory_movements"]["Row"] & {
  product: Pick<Product, "id" | "name" | "sku" | "unit"> | null;
};
type MovementPage = { movements: Movement[]; hasMore: boolean; error?: string };

const PAGE_SIZE = 30;

async function readMovementPage(offset: number): Promise<MovementPage> {
  const response = await fetch(
    `/api/inventory/movements?offset=${offset}&limit=${PAGE_SIZE}`,
    { cache: "no-store" },
  );
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
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadFirstPage = useCallback(async () => {
    try {
      const result = await readMovementPage(0);
      setMovements(result.movements);
      setHasMore(result.hasMore);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "De voorraadgeschiedenis kon niet worden opgehaald.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadFirstPage();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadFirstPage]);

  async function loadMore() {
    setLoadingMore(true);
    setError("");
    try {
      const result = await readMovementPage(movements.length);
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
          <p>{movements.length ? `${movements.length} mutaties geladen` : "Volledige voorraadgeschiedenis."}</p>
        </div>
        <span className="history-icon" aria-hidden="true">↕</span>
      </div>

      {error ? <div className="inventory-alert inventory-alert-error history-page-error" role="alert">{error}</div> : null}
      {loading ? <div className="history-empty">Voorraadmutaties worden geladen…</div> : movements.length === 0 ? (
        <div className="history-empty">
          <strong>Er zijn nog geen voorraadmutaties</strong>
          <span>Na de eerste ontvangst of afboeking verschijnt de geschiedenis hier.</span>
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
