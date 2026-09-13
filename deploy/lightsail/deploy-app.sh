#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
ENV_FILE="${ENV_FILE:-/etc/lotto-analysis.env}"

cd "$PROJECT_DIR"

if [[ ! -r "$ENV_FILE" ]]; then
  echo "환경변수 파일을 읽을 수 없습니다: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

export NODE_ENV=production
export PORT=3000
export BASE_PATH="/"

pnpm install --frozen-lockfile
pnpm run build:vps

if pm2 describe lotto-analysis >/dev/null 2>&1; then
  pm2 reload deploy/lightsail/ecosystem.config.cjs --update-env
else
  pm2 start deploy/lightsail/ecosystem.config.cjs
fi

if ! pm2 describe pm2-logrotate >/dev/null 2>&1; then
  pm2 install pm2-logrotate
  pm2 set pm2-logrotate:max_size 10M
  pm2 set pm2-logrotate:retain 14
  pm2 set pm2-logrotate:compress true
fi

pm2 save
pm2 status