#!/usr/bin/env bash
set -Eeuo pipefail

ENV_FILE="${ENV_FILE:-/etc/lotto-analysis.env}"

if [[ ! -r "$ENV_FILE" ]]; then
  echo "환경변수 파일을 읽을 수 없습니다: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

export NODE_ENV="${NODE_ENV:-production}"
export PORT=3000

exec node --enable-source-maps artifacts/api-server/dist/index.mjs