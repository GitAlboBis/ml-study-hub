"""Pagine sorgente per il visualizzatore: _sources/pages/<doc>/pNNN.png -> public/sources/<doc>/pNNN.webp

Da lanciare dalla radice del progetto:
  python scripts/build-source-pages.py                 tutti i documenti
  python scripts/build-source-pages.py ch2 dl          solo alcuni
  python scripts/build-source-pages.py --width 900 --quality 60   rigenera tutto piu leggero

Larghezza massima 1000 px (le pagine piu strette non vengono ingrandite), WebP qualita 70.
Le pagine gia convertite e piu recenti del PNG vengono saltate; --force, --width o --quality
le rigenerano. Alla fine stampa i MB totali di public/sources (atteso < 70 MB).
"""
import os
import re
import shutil
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SRC = os.path.join(ROOT, '_sources', 'pages')
OUT = os.path.join(ROOT, 'public', 'sources')

WIDTH = 1000          # larghezza massima in px
QUALITY = 70
MIN_FREE_GB = 1.0     # regola del progetto: fermarsi sotto 1 GB liberi su disco
EXPECTED_MB = 70      # dimensione attesa di public/sources
LIMIT_MB = 120        # oltre questa soglia: abbassare larghezza o qualita e rigenerare
PAGE_RE = re.compile(r'^p(\d{3,})\.png$')

USAGE = """uso (dalla radice del progetto):
  python scripts/build-source-pages.py [doc ...] [--width PX] [--quality Q] [--force]
    doc          cartelle di _sources/pages da convertire (default: tutte)
    --width PX   larghezza massima in px, 200-4000 (default 1000); non ingrandisce mai
    --quality Q  qualita WebP 1-100 (default 70)
    --force      rigenera anche le pagine gia convertite (implicito con --width o --quality)"""


def fail(msg, usage=False, code=2):
    print(f'errore: {msg}', file=sys.stderr)
    if usage:
        print(USAGE, file=sys.stderr)
    sys.exit(code)


try:
    from PIL import Image
except ImportError:
    fail('dipendenza Python mancante (Pillow): pip install pillow')


def free_gb():
    return shutil.disk_usage(ROOT).free / 1024 ** 3


def check_disk():
    if free_gb() < MIN_FREE_GB:
        fail(f'spazio su disco insufficiente: {free_gb():.2f} GB liberi, soglia {MIN_FREE_GB:.0f} GB. Mi fermo', code=1)


def int_option(name, value, lo, hi):
    if value is None:
        fail(f'{name} richiede un valore intero', usage=True)
    try:
        n = int(value)
    except ValueError:
        fail(f'{name} richiede un valore intero: "{value}"', usage=True)
    if not lo <= n <= hi:
        fail(f'{name} fuori intervallo: {n} (ammesso {lo}-{hi})')
    return n


def parse_args(argv):
    docs, width, quality, force = [], WIDTH, QUALITY, False
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in ('-h', '--help'):
            print(USAGE)
            sys.exit(0)
        elif a == '--force':
            force = True
        elif a in ('--width', '--quality'):
            value = argv[i + 1] if i + 1 < len(argv) else None
            if a == '--width':
                width = int_option(a, value, 200, 4000)
            else:
                quality = int_option(a, value, 1, 100)
            force = True
            i += 1
        elif a.startswith('-'):
            fail(f'opzione sconosciuta: "{a}"', usage=True)
        else:
            docs.append(a)
        i += 1
    return docs, width, quality, force


def list_docs():
    if not os.path.isdir(SRC):
        fail(f'cartella delle pagine non trovata: {SRC}. Vanno prima renderizzate con _sources/tools/render_pages.py', code=1)
    return sorted(d for d in os.listdir(SRC) if os.path.isdir(os.path.join(SRC, d)))


def convert(src, out, width, quality):
    with Image.open(src) as im:
        img = im.convert('RGB')
    if img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    tmp = out + '.tmp'
    img.save(tmp, 'WEBP', quality=quality, method=6)
    os.replace(tmp, out)  # niente file a meta se il processo viene interrotto


def dir_mb(path):
    total = count = 0
    for base, _, files in os.walk(path):
        for f in files:
            if f.endswith('.webp'):
                total += os.path.getsize(os.path.join(base, f))
                count += 1
    return total / 1024 ** 2, count


def main(argv):
    docs, width, quality, force = parse_args(argv)
    available = list_docs()
    if not available:
        fail(f'nessun documento in {SRC}', code=1)
    unknown = [d for d in docs if d not in available]
    if unknown:
        fail(f'doc inesistente: {", ".join(unknown)}. Disponibili in _sources/pages: {", ".join(available)}')
    docs = docs or available

    print(f'larghezza max {width} px, qualita {quality}, liberi su disco {free_gb():.2f} GB')
    made = skipped = 0
    for doc in docs:
        check_disk()
        src_dir, out_dir = os.path.join(SRC, doc), os.path.join(OUT, doc)
        pages = sorted(f for f in os.listdir(src_dir) if PAGE_RE.match(f))
        ignored = sorted(f for f in os.listdir(src_dir) if not PAGE_RE.match(f))
        if ignored:
            print(f'  {doc}: ignorati {len(ignored)} file senza nome pNNN.png ({", ".join(ignored[:3])}{"..." if len(ignored) > 3 else ""})')
        if not pages:
            print(f'  {doc}: nessuna pagina pNNN.png, salto')
            continue
        os.makedirs(out_dir, exist_ok=True)
        n = 0
        for k, f in enumerate(pages):
            src, out = os.path.join(src_dir, f), os.path.join(out_dir, f[:-4] + '.webp')
            if not force and os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
                skipped += 1
                continue
            if k % 25 == 0:
                check_disk()
            try:
                convert(src, out, width, quality)
            except Exception as e:
                fail(f'conversione fallita per {src}: {e}', code=1)
            n += 1
        made += n
        mb, count = dir_mb(out_dir)
        print(f'  {doc}: {count} pagine, {mb:.1f} MB ({n} convertite ora)', flush=True)

    total, count = dir_mb(OUT)
    print(f'convertite {made}, gia aggiornate {skipped}')
    print(f'TOTALE public/sources: {count} pagine, {total:.1f} MB (atteso < {EXPECTED_MB} MB). Liberi su disco {free_gb():.2f} GB')
    if total > LIMIT_MB:
        print(f'ATTENZIONE: oltre {LIMIT_MB} MB. Rigenerare piu leggero, es.: python scripts/build-source-pages.py --width 900 --quality 60')
    elif total > EXPECTED_MB:
        print(f'nota: sopra i {EXPECTED_MB} MB attesi ma sotto la soglia di {LIMIT_MB} MB')


if __name__ == '__main__':
    main(sys.argv[1:])
