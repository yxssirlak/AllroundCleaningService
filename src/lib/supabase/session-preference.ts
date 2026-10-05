export const REMEMBER_SESSION_COOKIE = "acs_remember_session";
export const REMEMBER_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function shouldRememberSession(cookieHeader: string | undefined) {
  return cookieHeader
    ?.split(";")
    .some((cookie) => cookie.trim() === `${REMEMBER_SESSION_COOKIE}=1`) ?? false;
}

export function setRememberSessionPreference(remember: boolean) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const maxAge = remember ? `; Max-Age=${REMEMBER_SESSION_MAX_AGE}` : "";
  document.cookie = `${REMEMBER_SESSION_COOKIE}=${remember ? "1" : "0"}; Path=/; SameSite=Lax${maxAge}${secure}`;
}

export function clearRememberSessionPreference() {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${REMEMBER_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
