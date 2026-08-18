from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()

app_store_url = 'https://apps.apple.com/de/app/reklaio/id6799375798'

const_anchor = 'import { HomeSeoJsonLd } from "@/components/home-seo-json-ld";\n\nexport const metadata: Metadata = {'
const_new = f'import {{ HomeSeoJsonLd }} from "@/components/home-seo-json-ld";\n\nconst REKLAIO_APP_STORE_URL = "{app_store_url}";\n\nexport const metadata: Metadata = {{'
if 'REKLAIO_APP_STORE_URL' not in s:
    if const_anchor not in s:
        raise SystemExit('Import anchor not found')
    s = s.replace(const_anchor, const_new, 1)

hero_old = '''            <Link className="button button-primary" href={user ? "/neuer-fall" : "/registrieren"}>
              Reklamation kostenlos erstellen
            </Link>
            <Link className="button button-secondary" href="/preise">Free und Pro vergleichen</Link>'''
hero_new = '''            <Link className="button button-primary" href={user ? "/neuer-fall" : "/registrieren"}>
              Reklamation kostenlos erstellen
            </Link>
            <a className="button button-secondary" href={REKLAIO_APP_STORE_URL} target="_blank" rel="noreferrer" aria-label="Reklaio im Apple App Store laden">Im App Store laden ↗</a>
            <Link className="button button-secondary" href="/preise">Free und Pro vergleichen</Link>'''
if 'Im App Store laden ↗' not in s:
    if hero_old not in s:
        raise SystemExit('Hero action anchor not found')
    s = s.replace(hero_old, hero_new, 1)

p.write_text(s)
print('Reklaio App Store download link published')
