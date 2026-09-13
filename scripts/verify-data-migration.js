#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl =
  process.env.TARGET_DATABASE_URL ?? process.env.DATABASE_URL;

function stop(message) {
  console.error(`오류: ${message}`);
  process.exit(1);
}

if (!sourceUrl) {
  stop("SOURCE_DATABASE_URL이 필요합니다.");
}
if (!targetUrl) {
  stop("DATABASE_URL 또는 TARGET_DATABASE_URL이 필요합니다.");
}

const targetHost = new URL(targetUrl).hostname;
if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(targetHost)) {
  stop(`대상 DB는 로컬 PostgreSQL이어야 합니다. 현재 호스트: ${targetHost}`);
}

function query(url, sql) {
  const result = spawnSync(
    "psql",
    [
      "-X",
      "--no-psqlrc",
      "--set",
      "ON_ERROR_STOP=1",
      "--tuples-only",
      "--no-align",
      "--dbname",
      url,
      "--command",
      sql,
    ],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );

  if (result.error?.code === "ENOENT") {
    stop("psql을 찾을 수 없습니다. PostgreSQL 클라이언트를 설치해주세요.");
  }
  if (result.status !== 0) {
    console.error(result.stderr);
    stop(`DB 조회가 실패했습니다(종료 코드 ${result.status}).`);
  }
  return result.stdout.trim();
}

function listRelations(url, kind) {
  const relationType = kind === "table" ? "r" : "S";
  const output = query(
    url,
    `
      SELECT format('%I.%I', n.nspname, c.relname)
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = '${relationType}'
        AND n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND n.nspname NOT LIKE 'pg_toast%'
      ORDER BY n.nspname, c.relname;
    `,
  );
  return output ? output.split("\n") : [];
}

function hashCopy(url, selectSql) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "psql",
      [
        "-X",
        "--no-psqlrc",
        "--set",
        "ON_ERROR_STOP=1",
        "--quiet",
        "--dbname",
        url,
        "--command",
        `SET TIME ZONE 'UTC'; SET bytea_output = 'hex'; COPY (${selectSql}) TO STDOUT;`,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );

    const hash = createHash("sha256");
    let rows = 0;
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      hash.update(chunk);
      for (const byte of chunk) {
        if (byte === 10) rows += 1;
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `psql 종료 코드 ${code}`));
        return;
      }
      resolve({ rows, hash: hash.digest("hex") });
    });
  });
}

const metadataSql = `
  WITH metadata AS (
    SELECT 'column' AS kind,
      jsonb_build_object(
        'schema', table_schema, 'table', table_name,
        'position', ordinal_position, 'name', column_name,
        'type', data_type, 'udt_schema', udt_schema, 'udt', udt_name,
        'nullable', is_nullable, 'default', column_default,
        'identity', identity_generation, 'generated', is_generated
      )::text AS definition
    FROM information_schema.columns
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')

    UNION ALL

    SELECT 'constraint',
      jsonb_build_object(
        'schema', n.nspname, 'table', c.relname, 'name', con.conname,
        'type', con.contype, 'definition', pg_get_constraintdef(con.oid, true)
      )::text
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')

    UNION ALL

    SELECT 'index',
      jsonb_build_object(
        'schema', schemaname, 'table', tablename,
        'name', indexname, 'definition', indexdef
      )::text
    FROM pg_indexes
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')

    UNION ALL

    SELECT 'trigger',
      jsonb_build_object(
        'schema', n.nspname, 'table', c.relname,
        'name', t.tgname, 'definition', pg_get_triggerdef(t.oid, true)
      )::text
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE NOT t.tgisinternal
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
  )
  SELECT COALESCE(
    string_agg(kind || ':' || definition, E'\\n' ORDER BY kind, definition),
    ''
  )
  FROM metadata;
`;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function compareRelation(kind, relation) {
  const selectSql =
    kind === "table"
      ? `SELECT row_to_json(t)::text FROM ${relation} t ORDER BY md5(row_to_json(t)::text), convert_to(row_to_json(t)::text, 'UTF8')`
      : `SELECT row_to_json(s)::text FROM ${relation} s`;
  const [source, target] = await Promise.all([
    hashCopy(sourceUrl, selectSql),
    hashCopy(targetUrl, selectSql),
  ]);
  const same = source.rows === target.rows && source.hash === target.hash;
  console.log(
    `${same ? "일치" : "불일치"} ${kind === "table" ? "테이블" : "시퀀스"} ${relation}` +
      ` | 원본 ${source.rows}행 ${source.hash.slice(0, 12)}` +
      ` | 대상 ${target.rows}행 ${target.hash.slice(0, 12)}`,
  );
  return same;
}

async function main() {
  console.log("원본과 Lightsail 로컬 DB의 전체 논리 데이터 검증을 시작합니다.\n");

  const [sourceTables, targetTables, sourceSequences, targetSequences] =
    await Promise.all([
      Promise.resolve(listRelations(sourceUrl, "table")),
      Promise.resolve(listRelations(targetUrl, "table")),
      Promise.resolve(listRelations(sourceUrl, "sequence")),
      Promise.resolve(listRelations(targetUrl, "sequence")),
    ]);

  let exact = true;
  if (JSON.stringify(sourceTables) !== JSON.stringify(targetTables)) {
    exact = false;
    console.error("불일치: 테이블 목록이 다릅니다.");
    console.error("원본:", sourceTables);
    console.error("대상:", targetTables);
  }
  if (JSON.stringify(sourceSequences) !== JSON.stringify(targetSequences)) {
    exact = false;
    console.error("불일치: 시퀀스 목록이 다릅니다.");
    console.error("원본:", sourceSequences);
    console.error("대상:", targetSequences);
  }

  const sourceMetadata = sha256(query(sourceUrl, metadataSql));
  const targetMetadata = sha256(query(targetUrl, metadataSql));
  if (sourceMetadata !== targetMetadata) {
    exact = false;
    console.error("불일치: 컬럼·제약조건·인덱스·트리거 구조가 다릅니다.");
  } else {
    console.log(`일치 DB 구조 | ${sourceMetadata.slice(0, 12)}\n`);
  }

  for (const table of sourceTables.filter((item) =>
    targetTables.includes(item),
  )) {
    if (!(await compareRelation("table", table))) exact = false;
  }
  for (const sequence of sourceSequences.filter((item) =>
    targetSequences.includes(item),
  )) {
    if (!(await compareRelation("sequence", sequence))) exact = false;
  }

  if (!exact) {
    console.error("\n검증 실패: 원본과 Lightsail DB에 차이가 있습니다.");
    process.exitCode = 1;
    return;
  }

  console.log(
    "\n검증 성공: 구조, 전체 테이블 행 수·내용, 시퀀스 상태가 모두 일치합니다.",
  );
}

main().catch((error) => {
  console.error(`오류: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});