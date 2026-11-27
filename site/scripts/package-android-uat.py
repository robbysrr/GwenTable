"""Package the private Android UAT ZIP from an artwork-withheld preview build.

Usage: python scripts/package-android-uat.py BUILD_DIR OUTPUT.zip ROOT_NAME
BUILD_DIR is the output of `npm run build:artwork-withheld-preview` (no image binaries).
"""
import hashlib, os, pathlib, sys, zipfile

build, out, root = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), sys.argv[3]
here = pathlib.Path(__file__).resolve().parent / 'android'
entries = {}
for name in ('start_gwentable.py', 'README_ANDROID.md', 'UAT_CHECKLIST.md'):
    entries[name] = (here / name).read_bytes()
for path in sorted(build.rglob('*')):
    if path.is_file():
        rel = path.relative_to(build).as_posix()
        assert not rel.lower().endswith(('.png', '.webp', '.ico', '.jpg', '.jpeg', '.gif', '.svg')), 'image binary in build: ' + rel
        entries['site/' + rel] = path.read_bytes()
manifest = ''.join(f'{hashlib.sha256(data).hexdigest()}  {name}\n' for name, data in sorted(entries.items()))
entries['PACKAGE_SHA256.txt'] = manifest.encode()
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for name, data in sorted(entries.items()):
        info = zipfile.ZipInfo(f'{root}/{name}', date_time=(2026, 11, 27, 0, 0, 0))
        info.external_attr = (0o755 if name.endswith('.py') else 0o644) << 16
        info.compress_type = zipfile.ZIP_DEFLATED
        z.writestr(info, data)
print(f'{out}: {len(entries)} files, {out.stat().st_size} bytes')
