"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { setRememberSessionPreference } from "@/lib/supabase/session-preference";
import LoginLayout from "./login-layout";
import PasswordVisibilityButton from "@/components/password-visibility-button";

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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invalidLoginField, setInvalidLoginField] = useState<"email" | "password" | null>(null);
  const [message, setMessage] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);

  function clearLoginError() {
    setError("");
    setInvalidLoginField(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearLoginError();
    setMessage("");
    setBusy(true);

    try {
      setRememberSessionPreference(rememberMe);
      const supabase = createSupabaseBrowserClient({ rememberSession: rememberMe });
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.code !== "invalid_credentials") {
          console.error("Inloggen bij het bedrijfsportaal mislukt:", signInError.message);
          setError("Inloggen is niet gelukt. Probeer het later opnieuw.");
          return;
        }

        const { data: emailExists, error: emailCheckError } = await supabase.rpc(
          "login_email_exists",
          { p_email: email.trim() },
        );
        if (emailCheckError || typeof emailExists !== "boolean") {
          setError("Inloggegevens onjuist. Controleer je e-mailadres en wachtwoord.");
          return;
        }

        if (emailExists) {
          setInvalidLoginField("password");
          setError("Wachtwoord incorrect. Controleer je wachtwoord.");
        } else {
          setInvalidLoginField("email");
          setError("Dit e-mailadres is niet bekend. Controleer het adres.");
        }
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("Er ging iets mis bij het inloggen. Probeer het later opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login/wachtwoord-wijzigen`,
      });
      if (resetError) throw resetError;
      setMessage("Als dit e-mailadres bij een account hoort, ontvang je een link om je wachtwoord opnieuw in te stellen.");
    } catch (caught) {
      console.error("Wachtwoordherstel aanvragen mislukt:", caught);
      setError("De herstelmail kon niet worden verstuurd. Controleer het e-mailadres en probeer het opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LoginLayout>
      <div className="eyebrow">BEDRIJFSPORTAAL</div>
      <h1>{forgotPassword ? "Wachtwoord herstellen" : "Welkom terug"}</h1>
      <p className="login-intro">
        {forgotPassword
          ? "Vul je e-mailadres in. We sturen je een link om een nieuw wachtwoord in te stellen."
          : "Log in om door te gaan naar je werkomgeving."}
      </p>

      {!configured ? (
        <div className="login-config-notice" role="status">
          De Supabase-verbinding moet eerst worden ingesteld. Vul de projectgegevens in
          in <code>.env.local</code> en herstart de ontwikkelserver.
        </div>
      ) : forgotPassword ? (
        <form className="login-form" onSubmit={handlePasswordReset}>
          <label>
            E-mailadres
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="naam@bedrijf.nl"
            />
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          {message ? <p className="login-success" role="status">{message}</p> : null}
          <button className="primary-button login-submit" type="submit" disabled={busy}>
            {busy ? "Herstelmail versturen…" : "Herstelmail versturen"}
          </button>
          <button className="login-text-link login-back-link" type="button" onClick={() => {
            setForgotPassword(false);
            clearLoginError();
            setMessage("");
          }}>
            Terug naar inloggen
          </button>
        </form>
      ) : (
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            E-mailadres
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearLoginError();
              }}
              placeholder="naam@bedrijf.nl"
              aria-invalid={invalidLoginField === "email"}
            />
          </label>
          <label>
            Wachtwoord
            <span className="login-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearLoginError();
                }}
                placeholder="Je wachtwoord"
                aria-invalid={invalidLoginField === "password"}
              />
              <PasswordVisibilityButton visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
            </span>
          </label>
          <div className="login-options">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Blijf ingelogd</span>
            </label>
            <button className="login-text-link" type="button" onClick={() => {
              setForgotPassword(true);
              clearLoginError();
              setMessage("");
            }}>
              Wachtwoord vergeten?
            </button>
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button className="primary-button login-submit" type="submit" disabled={busy}>
            {busy ? "Bezig met inloggen..." : "Inloggen"}
          </button>
        </form>
      )}
    </LoginLayout>
  );
}
