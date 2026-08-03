"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const CASE_DETAIL_PATTERN = /^\/faelle\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function CaseEditShortcut() {
  const pathname = usePathname();

  if (!CASE_DETAIL_PATTERN.test(pathname)) {
    return null;
  }

  return (
    <Link className="case-edit-shortcut" href={`${pathname}/bearbeiten`}>
      <span aria-hidden="true">✎</span>
      Fall bearbeiten
    </Link>
  );
}
