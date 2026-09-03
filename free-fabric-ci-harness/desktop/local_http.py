from __future__ import annotations

import http.client
import ipaddress
import urllib.error
import urllib.parse
import urllib.request


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def _guard_response_body(response):
    original_read = response.read

    def guarded_read(*args, **kwargs):
        try:
            return original_read(*args, **kwargs)
        except http.client.HTTPException as exc:
            raise urllib.error.URLError("malformed_local_http_response") from exc

    response.read = guarded_read
    return response


class LoopbackOnlyHTTPHandler(urllib.request.HTTPHandler):
    def http_open(self, req):
        parsed = urllib.parse.urlsplit(req.full_url)
        host = (parsed.hostname or "").lower().rstrip(".")
        if host == "localhost":
            try:
                port = parsed.port
            except ValueError as exc:
                raise urllib.error.URLError("loopback_ip_required") from exc
            req.host = "127.0.0.1" + (f":{port}" if port is not None else "")
        else:
            try:
                address = ipaddress.ip_address(host)
            except ValueError as exc:
                raise urllib.error.URLError("loopback_ip_required") from exc
            if not address.is_loopback:
                raise urllib.error.URLError("loopback_ip_required")
        try:
            response = super().http_open(req)
        except http.client.HTTPException as exc:
            raise urllib.error.URLError("malformed_local_http_response") from exc
        return _guard_response_body(response)


def opener() -> urllib.request.OpenerDirector:
    return urllib.request.build_opener(
        urllib.request.ProxyHandler({}),
        LoopbackOnlyHTTPHandler(),
        NoRedirect,
    )
