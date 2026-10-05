import Image from "next/image";
import type { ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <main className="login-page">
      <section className="login-card">
        <Image
          className="login-logo"
          src="/logo.png"
          alt="Allround Cleaning Service"
          width={1024}
          height={368}
          priority
        />
        <div className="login-form-content">{children}</div>
        <footer className="login-footer">
          <span>© 2026 <strong>Allround Cleaning</strong></span>
          <span className="login-footer-brand">ITalize Systems</span>
        </footer>
      </section>
      <aside className="login-video-backdrop" aria-hidden="true">
        <video autoPlay muted loop playsInline preload="auto">
          <source src="/allround-login.mp4" type="video/mp4" />
        </video>
      </aside>
    </main>
  );
}
