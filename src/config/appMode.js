/**
 * Centralized Application Mode Configuration (Build-Time via VITE_APP_MODE)
 *
 * - VITE_APP_MODE=public -> Public read-only portal (no scouting, no mutations, no coach controls)
 * - VITE_APP_MODE=admin (or unset/empty in local dev) -> Full admin/coaching workspace
 */

export function resolveAppMode(rawValue) {
  if (typeof rawValue === 'string' && rawValue.trim().toLowerCase() === 'public') {
    return 'public';
  }
  return 'admin';
}

const rawViteMode =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_APP_MODE
    : undefined;

const rawProcessMode =
  typeof process !== 'undefined' && process.env
    ? process.env.VITE_APP_MODE
    : undefined;

export const APP_MODE = resolveAppMode(rawViteMode ?? rawProcessMode);
export const IS_PUBLIC_MODE = APP_MODE === 'public';
export const IS_ADMIN_MODE = APP_MODE === 'admin';

export function canMutate() {
  return !IS_PUBLIC_MODE;
}

/**
 * Guard helper for mutation/scouting operations.
 * Throws in public read-only mode; returns true in admin mode.
 */
export function assertCanMutate(action = 'mutation') {
  if (IS_PUBLIC_MODE) {
    throw new Error(`Blocked ${action}: application is running in read-only public mode.`);
  }
  return true;
}
