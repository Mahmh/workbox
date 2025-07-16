from typing import Callable
from functools import wraps
from lib.constants import ENABLE_LOGGING, LOG_DIR
import logging, os


def endpoint(func: Callable) -> Callable:
    """Logs inputs, outputs, errors of API endpoints. Returns error messages instead of raising."""

    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            result = await func(*args, **kwargs)
            log(
                f"{func.__name__} ({args}, {kwargs}) -> {result}",
                "api",
                "DEBUG",
            )
            return result
        except Exception as e:
            errlog(func.__name__, e, "api-errors")
            return {"error": str(e)}

    return wrapper


def log(msg: str, filename: str, level: str = "INFO") -> None:
    """Write a log message with the specified file and level."""
    logger = _get_logger(name=filename, filename=filename, level=level)
    if logger:
        logger.log(logging._nameToLevel[level.upper()], msg)


def errlog(func_name: str, e: Exception, filename: str) -> None:
    """Log an exception to the specified file."""
    err_name = str(type(e)).split("'")[1]
    log(f"[{func_name}] {err_name}: {e}", filename, "ERROR")


def _get_logger(name: str, filename: str, level: str = "INFO") -> logging.Logger:
    """Get a logger with a specific name and file handler."""
    if not ENABLE_LOGGING:
        return None
    logger = logging.getLogger(name)

    if not logger.hasHandlers():
        level = logging._nameToLevel[level.upper()]
        log_file = os.path.join(LOG_DIR, f"{filename}.log")

        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(level)
        file_handler.setFormatter(
            logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
        )

        logger.setLevel(level)
        logger.addHandler(file_handler)
    return logger
