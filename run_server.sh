#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export GEM_HOME="${ROOT_DIR}/.gem"
export GEM_PATH="${ROOT_DIR}/.gem:${HOME}/.gem/ruby/2.6.0"
export BUNDLE_PATH="${ROOT_DIR}/vendor/bundle"

"${HOME}/.gem/ruby/2.6.0/bin/bundle" exec jekyll liveserve
