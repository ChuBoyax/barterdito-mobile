import { useState } from 'react';

/**
 * Defers mounting a sheet until it is first opened, then keeps it mounted so its
 * close animation still plays. Screens open faster because hidden sheets (and the
 * requests they make) cost nothing until the user actually asks for them.
 */
export function useMountOnOpen(visible: boolean) {
  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);
  return mounted || visible;
}
