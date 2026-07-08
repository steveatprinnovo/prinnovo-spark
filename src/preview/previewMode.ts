// Preview mode: used only for pre-deploy visual review. Bypasses auth and
// serves bundled sample data instead of Supabase. Never enabled in production
// builds (requires VITE_PREVIEW=1 at build time).
export const PREVIEW = import.meta.env.VITE_PREVIEW === "1";
