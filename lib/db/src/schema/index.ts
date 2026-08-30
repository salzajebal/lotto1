import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const adminUsersTable = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("staff"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const adminSessionsTable = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => adminUsersTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamps.createdAt,
});

export const memberGradesTable = pgTable("member_grades", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  price: integer("price").notNull().default(0),
  color: text("color").notNull().default("#D8A84E"),
  description: text("description").notNull().default(""),
  benefits: text("benefits").array().notNull().default([]),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const membersTable = pgTable("members", {
  id: serial("id").primaryKey(),
  username: text("username"),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  gradeId: integer("grade_id").references(() => memberGradesTable.id, { onDelete: "set null" }),
  status: text("status").notNull().default("active"),
  assignedStaffId: integer("assigned_staff_id").references(() => adminUsersTable.id, { onDelete: "set null" }),
  source: text("source").notNull().default("direct"),
  paymentAmount: integer("payment_amount").notNull().default(0),
  monthlyRevenue: integer("monthly_revenue").notNull().default(0),
  notes: text("notes").notNull().default(""),
  ...timestamps,
});

export const analysisDatabasesTable = pgTable("analysis_databases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  drawNumber: integer("draw_number"),
  status: text("status").notNull().default("ready"),
  memberCount: integer("member_count").notNull().default(0),
  price: integer("price").notNull().default(0),
  assignedStaffId: integer("assigned_staff_id").references(() => adminUsersTable.id, { onDelete: "set null" }),
  notes: text("notes").notNull().default(""),
  ...timestamps,
});

export const analysisDatabaseRowsTable = pgTable("analysis_database_rows", {
  id: serial("id").primaryKey(),
  databaseId: integer("database_id").notNull().references(() => analysisDatabasesTable.id, { onDelete: "cascade" }),
  phone: text("phone").notNull(),
  memberName: text("member_name").notNull(),
  amount: integer("amount").notNull().default(0),
  recordedDate: date("recorded_date", { mode: "string" }).notNull(),
  ...timestamps,
}, (table) => ({
  uniqueRow: uniqueIndex("analysis_database_rows_unique_row_idx")
    .on(table.databaseId, table.phone, table.memberName, table.amount, table.recordedDate),
  databaseDate: index("analysis_database_rows_database_date_idx")
    .on(table.databaseId, table.recordedDate),
  databasePhone: index("analysis_database_rows_database_phone_idx")
    .on(table.databaseId, table.phone),
}));

export const analysisDatabaseNotesTable = pgTable("analysis_database_notes", {
  id: serial("id").primaryKey(),
  databaseId: integer("database_id").notNull().references(() => analysisDatabasesTable.id, { onDelete: "cascade" }),
  staffId: integer("staff_id").notNull().references(() => adminUsersTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  ...timestamps,
}, (table) => ({
  databaseCreated: index("analysis_database_notes_database_created_idx")
    .on(table.databaseId, table.createdAt),
}));

export const dbAssignmentsTable = pgTable("db_assignments", {
  id: serial("id").primaryKey(),
  databaseId: integer("database_id").notNull().references(() => analysisDatabasesTable.id, { onDelete: "cascade" }),
  staffId: integer("staff_id").notNull().references(() => adminUsersTable.id, { onDelete: "cascade" }),
  memberId: integer("member_id").references(() => membersTable.id, { onDelete: "set null" }),
  status: text("status").notNull().default("assigned"),
  notes: text("notes").notNull().default(""),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
});

export const supportInquiriesTable = pgTable("support_inquiries", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => membersTable.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  category: text("category").notNull().default("일반 문의"),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  priority: text("priority").notNull().default("normal"),
  assignedStaffId: integer("assigned_staff_id").references(() => adminUsersTable.id, { onDelete: "set null" }),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
  ...timestamps,
});

export const consultationNotesTable = pgTable("consultation_notes", {
  id: serial("id").primaryKey(),
  inquiryId: integer("inquiry_id").references(() => supportInquiriesTable.id, { onDelete: "cascade" }),
  memberId: integer("member_id").references(() => membersTable.id, { onDelete: "set null" }),
  staffId: integer("staff_id").notNull().references(() => adminUsersTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  ...timestamps,
});

export const winningReviewsTable = pgTable("winning_reviews", {
  id: serial("id").primaryKey(),
  memberName: text("member_name").notNull(),
  drawNumber: integer("draw_number").notNull(),
  rank: text("rank").notNull(),
  amount: integer("amount").notNull().default(0),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"),
  ...timestamps,
});

export const communityPostsTable = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  authorName: text("author_name").notNull(),
  category: text("category").notNull().default("자유 토론"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  replyCount: integer("reply_count").notNull().default(0),
  status: text("status").notNull().default("pending"),
  ...timestamps,
});

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  kakaoChannelUrl: text("kakao_channel_url").notNull().default(""),
  kakaoButtonLabel: text("kakao_button_label").notNull().default("카카오톡 채널 상담"),
  ...timestamps,
});

export const auditEventsTable = pgTable("audit_events", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => adminUsersTable.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  detail: text("detail").notNull().default(""),
  createdAt: timestamps.createdAt,
});

export type AdminUser = typeof adminUsersTable.$inferSelect;
export type Member = typeof membersTable.$inferSelect;
export type MemberGrade = typeof memberGradesTable.$inferSelect;
export type AnalysisDatabase = typeof analysisDatabasesTable.$inferSelect;
export type AnalysisDatabaseRow = typeof analysisDatabaseRowsTable.$inferSelect;
export type AnalysisDatabaseNote = typeof analysisDatabaseNotesTable.$inferSelect;
export type SupportInquiry = typeof supportInquiriesTable.$inferSelect;
export type WinningReview = typeof winningReviewsTable.$inferSelect;
export type CommunityPost = typeof communityPostsTable.$inferSelect;
export type SiteSettings = typeof siteSettingsTable.$inferSelect;