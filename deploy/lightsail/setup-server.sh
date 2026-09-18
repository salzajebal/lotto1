#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "sudo로 실행해주세요: sudo bash deploy/lightsail/setup-server.sh" >&2
  exit 1
fi

APP_DB_NAME="${APP_DB_NAME:-lotto_analysis}"
APP_DB_USER="${APP_DB_USER:-lotto_app}"
APP_ENV_FILE="${APP_ENV_FILE:-/etc/lotto-analysis.env}"
APP_SYSTEM_USER="${APP_SYSTEM_USER:-${SUDO_USER:-ubuntu}}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! id "$APP_SYSTEM_USER" >/dev/null 2>&1; then
  echo "앱 실행 사용자를 찾을 수 없습니다: $APP_SYSTEM_USER" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg git build-essential nginx \
  postgresql postgresql-contrib ufw openssl

if ! command -v node >/dev/null 2>&1 || [[ "$(node -p 'Number(process.versions.node.split(\".\")[0])')" -lt 22 ]]; then
  install -d -m 0755 /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
  chmod a+r /etc/apt/keyrings/nodesource.gpg
  cat >/etc/apt/sources.list.d/nodesource.list <<'EOF'
deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main
EOF
  apt-get update
  apt-get install -y nodejs
fi

corepack enable
corepack prepare pnpm@10.29.3 --activate
sudo -u "$APP_SYSTEM_USER" -H sh -c \
  'cd "$HOME" && corepack install --global pnpm@10.29.3'
npm install --global pm2

systemctl enable --now postgresql
systemctl enable --now nginx

if [[ -s "$APP_ENV_FILE" ]]; then
  # 재실행 시 기존 DB 비밀번호와 세션 키를 보존합니다.
  set -a
  # shellcheck disable=SC1090
  source "$APP_ENV_FILE"
  set +a
  : "${DATABASE_URL:?기존 환경파일에 DATABASE_URL이 없습니다.}"
  : "${SESSION_SECRET:?기존 환경파일에 SESSION_SECRET이 없습니다.}"
  mapfile -t DB_PARTS < <(
    node -e 'const u=new URL(process.env.DATABASE_URL); console.log(decodeURIComponent(u.username)); console.log(decodeURIComponent(u.password)); console.log(u.pathname.slice(1));'
  )
  APP_DB_USER="${DB_PARTS[0]}"
  DB_PASSWORD="${DB_PARTS[1]}"
  APP_DB_NAME="${DB_PARTS[2]}"
  if [[ -z "$APP_DB_USER" || -z "$DB_PASSWORD" || -z "$APP_DB_NAME" ]]; then
    echo "기존 DATABASE_URL에서 DB 사용자, 비밀번호 또는 DB 이름을 읽지 못했습니다." >&2
    exit 1
  fi
  CREATE_ENV_FILE=false
else
  DB_PASSWORD="$(openssl rand -hex 24)"
  SESSION_SECRET="$(openssl rand -hex 48)"
  DATABASE_URL="postgresql://${APP_DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${APP_DB_NAME}"
  CREATE_ENV_FILE=true
fi

sudo -u postgres psql --set=ON_ERROR_STOP=1 \
  --set=db_user="$APP_DB_USER" \
  --set=db_password="$DB_PASSWORD" \
  --set=db_name="$APP_DB_NAME" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'db_user', :'db_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'db_user') \gexec
SELECT format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'db_user', :'db_password') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'db_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'db_name') \gexec
SELECT format('ALTER DATABASE %I OWNER TO %I', :'db_name', :'db_user') \gexec
SQL

if [[ "$CREATE_ENV_FILE" == "true" ]]; then
  TEMP_ENV_FILE="$(mktemp "${APP_ENV_FILE}.tmp.XXXXXX")"
  trap 'rm -f "${TEMP_ENV_FILE:-}"' EXIT
  cat >"$TEMP_ENV_FILE" <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=${DATABASE_URL}
SESSION_SECRET=${SESSION_SECRET}
EOF
  chown root:"$APP_SYSTEM_USER" "$TEMP_ENV_FILE"
  chmod 640 "$TEMP_ENV_FILE"
  mv -f "$TEMP_ENV_FILE" "$APP_ENV_FILE"
  trap - EXIT
fi

chown root:"$APP_SYSTEM_USER" "$APP_ENV_FILE"
chmod 640 "$APP_ENV_FILE"
install -d -o "$APP_SYSTEM_USER" -g "$APP_SYSTEM_USER" -m 755 /var/log/lotto-analysis
cp "$SCRIPT_DIR/nginx.conf" /etc/nginx/sites-available/lotto-analysis
ln -sfn /etc/nginx/sites-available/lotto-analysis /etc/nginx/sites-enabled/lotto-analysis
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

ufw allow OpenSSH
ufw allow "Nginx Full"
ufw --force enable

echo
echo "Lightsail 기본 구성이 완료되었습니다."
echo "환경변수 파일: $APP_ENV_FILE (root와 ${APP_SYSTEM_USER}만 읽기 가능)"
echo "다음 단계는 README.md의 '앱 설치 및 첫 실행'을 진행하세요."