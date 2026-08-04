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
        <Link href={`/faelle/${id}`}>Fallakte</Link>
        <Link href={`/faelle/${id}/bearbeiten`}>Fall bearbeiten</Link>
        <Link href="/fristen">Alle Fristen</Link>
      </nav>
    </>
  );
}
