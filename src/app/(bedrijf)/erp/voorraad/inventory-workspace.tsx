"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database, InventoryMovementType } from "@/lib/supabase/database.types";

type Product = Database["public"]["Tables"]["inventory_products"]["Row"];
type Movement = Database["public"]["Tables"]["inventory_movements"]["Row"] & {
  product: Pick<Product, "id" | "name" | "sku" | "unit"> | null;
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
}: {
  onClose: () => void;
  onBarcode: (barcode: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [recognized, setRecognized] = useState("");
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let stopped = false;
    let barcodeFound = false;
    let stopCamera: (() => void) | undefined;
    const video = videoRef.current;

    if (!video || !navigator.mediaDevices?.getUserMedia) {
      setStarting(false);
      setError("Deze browser biedt geen cameratoegang. Gebruik de handscanner of voer de barcode in.");
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
              setRecognized(result.getText());
              stopCamera?.();
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
        setError("Camera niet beschikbaar. Controleer de cameratoestemming of gebruik een handscanner.");
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
          {error ? <span className="camera-error">{error}</span> : null}
        </div>
        {recognized ? (
          <div className="recognized-code"><InventoryIcon name="check" size={17} /> Barcode herkend: <strong>{recognized}</strong></div>
        ) : (
          <p className="scanner-help">Houd de barcode stil in het kader. De camera heeft toestemming nodig.</p>
        )}
        <div className="scanner-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Annuleren</button>
          <button className="primary-button" type="button" disabled={!recognized} onClick={() => onBarcode(recognized)}>
            Artikel zoeken
          </button>
        </div>
      </section>
    </div>
  );
}

export default function InventoryWorkspace({ email }: { email: string }) {
  const router = useRouter();
  const movementPanelRef = useRef<HTMLElement>(null);
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
  const [movementType, setMovementType] = useState<InventoryMovementType>("in");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [draftBarcode, setDraftBarcode] = useState("");
  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productUnit, setProductUnit] = useState("stuk");
  const [productLocation, setProductLocation] = useState("");
  const [minimumQuantity, setMinimumQuantity] = useState("0");

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
  }, []);

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
      .subscribe((status, error) => {
        setLiveConnected(status === "SUBSCRIBED");
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

  const lookupBarcode = useCallback((value: string) => {
    const scannedCode = value.trim();
    if (!scannedCode) return;
    const product = products.find(
      (item) => item.barcode === scannedCode || item.sku === scannedCode,
    );

    setBarcode(scannedCode);
    setNotice("");
    setError("");

    if (product) {
      setSelectedId(product.id);
      setCreateOpen(false);
      setNotice(`${product.name} geselecteerd. Kies de mutatie en bevestig het aantal.`);
      movementPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setDraftBarcode(scannedCode);
    setCreateOpen(true);
    setNotice("Deze barcode is nog niet bekend. Voeg het artikel eerst toe aan de administratie.");
    movementPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [products]);

  function handleBarcodeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    lookupBarcode(barcode);
  }

  async function handleMovementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct) {
      setError("Scan of selecteer eerst een artikel.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          movementType,
          quantity: Number(quantity),
          note,
        }),
      });
      await readApiResponse<{ movement: Movement }>(response);
      setNotice(movementType === "in" ? "Goederen ontvangen. De voorraad is bijgewerkt." : "Goederen afgeboekt. De voorraad is bijgewerkt.");
      setQuantity("1");
      setNote("");
      await loadInventory();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "De voorraadmutatie kon niet worden opgeslagen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleProductSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/inventory/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName,
          sku: productSku,
          barcode: draftBarcode,
          unit: productUnit,
          location: productLocation,
          minimumQuantity: Number(minimumQuantity),
        }),
      });
      const payload = await readApiResponse<{ product: Product }>(response);
      setSelectedId(payload.product.id);
      setBarcode(payload.product.barcode ?? "");
      setProductName("");
      setProductSku("");
      setProductUnit("stuk");
      setProductLocation("");
      setMinimumQuantity("0");
      setCreateOpen(false);
      setNotice(`${payload.product.name} is toegevoegd. Boek de ontvangen goederen hieronder in.`);
      await loadInventory();
      movementPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Het artikel kon niet worden opgeslagen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      router.replace("/login");
      router.refresh();
    } catch (caught) {
      console.error("Uitloggen mislukt:", caught);
      setError("Uitloggen is niet gelukt. Probeer het opnieuw.");
    }
  }

  return (
    <div className="portal inventory-portal">
      <aside className="sidebar">
        <Link className="brand" href="/dashboard" aria-label="Allround dashboard">
          <Image src="/logo.png" alt="Allround Cleaning Service" width={1024} height={368} priority />
        </Link>
        <div className="sidebar-label">WERKRUIMTE</div>
        <nav className="main-nav" aria-label="Hoofdnavigatie">
          <Link className="nav-item" href="/dashboard"><InventoryIcon name="grid" /><span>Dashboard</span></Link>
          <Link className="nav-item active" href="/erp/voorraad" aria-current="page"><InventoryIcon name="box" /><span>ERP & Voorraad</span></Link>
          <a className="nav-item nav-coming-soon" href="/dashboard#modules"><InventoryIcon name="users" /><span>Klanten & CRM</span><span className="coming-soon">In opbouw</span></a>
          <a className="nav-item nav-coming-soon" href="/dashboard#modules"><InventoryIcon name="calendar" /><span>Planning</span><span className="coming-soon">In opbouw</span></a>
          <a className="nav-item nav-coming-soon" href="/dashboard#modules"><InventoryIcon name="briefcase" /><span>Medewerkers</span><span className="coming-soon">In opbouw</span></a>
          <a className="nav-item nav-coming-soon" href="/dashboard#modules"><InventoryIcon name="receipt" /><span>Facturen</span><span className="coming-soon">In opbouw</span></a>
          <a className="nav-item nav-coming-soon" href="/dashboard#modules"><InventoryIcon name="sparkles" /><span>Automatiseringen</span><span className="coming-soon">In opbouw</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-label">BEHEER</div>
          <div className="account-card">
            <div className="avatar avatar-admin"><InventoryIcon name="users" size={17} /></div>
            <div className="account-copy"><strong>Ingelogd</strong><span title={email}>{email}</span></div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <Link href="/dashboard">Allround</Link>
            <span className="breadcrumb-divider">/</span><span>ERP</span>
            <span className="breadcrumb-divider">/</span><strong>Voorraad</strong>
          </div>
          <div className="topbar-right inventory-topbar">
            <span className="portal-tag">
              <span className={liveConnected ? "status-dot" : "build-dot"} />
              {liveConnected ? "Live voorraad" : "Voorraadbeheer"}
            </span>
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
            <button className="primary-button" type="button" onClick={() => {
              setDraftBarcode("");
              setCreateOpen((open) => !open);
            }}>
              <InventoryIcon name="plus" size={17} /> Nieuw artikel
            </button>
          </section>

          <section className="inventory-metrics" aria-label="Voorraadoverzicht">
            <article className="inventory-metric">
              <span className="inventory-metric-icon metric-cyan"><InventoryIcon name="box" /></span>
              <span className="inventory-metric-label">Artikelen in catalogus</span>
              <strong>{loading ? "—" : products.length}</strong>
              <span className="inventory-metric-detail">Actieve voorraadartikelen</span>
            </article>
            <article className="inventory-metric">
              <span className="inventory-metric-icon metric-amber"><InventoryIcon name="warning" /></span>
              <span className="inventory-metric-label">Onder minimumvoorraad</span>
              <strong>{loading ? "—" : lowStockCount}</strong>
              <span className="inventory-metric-detail">Artikelen met ingestelde drempel</span>
            </article>
            <article className="inventory-metric">
              <span className="inventory-metric-icon metric-violet"><InventoryIcon name="scan" /></span>
              <span className="inventory-metric-label">Artikelen met barcode</span>
              <strong>{loading ? "—" : barcodeCount}</strong>
              <span className="inventory-metric-detail">Via scanner direct terug te vinden</span>
            </article>
          </section>

          {error ? <div className="inventory-alert inventory-alert-error" role="alert"><InventoryIcon name="warning" size={18} />{error}</div> : null}
          {notice ? <div className="inventory-alert inventory-alert-success" role="status"><InventoryIcon name="check" size={18} />{notice}</div> : null}

          <section className="stock-workflow">
            <article className="panel scan-panel" ref={movementPanelRef}>
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
                    onChange={(event) => setBarcode(event.target.value)}
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
              <label className="field-label" htmlFor="select-product">Artikel uit catalogus</label>
              <select
                id="select-product"
                className="inventory-select"
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                <option value="">Kies een artikel…</option>
                {products.map((product) => (
                  <option value={product.id} key={product.id}>
                    {product.name}{product.sku ? ` · ${product.sku}` : ""} · voorraad {product.stock_quantity} {product.unit}
                  </option>
                ))}
              </select>

              {selectedProduct ? (
                <div className="selected-product">
                  <span className="selected-product-icon"><InventoryIcon name="box" size={19} /></span>
                  <span className="selected-product-copy">
                    <strong>{selectedProduct.name}</strong>
                    <span>{selectedProduct.sku ? `Artikelcode ${selectedProduct.sku}` : "Geen artikelcode"}
                      {selectedProduct.location ? ` · ${selectedProduct.location}` : ""}
                    </span>
                  </span>
                  <span className={`stock-pill ${selectedProduct.stock_quantity <= selectedProduct.minimum_quantity && selectedProduct.minimum_quantity > 0 ? "stock-pill-low" : ""}`}>
                    {selectedProduct.stock_quantity} {selectedProduct.unit}
                  </span>
                </div>
              ) : null}

              {createOpen ? (
                <form className="new-product-form" onSubmit={handleProductSubmit}>
                  <div className="new-product-heading">
                    <div><strong>Nieuw artikel toevoegen</strong><span>Eenmalig registreren; daarna kun je het scannen.</span></div>
                    <button type="button" className="quiet-icon-button" aria-label="Formulier sluiten" onClick={() => setCreateOpen(false)}><InventoryIcon name="close" size={17} /></button>
                  </div>
                  <label className="field-label" htmlFor="new-product-name">Artikelnaam *</label>
                  <input id="new-product-name" className="inventory-input" value={productName} onChange={(event) => setProductName(event.target.value)} required maxLength={120} placeholder="Bijvoorbeeld: microvezeldoek blauw" />
                  <div className="form-grid-two">
                    <label><span className="field-label">Barcode</span><input className="inventory-input" value={draftBarcode} onChange={(event) => setDraftBarcode(event.target.value)} maxLength={128} /></label>
                    <label><span className="field-label">Artikelcode</span><input className="inventory-input" value={productSku} onChange={(event) => setProductSku(event.target.value)} maxLength={64} placeholder="Optioneel" /></label>
                    <label><span className="field-label">Eenheid</span><select className="inventory-select" value={productUnit} onChange={(event) => setProductUnit(event.target.value)}><option value="stuk">Stuk</option><option value="pak">Pak</option><option value="doos">Doos</option><option value="liter">Liter</option><option value="kg">Kilogram</option><option value="rol">Rol</option></select></label>
                    <label><span className="field-label">Magazijnlocatie</span><input className="inventory-input" value={productLocation} onChange={(event) => setProductLocation(event.target.value)} maxLength={100} placeholder="Bijvoorbeeld: Stelling A2" /></label>
                    <label><span className="field-label">Minimumvoorraad</span><input className="inventory-input" type="number" min="0" step="0.001" value={minimumQuantity} onChange={(event) => setMinimumQuantity(event.target.value)} /></label>
                  </div>
                  <button className="primary-button form-save-button" type="submit" disabled={saving}><InventoryIcon name="plus" size={16} />{saving ? "Opslaan…" : "Artikel opslaan"}</button>
                </form>
              ) : null}
            </article>

            <article className="panel movement-panel">
              <div className="inventory-section-heading">
                <div>
                  <span className="inventory-step-label"><span>02</span> VOORRAAD BIJWERKEN</span>
                  <h2>Registreer een mutatie</h2>
                  <p>Elke ontvangst en afboeking wordt met tijdstip bewaard.</p>
                </div>
                <span className="inventory-heading-icon movement-heading-icon"><InventoryIcon name="receipt" size={21} /></span>
              </div>
              <form className="movement-form" onSubmit={handleMovementSubmit}>
                <fieldset className="movement-choice">
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
                    <div className="quantity-wrap"><input className="inventory-input" type="number" min="0.001" max="1000000" step="0.001" required value={quantity} onChange={(event) => setQuantity(event.target.value)} /><span>{selectedProduct?.unit ?? "stuks"}</span></div>
                  </label>
                  <label>
                    <span className="field-label">Notitie <span className="optional-label">Optioneel</span></span>
                    <input className="inventory-input" value={note} onChange={(event) => setNote(event.target.value)} maxLength={250} placeholder={movementType === "in" ? "Bijvoorbeeld: inkooporder" : "Bijvoorbeeld: verbruikt op locatie"} />
                  </label>
                </div>
                <div className="stock-result">
                  <span>Voorraad na mutatie</span>
                  <strong className={projectedQuantity !== null && projectedQuantity < 0 ? "stock-result-negative" : ""}>
                    {selectedProduct && projectedQuantity !== null
                      ? `${projectedQuantity.toLocaleString("nl-NL")} ${selectedProduct.unit}`
                      : "Selecteer eerst een artikel"}
                  </strong>
                </div>
                <button className={`primary-button movement-submit ${movementType === "out" ? "movement-submit-out" : ""}`} type="submit" disabled={saving || loading || !selectedProduct}>
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
                <span className={`realtime-badge ${liveConnected ? "realtime-connected" : ""}`}>
                  <span /> {liveConnected ? "Live bijgewerkt" : "Automatisch vernieuwen"}
                </span>
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
                        <td><span className={`product-status ${isLow ? "product-status-low" : "product-status-ok"}`}><span />{isLow ? "Bijbestellen" : "Op voorraad"}</span></td>
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
                <p>De laatste 30 ontvangsten en afboekingen.</p>
              </div>
              <span className="history-icon"><InventoryIcon name="clock" size={19} /></span>
            </div>
            {loading ? <div className="history-empty">Mutaties worden geladen…</div> : movements.length === 0 ? (
              <div className="history-empty">
                <span className="empty-illustration empty-illustration-purple"><InventoryIcon name="receipt" size={22} /></span>
                <strong>Er zijn nog geen voorraadmutaties</strong>
                <span>Na de eerste ontvangst of afboeking zie je hier de voorraadgeschiedenis.</span>
              </div>
            ) : (
              <div className="history-list">
                {movements.map((movement) => (
                  <article className="history-row" key={movement.id}>
                    <span className={`history-type-icon ${movement.movement_type === "in" ? "history-in" : "history-out"}`}><InventoryIcon name={movement.movement_type === "in" ? "arrow" : "receipt"} size={17} /></span>
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
          onBarcode={(value) => {
            setScannerOpen(false);
            lookupBarcode(value);
          }}
        />
      ) : null}
    </div>
  );
}
