"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type SidebarIconName = "grid" | "users" | "calendar" | "briefcase" | "receipt" | "sparkles" | "settings" | "box" | "book";

function SidebarIcon({ name, size = 20 }: { name: SidebarIconName; size?: number }) {
  const paths: Record<SidebarIconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
    receipt: <><path d="M4 3h16v18l-3-2-3 2-3-2-3 2-4-2z" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
    sparkles: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" /></>,
    box: <><path d="m21 8-9-5-9 5v8l9 5 9-5V8Z" /><path d="m3.3 7.9 8.7 5 8.7-5M12 13v8M7.5 5.5l9 5" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
  };

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

const businessModules: { label: string; icon: SidebarIconName }[] = [
  { label: "Klanten & CRM", icon: "users" },
  { label: "Planning", icon: "calendar" },
  { label: "Medewerkers", icon: "briefcase" },
  { label: "Facturen", icon: "receipt" },
  { label: "Automatiseringen", icon: "sparkles" },
];

export default function BusinessSidebar({
  currentPage,
  accountLabel,
  accountDetail,
  showSettings = false,
}: {
  currentPage: "dashboard" | "inventory" | "inventory-history" | "inventory-new" | "inventory-trends";
  accountLabel: string;
  accountDetail: string;
  showSettings?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [inventoryExpanded, setInventoryExpanded] = useState(currentPage.startsWith("inventory"));
  const [collapsedInventoryOpen, setCollapsedInventoryOpen] = useState(false);

  return (
    <aside className="sidebar">
      <div className="business-sidebar-header">
        <Link className="brand" href="/dashboard" aria-label="Allround dashboard">
          <Image src="/logo.png" alt="Allround Cleaning Service" width={1024} height={368} priority />
        </Link>
        <button
          className="sidebar-collapse-button"
          type="button"
          aria-label={collapsed ? "Navigatie uitklappen" : "Navigatie inklappen"}
          aria-expanded={!collapsed}
          aria-controls="business-primary-navigation"
          onClick={() => {
            setCollapsed((value) => !value);
            setCollapsedInventoryOpen(false);
          }}
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
            <path d="M9 5v14m5-10 3 3-3 3" />
          </svg>
        </button>
      </div>
      <div className="sidebar-label">WERKRUIMTE</div>
      <nav className="main-nav" id="business-primary-navigation" aria-label="Hoofdnavigatie">
        <div className="sidebar-nav-group">
          <Link
            className={`nav-item${currentPage === "dashboard" ? " active" : ""}`}
            href="/dashboard"
            title="Dashboard"
            aria-current={currentPage === "dashboard" ? "page" : undefined}
            onClick={(event) => {
              if (!collapsed) return;
              event.preventDefault();
              setCollapsed(false);
            }}
          >
            <SidebarIcon name="grid" /><span>Dashboard</span>
          </Link>
        </div>
        <div className="sidebar-nav-group">
          <button
            className={`nav-item nav-group-toggle${currentPage.startsWith("inventory") ? " active" : ""}`}
            type="button"
            title="ERP & Voorraad"
            aria-expanded={collapsed ? collapsedInventoryOpen : inventoryExpanded}
            aria-controls="inventory-subnavigation"
            onClick={() => {
              if (collapsed) {
                setCollapsedInventoryOpen((open) => !open);
                return;
              }
              setInventoryExpanded((expanded) => !expanded);
            }}
          >
            <SidebarIcon name="box" />
            <span>ERP & Voorraad</span>
            <svg className="nav-group-chevron" aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          <div
            className="nav-submenu"
            id="inventory-subnavigation"
            aria-label="ERP en voorraadpagina's"
            hidden={collapsed ? !collapsedInventoryOpen : !inventoryExpanded}
          >
            <Link className={`nav-subitem${currentPage === "inventory" ? " active" : ""}`} href="/erp/voorraad" aria-current={currentPage === "inventory" ? "page" : undefined} onClick={() => setCollapsedInventoryOpen(false)}>Voorraad</Link>
            <Link className={`nav-subitem${currentPage === "inventory-history" ? " active" : ""}`} href="/erp/voorraad/mutaties" aria-current={currentPage === "inventory-history" ? "page" : undefined} onClick={() => setCollapsedInventoryOpen(false)}>Mutaties</Link>
            <Link className={`nav-subitem${currentPage === "inventory-new" ? " active" : ""}`} href="/erp/voorraad/nieuw" aria-current={currentPage === "inventory-new" ? "page" : undefined} onClick={() => setCollapsedInventoryOpen(false)}>Artikelen beheren</Link>
            <Link className={`nav-subitem${currentPage === "inventory-trends" ? " active" : ""}`} href="/erp/voorraad/trends" aria-current={currentPage === "inventory-trends" ? "page" : undefined} onClick={() => setCollapsedInventoryOpen(false)}>Trends & Inzichten</Link>
          </div>
        </div>
        <div className="sidebar-label sidebar-section-label">BEDRIJFSVOERING</div>
        {businessModules.map((item) => (
          <a
            className="nav-item nav-coming-soon"
            href="/dashboard#modules"
            key={item.label}
            title={item.label}
            onClick={(event) => {
              if (!collapsed) return;
              event.preventDefault();
              setCollapsed(false);
            }}
          >
            <SidebarIcon name={item.icon} /><span>{item.label}</span><span className="coming-soon">In opbouw</span>
          </a>
        ))}
        <a
          className="nav-item nav-coming-soon"
          href="/dashboard#eerste-stappen"
          title="Leercentrum"
          onClick={(event) => {
            if (!collapsed) return;
            event.preventDefault();
            setCollapsed(false);
          }}
        >
          <SidebarIcon name="book" /><span>Leercentrum</span><span className="coming-soon">In opbouw</span>
        </a>
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-label" id="beheer">BEHEER</div>
        {showSettings ? (
          <a
            className="nav-item nav-coming-soon"
            href="#modules"
            title="Instellingen"
            onClick={(event) => {
              if (!collapsed) return;
              event.preventDefault();
              setCollapsed(false);
            }}
          >
            <SidebarIcon name="settings" /><span>Instellingen</span><span className="coming-soon">In opbouw</span>
          </a>
        ) : null}
        <div className="account-card">
          <div className="avatar avatar-admin"><SidebarIcon name="users" size={18} /></div>
          <div className="account-copy"><strong>{accountLabel}</strong><span title={accountDetail}>{accountDetail}</span></div>
          {showSettings ? <span className="account-menu-dots" aria-hidden="true">···</span> : null}
        </div>
      </div>
    </aside>
  );
}
