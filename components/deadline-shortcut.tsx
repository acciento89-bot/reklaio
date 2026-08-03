"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const CASE_DETAIL_PATTERN = /^\/faelle\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function DeadlineShortcut() {
  const pathname = usePathname();
  const visible = pathname === "/dashboard" || pathname === "/dokumente" || CASE_DETAIL_PATTERN.test(pathname);

  if (!visible) {
    return null;
  }

  return (
    <Link className="deadline-shortcut" href="/fristen">
      <span aria-hidden="true">⌛</span>
      Fristen
    </Link>
  );
}
