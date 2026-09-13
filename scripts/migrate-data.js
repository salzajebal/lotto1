#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, rmSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import path from "node:path";
import os from "node:os";

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl =
  process.env.TARGET_DATABASE_URL ?? process.env.DATABASE_URL;

function fail(message) {
  console.error(`오류: ${message}`);
  process.exit(1);
}

function describeDatabase(connectionString) {
  const url = new URL(connectionString);
  return `${url.hostname}:${url.port || "5432"}/${url.pathname.slice(1)}`;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    ...options,
  });

  if (result.error?.code === "ENOENT") {
    throw new Error(
      `${command} 명령을 찾을 수 없습니다. PostgreSQL 클라이언트 도구를 설치해주세요.`,
    );
  }
  if (result.status !== 0) {
    throw new Error(
      `${command} 실행이 실패했습니다(종료 코드 ${result.status}).`,
    );
  }
}

if (!sourceUrl) {
  fail(
    "SOURCE_DATABASE_URL이 필요합니다. 원본 DB 접속 문자열을 환경변수로 지정한 뒤 다시 실행해주세요.",
  );
}

if (!targetUrl) {
  fail(
    "DATABASE_URL 또는 TARGET_DATABASE_URL이 필요합니다. 대상 로컬 DB를 명시해주세요.",
  );
}

let normalizedSource;
let normalizedTarget;
try {
  normalizedSource = new URL(sourceUrl).toString();
  normalizedTarget = new URL(targetUrl).toString();
} catch {
  fail("SOURCE_DATABASE_URL 또는 대상 DATABASE_URL 형식이 올바르지 않습니다.");
}

if (normalizedSource === normalizedTarget) {
  fail("원본 DB와 대상 DB가 같습니다. 데이터 손상을 방지하기 위해 중단합니다.");
}

const targetHost = new URL(targetUrl).hostname;
if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(targetHost)) {
  fail(
    `대상 DB가 로컬 호스트가 아닙니다(${targetHost}). Lightsail 내부 PostgreSQL만 대상으로 사용할 수 있습니다.`,
  );
}

const backupDir = path.resolve(process.cwd(), "backups");
mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
const targetBackup = path.join(backupDir, `before-migration-${stamp}.dump`);
const tempDir = path.join(os.tmpdir(), `lotto-data-migration-${process.pid}`);
const sourceSql = path.join(tempDir, "source.sql");
mkdirSync(tempDir, { recursive: true });
let appWasStopped = false;

console.log("\n수동 데이터 이전 준비");
console.log(`- 원본: ${describeDatabase(sourceUrl)}`);
console.log(`- 대상: ${describeDatabase(targetUrl)}`);
console.log(`- 대상 사전 백업: ${targetBackup}`);
console.log(
  "\n주의: 대상 DB의 기존 스키마와 데이터는 원본 DB 내용으로 교체됩니다.",
);

const readline = createInterface({ input, output });
const confirmation = await readline.question(
  '계속하려면 정확히 "MIGRATE"를 입력하세요: ',
);
readline.close();

if (confirmation !== "MIGRATE") {
  rmSync(tempDir, { recursive: true, force: true });
  console.log("사용자가 취소했습니다. 변경된 데이터가 없습니다.");
  process.exit(0);
}

try {
  console.log("\n1/4 대상 DB를 먼저 백업합니다.");
  run("pg_dump", [
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    "--file",
    targetBackup,
    targetUrl,
  ]);

  const pm2Status = spawnSync("pm2", ["jlist"], {
    encoding: "utf8",
    env: process.env,
  });
  if (pm2Status.status === 0) {
    try {
      const apps = JSON.parse(pm2Status.stdout || "[]");
      const app = apps.find((item) => item.name === "lotto-analysis");
      if (app?.pm2_env?.status === "online") {
        console.log("2/5 실행 중인 앱을 잠시 중지합니다.");
        run("pm2", ["stop", "lotto-analysis"]);
        appWasStopped = true;
      }
    } catch {
      fail("PM2 상태를 해석하지 못했습니다. 앱을 직접 중지한 뒤 다시 실행해주세요.");
    }
  }

  console.log(`${appWasStopped ? "3/5" : "2/4"} 원본 DB를 SQL로 추출합니다.`);
  const sourceFd = openSync(sourceSql, "w");
  writeFileSync(
    sourceFd,
    [
      "\\set ON_ERROR_STOP on",
      "DROP SCHEMA IF EXISTS public CASCADE;",
      "CREATE SCHEMA public AUTHORIZATION CURRENT_USER;",
      "",
    ].join("\n"),
  );
  run("pg_dump", [
    "--format=plain",
    "--no-owner",
    "--no-privileges",
    sourceUrl,
  ], {
    stdio: ["ignore", sourceFd, "inherit"],
  });
  closeSync(sourceFd);

  console.log(`${appWasStopped ? "4/5" : "3/4"} 단일 트랜잭션으로 로컬 PostgreSQL에 복원합니다.`);
  run("psql", [
    targetUrl,
    "--single-transaction",
    "--set",
    "ON_ERROR_STOP=1",
    "--file",
    sourceSql,
  ]);

  console.log(`${appWasStopped ? "5/5" : "4/4"} 대상 DB 연결을 확인합니다.`);
  run("psql", [targetUrl, "--set", "ON_ERROR_STOP=1", "--command", "SELECT 1;"]);

  console.log("\n데이터 이전이 완료되었습니다.");
  console.log(`문제 발생 시 복원용 백업: ${targetBackup}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n오류: ${message}`);
  console.error(
    "복원 트랜잭션은 롤백되었습니다. 위 오류를 해결한 뒤 다시 실행해주세요.",
  );
  process.exitCode = 1;
} finally {
  if (appWasStopped) {
    const restart = spawnSync("pm2", ["restart", "lotto-analysis"], {
      stdio: "inherit",
      env: process.env,
    });
    if (restart.status !== 0) {
      console.error(
        "경고: 데이터 이전 후 앱 자동 재시작에 실패했습니다. pm2 restart lotto-analysis를 실행해주세요.",
      );
    }
  }
  if (existsSync(tempDir)) {
    rmSync(tempDir, { recursive: true, force: true });
  }
}