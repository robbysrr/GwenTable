#!/usr/bin/env python3
"""GwenTable private UAT server for Android (Termux) or any computer with Python 3.

Serves ./site on http://127.0.0.1:42639/ only (loopback, never the network).
Standard library only. GET and HEAD only; no directory listings; rejects path
traversal and unexpected Host headers. Stop with Ctrl+C. Your characters live in
the browser (IndexedDB) for this exact address; keep using the same address and
browser profile, and never clear the site's data.
"""
import http.server
import mimetypes
import os
import posixpath
import sys
import urllib.parse

HOST, PORT = '127.0.0.1', 42639
ROOT = os.path.realpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'site'))
ALLOWED_HOSTS = {f'127.0.0.1:{PORT}', f'localhost:{PORT}'}
TYPES = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
         '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
         '.md': 'text/markdown; charset=utf-8', '.pdf': 'application/pdf', '.svg': 'image/svg+xml', '.png': 'image/png',
         '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff'}


class Handler(http.server.BaseHTTPRequestHandler):
    server_version = 'GwenTableUAT'
    sys_version = ''

    def _resolve(self):
        host = self.headers.get('Host', '')
        if host not in ALLOWED_HOSTS:
            return 421, None
        raw = urllib.parse.urlsplit(self.path).path
        try:
            path = urllib.parse.unquote(raw, errors='strict')
        except UnicodeDecodeError:
            return 400, None
        if '\x00' in path or '\\' in path:
            return 400, None
        clean = posixpath.normpath(path)
        if clean in ('.', '/'):
            clean = '/index.html'
        if any(part == '..' for part in path.split('/')):
            return 403, None
        full = os.path.realpath(os.path.join(ROOT, clean.lstrip('/')))
        if full != ROOT and not full.startswith(ROOT + os.sep):
            return 403, None
        if os.path.isdir(full):
            full = os.path.join(full, 'index.html')
        if not os.path.isfile(full):
            return 404, None
        return 200, full

    def _send(self, body):
        status, full = self._resolve()
        if status != 200:
            self.send_response(status)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return
        ext = os.path.splitext(full)[1].lower()
        data = open(full, 'rb').read()
        self.send_response(200)
        self.send_header('Content-Type', TYPES.get(ext) or mimetypes.guess_type(full)[0] or 'application/octet-stream')
        self.send_header('Content-Length', str(len(data)))
        # Always revalidate: the service worker manages offline copies itself.
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.end_headers()
        if body:
            self.wfile.write(data)

    def do_GET(self):
        self._send(True)

    def do_HEAD(self):
        self._send(False)

    def _refuse(self):
        self.send_response(405)
        self.send_header('Allow', 'GET, HEAD')
        self.send_header('Content-Length', '0')
        self.end_headers()

    do_POST = do_PUT = do_DELETE = do_PATCH = do_OPTIONS = _refuse

    def log_message(self, fmt, *args):
        if '--quiet' not in sys.argv:
            sys.stderr.write('%s %s\n' % (self.log_date_time_string(), fmt % args))


def main():
    if not os.path.isfile(os.path.join(ROOT, 'index.html')):
        sys.exit('Could not find site/index.html next to this file. Run it from the extracted GwenTable folder.')
    server = http.server.ThreadingHTTPServer((HOST, PORT), Handler)
    print(f'GwenTable UAT running: http://127.0.0.1:{PORT}/  (Ctrl+C to stop)')
    print('Private testing only. Use synthetic characters. Export backups before upgrading.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStopped.')


if __name__ == '__main__':
    main()
