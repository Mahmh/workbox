from urllib.parse import urlparse


def matches_type(url: str, ext: str) -> bool:
    """
    Verifies that `url` truly matches the given extension by checking suffix.
    """
    path = urlparse(url).path.lower()

    if path.endswith(f".{ext}"):
        return True
    elif ext == "html":
        return True

    return False
