// ================== Imports ==================
const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const multer = require("multer");
const db = require("./db"); // MySQL connection
require("dotenv").config();

const app = express();

// ================== Middleware ==================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // serve HTML, CSS, JS

// ================== Session ==================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret123",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 hour
  })
);

// ================== File Upload ==================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "student_photo") cb(null, "uploads/photos/");
    else cb(null, "uploads/certs/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ================== Routes ==================

// ------------------ Default Route ------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ------------------ Login ------------------
app.post("/login", async (req, res) => {
  const { roll_no, password } = req.body;

  try {
    const [rows] = await db.execute("SELECT * FROM users WHERE roll_no = ?", [roll_no]);
    if (rows.length === 0) return res.redirect("/?error=User not found");

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.redirect("/?error=Incorrect password");

    req.session.user = { id: user.id, roll_no: user.roll_no, is_admin: user.is_admin };

    if (user.is_admin === 1) return res.redirect("/admin-dashboard");
    else return res.redirect("/student-dashboard");
  } catch (err) {
    console.error("Login error:", err);
    return res.redirect("/?error=Server error");
  }
});

// ------------------ Student Dashboard ------------------
app.get("/student-dashboard", (req, res) => {
  if (!req.session.user || req.session.user.is_admin !== 0) {
    return res.redirect("/?error=Access denied");
  }
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// ------------------ Student Profile ------------------
app.get("/student/profile", async (req, res) => {
  if (!req.session.user || req.session.user.is_admin !== 0) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const [rows] = await db.execute(
      "SELECT id, full_name AS name, roll_no, email, phone FROM users WHERE id = ?",
      [req.session.user.id]
    );

    if (rows.length === 0) {
      return res.json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, student: rows[0] });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ------------------ Hostel Application Form ------------------
app.post(
  "/submit-application",
  upload.fields([{ name: "student_photo" }, { name: "certificate" }]),
  async (req, res) => {
    try {
      if (!req.session.user || req.session.user.is_admin !== 0) {
        return res.status(403).json({ success: false, message: "Login required" });
      }

      const data = req.body;

      // Uploaded files
      const photoPath = req.files["student_photo"]
        ? "/uploads/photos/" + req.files["student_photo"][0].filename
        : null;
      const certPath = req.files["certificate"]
        ? "/uploads/certs/" + req.files["certificate"][0].filename
        : null;

      // Generate reference number
      const refNumber = "REF" + Math.floor(100000 + Math.random() * 900000);

      // Insert into hostel_applications
      await db.execute(
        `INSERT INTO hostel_applications
        (ref_number, roll_no, full_name, father_name, profession, income, dob, birth_place, aadhaar, blood_group, food_preference,
         course, branch, year,
         perm_village, perm_pincode, perm_mandal, perm_district, perm_state,
         pres_village, pres_pincode, pres_mandal, pres_district, pres_state,
         nationality, other_country, category, gender, email, contact,
         student_photo, certificate, distance_km, application_type,
         school, school_period, college, college_period)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          refNumber,
          req.session.user.roll_no, // use session roll_no
          data.fullName || null,
          data.fatherName || null,
          data.profession || null,
          data.income || null,
          data.dob || null,
          data.birthPlace || null,
          data.aadhaar || null,
          data.bloodGroup || null,
          data.foodPreference || null,
          data.course || null,
          data.branch || null,
          data.year || null,
          data.permVillage || null,
          data.permPincode || null,
          data.permMandal || null,
          data.permDistrict || null,
          data.permState || null,
          data.presVillage || null,
          data.presPincode || null,
          data.presMandal || null,
          data.presDistrict || null,
          data.presState || null,
          data.nationality || null,
          data.otherCountry || null,
          data.category || null,
          data.gender || null,
          data.email || null,
          data.contact || null,
          photoPath,
          certPath,
          data.distance || null,
          data.applicationType || null,
          data.school || null,
          data.schoolPeriod || null,
          data.college || null,
          data.collegePeriod || null,
        ]
      );

      res.json({ success: true, message: "Application submitted successfully", ref_number: refNumber });
    } catch (err) {
      console.error("Application submit error:", err);
      res.json({ success: false, message: "Server error" });
    }
  }
);

// ------------------ Check if Student Already Applied ------------------
app.get("/api/has-application", async (req, res) => {
  if (!req.session.user || req.session.user.is_admin !== 0) {
    return res.json({ success: false, hasApplication: false });
  }

  try {
    const [rows] = await db.execute(
      `SELECT ref_number, application_date, payment_status, approval_status
       FROM hostel_applications
       WHERE roll_no = ?
       ORDER BY application_date DESC
       LIMIT 1`,
      [req.session.user.roll_no]
    );

    if (rows.length > 0) {
      return res.json({ success: true, hasApplication: true, application: rows[0] });
    } else {
      return res.json({ success: true, hasApplication: false });
    }
  } catch (err) {
    console.error("Application check error:", err);
    res.json({ success: false, hasApplication: false });
  }
});

// ------------------ Application Status ------------------
// ------------------ Application Status ------------------
app.get("/student/applications", async (req, res) => {
  if (!req.session.user || req.session.user.is_admin !== 0) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const [rows] = await db.execute(
      `SELECT ref_number, application_date, payment_status, approval_status 
       FROM hostel_applications 
       WHERE roll_no = ? 
       ORDER BY application_date DESC`,
      [req.session.user.roll_no]
    );

    res.json({ success: true, applications: rows });
  } catch (err) {
    console.error("Application status error:", err);
    res.json({ success: false, message: "Server error" });
  }
});


// ------------------ Complaints ------------------
app.post("/complaints", async (req, res) => {
  if (!req.session.user || req.session.user.is_admin !== 0) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const { complaint_type, description } = req.body || {};
    if (!complaint_type || !description) {
      return res.json({ success: false, message: "All fields are required" });
    }

    await db.execute(
      "INSERT INTO complaints (student_id, complaint_type, description) VALUES (?,?,?)",
      [req.session.user.id, complaint_type, description]
    );

    res.json({ success: true, message: "Complaint submitted successfully" });
  } catch (err) {
    console.error("Complaint error:", err);
    res.json({ success: false, message: "Server error" });
  }
});

app.get("/my-complaints", async (req, res) => {
  if (!req.session.user || req.session.user.is_admin !== 0) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const [rows] = await db.execute(
      "SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC",
      [req.session.user.id]
    );
    res.json({ success: true, complaints: rows });
  } catch (err) {
    console.error("Fetch complaints error:", err);
    res.json({ success: false, message: "Server error" });
  }
});

// ------------------ Admin Dashboard ------------------
app.get("/admin-dashboard", (req, res) => {
  if (!req.session.user || req.session.user.is_admin !== 1) {
    return res.redirect("/?error=Access denied");
  }
  res.sendFile(path.join(__dirname, "public", "admindashboard.html"));
});

// ------------------ Logout ------------------
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.redirect("/");
  });
});

// ================== Start Server ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
