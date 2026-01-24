// Access control for restricted features
// Add authorized email addresses here
const AUTHORIZED_EMAILS = [
  "harryhtkwong@gmail.com",
];

export function isAuthorizedForBetaFeatures(email: string | null | undefined): boolean {
  if (!email) return false;
  return AUTHORIZED_EMAILS.includes(email.toLowerCase());
}

// List of restricted routes that require authorization
export const RESTRICTED_ROUTES = [
  "/element-search",
  "/pi-precedents",
  "/legal-chat",
];
