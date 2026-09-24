"""Verify built HTML and local links without third-party Python dependencies."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else "_site").resolve()
prefix = sys.argv[2].rstrip("/") if len(sys.argv) > 2 else ""

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path, self.ids, self.links, self.h1 = path, [], [], 0
        self.description = self.canonical = self.main = False
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.append(a["id"])
        self.h1 += tag == "h1"
        self.main |= tag == "main" and a.get("id") == "main"
        self.description |= tag == "meta" and a.get("name") == "description" and bool(a.get("content"))
        self.canonical |= tag == "link" and a.get("rel") == "canonical"
        for key in ("href", "src"):
            if key in a:
                self.links.append(a[key])

pages = {path.resolve(): Page(path) for path in root.rglob("*.html")}
errors = []
if not pages:
    errors.append("No built HTML found. Run Jekyll first.")
for path, page in pages.items():
    name = path.relative_to(root)
    if page.h1 != 1 or not page.main or not page.description or not page.canonical:
        errors.append(f"{name}: expected one h1, main landmark, description and canonical")
    duplicates = [key for key, count in Counter(page.ids).items() if count > 1]
    if duplicates:
        errors.append(f"{name}: duplicate IDs {duplicates}")
    for link in page.links:
        url = urlsplit(link)
        if url.scheme or url.netloc:
            continue
        target_path = unquote(url.path)
        if prefix and target_path.startswith(prefix + "/"):
            target_path = target_path[len(prefix):]
        target = (root / target_path.lstrip("/") if target_path.startswith("/") else path.parent / target_path) if target_path else path
        target = target.resolve()
        if target.is_dir():
            target /= "index.html"
        if not target.exists():
            errors.append(f"{name}: broken link {link}")
        elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
            errors.append(f"{name}: missing anchor {link}")
for excluded in ("test.html", "projects/bin2shell-diagram-1/index.html"):
    if (root / excluded).exists():
        errors.append(f"Unexpected production output: {excluded}")
if errors:
    print("\n".join(errors))
    raise SystemExit(1)
print(f"Verified {len(pages)} HTML pages: structure, IDs, local links, and anchors.")
