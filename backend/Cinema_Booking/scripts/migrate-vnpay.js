import { pool } from "../src/Infrastructure/Config/database.js";

// Explicit deployment step. No schema changes are performed by application startup.
try {
  const [[{ duplicates }]] = await pool.execute(
    "SELECT COUNT(*) AS duplicates FROM (SELECT booking_id FROM tickets GROUP BY booking_id HAVING COUNT(*) > 1) duplicate_bookings");
  if (Number(duplicates)) throw new Error("Existing duplicate tickets: review them manually before migration; no data is deleted.");
  const [columns] = await pool.execute("SHOW COLUMNS FROM payments");
  const existing = new Set(columns.map((column) => column.Field));
  const additions = [
    ["gateway_response_code", "VARCHAR(2) NULL"],
    ["gateway_transaction_status", "VARCHAR(2) NULL"],
    ["review_reason", "VARCHAR(64) NULL"],
    ["gateway_processed_at", "DATETIME NULL"],
  ].filter(([name]) => !existing.has(name));
  if (additions.length) await pool.query("ALTER TABLE payments " +
    additions.map(([name, type]) => "ADD COLUMN " + name + " " + type).join(", "));
  const [indexes] = await pool.execute("SHOW INDEX FROM tickets");
  const names = new Set(indexes.filter((index) => Number(index.Non_unique) === 0).map((index) => index.Key_name));
  const hasBookingUnique = [...names].some((name) => {
    const indexColumns = indexes.filter((index) => index.Key_name === name);
    return indexColumns.length === 1 && indexColumns[0].Column_name === "booking_id";
  });
  if (!hasBookingUnique) await pool.query("ALTER TABLE tickets ADD UNIQUE KEY uq_tickets_booking_id (booking_id)");
  console.log("VNPay migration complete.");
} catch (error) {
  console.error("VNPay migration failed:", error.message);
  process.exitCode = 1;
} finally { await pool.end(); }
