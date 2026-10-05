"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import StyledSelect from "@/components/styled-select";

type Props = {
  initialBarcode: string;
  returnPath: string;
};

type ApiError = { error?: string };

async function readApiResponse<T>(response: Response): Promise<T> {
  const result = (await response.json()) as T & ApiError;
  if (!response.ok) {
    throw new Error(result.error ?? "Er ging iets mis. Probeer het opnieuw.");
  }
  return result;
}

export default function NewInventoryProductForm({ initialBarcode, returnPath }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState(initialBarcode);
  const [unit, setUnit] = useState("stuk");
  const [location, setLocation] = useState("");
  const [minimumQuantity, setMinimumQuantity] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(() => setError(""), 6000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/inventory/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku,
          barcode,
          unit,
          location,
          minimumQuantity: Number(minimumQuantity),
        }),
      });
      await readApiResponse<{ product: { id: string } }>(response);
      router.replace(`${returnPath}?added=1`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Het artikel kon niet worden opgeslagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form className="new-product-form product-create-form" onSubmit={handleSubmit}>
      <div className="new-product-heading">
        <div>
          <strong>Artikelgegevens</strong>
          <span>Velden met een * zijn verplicht.</span>
        </div>
      </div>
      <label>
        <span className="field-label">Artikelnaam *</span>
        <input
          className="inventory-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={120}
          autoFocus
          placeholder="Bijvoorbeeld: microvezeldoek blauw"
        />
      </label>
      <div className="form-grid-two">
        <label>
          <span className="field-label">Barcode</span>
          <input className="inventory-input" value={barcode} onChange={(event) => setBarcode(event.target.value)} maxLength={128} />
        </label>
        <label>
          <span className="field-label">Artikelcode *</span>
          <input className="inventory-input" value={sku} onChange={(event) => setSku(event.target.value)} required maxLength={64} placeholder="Bijvoorbeeld: ART-001" />
        </label>
        <div className="product-create-select-field">
          <span className="field-label">Eenheid</span>
          <StyledSelect
            ariaLabel="Eenheid"
            onChange={setUnit}
            value={unit}
            options={[
              { value: "stuk", label: "Stuk" },
              { value: "pak", label: "Pak" },
              { value: "doos", label: "Doos" },
              { value: "liter", label: "Liter" },
              { value: "kg", label: "Kilogram" },
              { value: "rol", label: "Rol" },
            ]}
          />
        </div>
        <label>
          <span className="field-label">Magazijnlocatie</span>
          <input className="inventory-input" value={location} onChange={(event) => setLocation(event.target.value)} maxLength={100} placeholder="Bijvoorbeeld: Stelling A2" />
        </label>
        <label>
          <span className="field-label">Minimumvoorraad</span>
          <input className="inventory-input" type="number" min="0" max="1000000" step="0.001" value={minimumQuantity} onChange={(event) => setMinimumQuantity(event.target.value)} required />
        </label>
      </div>
      <div className="product-create-actions">
        <button className="primary-button form-save-button" type="submit" disabled={saving}>
          {saving ? "Artikel opslaan…" : "Artikel opslaan"}
        </button>
      </div>
      </form>
      {error ? (
        <div className="inventory-toast-stack" aria-live="polite">
          <div className="inventory-alert inventory-alert-error" role="alert">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" />
              <path d="M12 9v4m0 4h.01" />
            </svg>
            <span>{error}</span>
            <button className="inventory-toast-close" type="button" aria-label="Foutmelding sluiten" onClick={() => setError("")}>
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m18 6-12 12M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
