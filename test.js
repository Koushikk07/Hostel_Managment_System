const db = require("./db");

async function testConnection() {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    console.log("✅ Database connected! Test result:", rows[0].result);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
}

testConnection();
