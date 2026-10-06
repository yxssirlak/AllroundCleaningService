"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import BusinessSidebar from "@/components/business-sidebar";
import BusinessTopbarTools from "@/components/business-topbar-tools";
import StyledSelect from "@/components/styled-select";
import { hasInventoryPrecision } from "@/lib/inventory/validation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { clearRememberSessionPreference } from "@/lib/supabase/session-preference";
import type { Database, InventoryMovementType } from "@/lib/supabase/database.types";

type Product = Database["public"]["Tables"]["inventory_products"]["Row"];
type Movement = Database["public"]["Tables"]["inventory_movements"]["Row"] & {
  product: Pick<Product, "id" | "name" | "sku" | "unit"> | null;
};
type MovementConfirmation = {
  productName: string;
  movementType: InventoryMovementType;
  quantity: number;
  unit: string;
  stockAfter: number;
};
type ApiError = { error?: string };

async function readApiResponse<T>(response: Response): Promise<T> {
  const result = (await response.json()) as T & ApiError;
  if (!response.ok) {
    throw new Error(result.error ?? "Er ging iets mis. Probeer het opnieuw.");
  }
  return result;
}

function InventoryIcon({
  name,
  size = 19,
}: {
  name: "grid" | "box" | "users" | "calendar" | "briefcase" | "receipt" | "sparkles" | "settings" | "search" | "camera" | "plus" | "arrow" | "scan" | "close" | "check" | "clock" | "logout" | "warning" | "shield" | "refresh";
  size?: number;
}) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    box: <><path d="m21 8-9-5-9 5v8l9 5 9-5V8Z" /><path d="m3.3 7.9 8.7 5 8.7-5M12 13v8M7.5 5.5l9 5" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></>,
    receipt: <><path d="M4 3h16v18l-3-2-3 2-3-2-3 2-4-2z" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
    sparkles: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    camera: <><path d="M14 4h-4L8 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4l-2-3Z" /><circle cx="12" cy="13" r="3" /></>,
    plus: <path d="M12 5v14m-7-7h14" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    scan: <><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M4 12h16" /></>,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    check: <path d="m5 12 4 4L19 6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    warning: <><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" /></>,
  } satisfies Record<string, React.ReactNode>;

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function CameraScanner({
  onClose,
  onBarcode,
  onError,
}: {
  onClose: () => void;
  onBarcode: (barcode: string) => void;
  onError: (message: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onBarcodeRef = useRef(onBarcode);
  const onErrorRef = useRef(onError);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    onBarcodeRef.current = onBarcode;
    onErrorRef.current = onError;
  }, [onBarcode, onError]);

  useEffect(() => {
    let stopped = false;
    let barcodeFound = false;
    let stopCamera: (() => void) | undefined;
    const video = videoRef.current;

    if (!video || !navigator.mediaDevices?.getUserMedia) {
      setStarting(false);
      onErrorRef.current("Deze browser biedt geen cameratoegang. Gebruik de handscanner of voer de barcode in.");
      return;
    }
    const preview = video;

    async function startCamera() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (stopped) return;
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } }, audio: false },
          preview,
          (result) => {
            if (result && !barcodeFound) {
              barcodeFound = true;
              stopCamera?.();
              onBarcodeRef.current(result.getText());
            }
          },
        );
        stopCamera = () => controls.stop();
        if (stopped || barcodeFound) {
          stopCamera();
        }
        setStarting(false);
      } catch (caught) {
        if (stopped) return;
        console.error("Camerascan starten mislukt:", caught);
        setStarting(false);
        onErrorRef.current("Camera niet beschikbaar. Controleer de cameratoestemming of gebruik een handscanner.");
      }
    }

    void startCamera();
    return () => {
      stopped = true;
      stopCamera?.();
    };
  }, []);

  return (
    <div className="scanner-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="scanner-dialog" role="dialog" aria-modal="true" aria-labelledby="scanner-title">
        <div className="scanner-header">
          <div>
            <div className="eyebrow">BARCODE SCANNEN</div>
            <h2 id="scanner-title">Richt je camera op de barcode</h2>
          </div>
          <button className="scanner-close" type="button" onClick={onClose} aria-label="Scanner sluiten">
            <InventoryIcon name="close" />
          </button>
        </div>
        <div className="camera-preview">
          <video ref={videoRef} muted autoPlay playsInline />
          <span className="camera-target" />
          {starting ? <span className="camera-loading">Camera wordt gestart…</span> : null}
        </div>
        <p className="scanner-help">Houd de barcode stil in het kader. Bij herkenning ga je direct verder.</p>
        <div className="scanner-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Annuleren</button>
        </div>
      </section>
    </div>
  );
}

export default function InventoryWorkspace({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const movementPanelRef = useRef<HTMLElement>(null);
  const movementChoiceRef = useRef<HTMLFieldSetElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [barcode, setBarcode] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [barcodeMatches, setBarcodeMatches] = useState<Product[]>([]);
  const [movementType, setMovementType] = useState<InventoryMovementType>("in");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [movementConfirmation, setMovementConfirmation] = useState<MovementConfirmation | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get("added") !== "1") return;

    currentUrl.searchParams.delete("added");
    window.history.replaceState(
      window.history.state,
      "",
      `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
    );
    const noticeTimer = window.setTimeout(() => {
      setNotice("Het artikel is toegevoegd aan de voorraadcatalogus.");
    }, 0);

    return () => window.clearTimeout(noticeTimer);
  }, [pathname]);

  useEffect(() => {
    if (!error && !notice) return;

    const timeout = window.setTimeout(() => {
      setError("");
      setNotice("");
    }, 6000);

    return () => window.clearTimeout(timeout);
  }, [error, notice]);

  useEffect(() => {
    if (!movementConfirmation) return;
    const timeout = window.setTimeout(() => setMovementConfirmation(null), 5500);
    return () => window.clearTimeout(timeout);
  }, [movementConfirmation]);

  const loadInventory = useCallback(async () => {
    try {
      const [productsResponse, movementsResponse] = await Promise.all([
        fetch("/api/inventory/products", { cache: "no-store" }),
        fetch("/api/inventory/movements", { cache: "no-store" }),
      ]);
      const productPayload = await readApiResponse<{ products: Product[] }>(productsResponse);
      const movementPayload = await readApiResponse<{ movements: Movement[] }>(movementsResponse);
      setProducts(productPayload.products);
      setMovements(movementPayload.movements);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Voorraad kon niet worden opgehaald.");
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setMovements, setProducts]);

  useEffect(() => {
    let active = true;

    async function loadInitialInventory() {
      try {
        const [productsResponse, movementsResponse] = await Promise.all([
          fetch("/api/inventory/products", { cache: "no-store" }),
          fetch("/api/inventory/movements", { cache: "no-store" }),
        ]);
        const productPayload = await readApiResponse<{ products: Product[] }>(productsResponse);
        const movementPayload = await readApiResponse<{ movements: Movement[] }>(movementsResponse);
        if (active) {
          setProducts(productPayload.products);
          setMovements(movementPayload.movements);
        }
      } catch (caught) {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Voorraad kon niet worden opgehaald.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInitialInventory();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const supabase = createSupabaseBrowserClient();
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const refreshSoon = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void loadInventory();
      }, 350);
    };

    const channel = supabase
      .channel("inventory-live-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_products" }, refreshSoon)
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_movements" }, refreshSoon)
      .subscribe((_status, error) => {
        if (error) {
          console.error("Live voorraadupdates zijn niet beschikbaar:", error.message);
        }
      });

    const fallbackRefresh = setInterval(() => {
      void loadInventory();
    }, 30000);

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      clearInterval(fallbackRefresh);
      void supabase.removeChannel(channel);
    };
  }, [loadInventory, loading]);

  const selectedProduct = products.find((product) => product.id === selectedId) ?? null;
  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("nl");
    if (!normalizedSearch) return products;

    return products.filter((product) =>
      [product.name, product.sku ?? "", product.barcode ?? "", product.location ?? ""]
        .some((value) => value.toLocaleLowerCase("nl").includes(normalizedSearch)),
    );
  }, [products, search]);

  const lowStockCount = products.filter(
    (product) => product.minimum_quantity > 0 && product.stock_quantity <= product.minimum_quantity,
  ).length;
  const barcodeCount = products.filter((product) => product.barcode).length;
  const projectedQuantity = selectedProduct
    ? selectedProduct.stock_quantity
      + (movementType === "in" ? Number(quantity || 0) : -Number(quantity || 0))
    : null;
  const quantityValue = quantity.trim() === "" ? Number.NaN : Number(quantity);
  const quantityIsValid =
    Number.isFinite(quantityValue)
    && quantityValue > 0
    && quantityValue <= 1000000
    && hasInventoryPrecision(quantityValue);
  const movementCanSubmit =
    Boolean(selectedProduct)
    && !loading
    && !saving
    && quantityIsValid
    && note.length <= 250
    && (movementType === "in" || (selectedProduct !== null && quantityValue <= selectedProduct.stock_quantity));

  const selectProduct = useCallback((product: Product) => {
    setMovementConfirmation(null);
    setBarcode(product.barcode ?? product.sku ?? "");
    setSelectedId(product.id);
    setBarcodeMatches([]);
    setError("");
    setNotice("");
    window.requestAnimationFrame(() => {
      movementPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.requestAnimationFrame(() => {
        movementChoiceRef.current?.querySelector<HTMLInputElement>('input[type="radio"]')?.focus({ preventScroll: true });
      });
    });
  }, [
    setBarcode,
    setBarcodeMatches,
    setError,
    setMovementConfirmation,
    setNotice,
    setSelectedId,
  ]);

  const lookupBarcode = useCallback((value: string) => {
    const scannedCode = value.trim();
    if (!scannedCode) return;
    const matches = products.filter(
      (item) => item.barcode === scannedCode || item.sku === scannedCode,
    );

    setBarcode(scannedCode);
    setNotice("");
    setError("");
    setMovementConfirmation(null);

    if (matches.length === 1) {
      selectProduct(matches[0]);
      return;
    }

    if (matches.length > 1) {
      setSelectedId("");
      setBarcodeMatches(matches);
      setNotice("Meerdere artikelen passen bij deze code. Kies het juiste artikel om verder te gaan.");
      return;
    }

    setSelectedId("");
    setBarcodeMatches([]);
    const params = new URLSearchParams({
      barcode: scannedCode,
      returnTo: "/erp/voorraad",
    });
    router.push(`/erp/voorraad/nieuw?${params.toString()}`);
  }, [
    products,
    router,
    selectProduct,
    setBarcode,
    setBarcodeMatches,
    setError,
    setMovementConfirmation,
    setNotice,
    setSelectedId,
  ]);

  function handleBarcodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    lookupBarcode(barcode);
  }

  async function handleMovementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!movementCanSubmit || !selectedProduct) {
      setError(
        !selectedProduct
          ? "Scan of selecteer eerst een artikel."
          : movementType === "out" && projectedQuantity !== null && projectedQuantity < 0
            ? "Het af te boeken aantal is groter dan de beschikbare voorraad."
            : "Controleer het aantal en probeer het opnieuw.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const submittedType = movementType;
      const submittedQuantity = Number(quantity);
      const submittedProduct = selectedProduct;
      const response = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: submittedProduct.id,
          movementType: submittedType,
          quantity: submittedQuantity,
          note,
        }),
      });
      const { movement } = await readApiResponse<{ movement: Movement }>(response);
      setMovementConfirmation({
        productName: submittedProduct.name,
        movementType: submittedType,
        quantity: submittedQuantity,
        unit: submittedProduct.unit,
        stockAfter: movement.stock_after,
      });
      setSelectedId("");
      setBarcode("");
      setBarcodeMatches([]);
      setQuantity("1");
      setNote("");
      setMovementType("in");
      await loadInventory();
      window.requestAnimationFrame(() => {
        barcodeInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        barcodeInputRef.current?.focus({ preventScroll: true });
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "De voorraadmutatie kon niet worden opgeslagen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      clearRememberSessionPreference();
      router.replace("/login");
      router.refresh();
    } catch (caught) {
      console.error("Uitloggen mislukt:", caught);
      setError("Uitloggen is niet gelukt. Probeer het opnieuw.");
    }
  }

  function focusMovementOptions() {
    const movementChoice = movementChoiceRef.current;
    if (!movementChoice) return;

    movementChoice.scrollIntoView({ behavior: "smooth", block: "center" });
    movementChoice.querySelector<HTMLInputElement>('input[type="radio"]')?.focus({ preventScroll: true });
  }

  return (
    <div className="portal inventory-portal">
      <BusinessSidebar currentPage="inventory" accountLabel="Ingelogd" accountDetail={email} />

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <Link href="/dashboard">Allround</Link>
            <span className="breadcrumb-divider">/</span><span>ERP</span>
            <span className="breadcrumb-divider">/</span><strong>Voorraad</strong>
          </div>
          <div className="topbar-right inventory-topbar">
            <BusinessTopbarTools accountName={email} />
            <button className="signout-button" type="button" onClick={handleSignOut} aria-label="Uitloggen">
              <InventoryIcon name="logout" size={17} /><span>Uitloggen</span>
            </button>
          </div>
        </header>

        <div className="dashboard-content inventory-content">
          <section className="welcome-row inventory-welcome">
            <div>
              <div className="eyebrow">ERP · MAGAZIJNBEHEER</div>
              <h1>Voorraad & goederen</h1>
              <p>Registreer wat binnenkomt, boek verbruik af en houd je magazijn actueel.</p>
            </div>
            <Link className="primary-button" href="/erp/voorraad/nieuw">
              <InventoryIcon name="plus" size={17} /> Nieuw artikel
            </Link>
          </section>

          <section className="inventory-metrics" aria-label="Voorraadoverzicht">
            <article className="inventory-metric">
              <div className="inventory-metric-heading">
                <span className="inventory-metric-label">Artikelen in catalogus</span>
                <span className="inventory-metric-icon metric-cyan"><InventoryIcon name="box" /></span>
              </div>
              <strong>{loading ? "—" : products.length}</strong>
            </article>
            <article className="inventory-metric">
              <div className="inventory-metric-heading">
                <span className="inventory-metric-label">Onder minimumvoorraad</span>
                <span className="inventory-metric-icon metric-amber"><InventoryIcon name="warning" /></span>
              </div>
              <strong className={lowStockCount > 0 ? "inventory-metric-alert-value" : ""}>{loading ? "—" : lowStockCount}</strong>
            </article>
            <article className="inventory-metric">
              <div className="inventory-metric-heading">
                <span className="inventory-metric-label">Artikelen met barcode</span>
                <span className="inventory-metric-icon metric-cyan"><InventoryIcon name="scan" /></span>
              </div>
              <strong>{loading ? "—" : barcodeCount}</strong>
            </article>
          </section>

          <section className="stock-workflow">
            <article className="panel scan-panel">
              <div className="inventory-section-heading">
                <div>
                  <span className="inventory-step-label"><span>01</span> ARTIKEL HERKENNEN</span>
                  <h2>Scan een artikel</h2>
                  <p>Gebruik een handscanner of de camera van je telefoon of tablet.</p>
                </div>
                <span className="inventory-heading-icon"><InventoryIcon name="scan" size={21} /></span>
              </div>

              <form className="barcode-form" onSubmit={handleBarcodeSubmit}>
                <label className="visually-hidden" htmlFor="inventory-barcode">Barcode of artikelcode</label>
                <div className="barcode-input-wrap">
                  <InventoryIcon name="scan" size={20} />
                  <input
                    id="inventory-barcode"
                    ref={barcodeInputRef}
                    autoComplete="off"
                    value={barcode}
                    onChange={(event) => {
                      setBarcode(event.target.value);
                    }}
                    placeholder="Scan barcode of artikelcode…"
                  />
                  <button className="barcode-submit" type="submit">Zoeken</button>
                </div>
              </form>
              <div className="scan-methods">
                <button className="camera-button" type="button" onClick={() => setScannerOpen(true)}>
                  <InventoryIcon name="camera" size={17} /> Scan met camera
                </button>
                <span>Handscanner werkt direct in het invoerveld (druk op Enter).</span>
              </div>

              <div className="inventory-or"><span>OF SELECTEER HANDMATIG</span></div>
              <span className="field-label">Artikel uit catalogus</span>
              <StyledSelect
                ariaLabel="Artikel uit catalogus"
                value={selectedId}
                onChange={(id) => {
                  const product = products.find((item) => item.id === id);
                  if (product) {
                    selectProduct(product);
                  } else {
                    setSelectedId("");
                    setBarcodeMatches([]);
                  }
                }}
                placeholder="Kies een artikel…"
                options={[
                  { value: "", label: "Kies een artikel…" },
                  ...products.map((product) => ({
                    value: product.id,
                    label: `${product.name}${product.sku ? ` · ${product.sku}` : ""}`,
                    description: `Voorraad: ${product.stock_quantity} ${product.unit}`,
                  })),
                ]}
              />

              {barcodeMatches.length > 1 ? (
                <div className="barcode-match-list" role="group" aria-label="Kies het juiste artikel">
                  <strong>Meerdere artikelen gevonden</strong>
                  <span>Kies het artikel dat je wilt bijwerken.</span>
                  {barcodeMatches.map((product) => (
                    <button
                      className="barcode-match-option"
                      key={product.id}
                      onClick={() => selectProduct(product)}
                      type="button"
                    >
                      <span className="barcode-match-copy">
                        <strong>{product.name}</strong>
                        <small>{product.sku ? `Code ${product.sku}` : `Barcode ${product.barcode}`} · {product.location ?? "Geen locatie"}</small>
                      </span>
                      <span className="barcode-match-stock">{product.stock_quantity.toLocaleString("nl-NL")} {product.unit}</span>
                    </button>
                  ))}
                </div>
              ) : null}

            </article>

            <div className={`workflow-connector ${selectedProduct ? "workflow-connector-ready" : ""}`} aria-live="polite">
              <span className="workflow-connector-line" />
              {!selectedProduct ? (
                <span className="workflow-connector-copy">
                  <strong>Eerst een artikel selecteren</strong>
                  <span>Scan een barcode of kies een artikel uit de catalogus</span>
                </span>
              ) : null}
              <button
                className="recognized-product-next"
                type="button"
                aria-label="Ga naar voorraad bijwerken"
                disabled={!selectedProduct}
                onClick={focusMovementOptions}
              >
                <InventoryIcon name="arrow" size={19} />
              </button>
              <span className="workflow-connector-line" />
            </div>

            <article
              className={`panel movement-panel ${selectedProduct ? "" : "movement-panel-locked"}`}
              ref={movementPanelRef}
            >
              <div className="inventory-section-heading">
                <div>
                  <span className="inventory-step-label"><span>02</span> VOORRAAD BIJWERKEN</span>
                  <h2>Registreer een mutatie</h2>
                  <p>Elke ontvangst en afboeking wordt met tijdstip bewaard.</p>
                </div>
                <span className="inventory-heading-icon movement-heading-icon"><InventoryIcon name="receipt" size={21} /></span>
              </div>
              {!selectedProduct ? (
                <div className="movement-locked-notice" role="status">
                  <InventoryIcon name="scan" size={17} />
                  <span><strong>Stap 2 is nog vergrendeld</strong>Selecteer of scan eerst een bestaand artikel.</span>
                </div>
              ) : (
                <div className="movement-product-summary">
                  <span className="movement-product-icon"><InventoryIcon name="box" size={21} /></span>
                  <span className="movement-product-details">
                    <strong>{selectedProduct.name}</strong>
                    <span>{selectedProduct.sku ? `Artikelcode ${selectedProduct.sku}` : "Geen artikelcode"}{selectedProduct.location ? ` · ${selectedProduct.location}` : ""}</span>
                  </span>
                  <span className="movement-current-stock">
                    <span>Huidige voorraad</span>
                    <strong>{selectedProduct.stock_quantity.toLocaleString("nl-NL")} {selectedProduct.unit}</strong>
                  </span>
                </div>
              )}
              <form className="movement-form" onSubmit={handleMovementSubmit}>
                <fieldset className="movement-fields" disabled={!selectedProduct || loading || saving}>
                  <fieldset className="movement-choice" ref={movementChoiceRef}>
                    <legend>Wat wil je registreren?</legend>
                    <label className={movementType === "in" ? "movement-option selected movement-in" : "movement-option"}>
                      <input type="radio" name="movementType" value="in" checked={movementType === "in"} onChange={() => setMovementType("in")} />
                      <span className="movement-option-icon"><InventoryIcon name="arrow" size={17} /></span>
                      <span><strong>Ontvangen</strong><small>Goederen komen binnen</small></span>
                    </label>
                    <label className={movementType === "out" ? "movement-option selected movement-out" : "movement-option"}>
                      <input type="radio" name="movementType" value="out" checked={movementType === "out"} onChange={() => setMovementType("out")} />
                      <span className="movement-option-icon movement-out-icon"><InventoryIcon name="arrow" size={17} /></span>
                      <span><strong>Afboeken</strong><small>Goederen gaan eruit</small></span>
                    </label>
                  </fieldset>
                  <div className="form-grid-two movement-inputs">
                    <label>
                      <span className="field-label">Aantal *</span>
                      <div className="quantity-wrap">
                        <input className="inventory-input" type="number" min="0.001" max="1000000" step="0.001" required value={quantity} onChange={(event) => setQuantity(event.target.value)} />
                        <span className="quantity-unit">{selectedProduct?.unit ?? "stuks"}</span>
                      </div>
                    </label>
                    <label>
                      <span className="field-label">Notitie <span className="optional-label">Optioneel</span></span>
                      <input className="inventory-input" value={note} onChange={(event) => setNote(event.target.value)} maxLength={250} placeholder={movementType === "in" ? "Bijvoorbeeld: inkooporder" : "Bijvoorbeeld: verbruikt op locatie"} />
                    </label>
                  </div>
                </fieldset>
                <div className={`stock-result ${projectedQuantity !== null && projectedQuantity < 0 ? "stock-result-invalid" : ""}`}>
                  <span className="stock-result-heading">Voorraad na deze mutatie</span>
                  <div className="stock-result-values">
                    <span className="stock-result-current">
                      <small>Nu</small>
                      <strong>{selectedProduct ? `${selectedProduct.stock_quantity.toLocaleString("nl-NL")} ${selectedProduct.unit}` : "—"}</strong>
                    </span>
                    <span className="stock-result-arrow" aria-hidden="true"><InventoryIcon name="arrow" size={18} /></span>
                    <span className="stock-result-next">
                      <small>Na mutatie</small>
                      <strong className={projectedQuantity !== null && projectedQuantity < 0 ? "stock-result-negative" : ""}>
                        {selectedProduct && projectedQuantity !== null && projectedQuantity >= 0
                          ? `${projectedQuantity.toLocaleString("nl-NL")} ${selectedProduct.unit}`
                          : projectedQuantity !== null && projectedQuantity < 0
                            ? "Onvoldoende voorraad"
                            : "Selecteer een artikel"}
                      </strong>
                    </span>
                  </div>
                </div>
                {selectedProduct && movementType === "out" && quantityIsValid && projectedQuantity !== null && projectedQuantity < 0 ? (
                  <p className="movement-validation-message" role="alert">Dit aantal is groter dan de beschikbare voorraad.</p>
                ) : null}
                {!quantityIsValid && selectedProduct ? (
                  <p className="movement-validation-message">Vul een aantal groter dan nul in (maximaal drie decimalen).</p>
                ) : null}
                <button className={`primary-button movement-submit ${movementType === "out" ? "movement-submit-out" : ""}`} type="submit" disabled={!movementCanSubmit}>
                  <InventoryIcon name={movementType === "in" ? "arrow" : "receipt"} size={17} />
                  {saving ? "Voorraad wordt bijgewerkt…" : movementType === "in" ? "Ontvangst bevestigen" : "Afboeking bevestigen"}
                </button>
                <p className="movement-footnote"><InventoryIcon name="shield" size={14} /> Mutaties worden veilig en direct in de voorraadadministratie verwerkt.</p>
              </form>
            </article>
          </section>

          <section className="panel inventory-list-panel">
            <div className="inventory-list-heading">
              <div>
                <div className="eyebrow">MAGAZIJNADMINISTRATIE</div>
                <h2>Artikelen op voorraad</h2>
                <p>Huidige voorraad en magazijnlocaties.</p>
              </div>
              <div className="inventory-list-actions">
                <button className="inventory-refresh" type="button" onClick={() => void loadInventory()} aria-label="Voorraad vernieuwen" title="Voorraad vernieuwen">
                  <InventoryIcon name="refresh" size={16} />
                </button>
                <label className="inventory-search">
                  <InventoryIcon name="search" size={17} />
                  <span className="visually-hidden">Zoek in artikelen</span>
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Zoek op naam, code of barcode" />
                </label>
              </div>
            </div>
            <div className="inventory-table-wrap">
              <table className="inventory-table">
                <thead><tr><th>ARTIKEL</th><th>ARTIKELCODE / BARCODE</th><th>LOCATIE</th><th>VOORRAAD</th><th>STATUS</th><th aria-label="Actie" /></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td className="inventory-table-message" colSpan={6}>Voorraad wordt geladen…</td></tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr><td className="inventory-table-message" colSpan={6}>
                      <span className="table-empty">
                        <span className="empty-illustration"><InventoryIcon name="box" size={23} /></span>
                        <strong>{search ? "Geen artikelen gevonden" : "Je magazijn is nog leeg"}</strong>
                        <span>{search ? "Pas je zoekopdracht aan." : "Voeg je eerste artikel toe of scan een barcode om te beginnen."}</span>
                      </span>
                    </td></tr>
                  ) : filteredProducts.map((product) => {
                    const isLow = product.minimum_quantity > 0 && product.stock_quantity <= product.minimum_quantity;
                    return (
                      <tr key={product.id}>
                        <td><span className="table-product"><span className="table-product-icon"><InventoryIcon name="box" size={16} /></span><strong>{product.name}</strong></span></td>
                        <td><span className="table-code">{product.sku ?? "—"}</span><span className="table-barcode">{product.barcode ?? "Geen barcode"}</span></td>
                        <td>{product.location ?? "Niet toegewezen"}</td>
                        <td><strong className="table-stock">{product.stock_quantity.toLocaleString("nl-NL")} <span>{product.unit}</span></strong></td>
                        <td><span className={`product-status ${isLow ? "product-status-low" : "product-status-ok"}`}>{isLow ? <><span />Bijbestellen</> : "Op voorraad"}</span></td>
                        <td><button className="table-action" type="button" onClick={() => {
                          setSelectedId(product.id);
                          setMovementType("in");
                          movementPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}>Mutatie <InventoryIcon name="arrow" size={14} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel history-panel">
            <div className="inventory-list-heading">
              <div>
                <div className="eyebrow">CONTROLEERBAAR EN ACTUEEL</div>
                <h2>Recente voorraadmutaties</h2>
                <p>De laatste 6 ontvangsten en afboekingen.</p>
              </div>
              <div className="history-heading-actions">
                <span className="history-icon"><InventoryIcon name="clock" size={19} /></span>
                <Link className="primary-button history-all-link" href="/erp/voorraad/mutaties">
                  Alle mutaties bekijken <InventoryIcon name="arrow" size={15} />
                </Link>
              </div>
            </div>
            {loading ? <div className="history-empty">Mutaties worden geladen…</div> : movements.length === 0 ? (
              <div className="history-empty">
                <span className="empty-illustration empty-illustration-purple"><InventoryIcon name="receipt" size={22} /></span>
                <strong>Er zijn nog geen voorraadmutaties</strong>
                <span>Na de eerste ontvangst of afboeking zie je hier de voorraadgeschiedenis.</span>
              </div>
            ) : (
              <div className="history-list">
                {movements.slice(0, 6).map((movement) => (
                  <article className="history-row" key={movement.id}>
                    <span className={`history-type-icon ${movement.movement_type === "in" ? "history-in" : "history-out"}`}><InventoryIcon name="arrow" size={17} /></span>
                    <div className="history-product"><strong>{movement.product?.name ?? "Artikel verwijderd"}</strong><span>{movement.note || (movement.movement_type === "in" ? "Goederen ontvangen" : "Goederen afgeboekt")}</span></div>
                    <time dateTime={movement.created_at}>{new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(movement.created_at))}</time>
                    <strong className={movement.movement_type === "in" ? "history-quantity history-quantity-in" : "history-quantity history-quantity-out"}>
                      {movement.movement_type === "in" ? "+" : "−"}{movement.quantity.toLocaleString("nl-NL")} {movement.product?.unit ?? ""}
                    </strong>
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="page-footer inventory-footer">
            <span>© Allround Cleaning Service</span>
            <span><InventoryIcon name="shield" size={13} /> Voorraadmutaties zijn voorzien van tijdstip en account.</span>
          </footer>
        </div>
      </main>

      {scannerOpen ? (
        <CameraScanner
          onClose={() => setScannerOpen(false)}
          onError={setError}
          onBarcode={(value) => {
            setScannerOpen(false);
            lookupBarcode(value);
          }}
        />
      ) : null}
      {error || notice || movementConfirmation ? (
        <div className="inventory-toast-stack" aria-live="polite">
          {error ? (
            <div className="inventory-alert inventory-alert-error" role="alert">
              <InventoryIcon name="warning" size={18} />
              <span>{error}</span>
              <button className="inventory-toast-close" type="button" aria-label="Foutmelding sluiten" onClick={() => setError("")}>
                <InventoryIcon name="close" size={16} />
              </button>
            </div>
          ) : null}
          {notice ? (
            <div className="inventory-alert inventory-alert-success" role="status">
              <InventoryIcon name="check" size={18} />
              <span>{notice}</span>
              <button className="inventory-toast-close" type="button" aria-label="Melding sluiten" onClick={() => setNotice("")}>
                <InventoryIcon name="close" size={16} />
              </button>
            </div>
          ) : null}
          {movementConfirmation ? (
            <div className={`inventory-alert inventory-alert-success movement-confirmation movement-confirmation-${movementConfirmation.movementType}`} role="status">
              <span className="movement-confirmation-check"><InventoryIcon name="check" size={20} /></span>
              <span className="movement-confirmation-copy">
                <strong>{movementConfirmation.movementType === "in" ? "Opgeboekt" : "Afgeboekt"}</strong>
                <span className="movement-confirmation-details">
                  <span className="movement-confirmation-product">{movementConfirmation.productName}</span>
                  <span className="movement-confirmation-quantity">
                    {movementConfirmation.movementType === "in" ? "+" : "−"}{movementConfirmation.quantity.toLocaleString("nl-NL")} {movementConfirmation.unit}
                  </span>
                </span>
              </span>
              <span className="movement-confirmation-stock">
                <small>Nieuwe voorraad</small>
                <strong>{movementConfirmation.stockAfter.toLocaleString("nl-NL")} {movementConfirmation.unit}</strong>
              </span>
              <button className="inventory-toast-close" type="button" aria-label="Melding sluiten" onClick={() => setMovementConfirmation(null)}>
                <InventoryIcon name="close" size={16} />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
