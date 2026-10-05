"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import LoginLayout from "../login-layout";
import PasswordVisibilityButton from "@/components/password-visibility-button";

export default function UpdatePasswordForm() {
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("De wachtwoorden komen niet overeen.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setUpdated(true);
    } catch (caught) {
      console.error("Wachtwoord bijwerken mislukt:", caught);
      setError("Het wachtwoord kon niet worden bijgewerkt. Vraag een nieuwe herstelmail aan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LoginLayout>
      <div className="eyebrow">BEDRIJFSPORTAAL</div>
      <h1>Nieuw wachtwoord</h1>
      <p className="login-intro">Kies een nieuw wachtwoord voor je account.</p>

      {updated ? (
        <div className="login-reset-complete" role="status">
          <p>Je wachtwoord is bijgewerkt. Je kunt nu opnieuw inloggen.</p>
          <Link className="primary-button login-submit" href="/login">Naar inloggen</Link>
        </div>
      ) : !recoveryReady ? (
        <div className="login-config-notice" role="status">
          Open de herstel-link uit je e-mail. Is de link verlopen? Vraag dan een nieuwe aan.
          <Link href="/login" className="login-text-link">Terug naar inloggen</Link>
        </div>
      ) : (
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Nieuw wachtwoord
            <span className="login-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimaal 8 tekens"
              />
              <PasswordVisibilityButton visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
            </span>
          </label>
          <label>
            Bevestig nieuw wachtwoord
            <span className="login-password-wrap">
              <input
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="Herhaal je wachtwoord"
              />
              <PasswordVisibilityButton visible={showConfirmation} onToggle={() => setShowConfirmation((value) => !value)} />
            </span>
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-button login-submit" type="submit" disabled={busy}>
            {busy ? "Wachtwoord opslaan…" : "Nieuw wachtwoord opslaan"}
          </button>
        </form>
      )}
    </LoginLayout>
  );
}
