export type PasswordStrength = "weak" | "medium" | "strong";

// Simple heuristic (length + character variety) — no external validator
// needed, and the backend enforces the real minimum (6 chars) separately.
// Purely a UX signal so users see feedback before hitting submit.
export function getPasswordStrength(password: string): PasswordStrength | null {
  if (!password) return null;
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}
