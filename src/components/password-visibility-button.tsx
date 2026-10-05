export default function PasswordVisibilityButton({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className={`password-visibility-button${visible ? " password-visibility-button-visible" : ""}`}
      type="button"
      aria-label={visible ? "Wachtwoord verbergen" : "Wachtwoord tonen"}
      aria-pressed={visible}
      onClick={onToggle}
    >
      {visible ? (
        <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.8 4.5 10 7-.5 1-1.4 2.2-2.6 3.3" />
          <path d="M6.2 6.2C3.9 7.6 2.5 9.6 2 12c1.2 2.5 4.8 7 10 7 1 0 1.9-.2 2.8-.5" />
        </svg>
      ) : (
        <svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}
