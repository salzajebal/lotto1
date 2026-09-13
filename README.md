# 로또리코 AWS Lightsail 자체 운영 가이드

이 프로젝트는 외부 DB 서비스 없이 한 대의 AWS Lightsail Ubuntu 서버에서 다음 구성을 함께 운영할 수 있습니다.

- PostgreSQL: 서버 내부 `127.0.0.1:5432`에서만 앱과 연결
- Node.js/Express: API와 빌드된 React 웹을 함께 제공
- PM2: 앱 자동 재시작 및 부팅 시 자동 실행
- PM2 Logrotate: 앱 로그를 10MB 단위로 순환하고 14개 보관
- Nginx: 외부 80/443 요청을 앱의 내부 3000 포트로 전달

## 1. 준비 사항

1. AWS Lightsail에서 Ubuntu 인스턴스를 생성합니다.
2. 최소 권장 사양은 RAM 2GB 이상입니다.
3. Lightsail 네트워킹 방화벽에서 `SSH(22)`, `HTTP(80)`, `HTTPS(443)`만 허용합니다.
4. PostgreSQL 포트 `5432`는 외부에 열지 않습니다.
5. 도메인을 사용할 경우 DNS A 레코드를 Lightsail 고정 IP로 연결합니다.

## 2. 서버 접속과 프로젝트 업로드

Lightsail 콘솔의 SSH 또는 로컬 터미널에서 접속합니다.

```bash
ssh ubuntu@서버_고정_IP
```

Git 저장소를 `/var/www/lotto-analysis`에 복제합니다.

```bash
sudo mkdir -p /var/www/lotto-analysis
sudo chown -R ubuntu:ubuntu /var/www/lotto-analysis
git clone 저장소_URL /var/www/lotto-analysis
cd /var/www/lotto-analysis
```

Git을 사용하지 않는 경우 SFTP/SCP로 프로젝트 전체를 같은 경로에 올려도 됩니다.

## 3. PostgreSQL, Node.js, PM2, Nginx 최초 설치

프로젝트 루트에서 다음 명령을 한 번 실행합니다.

```bash
cd /var/www/lotto-analysis
sudo bash deploy/lightsail/setup-server.sh
```

이 스크립트가 수행하는 작업:

- PostgreSQL과 Nginx 설치 및 부팅 자동 시작
- Node.js 22와 pnpm 10 설치
- PM2 설치
- `lotto_analysis` DB와 `lotto_app` 사용자 생성
- 재실행 시 기존 DB 비밀번호와 세션 키 보존
- 안전한 무작위 DB 비밀번호와 세션 키 생성
- `/etc/lotto-analysis.env` 환경변수 파일 생성
- Nginx 리버스 프록시와 UFW 방화벽 설정

환경변수 파일은 root와 앱 실행 사용자(`ubuntu`)만 읽을 수 있습니다. 설치 스크립트를 다시 실행해도 기존 DB 비밀번호와 `SESSION_SECRET`은 바뀌지 않습니다.

```bash
sudo cat /etc/lotto-analysis.env
```

직접 값을 바꿀 때는 다음 명령을 사용합니다.

```bash
sudo nano /etc/lotto-analysis.env
```

앱의 DB 연결은 `process.env.DATABASE_URL`을 사용합니다. 환경변수가 전혀 없을 때 코드가 참조하는 개발용 기본값은 다음과 같습니다.

```text
postgresql://postgres:password@localhost:5432/myapp
```

운영 서버에서는 설치 스크립트가 생성한 `/etc/lotto-analysis.env`의 강력한 접속 정보를 사용하며, 위 기본 비밀번호를 운영에 사용하지 않습니다.

## 4. 앱 설치 및 첫 실행

먼저 빈 로컬 DB에 현재 앱 스키마를 적용합니다.

```bash
cd /var/www/lotto-analysis
set -a
source <(sudo cat /etc/lotto-analysis.env)
set +a
corepack pnpm install --frozen-lockfile
corepack pnpm run db:push
```

`db:push` 결과에 기존 테이블 삭제 또는 데이터 손실 경고가 표시되면 강제로 진행하지 말고 먼저 DB를 백업하고 변경 내용을 검토하세요.

이후 웹과 API를 빌드하고 PM2로 실행합니다.

```bash
cd /var/www/lotto-analysis
bash deploy/lightsail/deploy-app.sh
```

PM2가 현재 앱을 정상 실행하는지 확인합니다. 첫 배포 시 PM2 로그 순환 모듈도 함께 설치됩니다.

```bash
pm2 status
pm2 logs lotto-analysis --lines 100
curl http://127.0.0.1:3000/api/healthz
curl -I http://127.0.0.1:3000/
```

부팅 시 PM2 자동 시작을 등록합니다. 아래 첫 명령이 출력하는 `sudo ... pm2 startup ...` 명령을 그대로 한 번 실행한 뒤 저장합니다.

```bash
pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save
```

서버 재부팅 후 확인:

```bash
sudo reboot
# 다시 SSH 접속한 뒤
pm2 status
sudo systemctl status postgresql --no-pager
sudo systemctl status nginx --no-pager
```

## 5. HTTPS 연결

도메인이 서버 고정 IP를 가리킨 뒤 Nginx 설정의 `server_name _;`를 실제 도메인으로 변경합니다.

```bash
sudo nano /etc/nginx/sites-available/lotto-analysis
sudo nginx -t
sudo systemctl reload nginx
```

Certbot 설치와 인증서 발급:

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
sudo certbot renew --dry-run
```

## 6. 코드 업데이트 배포

```bash
cd /var/www/lotto-analysis
git pull
bash deploy/lightsail/deploy-app.sh
```

DB 스키마가 변경된 배포에서만 백업 후 명시적으로 실행합니다.

```bash
set -a
source <(sudo cat /etc/lotto-analysis.env)
set +a
corepack pnpm run db:push
```

데이터 이전 스크립트는 위 배포 명령이나 PM2 시작 과정에서 자동 실행되지 않습니다.

## 7. 기존 데이터 수동 이전

데이터 이전은 앱과 서버 구축을 모두 완료한 뒤 원하는 시점에만 실행합니다. 이 스크립트는 자동 시작되지 않으며 직접 명령을 입력해야만 동작합니다.

### 이전 전 확인

- 대상 로컬 DB 접속 정보는 `/etc/lotto-analysis.env`의 `DATABASE_URL`입니다.
- 원본 DB 접속 문자열은 실행할 때만 `SOURCE_DATABASE_URL`로 지정합니다.
- 원본 DB를 외부에서 읽어야 한다면 원본 서비스의 네트워크 허용 목록에 Lightsail 고정 IP를 일시적으로 추가해야 할 수 있습니다.
- 스크립트는 대상 DB를 `backups/`에 먼저 백업한 뒤 원본의 스키마와 데이터로 교체합니다.
- 대상 DB는 `localhost`, `127.0.0.1`, `::1` 중 하나여야 하며 대상 URL이 없으면 실행되지 않습니다.
- PM2 앱이 실행 중이면 쓰기 충돌을 막기 위해 잠시 중지하고 완료 또는 실패 후 다시 시작합니다.
- DB URL을 Git에 커밋하거나 터미널 기록이 남는 공개 환경에 붙여 넣지 마세요.

### 실행

대화형 셸에 원본 URL을 노출하지 않으려면 다음처럼 읽어 환경변수로 설정합니다.

```bash
cd /var/www/lotto-analysis
read -s -p "원본 DATABASE_URL: " SOURCE_DATABASE_URL
echo
export SOURCE_DATABASE_URL

set -a
source <(sudo cat /etc/lotto-analysis.env)
set +a

node scripts/migrate-data.js
```

화면에 표시되는 원본/대상 호스트와 DB 이름을 확인한 뒤, 계속하려면 `MIGRATE`를 정확히 입력합니다.

현재 셸에 대상 환경변수를 먼저 불러온 상태에서 사용할 수 있는 간단한 명령 형식은 다음과 같습니다.

```bash
set -a
source <(sudo cat /etc/lotto-analysis.env)
set +a
SOURCE_DATABASE_URL='원본_DB_URL' node scripts/migrate-data.js
```

단, 이 형식은 셸 히스토리에 원본 URL이 남을 수 있으므로 위의 `read -s` 방식을 권장합니다.

스크립트 동작:

1. 대상 로컬 DB를 `backups/before-migration-날짜.dump`에 백업
2. 실행 중인 PM2 앱을 잠시 중지
3. `pg_dump`로 원본 DB 전체 스키마·데이터·시퀀스 추출
4. 기존 스키마 제거와 전체 복원을 하나의 PostgreSQL 트랜잭션으로 실행
5. 대상 DB 연결 확인 후 PM2 앱 재시작

복원 중 오류가 나면 전체 트랜잭션이 롤백되므로 이전 대상 DB 상태가 유지됩니다. 별도 수동 복구가 필요한 경우 사전 백업을 사용합니다.

### 데이터 이전 후 원본·대상 전수 비교

데이터 이전이 끝난 뒤 같은 SSH 세션에서 다음 명령을 실행합니다.

```bash
pnpm run verify:data
```

이 검증은 원본 Replit DB와 Lightsail 로컬 DB의 테이블 목록, 컬럼·제약조건·인덱스·트리거 구조, 모든 테이블 행의 전체 내용 해시, 행 수, 시퀀스 상태를 비교합니다. 성공하면 다음 문구가 표시됩니다.

```text
검증 성공: 구조, 전체 테이블 행 수·내용, 시퀀스 상태가 모두 일치합니다.
```

완료 후 원본 DB 주소를 현재 셸에서 제거합니다.

```bash
unset SOURCE_DATABASE_URL
```

```bash
set -a
source <(sudo cat /etc/lotto-analysis.env)
set +a
pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname="$DATABASE_URL" backups/before-migration-날짜.dump
```

## 8. PostgreSQL 백업

수동 백업:

```bash
cd /var/www/lotto-analysis
mkdir -p backups
set -a
source <(sudo cat /etc/lotto-analysis.env)
set +a
pg_dump --format=custom --no-owner --no-privileges \
  --file="backups/lotto-$(date +%F-%H%M).dump" "$DATABASE_URL"
```

매일 새벽 3시 백업 예시입니다. 환경파일 접근 권한과 백업 파일 보호를 위해 root의 cron에 등록합니다.

```bash
sudo crontab -e
```

아래 한 줄을 추가합니다.

```cron
0 3 * * * cd /var/www/lotto-analysis && set -a && . /etc/lotto-analysis.env && set +a && mkdir -p backups && pg_dump --format=custom --no-owner --no-privileges --file="backups/lotto-$(date +\%F-\%H\%M).dump" "$DATABASE_URL"
```

백업은 같은 서버만이 아니라 별도 저장소에도 주기적으로 복사해야 서버 장애에도 복구할 수 있습니다.

## 9. 자주 사용하는 운영 명령

```bash
# 앱 상태와 로그
pm2 status
pm2 logs lotto-analysis
pm2 restart lotto-analysis

# 서비스 상태
sudo systemctl status postgresql
sudo systemctl status nginx

# PostgreSQL 접속
set -a
source <(sudo cat /etc/lotto-analysis.env)
set +a
psql "$DATABASE_URL"

# Nginx 설정 확인
sudo nginx -t

# 앱 상태 확인
curl http://127.0.0.1:3000/api/healthz
```

## 10. 주요 파일

- `deploy/lightsail/setup-server.sh`: Ubuntu 최초 설치와 로컬 DB 생성
- `deploy/lightsail/deploy-app.sh`: 의존성 설치, 빌드, PM2 반영
- `deploy/lightsail/ecosystem.config.cjs`: PM2 앱 설정
- `deploy/lightsail/start-app.sh`: 환경변수를 읽고 앱 실행
- `deploy/lightsail/nginx.conf`: Nginx 리버스 프록시
- `scripts/migrate-data.js`: 명시적으로 실행하는 수동 데이터 이전
- `.env.vps.example`: 환경변수 예시