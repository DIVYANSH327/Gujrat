import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users / Law Enforcement Officers Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('OFFICER'),
  unit: text('unit'),
  createdAt: timestamp('created_at').defaultNow(),
});

// E-Challan Records Table
export const challans = pgTable('challans', {
  id: serial('id').primaryKey(),
  challanNumber: text('challan_number').notNull().unique(),
  vehicleNumber: text('vehicle_number').notNull(),
  violationType: text('violation_type').notNull(),
  amount: integer('amount').notNull(),
  status: text('status').notNull().default('ISSUED'),
  location: text('location').notNull(),
  cameraId: text('camera_id'),
  issuedByUid: text('issued_by_uid'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Vision Intelligence & Security Alerts Table
export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  alertId: text('alert_id').notNull().unique(),
  cameraId: text('camera_id').notNull(),
  alertType: text('alert_type').notNull(),
  severity: text('severity').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('UNRESOLVED'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  challans: many(challans),
}));

export const challansRelations = relations(challans, ({ one }) => ({
  officer: one(users, {
    fields: [challans.issuedByUid],
    references: [users.uid],
  }),
}));
