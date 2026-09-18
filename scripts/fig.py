"""Figure dalle fonti: griglia di riferimento, ritaglio e pagina intera in WebP.

Da lanciare dalla radice del progetto:
  python scripts/fig.py grid <doc> <page>
  python scripts/fig.py crop <doc> <page> <x0> <y0> <x1> <y1> <out.webp>
  python scripts/fig.py full <doc> <page> <out.webp>

Le coordinate del ritaglio sono frazioni 0-1 della pagina (origine in alto a sinistra):
prima si guarda la griglia, poi si ritaglia. Il render parte dal PDF originale (vettoriale),
non dai PNG di _sources/pages.
"""
import os
import shutil
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
TOOLS = os.path.join(ROOT, '_sources', 'tools')
GRID_DIR = os.path.join(ROOT, '_sources', 'grid')

MAX_WIDTH = 1400      # larghezza massima dei WebP prodotti
QUALITY = 82
MIN_FREE_GB = 1.0     # regola del progetto: fermarsi sotto 1 GB liberi su disco
MIN_CROP = 0.01       # lato minimo del ritaglio, in frazione di pagina

USAGE = """uso (dalla radice del progetto):
  python scripts/fig.py grid <doc> <page>
      -> _sources/grid/<doc>-p<page>.png  (pagina con griglia 10x10 etichettata 0.0-1.0)
  python scripts/fig.py crop <doc> <page> <x0> <y0> <x1> <y1> <out.webp>
      -> ritaglio; coordinate in frazioni 0-1, origine in alto a sinistra, x0 < x1 e y0 < y1
  python scripts/fig.py full <doc> <page> <out.webp>
      -> pagina intera
esempio (grafici "Window Width Effect", Cap. 2 pagina 56):
  python scripts/fig.py grid ch2 56
  python scripts/fig.py crop ch2 56 0.03 0.28 0.97 0.73 public/figures/m09-parzen-windows/window-width.webp"""


def fail(msg, usage=False):
    print(f'errore: {msg}', file=sys.stderr)
    if usage:
        print(USAGE, file=sys.stderr)
    sys.exit(2)


try:
    import pymupdf
    from PIL import Image, ImageDraw, ImageFont
except ImportError as e:
    fail(f'dipendenza Python mancante ({e.name}): pip install pymupdf pillow')

sys.path.insert(0, TOOLS)
try:
    from extract_pages import SOURCES
except ImportError:
    fail(f'non trovo {os.path.join(TOOLS, "extract_pages.py")} (elenco SOURCES dei PDF originali)')


def open_page(doc, page):
    """Apre il PDF di `doc` e restituisce (documento, pagina) dopo aver validato gli argomenti."""
    if doc not in SOURCES:
        fail(f'doc inesistente: "{doc}". Valori ammessi: {", ".join(SOURCES)}')
    path = SOURCES[doc]
    if not os.path.isfile(path):
        fail(f'PDF di "{doc}" non trovato: {path}')
    try:
        d = pymupdf.open(path)
    except Exception as e:
        fail(f'impossibile aprire {path}: {e}')
    if not 1 <= page <= len(d):
        fail(f'pagina fuori intervallo: {page}. "{doc}" ha {len(d)} pagine (1-{len(d)})')
    return d, d[page - 1]


def render(doc, page, clip=None, zoom=3.0):
    d, p = open_page(doc, page)
    r = p.rect
    rect = None if clip is None else pymupdf.Rect(
        r.x0 + clip[0] * r.width, r.y0 + clip[1] * r.height,
        r.x0 + clip[2] * r.width, r.y0 + clip[3] * r.height)
    pix = p.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=rect, alpha=False)
    img = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    d.close()
    return img


def check_disk():
    free = shutil.disk_usage(ROOT).free / 1024 ** 3
    if free < MIN_FREE_GB:
        fail(f'spazio su disco insufficiente: {free:.2f} GB liberi, soglia {MIN_FREE_GB:.0f} GB. Niente scritto')


def save_webp(img, out):
    check_disk()
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    if img.width > MAX_WIDTH:
        img = img.resize((MAX_WIDTH, round(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)
    img.save(out, 'WEBP', quality=QUALITY, method=6)
    print(f'{out} {img.width}x{img.height} {max(1, os.path.getsize(out) // 1024)}KB')


def label(dr, xy, text, font, anchor):
    """Etichetta rossa su fondo bianco, leggibile anche sopra testo o figure."""
    box = dr.textbbox(xy, text, font=font, anchor=anchor)
    dr.rectangle((box[0] - 2, box[1] - 1, box[2] + 2, box[3] + 1), fill=(255, 255, 255, 230))
    dr.text(xy, text, font=font, fill=(200, 0, 0, 255), anchor=anchor)


def grid(doc, page):
    img = render(doc, page, zoom=1.5).convert('RGBA')
    w, h = img.size
    over = Image.new('RGBA', img.size, (0, 0, 0, 0))
    dr = ImageDraw.Draw(over)
    try:
        font = ImageFont.load_default(size=13)
    except TypeError:  # Pillow < 10.1: solo font bitmap
        font = ImageFont.load_default()
    # linee sottili ai ventesimi (0.05, 0.15, ...) per stimare meglio le coordinate
    for i in range(1, 20, 2):
        x, y = round(w * i / 20), round(h * i / 20)
        dr.line([(x, 0), (x, h)], fill=(255, 0, 0, 60), width=1)
        dr.line([(0, y), (w, y)], fill=(255, 0, 0, 60), width=1)
    # linee principali ai decimi
    for i in range(1, 10):
        x, y = round(w * i / 10), round(h * i / 10)
        dr.line([(x, 0), (x, h)], fill=(255, 0, 0, 170), width=1)
        dr.line([(0, y), (w, y)], fill=(255, 0, 0, 170), width=1)
    # etichette sui quattro bordi: x in alto e in basso, y a sinistra e a destra
    for i in range(1, 10):
        x, y, t = round(w * i / 10), round(h * i / 10), f'{i / 10:.1f}'
        label(dr, (x, 3), t, font, 'ma')
        label(dr, (x, h - 3), t, font, 'md')
        label(dr, (4, y), t, font, 'lm')
        label(dr, (w - 4, y), t, font, 'rm')
    label(dr, (4, 3), '0.0', font, 'la')
    label(dr, (w - 4, h - 3), '1.0', font, 'rd')
    check_disk()
    os.makedirs(GRID_DIR, exist_ok=True)
    out = os.path.join(GRID_DIR, f'{doc}-p{page}.png')
    Image.alpha_composite(img, over).convert('RGB').save(out, optimize=True)
    print(os.path.relpath(out, os.getcwd()).replace(os.sep, '/'))


def parse_page(s):
    try:
        return int(s)
    except ValueError:
        fail(f'<page> deve essere un intero (numero di pagina del PDF, da 1): "{s}"')


def parse_out(s):
    if not s.lower().endswith('.webp'):
        fail(f'il file di uscita deve avere estensione .webp: "{s}"')
    return s


def parse_clip(args):
    try:
        x0, y0, x1, y1 = (float(a) for a in args)
    except ValueError:
        fail(f'le coordinate devono essere numeri tra 0 e 1: {" ".join(args)}')
    if not all(0.0 <= v <= 1.0 for v in (x0, y0, x1, y1)):
        fail(f'coordinate fuori da 0-1: {x0} {y0} {x1} {y1}. Sono frazioni della pagina, non pixel: vedi "fig.py grid"')
    if x1 - x0 < MIN_CROP or y1 - y0 < MIN_CROP:
        fail(f'ritaglio vuoto o troppo piccolo: serve x0 < x1 e y0 < y1 (ordine: x0 y0 x1 y1), lato minimo {MIN_CROP}. Ricevuto: {x0} {y0} {x1} {y1}')
    return x0, y0, x1, y1


def main(argv):
    if not argv:
        fail('argomenti mancanti: serve un comando (grid, crop, full)', usage=True)
    if argv[0] in ('-h', '--help', 'help'):
        print(USAGE)
        print(f'doc disponibili: {", ".join(SOURCES)}')
        sys.exit(0)
    cmd, args = argv[0], argv[1:]
    arity = {'grid': 2, 'crop': 7, 'full': 3}
    if cmd not in arity:
        fail(f'comando sconosciuto: "{cmd}". Comandi: grid, crop, full', usage=True)
    if len(args) != arity[cmd]:
        what = 'mancanti' if len(args) < arity[cmd] else 'in eccesso'
        fail(f'argomenti {what} per "{cmd}": attesi {arity[cmd]}, ricevuti {len(args)}', usage=True)
    doc, page = args[0], parse_page(args[1])
    if cmd == 'grid':
        grid(doc, page)
    elif cmd == 'crop':
        clip = parse_clip(args[2:6])
        out = parse_out(args[6])
        save_webp(render(doc, page, clip), out)
    else:
        out = parse_out(args[2])
        save_webp(render(doc, page, zoom=2.0), out)


if __name__ == '__main__':
    main(sys.argv[1:])
