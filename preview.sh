#!/usr/bin/env bash
# Local build + preview helper for the Jekyll site.
#
# The site itself is built by Jekyll (Ruby/bundler); the uv-managed Python
# venv at ./.venv is used only to serve the generated _site/ over HTTP so you
# can preview it in a browser.
#
# Usage:
#   ./preview.sh            # build once, then serve at http://localhost:4000
#   ./preview.sh --port 8080
#   ./preview.sh --no-build # skip the Jekyll build, just serve existing _site/

set -euo pipefail
cd "$(dirname "$0")"

PORT=4000
BUILD=1
for arg in "$@"; do
  case "$arg" in
    --port) shift; PORT="${1:-4000}"; shift || true ;;
    --port=*) PORT="${arg#*=}" ;;
    --no-build) BUILD=0 ;;
  esac
done

if [[ "$BUILD" == "1" ]]; then
  echo "==> Building site with Jekyll..."
  BUNDLE_PATH="${BUNDLE_PATH:-/private/tmp/homepage-bundle}" \
    bundle exec jekyll build --trace
fi

if [[ ! -d _site ]]; then
  echo "error: _site/ not found. Run without --no-build first." >&2
  exit 1
fi

echo "==> Serving _site/ at http://localhost:${PORT}  (Ctrl+C to stop)"
exec .venv/bin/python -m http.server "$PORT" --directory _site
