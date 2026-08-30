import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import multer from "multer";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { Worker } from "node:worker_threads";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod/v4";
import {
  adminSessionsTable,
  adminUsersTable,
  analysisDatabasesTable,
  analysisDatabaseRowsTable,
  auditEventsTable,
  communityPostsTable,
  consultationNotesTable,
  db,
  dbAssignmentsTable,
  memberGradesTable,
  membersTable,
  siteSettingsTable,
  supportInquiriesTable,
  winningReviewsTable,
} from "@workspace/db";

type SessionUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      adminUser?: SessionUser;
    }
  }
}

const router: IRouter = Router();
const SESSION_COOKIE = "golden_pick_admin";
const SESSION_DAYS = 7;
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be configured for admin sessions.");
}

const text = (value: unknown, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;
const int = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : fallback;
};
const publicAdmin = (user: typeof adminUsersTable.$inferSelect): SessionUser => ({
  id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
});
const hash = (value: string) => createHash("sha256").update(`${sessionSecret}:${value}`).digest("hex");
const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
};
const verifyPassword = (password: string, stored: string) => {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
};
const addDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const publicWriteAttempts = new Map<string, { count: number; resetAt: number }>();
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
});
const IMPORT_BATCH_SIZE = 500;
const MAX_IMPORT_ROWS = 50_000;
const MAX_IMPORT_COLUMNS = 100;
const EXCEL_PARSE_TIMEOUT_MS = 20_000;
let activeExcelParses = 0;

type ImportMapping = {
  phone: number;
  name: number;
  amount: number;
  date: number;
};

type ParsedImportRow = {
  phone: string;
  memberName: string;
  amount: number;
  recordedDate: string;
};

type ImportRowError = {
  row: number;
  message: string;
};

const importAliases: Record<keyof ImportMapping, string[]> = {
  phone: ["전화번호", "연락처", "휴대폰", "휴대전화", "phone", "mobile"],
  name: ["이름", "성명", "회원명", "name", "membername"],
  amount: ["금액", "당첨금액", "당첨금", "amount", "prize"],
  date: ["날짜", "당첨일", "등록일", "일자", "date", "recordeddate"],
};

const normalizeHeader = (value: unknown) =>
  String(value ?? "").trim().toLowerCase().replace(/\s+/g, "").replace(/[()（）_./-]/g, "");

const findSuggestedColumn = (headers: string[], field: keyof ImportMapping) => {
  const aliases = new Set(importAliases[field].map(normalizeHeader));
  return headers.findIndex((header) => aliases.has(normalizeHeader(header)));
};

const receiveExcel = (req: Request, res: Response, next: NextFunction) => {
  excelUpload.single("file")(req, res, (error) => {
    if (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "엑셀 파일을 업로드할 수 없습니다." });
      return;
    }
    next();
  });
};

const validateExcelFile = (file: Express.Multer.File | undefined, res: Response) => {
  if (!file) {
    res.status(400).json({ error: "엑셀 파일을 선택해주세요." });
    return false;
  }
  const extension = file.originalname.toLowerCase().split(".").pop();
  if (extension !== "xlsx" && extension !== "xls") {
    res.status(400).json({ error: "xlsx 또는 xls 형식의 엑셀 파일만 업로드할 수 있습니다." });
    return false;
  }
  return true;
};

const excelWorkerSource = `
  const { parentPort, workerData } = require("node:worker_threads");
  const XLSX = require("xlsx");
  try {
    const workbook = XLSX.read(workerData.buffer, {
      type: "buffer",
      cellDates: false,
      dense: true,
      sheetRows: workerData.maxRows + 2,
    });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("엑셀 파일에 읽을 수 있는 시트가 없습니다.");
    const sheet = workbook.Sheets[sheetName];
    const range = sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]) : null;
    if (range && range.e.c + 1 > workerData.maxColumns) {
      throw new Error("엑셀 파일의 컬럼 수가 너무 많습니다.");
    }
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    }).map((row) => row.map((value) => String(value ?? "").trim()));
    if (rows.length < 2) throw new Error("첫 번째 행에 컬럼명이 있고, 그 아래에 데이터가 있어야 합니다.");
    if (rows.length - 1 > workerData.maxRows) {
      throw new Error("한 번에 최대 " + workerData.maxRows.toLocaleString() + "행까지 등록할 수 있습니다.");
    }
    parentPort.postMessage({ ok: true, data: { sheetName, rows } });
  } catch (error) {
    parentPort.postMessage({ ok: false, error: error instanceof Error ? error.message : "엑셀 파일을 읽을 수 없습니다." });
  }
`;

const readExcel = async (buffer: Buffer): Promise<{ sheetName: string; headers: string[]; rows: string[][] }> => {
  if (activeExcelParses >= 1) throw new Error("다른 엑셀 파일을 처리 중입니다. 잠시 후 다시 시도해주세요.");
  const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;
  const isOle = buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  if (!isZip && !isOle) throw new Error("올바른 엑셀 파일 형식이 아닙니다.");
  activeExcelParses += 1;
  try {
    const parsed = await new Promise<{ sheetName: string; rows: string[][] }>((resolve, reject) => {
      const worker = new Worker(excelWorkerSource, {
        eval: true,
        workerData: { buffer, maxRows: MAX_IMPORT_ROWS, maxColumns: MAX_IMPORT_COLUMNS },
        resourceLimits: { maxOldGenerationSizeMb: 192, maxYoungGenerationSizeMb: 32 },
      });
      const timeout = setTimeout(() => {
        void worker.terminate();
        reject(new Error("엑셀 파일 처리 시간이 초과되었습니다."));
      }, EXCEL_PARSE_TIMEOUT_MS);
      worker.once("message", (message: { ok: boolean; data?: { sheetName: string; rows: string[][] }; error?: string }) => {
        clearTimeout(timeout);
        void worker.terminate();
        if (message.ok && message.data) resolve(message.data);
        else reject(new Error(message.error || "엑셀 파일을 읽을 수 없습니다."));
      });
      worker.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      worker.once("exit", (code) => {
        if (code !== 0) {
          clearTimeout(timeout);
          reject(new Error("엑셀 파일 처리 중 메모리 제한을 초과했습니다."));
        }
      });
    });
    const headers = parsed.rows[0].map((value) => value.trim());
    if (headers.some((header) => !header)) throw new Error("컬럼명에 빈 셀이 있습니다.");
    if (new Set(headers.map(normalizeHeader)).size !== headers.length) throw new Error("중복된 컬럼명이 있습니다.");
    return { sheetName: parsed.sheetName, headers, rows: parsed.rows.slice(1) };
  } finally {
    activeExcelParses -= 1;
  }
};

const cellText = (value: unknown) => String(value ?? "").trim();

const parseImportDate = (value: unknown) => {
  const raw = cellText(value).replace(/[./]/g, "-").replace(/\s+/g, "");
  const serial = Number(raw);
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      year >= 1900
      && year <= 2100
      && date.getUTCFullYear() === year
      && date.getUTCMonth() === month - 1
      && date.getUTCDate() === day
    ) {
      return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    }
  }
  if (Number.isFinite(serial) && serial > 1) {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.floor(serial) * 86_400_000);
    const year = date.getUTCFullYear();
    if (Number.isFinite(date.getTime()) && year >= 1900 && year <= 2100) {
      return `${year.toString().padStart(4, "0")}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}-${date.getUTCDate().toString().padStart(2, "0")}`;
    }
  }
  return null;
};

const parseImportAmount = (value: unknown) => {
  const raw = cellText(value).replace(/[₩,\s]/g, "");
  if (!/^\d+$/.test(raw)) return null;
  const amount = Number(raw);
  return Number.isSafeInteger(amount) && amount >= 0 && amount <= 2_147_483_647 ? amount : null;
};

const parseImportPhone = (value: unknown) => {
  const raw = cellText(value);
  if (!/^[\d\s()-]+$/.test(raw)) return null;
  const phone = raw.replace(/\D/g, "");
  return /^010\d{8}$/.test(phone) ? phone : null;
};

const parseImportRows = (rows: unknown[][], mapping: ImportMapping) => {
  const validRows: ParsedImportRow[] = [];
  const errors: ImportRowError[] = [];
  const seen = new Set<string>();
  let duplicateCount = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const phone = parseImportPhone(row[mapping.phone]);
    const memberName = cellText(row[mapping.name]);
    const amount = parseImportAmount(row[mapping.amount]);
    const recordedDate = parseImportDate(row[mapping.date]);
    const rowErrors: string[] = [];
    if (!phone) rowErrors.push("전화번호는 010으로 시작하는 휴대전화 번호 11자리여야 합니다.");
    if (!memberName || memberName.length > 100) rowErrors.push("이름을 입력하고 100자 이내로 작성해주세요.");
    if (amount == null) rowErrors.push("금액은 0 이상의 숫자로 입력해주세요.");
    if (!recordedDate) rowErrors.push("날짜는 YYYY-MM-DD 형식으로 입력해주세요.");
    if (rowErrors.length) {
      errors.push({ row: rowNumber, message: rowErrors.join(" ") });
      return;
    }
    const parsed = { phone: phone!, memberName, amount: amount!, recordedDate: recordedDate! };
    const key = `${parsed.phone}|${parsed.memberName}|${parsed.amount}|${parsed.recordedDate}`;
    if (seen.has(key)) {
      duplicateCount += 1;
      return;
    }
    seen.add(key);
    validRows.push(parsed);
  });

  return { validRows, errors, duplicateCount };
};

const publicWriteRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || "unknown";
  const now = Date.now();
  const current = publicWriteAttempts.get(key);
  if (!current || current.resetAt <= now) {
    publicWriteAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    next();
    return;
  }
  if (current.count >= 10) {
    res.status(429).json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." });
    return;
  }
  current.count += 1;
  next();
};

async function getUserFromRequest(req: Request): Promise<SessionUser | null> {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const [session] = await db
    .select({
      id: adminSessionsTable.id,
      adminId: adminSessionsTable.adminId,
      expiresAt: adminSessionsTable.expiresAt,
      name: adminUsersTable.name,
      username: adminUsersTable.username,
      email: adminUsersTable.email,
      role: adminUsersTable.role,
      active: adminUsersTable.active,
    })
    .from(adminSessionsTable)
    .innerJoin(adminUsersTable, eq(adminSessionsTable.adminId, adminUsersTable.id))
    .where(eq(adminSessionsTable.tokenHash, hash(token)))
    .limit(1);
  if (!session || !session.active || session.expiresAt < new Date()) return null;
  return { id: session.adminId, name: session.name, username: session.username, email: session.email, role: session.role };
}

const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = await getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "관리자 로그인이 필요합니다." });
    return;
  }
  req.adminUser = user;
  next();
};

const requireOwner = (req: Request, res: Response, next: NextFunction) => {
  if (req.adminUser?.role !== "owner") {
    res.status(403).json({ error: "관리자 권한이 필요합니다." });
    return;
  }
  next();
};

const parse = <T extends z.ZodType>(schema: T, value: unknown, res: Response): z.infer<T> | null => {
  const result = schema.safeParse(value);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0]?.message ?? "입력값을 확인해주세요." });
    return null;
  }
  return result.data;
};

const recordEvent = async (req: Request, action: string, entity: string, entityId?: number, detail = "") => {
  await db.insert(auditEventsTable).values({
    adminId: req.adminUser?.id,
    action,
    entity,
    entityId,
    detail,
  });
};

const isOwner = (req: Request) => req.adminUser?.role === "owner";

const defaultSiteSettings = {
  kakaoChannelUrl: "",
  kakaoButtonLabel: "카카오톡 채널 상담",
};

const getSiteSettings = async () => {
  const [settings] = await db
    .select({
      kakaoChannelUrl: siteSettingsTable.kakaoChannelUrl,
      kakaoButtonLabel: siteSettingsTable.kakaoButtonLabel,
    })
    .from(siteSettingsTable)
    .where(eq(siteSettingsTable.id, 1))
    .limit(1);
  return settings ?? defaultSiteSettings;
};

const isValidKakaoChannelUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.hostname === "pf.kakao.com"
      && /^\/_[A-Za-z0-9]+(?:\/chat)?\/?$/.test(url.pathname)
      && !url.search
      && !url.hash;
  } catch {
    return false;
  }
};

const siteSettingsSchema = z.object({
  kakaoChannelUrl: z.string().trim().refine(
    (value) => value === "" || isValidKakaoChannelUrl(value),
    "카카오톡 채널 주소는 https://pf.kakao.com/_채널코드 형식으로 입력해주세요.",
  ),
  kakaoButtonLabel: z.string().trim().min(2, "버튼 문구는 2자 이상 입력해주세요.").max(40, "버튼 문구는 40자 이내로 입력해주세요."),
});

async function activeStaffExists(staffId: number | null | undefined) {
  if (staffId == null) return true;
  const [staff] = await db.select({ id: adminUsersTable.id }).from(adminUsersTable)
    .where(and(eq(adminUsersTable.id, staffId), eq(adminUsersTable.active, true))).limit(1);
  return Boolean(staff);
}

async function canAccessMember(req: Request, memberId: number) {
  if (isOwner(req)) return true;
  const [member] = await db.select({ id: membersTable.id }).from(membersTable)
    .where(and(eq(membersTable.id, memberId), eq(membersTable.assignedStaffId, req.adminUser!.id))).limit(1);
  return Boolean(member);
}

async function canAccessInquiry(req: Request, inquiryId: number) {
  if (isOwner(req)) return true;
  const [inquiry] = await db.select({ id: supportInquiriesTable.id }).from(supportInquiriesTable)
    .where(and(eq(supportInquiriesTable.id, inquiryId), eq(supportInquiriesTable.assignedStaffId, req.adminUser!.id))).limit(1);
  return Boolean(inquiry);
}

async function canAccessDatabase(req: Request, databaseId: number) {
  if (isOwner(req)) return true;
  const [database] = await db.select({ id: analysisDatabasesTable.id }).from(analysisDatabasesTable)
    .where(and(eq(analysisDatabasesTable.id, databaseId), eq(analysisDatabasesTable.assignedStaffId, req.adminUser!.id))).limit(1);
  return Boolean(database);
}

router.use(cookieParser());

const adminAccountSchema = z.object({
  name: z.string().trim().min(2, "이름은 2자 이상 입력해주세요."),
  username: z.string().trim().min(3, "아이디는 3자 이상 입력해주세요.").max(32, "아이디는 32자 이내로 입력해주세요.").regex(
    /^[A-Za-z0-9._-]+$/,
    "아이디는 영문, 숫자, 마침표, 밑줄, 하이픈만 사용할 수 있습니다.",
  ),
  email: z.string().trim().email("올바른 이메일을 입력해주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상 입력해주세요."),
});
const adminBootstrapSchema = adminAccountSchema.pick({ username: true, password: true });
const memberUsernameSchema = z.string().trim().min(3, "아이디는 3자 이상 입력해주세요.").max(32, "아이디는 32자 이내로 입력해주세요.").regex(
  /^[A-Za-z0-9._-]+$/,
  "아이디는 영문, 숫자, 마침표, 밑줄, 하이픈만 사용할 수 있습니다.",
);
const memberPasswordSchema = z.string().min(6, "비밀번호는 6자 이상 입력해주세요.").max(100, "비밀번호는 100자 이내로 입력해주세요.");

router.get("/admin/auth/status", async (req, res): Promise<void> => {
  const [count] = await db.select({ count: sql<number>`count(*)::int` }).from(adminUsersTable);
  const user = await getUserFromRequest(req);
  res.json({ authenticated: Boolean(user), user, needsBootstrap: (count?.count ?? 0) === 0 });
});

router.post("/admin/auth/bootstrap", async (req, res): Promise<void> => {
  const body = parse(adminBootstrapSchema, req.body, res);
  if (!body) return;
  const token = randomBytes(32).toString("hex");
  const user = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(872634102)`);
    const [count] = await tx.select({ count: sql<number>`count(*)::int` }).from(adminUsersTable);
    if ((count?.count ?? 0) > 0) return null;
    const [created] = await tx
      .insert(adminUsersTable)
        .values({
          name: "운영자",
          username: body.username.toLowerCase(),
          email: "admin@lottorico.com",
          passwordHash: hashPassword(body.password),
          role: "owner",
        })
      .returning();
    await tx.insert(adminSessionsTable).values({
      adminId: created.id,
      tokenHash: hash(token),
      expiresAt: addDays(SESSION_DAYS),
    });
    await tx.insert(memberGradesTable).values([
      { name: "VIP", slug: "vip", price: 0, color: "#E4B957", description: "1·2등 맞춤 상담", benefits: ["1·2등 맞춤 분석", "전담 상담", "프리미엄 리포트"] },
      { name: "프리미엄", slug: "premium", price: 330000, color: "#6B9DFF", description: "3등 분석 번호", benefits: ["매주 분석 번호", "회차별 리포트", "상담 복기"] },
      { name: "스탠다드", slug: "standard", price: 99000, color: "#8D96A8", description: "기본 분석 서비스", benefits: ["주간 번호 안내", "기초 리포트"] },
    ]).onConflictDoNothing({ target: memberGradesTable.slug });
    return created;
  });
  if (!user) {
    res.status(409).json({ error: "이미 운영 계정이 존재합니다." });
    return;
  }
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
  res.status(201).json({ user: publicAdmin(user) });
});

router.post("/admin/auth/login", async (req, res): Promise<void> => {
  const body = parse(adminAccountSchema.pick({ username: true, password: true }), req.body, res);
  if (!body) return;
  const username = body.username.toLowerCase();
  const attemptKey = `${req.ip || "unknown"}:${username}`;
  const now = Date.now();
  const attempt = loginAttempts.get(attemptKey);
  if (attempt && attempt.resetAt > now && attempt.count >= 5) {
    res.status(429).json({ error: "로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요." });
    return;
  }
  const [user] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.username, username)).limit(1);
  if (!user || !user.active || !verifyPassword(body.password, user.passwordHash)) {
    loginAttempts.set(attemptKey, {
      count: attempt && attempt.resetAt > now ? attempt.count + 1 : 1,
      resetAt: attempt && attempt.resetAt > now ? attempt.resetAt : now + 15 * 60 * 1000,
    });
    res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." });
    return;
  }
  loginAttempts.delete(attemptKey);
  const token = randomBytes(32).toString("hex");
  await db.insert(adminSessionsTable).values({ adminId: user.id, tokenHash: hash(token), expiresAt: addDays(SESSION_DAYS) });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
  res.json({ user: publicAdmin(user) });
});

router.post("/admin/auth/logout", async (req, res): Promise<void> => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) await db.delete(adminSessionsTable).where(eq(adminSessionsTable.tokenHash, hash(token)));
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true });
});

router.use("/admin", requireAdmin);

router.get("/admin/me", (req, res) => res.json({ user: req.adminUser }));

router.patch("/admin/me", async (req, res): Promise<void> => {
  const body = parse(z.object({
    name: z.string().trim().min(2).optional(),
    username: adminAccountSchema.shape.username.optional(),
    password: z.string().min(8).optional(),
  }), req.body, res);
  if (!body) return;
  const user = await db.transaction(async (tx) => {
    const [updated] = await tx.update(adminUsersTable).set({
      ...(body.name ? { name: body.name } : {}),
      ...(body.username ? { username: body.username.toLowerCase() } : {}),
      ...(body.password ? { passwordHash: hashPassword(body.password) } : {}),
      updatedAt: new Date(),
    }).where(eq(adminUsersTable.id, req.adminUser!.id)).returning();
    if (body.password) {
      await tx.delete(adminSessionsTable).where(eq(adminSessionsTable.adminId, req.adminUser!.id));
    }
    return updated;
  });
  await recordEvent(req, "update", "admin_profile", user.id);
  if (body.password) res.clearCookie(SESSION_COOKIE);
  res.json({ user: publicAdmin(user) });
});

router.get("/admin/site-settings", async (_req, res): Promise<void> => {
  res.json(await getSiteSettings());
});

router.patch("/admin/site-settings", requireOwner, async (req, res): Promise<void> => {
  const body = parse(siteSettingsSchema, req.body, res);
  if (!body) return;
  const [settings] = await db
    .insert(siteSettingsTable)
    .values({ id: 1, ...body })
    .onConflictDoUpdate({
      target: siteSettingsTable.id,
      set: { ...body, updatedAt: new Date() },
    })
    .returning();
  await recordEvent(req, "update", "site_settings", settings.id, "카카오톡 상담 채널 설정");
  res.json({
    kakaoChannelUrl: settings.kakaoChannelUrl,
    kakaoButtonLabel: settings.kakaoButtonLabel,
  });
});

router.get("/admin/dashboard", async (req, res): Promise<void> => {
  const staffFilter = isOwner(req) ? undefined : eq(membersTable.assignedStaffId, req.adminUser!.id);
  const databaseFilter = isOwner(req) ? undefined : eq(analysisDatabasesTable.assignedStaffId, req.adminUser!.id);
  const inquiryFilter = isOwner(req)
    ? eq(supportInquiriesTable.status, "new")
    : and(eq(supportInquiriesTable.status, "new"), eq(supportInquiriesTable.assignedStaffId, req.adminUser!.id));
  const [[members], [databases], [reviews], [inquiries], [revenue], staff, recentInquiries] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(membersTable).where(staffFilter),
    db.select({ count: sql<number>`count(*)::int` }).from(analysisDatabasesTable).where(databaseFilter),
    db.select({ count: sql<number>`count(*)::int` }).from(winningReviewsTable).where(eq(winningReviewsTable.status, "published")),
    db.select({ count: sql<number>`count(*)::int` }).from(supportInquiriesTable).where(inquiryFilter),
    db.select({ total: sql<number>`coalesce(sum(${membersTable.monthlyRevenue}), 0)::int` }).from(membersTable).where(staffFilter),
    db.select({ id: adminUsersTable.id, name: adminUsersTable.name, username: adminUsersTable.username, role: adminUsersTable.role, active: adminUsersTable.active }).from(adminUsersTable).orderBy(desc(adminUsersTable.createdAt)).limit(5),
    db.select().from(supportInquiriesTable)
      .where(isOwner(req) ? undefined : eq(supportInquiriesTable.assignedStaffId, req.adminUser!.id))
      .orderBy(desc(supportInquiriesTable.createdAt)).limit(5),
  ]);
  res.json({
    metrics: {
      members: members?.count ?? 0,
      databases: databases?.count ?? 0,
      reviews: reviews?.count ?? 0,
      newInquiries: inquiries?.count ?? 0,
      monthlyRevenue: revenue?.total ?? 0,
    },
    staff,
    recentInquiries,
  });
});

router.post("/admin/databases/import/preview", requireOwner, receiveExcel, async (req, res): Promise<void> => {
  if (!validateExcelFile(req.file, res)) return;
  try {
    const workbook = await readExcel(req.file!.buffer);
    const suggestedMapping: Partial<ImportMapping> = {
      phone: findSuggestedColumn(workbook.headers, "phone"),
      name: findSuggestedColumn(workbook.headers, "name"),
      amount: findSuggestedColumn(workbook.headers, "amount"),
      date: findSuggestedColumn(workbook.headers, "date"),
    };
    res.json({
      fileName: req.file!.originalname,
      sheetName: workbook.sheetName,
      totalRows: workbook.rows.length,
      headers: workbook.headers,
      suggestedMapping,
      sampleRows: workbook.rows.slice(0, 5).map((row) => workbook.headers.map((_, index) => cellText(row[index]))),
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "엑셀 파일을 읽을 수 없습니다." });
  }
});

router.post("/admin/databases/import", requireOwner, receiveExcel, async (req, res): Promise<void> => {
  if (!validateExcelFile(req.file, res)) return;
  const name = text(req.body?.name);
  if (!name) {
    res.status(400).json({ error: "분석 DB 이름을 입력해주세요." });
    return;
  }

  let mapping: ImportMapping;
  try {
    const rawMapping = typeof req.body?.mapping === "string" ? JSON.parse(req.body.mapping) : req.body?.mapping;
    const parsedMapping = z.object({
      phone: z.coerce.number().int().nonnegative(),
      name: z.coerce.number().int().nonnegative(),
      amount: z.coerce.number().int().nonnegative(),
      date: z.coerce.number().int().nonnegative(),
    }).safeParse(rawMapping);
    if (!parsedMapping.success) {
      res.status(400).json({ error: "전화번호·이름·금액·날짜 컬럼을 모두 선택해주세요." });
      return;
    }
    mapping = parsedMapping.data;
    if (new Set(Object.values(mapping)).size !== 4) {
      res.status(400).json({ error: "전화번호·이름·금액·날짜는 서로 다른 컬럼을 선택해주세요." });
      return;
    }
  } catch {
    res.status(400).json({ error: "컬럼 매핑 정보를 확인해주세요." });
    return;
  }

  try {
    const workbook = await readExcel(req.file!.buffer);
    const maxColumn = Math.max(mapping.phone, mapping.name, mapping.amount, mapping.date);
    if (maxColumn >= workbook.headers.length) {
      res.status(400).json({ error: "선택한 컬럼이 엑셀 파일에 없습니다." });
      return;
    }
    const { validRows, errors, duplicateCount: inFileDuplicateCount } = parseImportRows(workbook.rows, mapping);
    if (validRows.length === 0) {
      res.status(400).json({
        error: "등록할 수 있는 데이터가 없습니다. 컬럼 매핑과 행별 오류를 확인해주세요.",
        totalRows: workbook.rows.length,
        importedCount: 0,
        duplicateCount: inFileDuplicateCount,
        invalidCount: errors.length,
        errors: errors.slice(0, 100),
        errorCount: errors.length,
      });
      return;
    }

    const priceValue = text(req.body?.price);
    const price = priceValue ? parseImportAmount(priceValue) : 0;
    if (price == null) {
      res.status(400).json({ error: "기대 단가는 0 이상의 숫자로 입력해주세요." });
      return;
    }
    const drawNumberValue = text(req.body?.drawNumber);
    const drawNumber = drawNumberValue ? int(drawNumberValue) : null;
    if (drawNumber != null && drawNumber < 1) {
      res.status(400).json({ error: "관련 회차는 1 이상의 숫자로 입력해주세요." });
      return;
    }
    const databaseIdValue = text(req.body?.databaseId);
    const targetDatabaseId = databaseIdValue ? int(databaseIdValue) : null;
    if (targetDatabaseId != null && targetDatabaseId < 1) {
      res.status(400).json({ error: "업로드할 분석 DB를 선택해주세요." });
      return;
    }
    const notes = text(req.body?.notes);
    const result = await db.transaction(async (tx) => {
      const database = targetDatabaseId
        ? (await tx.select().from(analysisDatabasesTable).where(eq(analysisDatabasesTable.id, targetDatabaseId)).limit(1))[0]
        : (await tx.insert(analysisDatabasesTable).values({
            name,
            drawNumber,
            price,
            notes,
          }).returning())[0];
      if (!database) throw new Error("업로드할 분석 DB를 찾을 수 없습니다.");
      let importedCount = 0;
      for (let index = 0; index < validRows.length; index += IMPORT_BATCH_SIZE) {
        const chunk = validRows.slice(index, index + IMPORT_BATCH_SIZE).map((row) => ({
          databaseId: database.id,
          ...row,
        }));
        const inserted = await tx.insert(analysisDatabaseRowsTable)
          .values(chunk)
          .onConflictDoNothing()
          .returning({ id: analysisDatabaseRowsTable.id });
        importedCount += inserted.length;
      }
      return { database, importedCount };
    });
    const databaseDuplicateCount = validRows.length - result.importedCount;
    const duplicateCount = inFileDuplicateCount + databaseDuplicateCount;
    await recordEvent(
      req,
      "import",
      "database",
      result.database.id,
      `${result.importedCount}건 등록 · ${duplicateCount}건 중복 · ${errors.length}건 오류`,
    );
    res.status(201).json({
      database: result.database,
      fileName: req.file!.originalname,
      totalRows: workbook.rows.length,
      importedCount: result.importedCount,
      duplicateCount,
      invalidCount: errors.length,
      errors: errors.slice(0, 100),
      errorCount: errors.length,
    });
  } catch (error) {
    req.log.error({ err: error }, "Excel analysis database import failed");
    res.status(400).json({ error: error instanceof Error ? error.message : "엑셀 데이터를 등록할 수 없습니다." });
  }
});

router.get("/admin/members", async (req, res): Promise<void> => {
  const search = text(req.query.search);
  const status = text(req.query.status);
  const gradeId = int(req.query.gradeId, 0);
  const filters = [];
  if (search) filters.push(or(ilike(membersTable.username, `%${search}%`), ilike(membersTable.name, `%${search}%`), ilike(membersTable.phone, `%${search}%`), ilike(membersTable.email, `%${search}%`)));
  if (status && status !== "all") filters.push(eq(membersTable.status, status));
  if (gradeId) filters.push(eq(membersTable.gradeId, gradeId));
  if (!isOwner(req)) filters.push(eq(membersTable.assignedStaffId, req.adminUser!.id));
  const rows = await db
    .select({ member: membersTable, gradeName: memberGradesTable.name, staffName: adminUsersTable.name })
    .from(membersTable)
    .leftJoin(memberGradesTable, eq(membersTable.gradeId, memberGradesTable.id))
    .leftJoin(adminUsersTable, eq(membersTable.assignedStaffId, adminUsersTable.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(membersTable.createdAt));
  res.json(rows.map(({ member, gradeName, staffName }) => {
    const { passwordHash: _passwordHash, ...safeMember } = member;
    return { ...safeMember, gradeName, staffName };
  }));
});

router.post("/admin/members", async (req, res): Promise<void> => {
  const body = parse(z.object({
    username: memberUsernameSchema.optional(),
    name: z.string().trim().min(1),
    email: z.string().trim().email().or(z.literal("")).default(""),
    phone: z.string().trim().default(""),
    gradeId: z.number().int().nullable().optional(),
    status: z.enum(["pending", "active", "inactive", "rejected"]).default("active"),
    assignedStaffId: z.number().int().nullable().optional(),
    paymentAmount: z.number().int().nonnegative().default(0),
    monthlyRevenue: z.number().int().nonnegative().default(0),
    notes: z.string().default(""),
  }), req.body, res);
  if (!body) return;
  if (body.username) {
    const username = body.username.toLowerCase();
    const [existing] = await db.select({ id: membersTable.id }).from(membersTable).where(eq(membersTable.username, username)).limit(1);
    if (existing) {
      res.status(409).json({ error: "이미 사용 중인 아이디입니다." });
      return;
    }
    body.username = username;
  }
  if (!(await activeStaffExists(body.assignedStaffId))) {
    res.status(400).json({ error: "활성 상태인 담당 직원을 선택해주세요." });
    return;
  }
  if (!isOwner(req) && body.assignedStaffId && body.assignedStaffId !== req.adminUser!.id) {
    res.status(403).json({ error: "다른 직원에게 회원을 배정할 수 없습니다." });
    return;
  }
  const [member] = await db.insert(membersTable).values({
    ...body,
    assignedStaffId: isOwner(req) ? body.assignedStaffId : req.adminUser!.id,
  }).returning();
  await recordEvent(req, "create", "member", member.id, member.name);
  res.status(201).json(member);
});

router.patch("/admin/members/:id", async (req, res): Promise<void> => {
  const id = int(req.params.id);
  const body = parse(z.object({
    username: memberUsernameSchema.optional(),
    name: z.string().trim().min(1).optional(),
    email: z.string().trim().email().or(z.literal("")).optional(),
    phone: z.string().trim().optional(),
    gradeId: z.number().int().nullable().optional(),
    status: z.enum(["pending", "active", "inactive", "rejected"]).optional(),
    assignedStaffId: z.number().int().nullable().optional(),
    paymentAmount: z.number().int().nonnegative().optional(),
    monthlyRevenue: z.number().int().nonnegative().optional(),
    notes: z.string().optional(),
  }), req.body, res);
  if (!body) return;
  if (body.username) {
    const username = body.username.toLowerCase();
    const [existing] = await db.select({ id: membersTable.id }).from(membersTable)
      .where(and(eq(membersTable.username, username), sql`${membersTable.id} <> ${id}`)).limit(1);
    if (existing) {
      res.status(409).json({ error: "이미 사용 중인 아이디입니다." });
      return;
    }
    body.username = username;
  }
  if (!(await canAccessMember(req, id))) {
    res.status(403).json({ error: "이 회원을 수정할 권한이 없습니다." });
    return;
  }
  if (!(await activeStaffExists(body.assignedStaffId))) {
    res.status(400).json({ error: "활성 상태인 담당 직원을 선택해주세요." });
    return;
  }
  if (!isOwner(req) && body.assignedStaffId !== undefined) {
    res.status(403).json({ error: "담당자 변경은 최고 관리자만 할 수 있습니다." });
    return;
  }
  const [member] = await db.update(membersTable).set({ ...body, updatedAt: new Date() }).where(eq(membersTable.id, id)).returning();
  if (!member) {
    res.status(404).json({ error: "회원을 찾을 수 없습니다." });
    return;
  }
  await recordEvent(req, "update", "member", id);
  res.json(member);
});

router.delete("/admin/members/:id", async (req, res): Promise<void> => {
  const id = int(req.params.id);
  if (!(await canAccessMember(req, id))) {
    res.status(403).json({ error: "이 회원을 삭제할 권한이 없습니다." });
    return;
  }
  const [member] = await db.delete(membersTable).where(eq(membersTable.id, id)).returning({
    id: membersTable.id,
    name: membersTable.name,
    username: membersTable.username,
  });
  if (!member) {
    res.status(404).json({ error: "회원을 찾을 수 없습니다." });
    return;
  }
  await recordEvent(req, "delete", "member", id, member.username ? `${member.username} · ${member.name}` : member.name);
  res.json({ ok: true });
});

router.get("/admin/staff", async (req, res): Promise<void> => {
  if (!isOwner(req)) {
    const staff = await db.select({
      id: adminUsersTable.id,
      name: adminUsersTable.name,
      username: adminUsersTable.username,
      role: adminUsersTable.role,
      active: adminUsersTable.active,
      memberCount: sql<number>`(select count(*)::int from members where assigned_staff_id = ${adminUsersTable.id})`,
      inquiryCount: sql<number>`(select count(*)::int from support_inquiries where assigned_staff_id = ${adminUsersTable.id} and status not in ('resolved', 'closed'))`,
    }).from(adminUsersTable).where(eq(adminUsersTable.id, req.adminUser!.id));
    res.json(staff);
    return;
  }
  const staff = await db.select({
    id: adminUsersTable.id,
    name: adminUsersTable.name,
    username: adminUsersTable.username,
    email: adminUsersTable.email,
    role: adminUsersTable.role,
    active: adminUsersTable.active,
    createdAt: adminUsersTable.createdAt,
    memberCount: sql<number>`(select count(*)::int from members where assigned_staff_id = ${adminUsersTable.id})`,
    inquiryCount: sql<number>`(select count(*)::int from support_inquiries where assigned_staff_id = ${adminUsersTable.id} and status not in ('resolved', 'closed'))`,
  }).from(adminUsersTable).orderBy(desc(adminUsersTable.createdAt));
  res.json(staff);
});

router.post("/admin/staff", requireOwner, async (req, res): Promise<void> => {
  const body = parse(adminAccountSchema.extend({ role: z.enum(["owner", "staff"]).default("staff") }), req.body, res);
  if (!body) return;
  const [staff] = await db.insert(adminUsersTable).values({
    name: body.name,
    username: body.username.toLowerCase(),
    email: body.email.toLowerCase(),
    passwordHash: hashPassword(body.password),
    role: body.role,
  }).returning();
  await recordEvent(req, "create", "staff", staff.id, staff.email);
  res.status(201).json(publicAdmin(staff));
});

router.patch("/admin/staff/:id", requireOwner, async (req, res): Promise<void> => {
  const id = int(req.params.id);
  const body = parse(z.object({
    name: z.string().trim().min(2).optional(),
    username: adminAccountSchema.shape.username.optional(),
    role: z.enum(["owner", "staff"]).optional(),
    active: z.boolean().optional(),
    password: z.string().min(8).optional(),
  }), req.body, res);
  if (!body) return;
  if (id === req.adminUser!.id && (body.role !== undefined || body.active !== undefined)) {
    res.status(409).json({ error: "현재 로그인한 계정의 권한이나 활성 상태는 변경할 수 없습니다." });
    return;
  }
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(872634103)`);
    const [target] = await tx.select({ id: adminUsersTable.id, role: adminUsersTable.role, active: adminUsersTable.active })
      .from(adminUsersTable).where(eq(adminUsersTable.id, id)).limit(1);
    if (!target) return { status: "not_found" as const };
    const removesActiveOwner = target.role === "owner" && target.active && (body.role === "staff" || body.active === false);
    if (removesActiveOwner) {
      const [owners] = await tx.select({ count: sql<number>`count(*)::int` }).from(adminUsersTable)
        .where(and(eq(adminUsersTable.role, "owner"), eq(adminUsersTable.active, true)));
      if ((owners?.count ?? 0) <= 1) return { status: "last_owner" as const };
    }
    const [updated] = await tx.update(adminUsersTable).set({
      ...(body.name ? { name: body.name } : {}),
      ...(body.username ? { username: body.username.toLowerCase() } : {}),
      ...(body.role ? { role: body.role } : {}),
      ...(body.active !== undefined ? { active: body.active } : {}),
      ...(body.password ? { passwordHash: hashPassword(body.password) } : {}),
      updatedAt: new Date(),
    }).where(eq(adminUsersTable.id, id)).returning();
    if (body.password) {
      await tx.delete(adminSessionsTable).where(eq(adminSessionsTable.adminId, id));
    }
    return { status: "ok" as const, staff: updated };
  });
  if (result.status === "last_owner") {
    res.status(409).json({ error: "마지막 활성 최고 관리자는 강등하거나 비활성화할 수 없습니다." });
    return;
  }
  const staff = result.status === "ok" ? result.staff : null;
  if (!staff) {
    res.status(404).json({ error: "직원을 찾을 수 없습니다." });
    return;
  }
  await recordEvent(req, "update", "staff", id);
  if (body.password && id === req.adminUser!.id) res.clearCookie(SESSION_COOKIE);
  res.json(publicAdmin(staff));
});

router.get("/admin/grades", async (_req, res): Promise<void> => {
  res.json(await db.select().from(memberGradesTable).orderBy(desc(memberGradesTable.active), memberGradesTable.price));
});

router.post("/admin/grades", requireOwner, async (req, res): Promise<void> => {
  const body = parse(z.object({
    name: z.string().trim().min(1),
    slug: z.string().trim().min(1).regex(/^[a-z0-9-]+$/),
    price: z.number().int().nonnegative().default(0),
    color: z.string().default("#D8A84E"),
    description: z.string().default(""),
    benefits: z.array(z.string()).default([]),
  }), req.body, res);
  if (!body) return;
  const [grade] = await db.insert(memberGradesTable).values(body).returning();
  await recordEvent(req, "create", "grade", grade.id, grade.name);
  res.status(201).json(grade);
});

router.patch("/admin/grades/:id", requireOwner, async (req, res): Promise<void> => {
  const id = int(req.params.id);
  const body = parse(z.object({
    name: z.string().trim().min(1).optional(),
    price: z.number().int().nonnegative().optional(),
    color: z.string().optional(),
    description: z.string().optional(),
    benefits: z.array(z.string()).optional(),
    active: z.boolean().optional(),
  }), req.body, res);
  if (!body) return;
  const [grade] = await db.update(memberGradesTable).set({ ...body, updatedAt: new Date() }).where(eq(memberGradesTable.id, id)).returning();
  if (!grade) {
    res.status(404).json({ error: "등급을 찾을 수 없습니다." });
    return;
  }
  await recordEvent(req, "update", "grade", id);
  res.json(grade);
});

router.delete("/admin/grades/:id", requireOwner, async (req, res): Promise<void> => {
  const id = int(req.params.id);
  const [grade] = await db.update(memberGradesTable).set({ active: false, updatedAt: new Date() }).where(eq(memberGradesTable.id, id)).returning();
  if (!grade) {
    res.status(404).json({ error: "등급을 찾을 수 없습니다." });
    return;
  }
  await recordEvent(req, "archive", "grade", id);
  res.json({ ok: true });
});

router.get("/admin/databases", async (req, res): Promise<void> => {
  const rows = await db.select({
    database: analysisDatabasesTable,
    staffName: adminUsersTable.name,
    entryCount: sql<number>`(
      select count(*)::int
      from ${analysisDatabaseRowsTable}
      where ${analysisDatabaseRowsTable.databaseId} = ${analysisDatabasesTable.id}
    )`,
  })
    .from(analysisDatabasesTable)
    .leftJoin(adminUsersTable, eq(analysisDatabasesTable.assignedStaffId, adminUsersTable.id))
    .where(isOwner(req) ? undefined : eq(analysisDatabasesTable.assignedStaffId, req.adminUser!.id))
    .orderBy(desc(analysisDatabasesTable.createdAt));
  res.json(rows.map(({ database, staffName, entryCount }) => ({ ...database, staffName, entryCount })));
});

router.post("/admin/databases", requireOwner, async (req, res): Promise<void> => {
  const body = parse(z.object({
    name: z.string().trim().min(1),
    drawNumber: z.number().int().nullable().optional(),
    status: z.string().default("ready"),
    price: z.number().int().nonnegative().default(0),
    notes: z.string().default(""),
  }), req.body, res);
  if (!body) return;
  const [database] = await db.insert(analysisDatabasesTable).values(body).returning();
  await recordEvent(req, "create", "database", database.id, database.name);
  res.status(201).json(database);
});

router.post("/admin/databases/bulk-assign", requireOwner, async (req, res): Promise<void> => {
  const body = parse(z.object({ databaseIds: z.array(z.number().int()).min(1), staffId: z.number().int() }), req.body, res);
  if (!body) return;
  if (!(await activeStaffExists(body.staffId))) {
    res.status(400).json({ error: "활성 상태인 담당 직원을 선택해주세요." });
    return;
  }
  await db.transaction(async (tx) => {
    await tx.update(analysisDatabasesTable).set({ assignedStaffId: body.staffId, updatedAt: new Date() }).where(sql`${analysisDatabasesTable.id} in (${sql.join(body.databaseIds.map((id) => sql`${id}`), sql`, `)})`);
    await tx.insert(dbAssignmentsTable).values(body.databaseIds.map((databaseId) => ({ databaseId, staffId: body.staffId })));
  });
  await recordEvent(req, "assign", "database", undefined, `${body.databaseIds.length}개 DB`);
  res.json({ ok: true });
});

router.get("/admin/databases/:id/rows", async (req, res): Promise<void> => {
  const databaseId = int(req.params.id);
  if (!(await canAccessDatabase(req, databaseId))) {
    res.status(403).json({ error: "이 분석 DB를 조회할 권한이 없습니다." });
    return;
  }
  const page = Math.max(1, int(req.query.page, 1));
  const limit = Math.min(100, Math.max(1, int(req.query.limit, 50)));
  const search = text(req.query.search);
  const filters = [eq(analysisDatabaseRowsTable.databaseId, databaseId)];
  if (search) {
    filters.push(or(
      ilike(analysisDatabaseRowsTable.phone, `%${search}%`),
      ilike(analysisDatabaseRowsTable.memberName, `%${search}%`),
      sql`${analysisDatabaseRowsTable.recordedDate}::text ilike ${`%${search}%`}`,
    )!);
  }
  const where = and(...filters);
  const [[count], rows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(analysisDatabaseRowsTable).where(where),
    db.select().from(analysisDatabaseRowsTable)
      .where(where)
      .orderBy(desc(analysisDatabaseRowsTable.recordedDate), desc(analysisDatabaseRowsTable.id))
      .limit(limit)
      .offset((page - 1) * limit),
  ]);
  const total = count?.count ?? 0;
  res.json({
    rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

router.post("/admin/databases/:id/assign", requireOwner, async (req, res): Promise<void> => {
  const id = int(req.params.id);
  const body = parse(z.object({ staffId: z.number().int() }), req.body, res);
  if (!body) return;
  if (!(await activeStaffExists(body.staffId))) {
    res.status(400).json({ error: "활성 상태인 담당 직원을 선택해주세요." });
    return;
  }
  const database = await db.transaction(async (tx) => {
    const [updated] = await tx.update(analysisDatabasesTable).set({ assignedStaffId: body.staffId, updatedAt: new Date() }).where(eq(analysisDatabasesTable.id, id)).returning();
    if (updated) await tx.insert(dbAssignmentsTable).values({ databaseId: id, staffId: body.staffId });
    return updated;
  });
  if (!database) {
    res.status(404).json({ error: "분석 DB를 찾을 수 없습니다." });
    return;
  }
  await recordEvent(req, "assign", "database", id);
  res.json(database);
});

router.get("/admin/inquiries", async (req, res): Promise<void> => {
  const status = text(req.query.status);
  const filters = status && status !== "all" ? [eq(supportInquiriesTable.status, status)] : [];
  if (!isOwner(req)) filters.push(eq(supportInquiriesTable.assignedStaffId, req.adminUser!.id));
  const rows = await db.select({ inquiry: supportInquiriesTable, staffName: adminUsersTable.name })
    .from(supportInquiriesTable)
    .leftJoin(adminUsersTable, eq(supportInquiriesTable.assignedStaffId, adminUsersTable.id))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(supportInquiriesTable.priority), desc(supportInquiriesTable.createdAt));
  res.json(rows.map(({ inquiry, staffName }) => ({ ...inquiry, staffName })));
});

router.post("/admin/inquiries", async (req, res): Promise<void> => {
  const body = parse(z.object({
    name: z.string().trim().min(1, "문의자 이름을 입력해주세요.").max(80),
    contact: z.string().trim().min(1, "연락처를 입력해주세요.").max(120),
    category: z.string().trim().min(1, "문의 유형을 선택해주세요.").max(50),
    subject: z.string().trim().min(1, "제목을 입력해주세요.").max(200),
    message: z.string().trim().min(1, "문의 내용을 입력해주세요.").max(3000),
    priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  }), req.body, res);
  if (!body) return;
  const [inquiry] = await db.insert(supportInquiriesTable).values({
    ...body,
    status: "new",
    assignedStaffId: isOwner(req) ? null : req.adminUser!.id,
  }).returning();
  await recordEvent(req, "create", "inquiry", inquiry.id, "관리자 직접 등록");
  res.status(201).json(inquiry);
});

router.patch("/admin/inquiries/:id", async (req, res): Promise<void> => {
  const id = int(req.params.id);
  const body = parse(z.object({
    status: z.enum(["new", "in_progress", "resolved", "closed"]).optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    assignedStaffId: z.number().int().nullable().optional(),
  }), req.body, res);
  if (!body) return;
  if (!(await canAccessInquiry(req, id))) {
    res.status(403).json({ error: "이 문의를 수정할 권한이 없습니다." });
    return;
  }
  if (!isOwner(req) && body.assignedStaffId !== undefined) {
    res.status(403).json({ error: "담당자 변경은 최고 관리자만 할 수 있습니다." });
    return;
  }
  if (!(await activeStaffExists(body.assignedStaffId))) {
    res.status(400).json({ error: "활성 상태인 담당 직원을 선택해주세요." });
    return;
  }
  const [inquiry] = await db.update(supportInquiriesTable).set({
    ...body,
    ...(body.status === "resolved" || body.status === "closed" ? { lastContactedAt: new Date() } : {}),
    updatedAt: new Date(),
  }).where(eq(supportInquiriesTable.id, id)).returning();
  if (!inquiry) {
    res.status(404).json({ error: "문의 내역을 찾을 수 없습니다." });
    return;
  }
  await recordEvent(req, "update", "inquiry", id);
  res.json(inquiry);
});

router.get("/admin/inquiries/:id/notes", async (req, res): Promise<void> => {
  const id = int(req.params.id);
  if (!(await canAccessInquiry(req, id))) {
    res.status(403).json({ error: "이 문의를 조회할 권한이 없습니다." });
    return;
  }
  const notes = await db.select({ note: consultationNotesTable, staffName: adminUsersTable.name })
    .from(consultationNotesTable)
    .leftJoin(adminUsersTable, eq(consultationNotesTable.staffId, adminUsersTable.id))
    .where(eq(consultationNotesTable.inquiryId, id))
    .orderBy(desc(consultationNotesTable.createdAt));
  res.json(notes.map(({ note, staffName }) => ({ ...note, staffName })));
});

router.post("/admin/inquiries/:id/notes", async (req, res): Promise<void> => {
  const id = int(req.params.id);
  const body = parse(z.object({ content: z.string().trim().min(1) }), req.body, res);
  if (!body) return;
  if (!(await canAccessInquiry(req, id))) {
    res.status(403).json({ error: "이 문의에 메모를 작성할 권한이 없습니다." });
    return;
  }
  const note = await db.transaction(async (tx) => {
    const [inquiry] = await tx.select({ status: supportInquiriesTable.status }).from(supportInquiriesTable).where(eq(supportInquiriesTable.id, id)).limit(1);
    if (!inquiry) return null;
    const [created] = await tx.insert(consultationNotesTable).values({ inquiryId: id, staffId: req.adminUser!.id, content: body.content }).returning();
    await tx.update(supportInquiriesTable).set({
      ...(inquiry.status === "new" ? { status: "in_progress" } : {}),
      lastContactedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(supportInquiriesTable.id, id));
    return created;
  });
  if (!note) {
    res.status(404).json({ error: "문의 내역을 찾을 수 없습니다." });
    return;
  }
  await recordEvent(req, "create", "consultation_note", note.id);
  res.status(201).json(note);
});

router.get("/admin/reviews", requireOwner, async (_req, res): Promise<void> => {
  res.json(await db.select().from(winningReviewsTable).orderBy(desc(winningReviewsTable.createdAt)));
});

router.post("/admin/reviews", requireOwner, async (req, res): Promise<void> => {
  const body = parse(z.object({
    memberName: z.string().trim().min(1),
    drawNumber: z.number().int().positive(),
    rank: z.string().trim().min(1),
    amount: z.number().int().nonnegative().default(0),
    content: z.string().trim().min(1),
    status: z.string().default("pending"),
  }), req.body, res);
  if (!body) return;
  const [review] = await db.insert(winningReviewsTable).values(body).returning();
  await recordEvent(req, "create", "review", review.id);
  res.status(201).json(review);
});

router.patch("/admin/reviews/:id", requireOwner, async (req, res): Promise<void> => {
  const id = int(req.params.id);
  const body = parse(z.object({
    memberName: z.string().trim().min(1).max(80).optional(),
    drawNumber: z.number().int().min(1).max(9999).optional(),
    rank: z.enum(["1등", "2등", "3등", "4등", "5등"]).optional(),
    amount: z.number().int().min(0).max(100000000000).optional(),
    content: z.string().trim().min(1).optional(),
    status: z.enum(["pending", "published", "rejected"]).optional(),
  }), req.body, res);
  if (!body) return;
  const [review] = await db.update(winningReviewsTable).set({ ...body, updatedAt: new Date() }).where(eq(winningReviewsTable.id, id)).returning();
  if (!review) {
    res.status(404).json({ error: "후기를 찾을 수 없습니다." });
    return;
  }
  await recordEvent(req, "update", "review", id);
  res.json(review);
});

router.delete("/admin/reviews/:id", requireOwner, async (req, res): Promise<void> => {
  const id = int(req.params.id);
  const [review] = await db.delete(winningReviewsTable).where(eq(winningReviewsTable.id, id)).returning();
  if (!review) {
    res.status(404).json({ error: "후기를 찾을 수 없습니다." });
    return;
  }
  await recordEvent(req, "delete", "review", id, review.memberName);
  res.json({ ok: true });
});

router.get("/admin/community-posts", requireOwner, async (_req, res): Promise<void> => {
  res.json(await db.select().from(communityPostsTable).orderBy(desc(communityPostsTable.createdAt)));
});

router.post("/admin/community-posts", requireOwner, async (req, res): Promise<void> => {
  const body = parse(z.object({
    authorName: z.string().trim().min(1).max(80),
    category: z.string().trim().min(1).max(50),
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(5000),
    replyCount: z.number().int().nonnegative().default(0),
    status: z.enum(["pending", "published", "rejected"]).default("pending"),
  }), req.body, res);
  if (!body) return;
  const [post] = await db.insert(communityPostsTable).values(body).returning();
  await recordEvent(req, "create", "community_post", post.id, post.title);
  res.status(201).json(post);
});

router.patch("/admin/community-posts/:id", requireOwner, async (req, res): Promise<void> => {
  const id = int(req.params.id);
  const body = parse(z.object({
    authorName: z.string().trim().min(1).max(80).optional(),
    category: z.string().trim().min(1).max(50).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    content: z.string().trim().min(1).max(5000).optional(),
    replyCount: z.number().int().nonnegative().optional(),
    status: z.enum(["pending", "published", "rejected"]).optional(),
  }), req.body, res);
  if (!body) return;
  const [post] = await db.update(communityPostsTable).set({ ...body, updatedAt: new Date() }).where(eq(communityPostsTable.id, id)).returning();
  if (!post) {
    res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    return;
  }
  await recordEvent(req, "update", "community_post", id);
  res.json(post);
});

router.delete("/admin/community-posts/:id", requireOwner, async (req, res): Promise<void> => {
  const id = int(req.params.id);
  const [post] = await db.delete(communityPostsTable).where(eq(communityPostsTable.id, id)).returning();
  if (!post) {
    res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
    return;
  }
  await recordEvent(req, "delete", "community_post", id, post.title);
  res.json({ ok: true });
});

router.get("/admin/stats", requireOwner, async (_req, res): Promise<void> => {
  const [membersByStatus, membersByGrade, inquiriesByStatus, revenue] = await Promise.all([
    db.select({ status: membersTable.status, count: sql<number>`count(*)::int` }).from(membersTable).groupBy(membersTable.status),
    db.select({ grade: memberGradesTable.name, count: sql<number>`count(*)::int` }).from(membersTable).leftJoin(memberGradesTable, eq(membersTable.gradeId, memberGradesTable.id)).groupBy(memberGradesTable.name),
    db.select({ status: supportInquiriesTable.status, count: sql<number>`count(*)::int` }).from(supportInquiriesTable).groupBy(supportInquiriesTable.status),
    db.select({ total: sql<number>`coalesce(sum(${membersTable.monthlyRevenue}), 0)::int` }).from(membersTable),
  ]);
  res.json({ membersByStatus, membersByGrade, inquiriesByStatus, revenue: revenue[0]?.total ?? 0 });
});

router.post("/support", publicWriteRateLimit, async (req, res): Promise<void> => {
  const body = parse(z.object({
    name: z.string().trim().min(1).max(80),
    contact: z.string().trim().min(1).max(120),
    category: z.string().trim().min(1).max(50).default("일반 문의"),
    message: z.string().trim().min(1).max(3000),
  }), req.body, res);
  if (!body) return;
  const [inquiry] = await db.insert(supportInquiriesTable).values({
    ...body,
    subject: body.category,
  }).returning();
  res.status(201).json({ id: inquiry.id, message: "문의가 접수되었습니다." });
});

router.post("/member-signups", publicWriteRateLimit, async (req, res): Promise<void> => {
  const body = parse(z.object({
    username: memberUsernameSchema,
    password: memberPasswordSchema,
    name: z.string().trim().min(1, "이름을 입력해주세요.").max(80),
    phone: z.string().trim().min(8, "전화번호를 입력해주세요.").max(30),
  }), req.body, res);
  if (!body) return;
  const username = body.username.toLowerCase();
  const [existing] = await db.select({ id: membersTable.id }).from(membersTable).where(eq(membersTable.username, username)).limit(1);
  if (existing) {
    res.status(409).json({ error: "이미 사용 중인 아이디입니다." });
    return;
  }
  const [member] = await db.insert(membersTable).values({
    username,
    passwordHash: hashPassword(body.password),
    name: body.name,
    phone: body.phone,
    status: "pending",
    source: "website",
    notes: "공개 홈페이지 회원가입 신청",
  }).returning();
  res.status(201).json({ id: member.id, message: "회원가입 신청이 접수되었습니다." });
});

router.post("/member-auth/login", async (req, res): Promise<void> => {
  const body = parse(z.object({
    username: memberUsernameSchema,
    password: memberPasswordSchema,
  }), req.body, res);
  if (!body) return;
  const username = body.username.toLowerCase();
  const attemptKey = `member:${req.ip || "unknown"}:${username}`;
  const now = Date.now();
  const attempt = loginAttempts.get(attemptKey);
  if (attempt && attempt.resetAt > now && attempt.count >= 5) {
    res.status(429).json({ error: "로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요." });
    return;
  }
  const [member] = await db.select().from(membersTable).where(eq(membersTable.username, username)).limit(1);
  if (!member || !member.passwordHash || !verifyPassword(body.password, member.passwordHash)) {
    loginAttempts.set(attemptKey, {
      count: attempt && attempt.resetAt > now ? attempt.count + 1 : 1,
      resetAt: attempt && attempt.resetAt > now ? attempt.resetAt : now + 15 * 60 * 1000,
    });
    res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." });
    return;
  }
  if (member.status !== "active") {
    res.status(403).json({ error: member.status === "pending" ? "관리자 승인 대기 중입니다." : "현재 로그인할 수 없는 회원 계정입니다." });
    return;
  }
  loginAttempts.delete(attemptKey);
  res.json({ member: { id: member.id, username: member.username, name: member.name } });
});

router.get("/site-settings", async (_req, res): Promise<void> => {
  res.json(await getSiteSettings());
});

router.post("/reviews", publicWriteRateLimit, async (req, res): Promise<void> => {
  const body = parse(z.object({
    memberName: z.string().trim().min(1).max(80),
    drawNumber: z.number().int().min(1).max(9999),
    rank: z.enum(["1등", "2등", "3등", "4등", "5등"]),
    amount: z.number().int().min(0).max(100000000000).default(0),
    content: z.string().trim().min(1).max(5000),
  }), req.body, res);
  if (!body) return;
  const [review] = await db.insert(winningReviewsTable).values({ ...body, status: "pending" }).returning();
  res.status(201).json({ id: review.id, message: "후기가 접수되었습니다." });
});

router.get("/reviews", async (_req, res): Promise<void> => {
  const reviews = await db.select({
    id: winningReviewsTable.id,
    memberName: winningReviewsTable.memberName,
    drawNumber: winningReviewsTable.drawNumber,
    rank: winningReviewsTable.rank,
    amount: winningReviewsTable.amount,
    content: winningReviewsTable.content,
    createdAt: winningReviewsTable.createdAt,
    updatedAt: winningReviewsTable.updatedAt,
  }).from(winningReviewsTable)
    .where(eq(winningReviewsTable.status, "published"))
    .orderBy(desc(winningReviewsTable.createdAt))
    .limit(50);
  res.json(reviews);
});

router.post("/community-posts", publicWriteRateLimit, async (req, res): Promise<void> => {
  const body = parse(z.object({
    authorName: z.string().trim().min(1).max(80),
    category: z.string().trim().min(1).max(50),
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(5000),
  }), req.body, res);
  if (!body) return;
  const [post] = await db.insert(communityPostsTable).values({ ...body, status: "pending" }).returning();
  res.status(201).json({ id: post.id, message: "게시글이 접수되었습니다." });
});

router.get("/community-posts", async (_req, res): Promise<void> => {
  const posts = await db.select({
    id: communityPostsTable.id,
    authorName: communityPostsTable.authorName,
    category: communityPostsTable.category,
    title: communityPostsTable.title,
    content: communityPostsTable.content,
    replyCount: communityPostsTable.replyCount,
    createdAt: communityPostsTable.createdAt,
    updatedAt: communityPostsTable.updatedAt,
  }).from(communityPostsTable)
    .where(eq(communityPostsTable.status, "published"))
    .orderBy(desc(communityPostsTable.createdAt))
    .limit(50);
  res.json(posts);
});

export default router;