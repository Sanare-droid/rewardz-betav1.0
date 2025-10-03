export function friendlyAuthError(e: any): string {
  const code = (e?.code as string) || "";
  const msg = (e?.message as string) || "";
  const map: Record<string, string> = {
    "auth/email-already-in-use": "Email already in use",
    "auth/invalid-email": "Enter a valid email",
    "auth/invalid-credential": "Incorrect email or password",
    "auth/wrong-password": "Incorrect email or password",
    "auth/user-not-found": "No account found with this email",
    "auth/too-many-requests": "Too many attempts. Try again later",
    "auth/network-request-failed": "Network error. Check connection or ad blockers",
    "auth/weak-password": "Password too weak. Use at least 8 chars incl. a symbol",
  };
  if (map[code]) return map[code];
  // Handle REST signup policy error messages
  if (/PASSWORD_DOES_NOT_MEET_REQUIREMENTS/i.test(msg)) {
    return "Password must include a symbol (e.g., !@#$)";
  }
  return msg || "Something went wrong";
}

export function validatePassword(pw: string): string | null {
  if (!pw || pw.length < 8) return "Use at least 8 characters";
  if (!/[^a-zA-Z0-9]/.test(pw)) return "Include at least one symbol (e.g., !@#)";
  return null;
}
