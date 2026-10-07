"use client";

import { useEffect, useState } from "react";
import type { Database } from "@/lib/supabase/database.types";

type Product = Pick<
  Database["public"]["Tables"]["inventory_products"]["Row"],
  "id" | "name" | "sku" | "stock_quantity" | "unit"
>;
type ApiError = { error?: string };

async function readApiResponse<T>(response: Response): Promise<T> {
  const result = (await response.json()) as T & ApiError;
  if (!response.ok) {
    throw new Error(result.error ?? "Er ging iets mis. Probeer het opnieuw.");
  }
  return result;
}

export default function DeleteInventoryProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const response = await fetch("/api/inventory/products", { cache: "no-store" });
        const result = await readApiResponse<{ products: Product[] }>(response);
        if (active) setProducts(result.products);
      } catch (caught) {
        if (active) {
          setError(caught instanceof Error ? caught.message : "De artikelen konden niet worden opgehaald.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProducts();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!error && !notice) return;
    const timeout = window.setTimeout(() => {
      setError("");
      setNotice("");
    }, 6000);
    return () => window.clearTimeout(timeout);
  }, [error, notice]);

  async function confirmRemoval() {
    if (selectedProducts.length === 0) return;
    setDeleting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/inventory/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedProducts.map((product) => product.id) }),
      });
      await readApiResponse<{ success: boolean }>(response);
      const selectedIds = new Set(selectedProducts.map((product) => product.id));
      setProducts((current) => current.filter((product) => !selectedIds.has(product.id)));
      setNotice(
        selectedProducts.length === 1
          ? `${selectedProducts[0].name} is verwijderd uit de actieve voorraadlijst.`
          : `${selectedProducts.length} artikelen zijn verwijderd uit de actieve voorraadlijst.`,
      );
      setSelectedProducts([]);
      setConfirmationOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "De artikelen konden niet worden verwijderd.");
    } finally {
      setDeleting(false);
    }
  }

  const allProductsSelected = products.length > 0 && products.every((product) =>
    selectedProducts.some((selectedProduct) => selectedProduct.id === product.id),
  );

  return (
    <>
      <div className="inventory-list-heading">
        <div>
          <div className="eyebrow">BESTAANDE ARTIKELEN</div>
          <h2>Bestaande artikelen</h2>
          <p>Selecteer een of meer artikelen om ze uit de actieve voorraadlijst te halen.</p>
        </div>
      </div>

      {error || notice ? (
        <div className="inventory-toast-stack" aria-live="polite">
          {error ? (
            <div className="inventory-alert inventory-alert-error" role="alert">
              <span>{error}</span>
              <button className="inventory-toast-close" type="button" aria-label="Foutmelding sluiten" onClick={() => setError("")}>
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : null}
          {notice ? (
            <div className="inventory-alert inventory-alert-success" role="status">
              <span>{notice}</span>
              <button className="inventory-toast-close" type="button" aria-label="Melding sluiten" onClick={() => setNotice("")}>
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <div className="history-empty">Artikelen worden geladen…</div>
      ) : products.length === 0 ? (
        <div className="history-empty">
          <strong>Er zijn geen actieve artikelen</strong>
          <span>Nieuwe artikelen kun je toevoegen via Artikelen beheren.</span>
        </div>
      ) : (
        <>
          <div className="inventory-delete-toolbar">
            <label className="inventory-delete-select-all">
              <input
                type="checkbox"
                checked={allProductsSelected}
                disabled={deleting}
                onChange={(event) => {
                  setSelectedProducts(event.target.checked ? products : []);
                }}
              />
              Alles selecteren
            </label>
            <button
              className="primary-button inventory-delete-confirm"
              type="button"
              disabled={selectedProducts.length === 0 || deleting}
              onClick={() => {
                setError("");
                setNotice("");
                setConfirmationOpen(true);
              }}
              aria-haspopup="dialog"
            >
              Verwijder selectie ({selectedProducts.length})
            </button>
          </div>
          <div className="inventory-table-wrap">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th><span className="visually-hidden">Selecteren</span></th>
                  <th>ARTIKEL</th>
                  <th>ARTIKELCODE</th>
                  <th>VOORRAAD</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const checked = selectedProducts.some((selectedProduct) => selectedProduct.id === product.id);
                  return (
                    <tr key={product.id}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Selecteer ${product.name}`}
                          checked={checked}
                          disabled={deleting}
                          onChange={(event) => {
                            setSelectedProducts((current) =>
                              event.target.checked
                                ? [...current, product]
                                : current.filter((selectedProduct) => selectedProduct.id !== product.id),
                            );
                          }}
                        />
                      </td>
                      <td><strong>{product.name}</strong></td>
                      <td>{product.sku}</td>
                      <td>
                        <strong className="table-stock">
                          <span className="stock-value-number">{product.stock_quantity.toLocaleString("nl-NL")}</span>
                          <span className="stock-value-unit">{product.unit}</span>
                        </strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {confirmationOpen && selectedProducts.length > 0 ? (
        <div
          className="inventory-delete-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (!deleting && event.target === event.currentTarget) setConfirmationOpen(false);
          }}
        >
          <section className="inventory-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-product-title">
            <div className="eyebrow">ARTIKELEN VERWIJDEREN</div>
            <h2 id="delete-product-title">
              Weet je zeker dat je {selectedProducts.length === 1 ? "dit artikel" : `deze ${selectedProducts.length} artikelen`} wilt verwijderen?
            </h2>
            <p>
              {selectedProducts.length === 1
                ? <><strong>{selectedProducts[0].name}</strong> ({selectedProducts[0].sku}) wordt uit de actieve voorraadlijst verwijderd.</>
                : <>De geselecteerde artikelen worden uit de actieve voorraadlijst verwijderd.</>} De voorraadgeschiedenis blijft bewaard.
            </p>
            <div className="inventory-delete-actions">
              <button className="secondary-button" type="button" disabled={deleting} onClick={() => setConfirmationOpen(false)}>
                Annuleren
              </button>
              <button className="primary-button inventory-delete-confirm" type="button" disabled={deleting} onClick={() => void confirmRemoval()}>
                {deleting ? "Artikelen verwijderen…" : `Ja, verwijder ${selectedProducts.length === 1 ? "artikel" : "selectie"}`}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
