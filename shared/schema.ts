import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("clinician"), // clinician, admin, patient
  name: text("name").notNull(),
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mrn: text("mrn").notNull().unique(), // Medical Record Number
  name: text("name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"),
  contactInfo: jsonb("contact_info").$type<{
    phone?: string;
    email?: string;
    address?: string;
  }>(),
  fhirId: text("fhir_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clinicalSummaries = pgTable("clinical_summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id),
  userId: varchar("user_id").references(() => users.id),
  type: text("type").notNull(), // discharge, progress, handoff
  content: text("content").notNull(),
  aiGenerated: boolean("ai_generated").default(true),
  groqModel: text("groq_model"),
  generationTime: integer("generation_time"), // milliseconds
  status: text("status").default("draft"), // draft, finalized
  fhirResourceId: text("fhir_resource_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const hospitalMetrics = pgTable("hospital_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").defaultNow(),
  activePatients: integer("active_patients").default(0),
  bedOccupancy: decimal("bed_occupancy", { precision: 5, scale: 2 }),
  criticalAlerts: integer("critical_alerts").default(0),
  aiSummariesGenerated: integer("ai_summaries_generated").default(0),
  departmentLoads: jsonb("department_loads").$type<{
    emergency: number;
    icu: number;
    surgery: number;
  }>(),
});

export const riskAlerts = pgTable("risk_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").references(() => patients.id),
  type: text("type").notNull(), // readmission, medication, critical
  severity: text("severity").notNull(), // low, medium, high, critical
  message: text("message").notNull(),
  riskScore: decimal("risk_score", { precision: 5, scale: 2 }),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  details: jsonb("details"),
  blockchainHash: text("blockchain_hash"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClinicalSummarySchema = createInsertSchema(clinicalSummaries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRiskAlertSchema = createInsertSchema(riskAlerts).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type ClinicalSummary = typeof clinicalSummaries.$inferSelect;
export type InsertClinicalSummary = z.infer<typeof insertClinicalSummarySchema>;
export type HospitalMetrics = typeof hospitalMetrics.$inferSelect;
export type RiskAlert = typeof riskAlerts.$inferSelect;
export type InsertRiskAlert = z.infer<typeof insertRiskAlertSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
