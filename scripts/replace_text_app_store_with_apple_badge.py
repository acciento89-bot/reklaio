from pathlib import Path

p = Path('app/page.tsx')
s = p.read_text()

old = '''            <a className="button button-secondary" href={REKLAIO_APP_STORE_URL} target="_blank" rel="noreferrer" aria-label="Reklaio im Apple App Store laden">Im App Store laden ↗</a>'''
new = '''            <a
              href={REKLAIO_APP_STORE_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Reklaio im App Store laden"
              style={{ display: "inline-block", lineHeight: 0 }}
            >
              <img
                src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/de-de?size=250x83"
                alt="Laden im App Store"
                width="170"
                height="56"
                style={{ display: "block", width: "170px", height: "auto" }}
              />
            </a>'''

if old not in s:
    raise SystemExit('Current Reklaio text App Store button not found')

s = s.replace(old, new, 1)
p.write_text(s)
print('Reklaio now uses the official Apple App Store badge')
