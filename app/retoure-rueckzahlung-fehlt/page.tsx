import type { Metadata } from "next";
import { SeoGuidePage } from "@/components/seo-guide-page";
import { getSeoGuide } from "@/lib/seo-guides";

const guide = getSeoGuide("retoure-rueckzahlung-fehlt");

export const metadata: Metadata = {
  title: guide.metaTitle,
  description: guide.metaDescription,
  alternates: { canonical: `/${guide.slug}` },
  openGraph: { url: `/${guide.slug}`, title: guide.metaTitle, description: guide.metaDescription }
};

export default function MissingReturnRefundGuidePage() {
  return <SeoGuidePage guide={guide} />;
}
