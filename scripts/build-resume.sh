#!/usr/bin/env bash
set -euo pipefail

RUN_ID="${1:-manual}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RESUME_DIR="${ROOT_DIR}/resume"
OUTPUT_DIR="${ROOT_DIR}/data/runs/${RUN_ID}"
API_URL="${TEXLIVE_URL:-http://texlive:5001/build}"

mkdir -p "${OUTPUT_DIR}"

payload=$(printf '{"runId":"%s"}' "${RUN_ID}")
response=$(curl -s -S -X POST "${API_URL}" -H 'Content-Type: application/json' -d "${payload}")
status=$(printf '%s' "${response}" | sed -n 's/.*"status":"\([^"]*\)".*/\1/p')

echo "${response}"

if [[ "${status}" != "OK" ]]; then
  exit 1
fi

if [[ -f "${RESUME_DIR}/cv.pdf" ]]; then
  cp -f "${RESUME_DIR}/cv.pdf" "${OUTPUT_DIR}/final.pdf"
fi
