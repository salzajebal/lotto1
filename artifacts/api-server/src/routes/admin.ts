import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import cookieParser from "cookie-parser";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod/v4";
import {
  adminSessionsTable,
  adminUsersTable,
  analysisDatabasesTable,
  auditEventsTable,
  consultationNotesTable,
  db,
  dbAssignmentsTable,
  memberGradesTable,
  membersTable,
  supportInquiriesTable,
  winningReviewsTable,
} from "@workspace/db";

type SessionUser = {
  id: number;
  name: string;
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
      email: adminUsersTable.email,
      role: adminUsersTable.role,
      active: adminUsersTable.active,
    })
    .from(adminSessionsTable)
    .innerJoin(adminUsersTable, eq(adminSessionsTable.adminId, adminUsersTable.id))
    .where(eq(adminSessionsTable.tokenHash, hash(token)))
    .limit(1);
  if (!session || !session.active || session.expiresAt < new Date()) return null;
  return { id: session.adminId, name: session.name, email: session.email, role: session.role };
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

router.use(cookieParser());

const adminAccountSchema = z.object({
  name: z.string().trim().min(2, "이름은 2자 이상 입력해주세요."),
  email: z.string().trim().email("올바른 이메일을 입력해주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상 입력해주세요."),
});

router.get("/admin/auth/status", async (req, res): Promise<void> => {
  const [count] = await db.select({ count: sql<number>`count(*)::int` }).from(adminUsersTable);
  const user = await getUserFromRequest(req);
  res.json({ authenticated: Boolean(user), user, needsBootstrap: (count?.count ?? 0) === 0 });
});

router.post("/admin/auth/bootstrap", async (req, res): Promise<void> => {
  const body = parse(adminAccountSchema, req.body, res);
  if (!body) return;
  const token = randomBytes(32).toString("hex");
  const user = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(872634102)`);
    const [count] = await tx.select({ count: sql<number>`count(*)::int` }).from(adminUsersTable);
    if ((count?.count ?? 0) > 0) return null;
    const [created] = await tx
      .insert(adminUsersTable)
      .values({ name: body.name, email: body.email.toLowerCase(), passwordHash: hashPassword(body.password), role: "owner" })
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
    ]);
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
  const body = parse(adminAccountSchema.pick({ email: true, password: true }), req.body, res);
  if (!body) return;
  const email = body.email.toLowerCase();
  const attemptKey = `${req.ip || "unknown"}:${email}`;
  const now = Date.now();
  const attempt = loginAttempts.get(attemptKey);
  if (attempt && attempt.resetAt > now && attempt.count >= 5) {
    res.status(429).json({ error: "로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요." });
    return;
  }
  const [user] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.email, email)).limit(1);
  if (!user || !user.active || !verifyPassword(body.password, user.passwordHash)) {
    loginAttempts.set(attemptKey, {
      count: attempt && attempt.resetAt > now ? attempt.count + 1 : 1,
      resetAt: attempt && attempt.resetAt > now ? attempt.resetAt : now + 15 * 60 * 1000,
    });
    res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." });
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
    password: z.string().min(8).optional(),
  }), req.body, res);
  if (!body) return;
  const [user] = await db.update(adminUsersTable).set({
    ...(body.name ? { name: body.name } : {}),
    ...(body.password ? { passwordHash: hashPassword(body.password) } : {}),
    updatedAt: new Date(),
  }).where(eq(adminUsersTable.id, req.adminUser!.id)).returning();
  await recordEvent(req, "update", "admin_profile", user.id);
  res.json({ user: publicAdmin(user) });
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
    db.select({ id: adminUsersTable.id, name: adminUsersTable.name, role: adminUsersTable.role, active: adminUsersTable.active }).from(adminUsersTable).orderBy(desc(adminUsersTable.createdAt)).limit(5),
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

router.get("/admin/members", async (req, res): Promise<void> => {
  const search = text(req.query.search);
  const status = text(req.query.status);
  const gradeId = int(req.query.gradeId, 0);
  const filters = [];
  if (search) filters.push(or(ilike(membersTable.name, `%${search}%`), ilike(membersTable.phone, `%${search}%`), ilike(membersTable.email, `%${search}%`)));
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
  res.json(rows.map(({ member, gradeName, staffName }) => ({ ...member, gradeName, staffName })));
});

router.post("/admin/members", async (req, res): Promise<void> => {
  const body = parse(z.object({
    name: z.string().trim().min(1),
    email: z.string().trim().email().or(z.literal("")).default(""),
    phone: z.string().trim().default(""),
    gradeId: z.number().int().nullable().optional(),
    status: z.string().default("active"),
    assignedStaffId: z.number().int().nullable().optional(),
    monthlyRevenue: z.number().int().nonnegative().default(0),
    notes: z.string().default(""),
  }), req.body, res);
  if (!body) return;
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
    name: z.string().trim().min(1).optional(),
    email: z.string().trim().email().or(z.literal("")).optional(),
    phone: z.string().trim().optional(),
    gradeId: z.number().int().nullable().optional(),
    status: z.string().optional(),
    assignedStaffId: z.number().int().nullable().optional(),
    monthlyRevenue: z.number().int().nonnegative().optional(),
    notes: z.string().optional(),
  }), req.body, res);
  if (!body) return;
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

router.get("/admin/staff", async (req, res): Promise<void> => {
  if (!isOwner(req)) {
    const staff = await db.select({
      id: adminUsersTable.id,
      name: adminUsersTable.name,
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
      ...(body.role ? { role: body.role } : {}),
      ...(body.active !== undefined ? { active: body.active } : {}),
      ...(body.password ? { passwordHash: hashPassword(body.password) } : {}),
      updatedAt: new Date(),
    }).where(eq(adminUsersTable.id, id)).returning();
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
  const rows = await db.select({ database: analysisDatabasesTable, staffName: adminUsersTable.name })
    .from(analysisDatabasesTable)
    .leftJoin(adminUsersTable, eq(analysisDatabasesTable.assignedStaffId, adminUsersTable.id))
    .where(isOwner(req) ? undefined : eq(analysisDatabasesTable.assignedStaffId, req.adminUser!.id))
    .orderBy(desc(analysisDatabasesTable.createdAt));
  res.json(rows.map(({ database, staffName }) => ({ ...database, staffName })));
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

router.patch("/admin/inquiries/:id", async (req, res): Promise<void> => {
  const id = int(req.params.id);
  const body = parse(z.object({
    status: z.string().optional(),
    priority: z.string().optional(),
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

router.get("/admin/reviews", async (_req, res): Promise<void> => {
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
    status: z.string().optional(),
    content: z.string().trim().min(1).optional(),
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

export default router;