import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "scheduler.db");

declare global {
  // eslint-disable-next-line no-var
  var __schedulerDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (!global.__schedulerDb) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
    global.__schedulerDb = db;
  }
  return global.__schedulerDb;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL,
      lng REAL,
      service_requested TEXT NOT NULL,
      service_id TEXT,
      total_price REAL,
      notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      scheduled_date TEXT,
      scheduled_time TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      max_appointments_per_day INTEGER NOT NULL DEFAULT 6,
      working_hours_start TEXT NOT NULL DEFAULT '09:00',
      working_hours_end TEXT NOT NULL DEFAULT '17:00',
      appointment_duration_minutes INTEGER NOT NULL DEFAULT 60,
      buffer_minutes INTEGER NOT NULL DEFAULT 15,
      unavailable_days TEXT NOT NULL DEFAULT '[]',
      working_days TEXT NOT NULL DEFAULT '[1,2,3,4,5,6]',
      cluster_radius_km REAL NOT NULL DEFAULT 25.0
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      french_name TEXT NOT NULL,
      english_name TEXT NOT NULL,
      price_type TEXT NOT NULL DEFAULT 'fixed',
      price REAL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      duration_label TEXT NOT NULL DEFAULT '1 h',
      description_fr TEXT DEFAULT '',
      description_en TEXT DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS business_info (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Ongles Natalia',
      address TEXT NOT NULL DEFAULT '6362 Alexis-Contant, Montréal, QC, H1M 1E9',
      phone TEXT NOT NULL DEFAULT '+1 514-652-6284',
      email TEXT NOT NULL DEFAULT 'onglesnatalia@gmail.com',
      instagram TEXT DEFAULT 'https://www.instagram.com/onglesnatalia',
      facebook TEXT DEFAULT '',
      gift_card_url TEXT DEFAULT '',
      hours TEXT NOT NULL DEFAULT '{}'
    );

    INSERT OR IGNORE INTO settings (id) VALUES (1);
    INSERT OR IGNORE INTO business_info (id, hours) VALUES (1, '{"1":"9h – 18h","2":"9h – 18h","3":"9h – 18h","4":"9h – 18h","5":"9h – 18h","6":"9h – 17h","0":"Fermé"}');
  `);

  // Safe migration: add columns to appointments if missing
  const apptCols = (db.prepare("PRAGMA table_info(appointments)").all() as {name:string}[]).map(c => c.name);
  if (!apptCols.includes("service_id")) db.exec("ALTER TABLE appointments ADD COLUMN service_id TEXT");
  if (!apptCols.includes("total_price")) db.exec("ALTER TABLE appointments ADD COLUMN total_price REAL");

  // Seed default admin
  const { c } = db.prepare("SELECT COUNT(*) as c FROM admin_users").get() as { c: number };
  if (c === 0) {
    const hash = bcrypt.hashSync("admin123", 10);
    db.prepare("INSERT INTO admin_users (id, email, password_hash) VALUES ('admin-default', 'admin@scheduler.local', ?)").run(hash);
  }

  // Seed services
  const { sc } = db.prepare("SELECT COUNT(*) as sc FROM services").get() as { sc: number };
  if (sc === 0) seedServices(db);
}

function genId() {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
}

function seedServices(db: Database.Database) {
  const insert = db.prepare(`
    INSERT INTO services (id, category, french_name, english_name, price_type, price,
      duration_minutes, duration_label, description_fr, description_en, active, sort_order)
    VALUES (@id, @category, @french_name, @english_name, @price_type, @price,
      @duration_minutes, @duration_label, @description_fr, @description_en, 1, @sort_order)
  `);

  const services = [
    // MANUCURE
    { id: "svc-man-01", category: "manicure", french_name: "Manucure Reg.", english_name: "Regular Manicure", price_type: "fixed", price: 60, duration_minutes: 60, duration_label: "1 h", description_fr: "", description_en: "", sort_order: 1 },
    { id: "svc-man-02", category: "manicure", french_name: "Manucure", english_name: "Manicure", price_type: "fixed", price: 115, duration_minutes: 90, duration_label: "1 h 30 min", description_fr: "", description_en: "", sort_order: 2 },
    { id: "svc-man-03", category: "manicure", french_name: "Manucure Gel Express", english_name: "Express Gel Manicure", price_type: "fixed", price: 55, duration_minutes: 30, duration_label: "30 min", description_fr: "", description_en: "", sort_order: 3 },
    { id: "svc-man-04", category: "manicure", french_name: "Manucure sans vernis", english_name: "Manicure without nail polish", price_type: "starting_at", price: 60, duration_minutes: 90, duration_label: "1 h 30 min+", description_fr: "", description_en: "", sort_order: 4 },
    { id: "svc-man-05", category: "manicure", french_name: "Recouvrement gel", english_name: "Gel Overlay", price_type: "fixed", price: 90, duration_minutes: 150, duration_label: "2 h 30 min", description_fr: "", description_en: "", sort_order: 5 },
    // PÉDICURE
    { id: "svc-ped-01", category: "pedicure", french_name: "Pédicure sèche", english_name: "Dry Pedicure", price_type: "starting_at", price: 95, duration_minutes: 90, duration_label: "1 h 30 min+", description_fr: "", description_en: "", sort_order: 1 },
    { id: "svc-ped-02", category: "pedicure", french_name: "Pédicure de luxe (avec eau)", english_name: "Luxury Pedicure (with water)", price_type: "starting_at", price: 100, duration_minutes: 120, duration_label: "2 h+", description_fr: "", description_en: "", sort_order: 2 },
    { id: "svc-ped-03", category: "pedicure", french_name: "Pédicure enfant (de luxe avec eau)", english_name: "Kids Pedicure (luxury with water)", price_type: "fixed", price: 40, duration_minutes: 60, duration_label: "1 h", description_fr: "", description_en: "", sort_order: 3 },
    // EXTENSIONS
    { id: "svc-ext-01", category: "extensions", french_name: "Extensions aux Dual Forms", english_name: "Extensions with Dual Forms", price_type: "starting_at", price: 110, duration_minutes: 180, duration_label: "3 h+", description_fr: "", description_en: "", sort_order: 1 },
    // NAIL ART
    { id: "svc-art-01", category: "nail_art", french_name: "Art ongulaire", english_name: "Nail Art", price_type: "variable", price: null, duration_minutes: 5, duration_label: "5 min+", description_fr: "Prix variable selon le design", description_en: "Variable price depending on design", sort_order: 1 },
    { id: "svc-art-02", category: "nail_art", french_name: "Chrome Powder / Poudre Chrome", english_name: "Chrome Powder", price_type: "fixed", price: 5, duration_minutes: 30, duration_label: "30 min", description_fr: "Ajout chrome sur n'importe quel soin", description_en: "Chrome add-on for any service", sort_order: 2 },
    // COURS
    { id: "svc-crs-01", category: "courses", french_name: "Cours de Nail Art", english_name: "Nail Art Course", price_type: "fixed", price: 90, duration_minutes: 150, duration_label: "2 h 30 min", description_fr: "", description_en: "", sort_order: 1 },
    { id: "svc-crs-02", category: "courses", french_name: "Cours Avancé Chrome", english_name: "Advanced Chrome Course", price_type: "fixed", price: 205, duration_minutes: 270, duration_label: "4 h 30 min", description_fr: "", description_en: "", sort_order: 2 },
    // RÉPARATIONS
    { id: "svc-rep-01", category: "repairs", french_name: "Retrait de produit non posé par ON!", english_name: "Removal — Product Not Applied By ON!", price_type: "fixed", price: 15, duration_minutes: 20, duration_label: "20 min", description_fr: "", description_en: "", sort_order: 1 },
    { id: "svc-rep-02", category: "repairs", french_name: "Réparation lors d'un soin", english_name: "Repair During Service", price_type: "variable", price: null, duration_minutes: 15, duration_label: "15 min", description_fr: "Prix variable selon le travail requis", description_en: "Variable price depending on work needed", sort_order: 2 },
  ];

  const run = db.transaction(() => {
    for (const s of services) insert.run(s);
  });
  run();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type Service = {
  id: string;
  category: string;
  french_name: string;
  english_name: string;
  price_type: "fixed" | "starting_at" | "variable";
  price: number | null;
  duration_minutes: number;
  duration_label: string;
  description_fr: string;
  description_en: string;
  active: number;
  sort_order: number;
  created_at: string;
};

export type BusinessInfo = {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  gift_card_url: string;
  hours: string; // JSON: { "0":"Fermé", "1":"9h–18h", ... }
};

export type Settings = {
  id: number;
  max_appointments_per_day: number;
  working_hours_start: string;
  working_hours_end: string;
  appointment_duration_minutes: number;
  buffer_minutes: number;
  unavailable_days: string;
  working_days: string;
  cluster_radius_km: number;
};

export type Appointment = {
  id: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  lat: number | null;
  lng: number | null;
  service_requested: string;
  service_id: string | null;
  total_price: number | null;
  notes: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  scheduled_date: string | null;
  scheduled_time: string | null;
  created_at: string;
  updated_at: string;
};

// ── Service helpers ───────────────────────────────────────────────────────────

export function getAllServices(): Service[] {
  return getDb().prepare("SELECT * FROM services ORDER BY category, sort_order, french_name").all() as Service[];
}

export function getActiveServices(): Service[] {
  return getDb().prepare("SELECT * FROM services WHERE active = 1 ORDER BY category, sort_order").all() as Service[];
}

export function getServiceById(id: string): Service | undefined {
  return getDb().prepare("SELECT * FROM services WHERE id = ?").get(id) as Service | undefined;
}

export function createService(data: Omit<Service, "id" | "created_at">): Service {
  const id = genId();
  getDb().prepare(`
    INSERT INTO services (id, category, french_name, english_name, price_type, price,
      duration_minutes, duration_label, description_fr, description_en, active, sort_order)
    VALUES (@id, @category, @french_name, @english_name, @price_type, @price,
      @duration_minutes, @duration_label, @description_fr, @description_en, @active, @sort_order)
  `).run({ id, ...data });
  return getServiceById(id)!;
}

export function updateService(id: string, data: Partial<Service>): Service | undefined {
  const allowed = ["category","french_name","english_name","price_type","price",
    "duration_minutes","duration_label","description_fr","description_en","active","sort_order"];
  const fields = Object.entries(data)
    .filter(([k]) => allowed.includes(k))
    .map(([k]) => `${k} = @${k}`)
    .join(", ");
  if (!fields) return getServiceById(id);
  getDb().prepare(`UPDATE services SET ${fields} WHERE id = @id`).run({ ...data, id });
  return getServiceById(id);
}

export function deleteService(id: string) {
  getDb().prepare("DELETE FROM services WHERE id = ?").run(id);
}

// ── Business info helpers ─────────────────────────────────────────────────────

export function getBusinessInfo(): BusinessInfo {
  return getDb().prepare("SELECT * FROM business_info WHERE id = 1").get() as BusinessInfo;
}

export function updateBusinessInfo(data: Partial<BusinessInfo>): BusinessInfo {
  const allowed = ["name","address","phone","email","instagram","facebook","gift_card_url","hours"];
  const fields = Object.entries(data)
    .filter(([k]) => allowed.includes(k))
    .map(([k]) => `${k} = @${k}`)
    .join(", ");
  if (fields) getDb().prepare(`UPDATE business_info SET ${fields} WHERE id = 1`).run(data);
  return getBusinessInfo();
}

// ── Settings helpers ──────────────────────────────────────────────────────────

export function getSettings(): Settings {
  return getDb().prepare("SELECT * FROM settings WHERE id = 1").get() as Settings;
}

export function updateSettings(s: Partial<Settings>) {
  const sets = Object.entries(s).filter(([k]) => k !== "id").map(([k]) => `${k} = @${k}`).join(", ");
  if (!sets) return;
  getDb().prepare(`UPDATE settings SET ${sets} WHERE id = 1`).run(s);
}

// ── Appointment helpers ───────────────────────────────────────────────────────

export function getAllAppointments(): Appointment[] {
  return getDb().prepare("SELECT * FROM appointments ORDER BY scheduled_date ASC, scheduled_time ASC, created_at DESC").all() as Appointment[];
}

export function getAppointmentById(id: string): Appointment | undefined {
  return getDb().prepare("SELECT * FROM appointments WHERE id = ?").get(id) as Appointment | undefined;
}

export function getAppointmentsForDate(date: string): Appointment[] {
  return getDb().prepare(
    "SELECT * FROM appointments WHERE scheduled_date = ? AND status NOT IN ('cancelled') ORDER BY scheduled_time ASC"
  ).all(date) as Appointment[];
}

export function createAppointment(data: Omit<Appointment, "id" | "created_at" | "updated_at">): Appointment {
  const id = genId();
  getDb().prepare(`
    INSERT INTO appointments
    (id, customer_name, phone, email, address, lat, lng, service_requested,
     service_id, total_price, notes, status, scheduled_date, scheduled_time)
    VALUES
    (@id, @customer_name, @phone, @email, @address, @lat, @lng, @service_requested,
     @service_id, @total_price, @notes, @status, @scheduled_date, @scheduled_time)
  `).run({ id, ...data });
  return getAppointmentById(id)!;
}

export function updateAppointment(id: string, data: Partial<Appointment>): Appointment | undefined {
  const allowed = ["customer_name","phone","email","address","lat","lng","service_requested",
    "service_id","total_price","notes","status","scheduled_date","scheduled_time"];
  const fields = Object.entries(data).filter(([k]) => allowed.includes(k)).map(([k]) => `${k} = @${k}`).join(", ");
  if (!fields) return getAppointmentById(id);
  getDb().prepare(`UPDATE appointments SET ${fields}, updated_at = datetime('now') WHERE id = @id`).run({ ...data, id });
  return getAppointmentById(id);
}

export function deleteAppointment(id: string) {
  getDb().prepare("DELETE FROM appointments WHERE id = ?").run(id);
}
