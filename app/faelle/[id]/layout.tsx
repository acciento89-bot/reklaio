import Link from "next/link";
import { getLocale, localizedPath } from "@/lib/i18n";

type CaseLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function CaseLayout({ children, params }: CaseLayoutProps) {
  const { id } = await params;
  const locale = await getLocale();
  const en = locale === "en";

  return (
    <>
      {children}
      <nav className="case-route-navigation" aria-label={en ? "Case navigation" : "Fallnavigation"}>
        <Link href={localizedPath(`/faelle/${id}`, locale)}>{en ? "Case" : "Fall"}</Link>
        <Link href={localizedPath(`/faelle/${id}/assistent`, locale)}>{en ? "Assistant" : "Assistent"}</Link>
        <Link href={localizedPath(`/faelle/${id}/steuerung`, locale)}>{en ? "Management" : "Steuerung"}</Link>
        <Link href={localizedPath(`/faelle/${id}/bearbeiten`, locale)}>{en ? "Edit" : "Bearbeiten"}</Link>
        <Link href={localizedPath(`/faelle/${id}/verwalten`, locale)}>{en ? "Manage" : "Verwalten"}</Link>
        <Link href={localizedPath("/fristen", locale)}>{en ? "Deadlines" : "Fristen"}</Link>
        <a href={`/api/cases/${id}/export/pdf`}>PDF</a>
      </nav>
    </>
  );
}
