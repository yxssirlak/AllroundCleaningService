"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const destinations = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Voorraad", href: "/erp/voorraad" },
  { label: "Mutaties", href: "/erp/voorraad/mutaties" },
  { label: "Nieuw artikel", href: "/erp/voorraad/nieuw" },
];

function ToolIcon({ name }: { name: "search" | "bell" | "settings" }) {
  const iconPaths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    settings: <><path d="M4 7h9m4 0h3M4 17h3m4 0h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
  };

  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {iconPaths[name]}
    </svg>
  );
}

export default function BusinessTopbarTools({ accountName }: { accountName: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const normalizedQuery = query.trim().toLocaleLowerCase("nl-NL");
  const matches = normalizedQuery
    ? destinations.filter((destination) => destination.label.toLocaleLowerCase("nl-NL").includes(normalizedQuery))
    : [];

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (matches[0]) {
      router.push(matches[0].href);
      setQuery("");
      setSearchOpen(false);
    }
  }

  const accountInitial = accountName.trim().charAt(0).toLocaleUpperCase("nl-NL") || "A";

  return (
    <div className="business-topbar-tools">
      <form className="quick-search" role="search" onSubmit={handleSearch}>
        <ToolIcon name="search" />
        <input
          aria-label="Zoek een pagina"
          autoComplete="off"
          onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setSearchOpen(true)}
          placeholder="Snel zoeken…"
          type="search"
          value={query}
        />
        {searchOpen && normalizedQuery ? (
          <ul className="quick-search-results" id="quick-search-results">
            {matches.length ? matches.map((destination) => (
              <li key={destination.href}>
                <Link
                  href={destination.href}
                  onClick={() => {
                    setQuery("");
                    setSearchOpen(false);
                  }}
                >
                  {destination.label}
                </Link>
              </li>
            )) : <li className="quick-search-empty" aria-live="polite">Geen pagina gevonden</li>}
          </ul>
        ) : null}
      </form>
      <details className="notification-menu">
        <summary className="notification-button" aria-label="Meldingen">
          <ToolIcon name="bell" />
        </summary>
        <div className="notification-popover">
          <strong>Meldingen</strong>
          <p>Meldingen verschijnen hier zodra de onderdelen zijn gekoppeld.</p>
        </div>
      </details>
      <details className="notification-menu settings-menu">
        <summary className="notification-button settings-button" aria-label="Instellingen">
          <ToolIcon name="settings" />
        </summary>
        <div className="notification-popover">
          <strong>Instellingen</strong>
          <p>Instellingen worden later aan het bedrijfsportaal toegevoegd.</p>
        </div>
      </details>
      <div className="topbar-account" title={accountName}>
        <span className="avatar avatar-user" aria-hidden="true">{accountInitial}</span>
        <span>{accountName}</span>
      </div>
    </div>
  );
}
