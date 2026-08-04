import Link from "next/link";

type CaseLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function CaseLayout({ children, params }: CaseLayoutProps) {
  const { id } = await params;

  return (
    <>
      {children}
      <nav className="case-route-navigation" aria-label="Fallnavigation">
        <Link href={`/faelle/${id}`}>Fall</Link>
        <Link href={`/faelle/${id}/assistent`}>Assistent</Link>
        <Link href={`/faelle/${id}/bearbeiten`}>Bearbeiten</Link>
        <Link href={`/faelle/${id}/verwalten`}>Verwalten</Link>
        <Link href="/fristen">Fristen</Link>
        <a href={`/api/cases/${id}/export/pdf`}>PDF</a>
      </nav>
    </>
  );
}
