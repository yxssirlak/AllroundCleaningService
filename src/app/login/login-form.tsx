"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginForm({
  configured,
  nextPath,
}: {
  configured: boolean;
  nextPath: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError("Inloggen is niet gelukt. Controleer je e-mailadres en wachtwoord.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (caught) {
      console.error("Inloggen bij het bedrijfsportaal mislukt:", caught);
      setError("Er ging iets mis bij het inloggen. Probeer het later opnieuw.");
    } finally {
      setBusy(false);
    }
  }

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
        <div className="eyebrow">BEVEILIGD BEDRIJFSPORTAAL</div>
        <h1>Welkom terug</h1>
        <p className="login-intro">Log in met het account dat voor jou is aangemaakt.</p>

        {!configured ? (
          <div className="login-config-notice" role="status">
            De Supabase-verbinding moet eerst worden ingesteld. Vul de projectgegevens in
            in <code>.env.local</code> en herstart de ontwikkelserver.
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              E-mailadres
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="naam@bedrijf.nl"
              />
            </label>
            <label>
              Wachtwoord
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Je wachtwoord"
              />
            </label>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="primary-button login-submit" type="submit" disabled={busy}>
              {busy ? "Bezig met inloggen..." : "Inloggen"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
