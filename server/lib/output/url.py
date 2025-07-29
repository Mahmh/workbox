from typing import Optional
from urllib.parse import urlparse
from lib.logger import errlog
from lib.constants import URL_CHECK_TIMEOUT, DOCUMENT_EXT_TO_MIME
import requests


def get_response_from_url(url: str) -> Optional[requests.Response]:
    """Used to verify if a URL is reachable."""
    try:
        # HEAD is lighter, but some servers reject it => fallback to GET
        r = requests.head(url, allow_redirects=True, timeout=URL_CHECK_TIMEOUT)
        if r.status_code >= 400 or r.status_code == 405:
            r = requests.get(url, allow_redirects=True, timeout=URL_CHECK_TIMEOUT)
        return r
    except requests.RequestException as e:
        errlog("_get_response_from_url", e, "url")
        return None


def matches_type(url: str, ext: str) -> bool:
    """
    Verifies that `url` truly matches the given extension
    by checking suffix or sniffing Content-Type.
    """
    path = urlparse(url).path.lower()

    # Quick suffix check
    if path.endswith(f".{ext}"):
        return True

    # Fallback to HEAD/GET + header inspection
    r = get_response_from_url(url)
    if r is not None:
        content_type = r.headers.get("Content-Type", "").lower()
    else:
        return False

    # Special case for 'webpage' type
    if ext == "html":
        # treat any text/html response (php, no‑ext, etc.) as html
        return "text/html" in content_type

    # Check against known MIME substrings
    for subtype in DOCUMENT_EXT_TO_MIME.get(ext, []):
        if subtype in content_type:
            return True

    return False
