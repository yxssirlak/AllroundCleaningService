"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type SidebarIconName = "grid" | "users" | "calendar" | "briefcase" | "receipt" | "sparkles" | "settings" | "box";

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
  };

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

const navigation: { label: string; icon: SidebarIconName; href?: string }[] = [
  { label: "Dashboard", icon: "grid", href: "/dashboard" },
  { label: "ERP & Voorraad", icon: "box", href: "/erp/voorraad" },
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
  currentPage: "dashboard" | "inventory";
  accountLabel: string;
  accountDetail: string;
  showSettings?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className="sidebar">
      <div className="business-sidebar-header">
        <Link className="brand" href="/dashboard" aria-label="Allround dashboard">
          <Image src="/logo.png" alt="Allround Cleaning Service" width={1024} height={368} priority />
          <span className="sidebar-brand-mark"><SidebarIcon name="box" size={21} /></span>
        </Link>
        <button
          className="sidebar-collapse-button"
          type="button"
          aria-label={collapsed ? "Navigatie uitklappen" : "Navigatie inklappen"}
          aria-expanded={!collapsed}
          aria-controls="business-primary-navigation"
          onClick={() => setCollapsed((value) => !value)}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
            <path d="M9 5v14m5-10 3 3-3 3" />
          </svg>
        </button>
      </div>
      <div className="sidebar-label">WERKRUIMTE</div>
      <nav className="main-nav" id="business-primary-navigation" aria-label="Hoofdnavigatie">
        {navigation.map((item) => {
          const active = (currentPage === "dashboard" && item.label === "Dashboard")
            || (currentPage === "inventory" && item.label === "ERP & Voorraad");
          const className = `nav-item${active ? " active" : ""}${!item.href ? " nav-coming-soon" : ""}`;
          const content = <><SidebarIcon name={item.icon} /><span>{item.label}</span>{!item.href ? <span className="coming-soon">In opbouw</span> : null}</>;

          return item.href ? (
            <Link className={className} href={item.href} key={item.label} title={item.label} aria-current={active ? "page" : undefined}>
              {content}
            </Link>
          ) : (
            <a className={className} href={currentPage === "dashboard" ? "#modules" : "/dashboard#modules"} key={item.label} title={item.label}>
              {content}
            </a>
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-label">BEHEER</div>
        {showSettings ? (
          <a className="nav-item nav-coming-soon" href="#modules" title="Instellingen">
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
