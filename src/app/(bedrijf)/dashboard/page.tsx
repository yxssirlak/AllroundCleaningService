import Link from "next/link";
import BusinessSidebar from "@/components/business-sidebar";
import BusinessTopbarTools from "@/components/business-topbar-tools";

type IconName =
  | "grid"
  | "users"
  | "calendar"
  | "briefcase"
  | "receipt"
  | "sparkles"
  | "settings"
  | "arrow"
  | "clock"
  | "dots"
  | "plus"
  | "bell"
  | "building"
  | "book"
  | "shield"
  | "box";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
      </>
    ),
    receipt: (
      <>
        <path d="M4 3h16v18l-3-2-3 2-3-2-3 2-4-2z" />
        <path d="M8 8h8M8 12h8M8 16h4" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
        <path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14ZM5 2l.8 2.2L8 5l-2.2.8L5 8l-.8-2.2L2 5l2.2-.8L5 2Z" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    dots: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    plus: <path d="M12 5v14m-7-7h14" />,
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    building: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-3h4v3" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    box: (
      <>
        <path d="m21 8-9-5-9 5v8l9 5 9-5V8Z" />
        <path d="m3.3 7.9 8.7 5 8.7-5M12 13v8M7.5 5.5l9 5" />
      </>
    ),
  };

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

export default function BusinessDashboard() {
  return (
    <div className="portal dashboard-portal">
      <BusinessSidebar
        currentPage="dashboard"
        accountLabel="Account"
        accountDetail="Allround Cleaning"
        showSettings
      />

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Allround</span>
            <span className="breadcrumb-divider">/</span>
            <strong>Dashboard</strong>
          </div>
          <BusinessTopbarTools accountName="Allround Cleaning" />
        </header>

        <div className="dashboard-content">
          <section className="welcome-row entrance entrance-one">
            <div>
              <div className="eyebrow">ALLES VOOR JE BEDRIJF, OP ÉÉN PLEK</div>
              <h1>Welkom in jouw werkruimte <span className="wave"></span></h1>
              <p>Een helder overzicht voor de dagelijkse organisatie van Allround Cleaning Service.</p>
            </div>
            <div className="welcome-actions">
              <a className="primary-button" href="#eerste-stappen">
                <Icon name="arrow" size={17} />
                Bekijk de eerste stappen
              </a>
            </div>
          </section>

          <section className="intro-grid entrance entrance-two" aria-label="Welkom en portaalstatus">
            <article className="intro-card">
              <div className="intro-orb intro-orb-one" />
              <div className="intro-orb intro-orb-two" />
              <div className="intro-copy">
                <span className="intro-kicker"><Icon name="sparkles" size={15} /> DE CENTRALE PLEK VOOR JE TEAM</span>
                <h2>Meer overzicht.<br />Meer ruimte om te groeien.</h2>
                <p>Van klantgegevens en werkplanning tot facturen en slimme automatiseringen: hier komt je dagelijkse bedrijfsvoering samen.</p>
                <a className="intro-link" href="#modules">Ontdek de onderdelen <Icon name="arrow" size={16} /></a>
              </div>
              <div className="intro-art" aria-hidden="true">
                <div className="art-window">
                  <span className="art-window-dot" /><span /><span />
                  <div className="art-window-line art-line-long" />
                  <div className="art-window-line art-line-short" />
                  <div className="art-window-block"><Icon name="grid" size={22} /></div>
                  <div className="art-window-block art-block-second"><Icon name="calendar" size={19} /></div>
                </div>
                <div className="art-sparkle"><Icon name="sparkles" size={20} /></div>
              </div>
            </article>
            <article className="status-card">
              <div className="status-card-heading">
                <span className="status-icon"><Icon name="shield" size={19} /></span>
                <span className="status-label">DE STATUS VAN JE PORTAAL</span>
              </div>
              <h2>Een goede basis<br />begint met overzicht.</h2>
              <p>Deze startpagina is klaar. De gegevens voor klanten, planning en facturatie zijn nog niet aangesloten.</p>
              <div className="status-divider" />
              <div className="status-note"><span className="status-note-dot" /> Je ziet hier geen voorbeeldcijfers of verzonnen klantgegevens.</div>
            </article>
          </section>

          <section className="section-block entrance entrance-three" id="modules">
            <div className="section-heading">
              <div>
                <div className="eyebrow">ÉÉN WERKPLEK, ALLE ONDERDELEN</div>
                <h2>De bouwstenen van je bedrijfsportaal</h2>
                <p>Open een onderdeel voor meer informatie. De functies worden stap voor stap aangesloten.</p>
              </div>
            </div>
            <div className="module-grid">
              <Link className="module-card module-blue module-card-link" href="/erp/voorraad">
                <span className="module-link-summary">
                  <span className="module-icon"><Icon name="box" size={21} /></span>
                  <span className="module-summary-copy"><strong>ERP & Voorraad</strong><span>Goederen scannen en voorraad beheren</span></span>
                  <span className="module-chevron"><Icon name="arrow" size={16} /></span>
                </span>
                <span className="module-detail module-link-detail"><span className="module-status"><span className="module-status-live" /> Nu beschikbaar</span><span className="module-link-description">Ontvang goederen, boek verbruik af en bekijk de mutatiegeschiedenis.</span></span>
              </Link>
              <details className="module-card module-blue">
                <summary>
                  <span className="module-icon"><Icon name="users" size={21} /></span>
                  <span className="module-summary-copy"><strong>Klanten & CRM</strong><span>Klantrelaties en locaties beheren</span></span>
                  <span className="module-chevron"><Icon name="arrow" size={16} /></span>
                </summary>
                <div className="module-detail"><p>Een centrale plek voor contactgegevens, locaties, contactmomenten en gemaakte klantafspraken.</p><span className="module-status"><span /> In ontwikkeling</span></div>
              </details>
              <details className="module-card module-purple">
                <summary>
                  <span className="module-icon"><Icon name="calendar" size={21} /></span>
                  <span className="module-summary-copy"><strong>Planning</strong><span>Werk en terugkerende taken plannen</span></span>
                  <span className="module-chevron"><Icon name="arrow" size={16} /></span>
                </summary>
                <div className="module-detail"><p>Plan schoonmaakwerkzaamheden, verdeel routes en houd terugkerende opdrachten bij.</p><span className="module-status"><span /> In ontwikkeling</span></div>
              </details>
              <details className="module-card module-green">
                <summary>
                  <span className="module-icon"><Icon name="briefcase" size={21} /></span>
                  <span className="module-summary-copy"><strong>Medewerkers</strong><span>Team, taken en beschikbaarheid</span></span>
                  <span className="module-chevron"><Icon name="arrow" size={16} /></span>
                </summary>
                <div className="module-detail"><p>Organiseer teaminformatie, beschikbaarheid, werkinstructies en dagelijkse communicatie.</p><span className="module-status"><span /> In ontwikkeling</span></div>
              </details>
              <details className="module-card module-orange">
                <summary>
                  <span className="module-icon"><Icon name="receipt" size={21} /></span>
                  <span className="module-summary-copy"><strong>Facturen</strong><span>Administratie en betalingen volgen</span></span>
                  <span className="module-chevron"><Icon name="arrow" size={16} /></span>
                </summary>
                <div className="module-detail"><p>Maak straks de verbinding tussen uitgevoerde werkzaamheden, facturen en betalingen.</p><span className="module-status"><span /> In ontwikkeling</span></div>
              </details>
              <details className="module-card module-teal">
                <summary>
                  <span className="module-icon"><Icon name="sparkles" size={21} /></span>
                  <span className="module-summary-copy"><strong>Automatiseringen</strong><span>Terugkerend werk slimmer maken</span></span>
                  <span className="module-chevron"><Icon name="arrow" size={16} /></span>
                </summary>
                <div className="module-detail"><p>Verminder handmatig werk met slimme herinneringen en vaste workflows voor terugkerende processen.</p><span className="module-status"><span /> In ontwikkeling</span></div>
              </details>
              <details className="module-card module-slate">
                <summary>
                  <span className="module-icon"><Icon name="building" size={21} /></span>
                  <span className="module-summary-copy"><strong>Bedrijfsbeheer</strong><span>Instellingen en bedrijfsgegevens</span></span>
                  <span className="module-chevron"><Icon name="arrow" size={16} /></span>
                </summary>
                <div className="module-detail"><p>Beheer straks de basisgegevens, rollen, voorkeuren en toegangsrechten van je organisatie.</p><span className="module-status"><span /> In ontwikkeling</span></div>
              </details>
            </div>
          </section>

          <section className="workspace-grid entrance entrance-four">
            <article className="panel empty-panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">DAGELIJKS OVERZICHT</div>
                  <h2>Je planning verschijnt hier</h2>
                  <p>Werkzaamheden, routes en afspraken op één overzichtelijke plek.</p>
                </div>
                <span className="empty-icon"><Icon name="calendar" size={20} /></span>
              </div>
              <div className="empty-state">
                <span className="empty-illustration"><Icon name="calendar" size={24} /></span>
                <strong>Er is nog geen planning gekoppeld</strong>
                <span>Zodra de planningsmodule is ingericht, zie je hier de agenda en eerstvolgende werkzaamheden.</span>
              </div>
            </article>
            <article className="panel empty-panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">RECENTE WIJZIGINGEN</div>
                  <h2>Activiteit van je team</h2>
                  <p>Belangrijke updates binnen je bedrijfsportaal.</p>
                </div>
                <span className="empty-icon"><Icon name="clock" size={20} /></span>
              </div>
              <div className="empty-state">
                <span className="empty-illustration empty-illustration-purple"><Icon name="sparkles" size={24} /></span>
                <strong>Activiteit wordt hier bijgehouden</strong>
                <span>Wanneer je modules gebruikt, vind je hier de laatste wijzigingen en updates terug.</span>
              </div>
            </article>
          </section>

          <section className="getting-started entrance entrance-five" id="eerste-stappen">
            <div className="getting-started-heading">
              <span className="getting-started-icon"><Icon name="book" size={20} /></span>
              <div>
                <div className="eyebrow">RUSTIG OPBOUWEN, STAP VOOR STAP</div>
                <h2>Een sterke start voor je bedrijfsportaal</h2>
                <p>Een logische volgorde helpt om straks veilig en overzichtelijk met je team te werken.</p>
              </div>
            </div>
            <div className="steps-list">
              <details className="step-item">
                <summary><span className="step-number">01</span><span className="step-copy"><strong>Bepaal wie toegang krijgt</strong><span>Breng de rollen en verantwoordelijkheden in kaart.</span></span><span className="module-chevron"><Icon name="arrow" size={16} /></span></summary>
                <p className="step-detail">Denk bijvoorbeeld aan beheer, planning en uitvoering. Zo kan elke medewerker straks alleen werken met wat die nodig heeft.</p>
              </details>
              <details className="step-item">
                <summary><span className="step-number">02</span><span className="step-copy"><strong>Breng klanten en werkzaamheden in beeld</strong><span>Leg vast welke gegevens en processen je wilt beheren.</span></span><span className="module-chevron"><Icon name="arrow" size={16} /></span></summary>
                <p className="step-detail">Een duidelijke basis voor klantgegevens, locaties en terugkerende taken maakt de inrichting van CRM en planning een stuk eenvoudiger.</p>
              </details>
              <details className="step-item">
                <summary><span className="step-number">03</span><span className="step-copy"><strong>Kies wat je als eerste wilt automatiseren</strong><span>Begin klein met een proces dat vaak terugkomt.</span></span><span className="module-chevron"><Icon name="arrow" size={16} /></span></summary>
                <p className="step-detail">Veelvoorkomende kansen zijn herinneringen, periodieke planningen en het opvolgen van afgeronde werkzaamheden.</p>
              </details>
            </div>
          </section>

          <footer className="page-footer">
            <span>© Allround Cleaning Service</span>
            <span><Icon name="shield" size={13} /> Bedrijfsportaal <span className="footer-dot">·</span> In ontwikkeling</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
