import http.server
import os
import socketserver
import urllib.error
import urllib.request

WEBROOT = '/Users/choedohyeon/Downloads/project/A-Moment-That-Lasts-Forever/jspbook/src/main/webapp'
BACKEND = 'http://127.0.0.1:8081'
PORT = 18092
PROXY_PREFIXES = ('/api/', '/uploads/')

os.chdir(WEBROOT)


class ReusableTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_OPTIONS(self):
        if self.path.startswith(PROXY_PREFIXES):
            self.send_response(204)
            self.send_header('Access-Control-Allow-Origin', self.headers.get('Origin', '*'))
            self.send_header('Access-Control-Allow-Credentials', 'true')
            self.send_header('Access-Control-Allow-Headers', self.headers.get('Access-Control-Request-Headers', 'Content-Type'))
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.end_headers()
        else:
            super().do_OPTIONS()

    def _proxy(self):
        target = BACKEND + self.path
        length = int(self.headers.get('Content-Length', '0'))
        body = self.rfile.read(length) if length else None
        req = urllib.request.Request(target, data=body, method=self.command)
        for key, value in self.headers.items():
            lowered = key.lower()
            if lowered in ('host', 'content-length', 'accept-encoding', 'connection'):
                continue
            req.add_header(key, value)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                self.send_response(resp.status)
                for key, value in resp.getheaders():
                    lowered = key.lower()
                    if lowered in ('transfer-encoding', 'connection', 'server', 'date', 'content-length'):
                        continue
                    self.send_header(key, value)
                data = resp.read()
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as exc:
            data = exc.read()
            self.send_response(exc.code)
            for key, value in exc.headers.items():
                lowered = key.lower()
                if lowered in ('transfer-encoding', 'connection', 'server', 'date', 'content-length'):
                    continue
                self.send_header(key, value)
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception as exc:
            data = ('{"success":false,"error":"proxy error: %s"}' % str(exc)).encode()
            self.send_response(502)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)

    def do_GET(self):
        if self.path.startswith(PROXY_PREFIXES):
            return self._proxy()
        return super().do_GET()

    def do_HEAD(self):
        if self.path.startswith(PROXY_PREFIXES):
            return self._proxy()
        return super().do_HEAD()

    def do_POST(self):
        if self.path.startswith(PROXY_PREFIXES):
            return self._proxy()
        return super().do_POST()

    def do_DELETE(self):
        if self.path.startswith(PROXY_PREFIXES):
            return self._proxy()
        return super().do_DELETE()

    def do_PUT(self):
        if self.path.startswith(PROXY_PREFIXES):
            return self._proxy()
        return super().do_PUT()


with ReusableTCPServer(('127.0.0.1', PORT), Handler) as httpd:
    print(f'proxy server on http://127.0.0.1:{PORT} -> {BACKEND} (webroot={WEBROOT})', flush=True)
    httpd.serve_forever()
