import json
import os
import signal
import sys
from datetime import datetime
from pathlib import Path

from scholarly import scholarly


RESULTS_DIR = Path("results")
PREVIOUS_DATA_PATH = RESULTS_DIR / "gs_data.previous.json"
GS_DATA_PATH = RESULTS_DIR / "gs_data.json"
SHIELDS_DATA_PATH = RESULTS_DIR / "gs_data_shieldsio.json"
TIMEOUT_SECONDS = int(os.environ.get("GOOGLE_SCHOLAR_TIMEOUT_SECONDS", "120"))


class ScholarFetchTimeout(Exception):
    pass


def _handle_timeout(signum, frame):
    raise ScholarFetchTimeout(f"Google Scholar fetch timed out after {TIMEOUT_SECONDS} seconds")


def load_previous_data(scholar_id):
    for path in (PREVIOUS_DATA_PATH, GS_DATA_PATH):
        if not path.exists():
            continue

        try:
            with path.open() as infile:
                previous_data = json.load(infile)
        except json.JSONDecodeError:
            continue

        if previous_data.get("scholar_id") == scholar_id:
            return previous_data

    return None


def fetch_author_data(scholar_id):
    print(f"Fetching Google Scholar stats for {scholar_id}", flush=True)
    signal.signal(signal.SIGALRM, _handle_timeout)
    signal.alarm(TIMEOUT_SECONDS)
    try:
        author = scholarly.search_author_id(scholar_id)
        scholarly.fill(author, sections=["basics", "indices", "counts"])
    finally:
        signal.alarm(0)

    author["updated"] = str(datetime.now())
    author["fetch_status"] = "success"
    author.pop("fetch_error", None)
    return author


def fallback_author_data(scholar_id, error):
    previous_data = load_previous_data(scholar_id)
    attempted_at = str(datetime.now())
    error_message = str(error)

    if previous_data and isinstance(previous_data.get("citedby"), int):
        print(f"Using previous Google Scholar stats after fetch failure: {error_message}", flush=True)
        previous_data["fetch_status"] = "stale"
        previous_data["fetch_error"] = error_message
        previous_data["last_attempted"] = attempted_at
        return previous_data

    print(f"No previous Google Scholar stats available: {error_message}", flush=True)
    return {
        "scholar_id": scholar_id,
        "citedby": None,
        "updated": attempted_at,
        "fetch_status": "failed",
        "fetch_error": error_message,
    }


def write_outputs(author):
    RESULTS_DIR.mkdir(exist_ok=True)
    with GS_DATA_PATH.open("w") as outfile:
        json.dump(author, outfile, ensure_ascii=False)

    citedby = author.get("citedby")
    shieldio_data = {
        "schemaVersion": 1,
        "label": "citations",
        "message": str(citedby) if isinstance(citedby, int) else "unavailable",
    }
    with SHIELDS_DATA_PATH.open("w") as outfile:
        json.dump(shieldio_data, outfile, ensure_ascii=False)


def main():
    scholar_id = os.environ["GOOGLE_SCHOLAR_ID"]
    try:
        author = fetch_author_data(scholar_id)
    except Exception as error:
        author = fallback_author_data(scholar_id, error)

    write_outputs(author)
    print(
        json.dumps(
            {
                "scholar_id": author.get("scholar_id"),
                "citedby": author.get("citedby"),
                "fetch_status": author.get("fetch_status"),
            },
            ensure_ascii=False,
        ),
        flush=True,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
