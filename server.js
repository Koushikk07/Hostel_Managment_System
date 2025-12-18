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
    name: "connect.sid",
    secret: process.env.SESSION_SECRET || "secret123",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 15*60*1000 ,httpOnly: true} // 15mins.
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

// ================== Middleware Functions ==================

// Admin authentication middleware
function checkAdmin(req, res, next) {
  if (req.session.user && req.session.user.is_admin === 1) return next();
  return res.redirect("/?error=Access denied");
}

// Student authentication middleware
function checkStudent(req, res, next) {
  if (req.session.user && req.session.user.is_admin === 0) return next();
  return res.redirect("/?error=Access denied");
}

// NEW: Prevent browser caching of protected pages (Fixes back button after logout)
const setNoCache = (req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
};
function isLoggedIn(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// ================== Routes ==================

// ------------------ Default Route ------------------
// Serve static files
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ================== Keep Alive Endpoint ==================
// This is hit by the client on user activity to reset the session timer.
app.post("/keep-alive", (req, res) => {
    // Check if the user is logged in
    if (req.session.user) {
        // The session middleware automatically updates the session cookie's maxAge on response.
        return res.status(200).json({ success: true, message: "Session kept alive." });
    }
    // If not logged in, respond with unauthorized
    return res.status(401).json({ success: false, message: "Unauthorized." });
});
// MODIFIED: Added setNoCache middleware to prevent caching of the logout page itself.
// ================== Logout (SECURE & CACHE-BUSTING FIX) ==================

// Assuming the default session cookie name is 'connect.sid'
// If you customized the name in your session setup, change this constant.
const SESSION_COOKIE_NAME = "connect.sid";

app.get("/logout", (req, res) => {
  // 1. Destroy the session on the server
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
      // Log the error but continue to log the user out
    }

    // 2. Clear the cookie on the client side
    // This is the CRITICAL step to prevent the browser from thinking it still has a key.
    res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });

    // 3. Set No-Cache headers on the response (redundant but safe, as setNoCache should handle it)
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // 4. Immediately redirect the user to the login page (root URL in this case).
    // This forces the browser out of the protected application domain.
    res.redirect("/");
  });
});

// ------------------ Login ------------------
// server.js

// Constants for the Security Feature
const MAX_FAILED_ATTEMPTS = 3;
const ACCOUNT_LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes lock

app.post("/login", async (req, res) => {
  const { roll_no, password } = req.body;
  
  try {
    const [rows] = await db.execute("SELECT * FROM users WHERE roll_no = ?", [
      roll_no,
    ]);
    const user = rows[0];
    
    // 1. Initial Check (MUST be safe against null/undefined)
    // Checks if the user exists AND if the password hash field is NOT NULL.
    if (!user || !user.password) { // <-- Uses user.password as per your working snippet
      return res.redirect("/?error=Invalid Roll Number or Password");
    }

    // --- SECURITY FEATURE LOGIC START ---
    
    // Check if the account is currently locked
    const now = Date.now();
    const lastAttemptTime = user.last_attempt_time ? new Date(user.last_attempt_time).getTime() : 0;
    const isLocked = user.login_attempts >= MAX_FAILED_ATTEMPTS && (now - lastAttemptTime) < ACCOUNT_LOCK_DURATION_MS;

    if (isLocked) {
        return res.redirect("/?error=Account locked. Try again in 15 minutes.");
    }
    
    // 2. Compare Password
    const isMatch = await bcrypt.compare(password, user.password); // <-- This is the line that will now work safely

    if (isMatch) {
      // SUCCESS: Reset attempts and log user in
      if (user.login_attempts > 0) {
        await db.execute(
          "UPDATE users SET login_attempts = 0, last_attempt_time = NULL WHERE roll_no = ?",
          [roll_no]
        );
      }
      
      req.session.user = {
        id: user.id,
        roll_no: user.roll_no,
        is_admin: user.is_admin,
        name: user.name, // Assuming 'name' field exists
      };
      
      // Redirect to the appropriate dashboard
      if (user.is_admin === 1) return res.redirect("/admin/admin-dashboard");
      else return res.redirect("/student-dashboard");
      
    } else {
      // FAILURE: Increment login attempts
      const newAttempts = user.login_attempts + 1;
      await db.execute(
        "UPDATE users SET login_attempts = ?, last_attempt_time = NOW() WHERE roll_no = ?",
        [newAttempts, roll_no]
      );

      // Check for Security Alert (Threshold Reached)
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        
        // Log the notification for Admin to see
        await db.execute(
          "INSERT INTO notifications (title, message, recipient_type, alert_type) VALUES (?, ?, 'Admin', 'Security')",
          [
            "SECURITY ALERT: Failed Login Attempts",
            `User ${roll_no} has reached ${newAttempts} failed login attempts and is now locked for 15 minutes.`,
          ]
        );
        return res.redirect("/?error=Incorrect password. Account is now locked for 15 minutes.");
      }
      
      // Notify user of remaining attempts
      const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
      let errorMsg = `Incorrect password. ${remaining} attempts remaining.`;
      
      return res.redirect(`/?error=${errorMsg}`);
    }
    // --- SECURITY FEATURE LOGIC END ---
    
  } catch (err) {
    console.error("Login error:", err);
    // Provide a generic, safe server error message
    return res.redirect("/?error=Server error during login process");
  }
});

// ------------------ Register ------------------
app.post("/register", async (req, res) => {
  try {
    const { full_name, roll_no, email, phone, password } = req.body;

    if (!full_name || !roll_no || !email || !phone || !password) {
      return res.json({ success: false, message: "All fields are required" });
    }

    // Only numbers allowed in roll_no
    if (!/^[0-9]+$/.test(roll_no)) {
      return res.json({
        success: false,
        message: "Roll number must contain only numbers",
      });
    }

    // Check if user already exists
    const [exists] = await db.execute(
      "SELECT id FROM users WHERE roll_no = ?",
      [roll_no]
    );
    if (exists.length > 0) {
      return res.json({
        success: false,
        message: "User with this roll number already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new student (is_admin = 0)
    await db.execute(
      "INSERT INTO users (full_name, roll_no, email, phone, password, is_admin) VALUES (?, ?, ?, ?, ?, 0)",
      [full_name, roll_no, email, phone, hashedPassword]
    );

    return res.json({ success: true, message: "Registration successful" });
  } catch (err) {
    console.error("Registration error:", err);
    return res.json({ success: false, message: "Server error" });
  }
});



const nodemailer = require("nodemailer");
const twilio = require("twilio");

// Store OTPs in memory
const otpStore = new Map(); // { email: { otp, data, expires } }

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Twilio setup
const smsClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

// ================= Send OTP =================
app.post("/register/request-otp", async (req, res) => {
  try {
    const { full_name, roll_no, email, phone, password } = req.body;

    if (!full_name || !roll_no || !email || !phone || !password) {
      return res.json({ success: false, message: "All fields are required" });
    }

    // Normalize phone number
    const toNumber = phone.startsWith("+91")
      ? phone
      : "+91" + phone.replace(/\D/g, "");

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP with 5 min expiration
    otpStore.set(email, {
      otp,
      data: req.body,
      expires: Date.now() + 5 * 60 * 1000,
    });

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Hostel Registration",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    });

    // Send SMS
    const message = await smsClient.messages.create({
      body: `Your Hostel Registration OTP: ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: toNumber,
    });

    console.log("SMS sent SID:", message.sid);

    res.json({ success: true, message: "OTP sent via email and SMS" });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.json({ success: false, message: "Failed to send OTP" });
  }
});

// ================= Verify OTP =================
app.post("/register/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const entry = otpStore.get(email);

    if (!entry)
      return res.json({ success: false, message: "No OTP request found" });
    if (entry.expires < Date.now())
      return res.json({ success: false, message: "OTP expired" });
    if (entry.otp !== otp)
      return res.json({ success: false, message: "Invalid OTP" });

    const { full_name, roll_no, phone, password } = entry.data;
    const hashedPass = await bcrypt.hash(password, 10);

    // Save user to DB
    await db.execute(
      "INSERT INTO users (full_name, roll_no, email, phone, password, is_admin) VALUES (?, ?, ?, ?, ?, 0)",
      [full_name, roll_no, email, phone, hashedPass]
    );

    otpStore.delete(email);

    res.json({ success: true, message: "Registration successful" });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.json({ success: false, message: "Server error" });
  }
});
// ================== PASSWORD RESET ROUTE ==================
app.post("/forgot-password", async (req, res) => {
  const { roll_no, new_password, confirm_password } = req.body;

  // 1. Basic Validation
  if (!roll_no || !new_password || !confirm_password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  if (new_password !== confirm_password) {
    return res
      .status(400)
      .json({ success: false, message: "New passwords do not match." });
  }

  // 2. Server-side Logic
  try {
    // Check if the user (roll_no) exists in the database
    const [users] = await db.query("SELECT id FROM users WHERE roll_no = ?", [
      roll_no,
    ]);

    if (users.length === 0) {
      console.log(`PASS-RESET FAIL: Roll number ${roll_no} not found.`);
      return res
        .status(404)
        .json({ success: false, message: "Roll number not found." });
    }

    // Hash the new password before updating
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update the password in the database
    const [result] = await db.query(
      "UPDATE users SET password = ? WHERE roll_no = ?",
      [hashedPassword, roll_no]
    );

    if (result.affectedRows === 1) {
      console.log(`PASS-RESET SUCCESS: Password reset for Roll No: ${roll_no}`);
      res.json({
        success: true,
        message: "Password reset successfully. You can now log in.",
      });
    } else {
      console.error(
        `PASS-RESET FAIL: Database update affected 0 rows for ${roll_no}.`
      );
      res
        .status(500)
        .json({
          success: false,
          message: "Password reset failed on the server.",
        });
    }
  } catch (err) {
    // 3. CRITICAL ERROR LOGGING
    // This will print the actual database error to your terminal
    console.error("PASS-RESET CRITICAL ERROR:", err.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error: Could not process request.",
      });
  }
});

// ------------------ Student Dashboard ------------------
// MODIFIED: Added setNoCache middleware
app.get("/student-dashboard", setNoCache, (req, res) => {
  if (!req.session.user || req.session.user.is_admin !== 0) {
    return res.redirect("/?error=Access denied");
  }
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});
// ================== STUDENT DASHBOARD DETAILS API ==================
// Add this route to your server.js file
app.get("/api/student/details", checkStudent, async (req, res) => {
  try {
    // FIXED: correct session user id
    const userId = req.session.user.id;

    const [users] = await db.query(
      "SELECT full_name, roll_no, room_no, hostel_name FROM users WHERE id = ?",
      [userId]
    );

    if (users.length > 0) {
      const user = users[0];
      res.json({
        success: true,
        name: user.full_name,
        roll: user.roll_no,
        room: user.room_no,
        hostel: user.hostel_name,
      });
    } else {
      res.status(404).json({ success: false, message: "User data not found." });
    }
  } catch (error) {
    console.error("DASHBOARD DETAILS FETCH ERROR:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error loading details." });
  }
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
// API to check existing application
app.get("/api/hostel-application/:roll_no", (req, res) => {
  const roll_no = req.params.roll_no;
  // NOTE: 'applications' array is not defined in this file scope. Assuming this is a placeholder or relies on an external module.
  // The functionality is likely superseded by the '/api/has-application' route.
  // const existing = applications.find(a => a.roll_no === roll_no && ['pending','approved'].includes(a.status));
  // if (existing) return res.json({ applied: true, application: existing });
  return res.json({ applied: false });
});
// ------------------ Hostel Application Form ------------------
app.post(
  "/submit-application",
  upload.fields([{ name: "student_photo" }, { name: "certificate" }]),
  async (req, res) => {
    try {
      if (!req.session.user || req.session.user.is_admin !== 0) {
        return res
          .status(403)
          .json({ success: false, message: "Login required" });
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
          req.session.user.roll_no,
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

      res.json({
        success: true,
        message: "Application submitted successfully",
        ref_number: refNumber,
      });
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
      "SELECT * FROM hostel_applications WHERE roll_no = ? ORDER BY application_date DESC LIMIT 1",
      [req.session.user.roll_no]
    );

    if (rows.length > 0) {
      return res.json({
        success: true,
        hasApplication: true,
        application: rows[0],
      });
    } else {
      return res.json({ success: true, hasApplication: false });
    }
  } catch (err) {
    console.error("Application check error:", err);
    res.json({ success: false, hasApplication: false });
  }
});

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

// ================== Finance Routes ========

// Fetch finance data
app.get("/api/finance/:roll_no", checkStudent, async (req, res) => {
  const roll_no = req.params.roll_no;
  try {
    const [rows] = await db.query(
      `SELECT academic_year, month, monthly_fee AS fee, paid_amount AS paid, scholarship
       FROM student_billing
       WHERE roll_no = ?
       ORDER BY academic_year ASC,
                FIELD(month,'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec')`,
      [roll_no]
    );
    if (!rows.length) return res.json({ success: true, years: [] });

    const yearsMap = {};
    rows.forEach((r, index) => {
      if (!yearsMap[r.academic_year]) yearsMap[r.academic_year] = [];
      const fee = parseFloat(r.fee || 0);
      const paid = parseFloat(r.paid || 0);
      const scholarship = parseFloat(r.scholarship || 0);

      const remaining = Math.max(0, paid + scholarship - fee);
      const due = Math.max(0, fee - (paid + scholarship));

      yearsMap[r.academic_year].push({
        id: index + 1,
        month: r.month,
        fee: fee.toFixed(2),
        paid: paid.toFixed(2),
        scholarship: scholarship.toFixed(2),
        remaining: remaining.toFixed(2),
        due: due.toFixed(2),
      });
    });

    const years = Object.keys(yearsMap).map((year) => {
      let totalFee = 0,
        totalPaid = 0,
        totalScholarship = 0;
      yearsMap[year].forEach((r) => {
        totalFee += parseFloat(r.fee);
        totalPaid += parseFloat(r.paid);
        totalScholarship += parseFloat(r.scholarship);
      });

      const totalRemaining = Math.max(
        0,
        totalPaid + totalScholarship - totalFee
      );
      const totalDue = Math.max(0, totalFee - (totalPaid + totalScholarship));

      yearsMap[year].push({
        id: "#",
        month: "Total",
        fee: totalFee.toFixed(2),
        paid: totalPaid.toFixed(2),
        scholarship: totalScholarship.toFixed(2),
        remaining: totalRemaining.toFixed(2),
        due: totalDue.toFixed(2),
      });

      return { year, records: yearsMap[year] };
    });

    res.json({ success: true, years });
  } catch (err) {
    console.error("Finance fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
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

// ================== Announcements API Routes ==================

// ADMIN: POST - Create New Announcement
app.post("/admin/api/announcements", checkAdmin, async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Title and message content are required.",
        });
    }

    // Note: Your SQL table uses 'message', 'title', and relies on 'created_at' default.
    await db.query("INSERT INTO announcements (title, message) VALUES (?, ?)", [
      title,
      message,
    ]);
    res.json({ success: true, message: "Announcement posted successfully." });
  } catch (err) {
    console.error("Post Announcement Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error posting announcement." });
  }
});

// ADMIN/STUDENT: GET - Fetch All Announcements
app.get("/api/announcements", (req, res) => {
  // Check if *any* user is logged in
  if (!req.session.user) {
    return res
      .status(403)
      .json({ success: false, message: "Access denied. Login required." });
  }

  try {
    // Select all announcements, ordering by newest first
    db.query(
      "SELECT id, title, message, created_at FROM announcements ORDER BY created_at DESC"
    )
      .then(([rows]) => {
        res.json({ success: true, announcements: rows });
      })
      .catch((err) => {
        console.error("Fetch Announcements Error:", err);
        res
          .status(500)
          .json({
            success: false,
            message: "Server error fetching announcements.",
          });
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

// ADMIN: DELETE - Delete an Announcement
app.delete("/admin/api/announcements/:id", checkAdmin, async (req, res) => {
  try {
    const announcementId = req.params.id;
    const [result] = await db.query("DELETE FROM announcements WHERE id = ?", [
      announcementId,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Announcement not found." });
    }
    res.json({ success: true, message: "Announcement deleted successfully." });
  } catch (err) {
    console.error("Delete Announcement Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error deleting announcement." });
  }
});

// =================== NOTIFICATION API ===================

// API to fetch unread admin notifications
app.get("/api/notifications/admin", async (req, res) => {
  if (!req.session.user || req.session.user.is_admin !== 1) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  
  try {
    const [rows] = await db.execute(
      // Fetch unread notifications meant for Admin or All
      "SELECT * FROM notifications WHERE (recipient_type = 'Admin' OR recipient_type = 'All') AND is_read = 0 ORDER BY created_at DESC"
    );
    res.json({ success: true, notifications: rows });
  } catch (err) {
    console.error("Fetch notifications error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// API to mark a notification as read
app.post("/api/notifications/mark-read/:id", async (req, res) => {
  if (!req.session.user) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    await db.execute(
      "UPDATE notifications SET is_read = 1 WHERE notification_id = ?",
      [req.params.id]
    );
    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// ------------------ Change Password ------------------
app.post("/change-password", async (req, res) => {
  if (!req.session.user) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.json({ success: false, message: "All fields required" });
    }

    // Fetch current password
    const [rows] = await db.execute("SELECT password FROM users WHERE id = ?", [
      req.session.user.id,
    ]);
    if (rows.length === 0) {
      return res.json({ success: false, message: "User not found" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.json({ success: false, message: "Old password incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      req.session.user.id,
    ]);

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.json({ success: false, message: "Server error" });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// ================== Admin Routes ==================

// Admin Dashboard
// MODIFIED: Added setNoCache middleware
app.get("/admin/admin-dashboard",isLoggedIn, checkAdmin, setNoCache, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "admindashboard.html"));
});

// MODIFIED: Added setNoCache middleware
app.get("/admin/billing-summary", checkAdmin, setNoCache, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "billing-summary.html"));
});

// ================== Serve billing-manage page ==================
// MODIFIED: Added setNoCache middleware
app.get("/admin/billing-manage", checkAdmin, setNoCache, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "billing-manage.html"));
});
// ================== Room-Allocation page ==================

// MODIFIED: Added setNoCache middleware
app.get("/admin/rooms", checkAdmin, setNoCache, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "rooms.html"));
});
// ================== students-manageme page ==================

// MODIFIED: Added setNoCache middleware
app.get("/admin/students", checkAdmin, setNoCache, (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin/students.html"));
});

// ================== notices and circulars page ==================

// MODIFIED: Added setNoCache middleware
app.get("/admin/notices", checkAdmin, setNoCache, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "notices.html"));
});
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------
// ================== Rooms API ==================

// ------------------ Get Rooms (Filter + Search) ------------------
app.get("/admin/api/rooms", checkAdmin, async (req, res) => {
  try {
    const { hostel_name, floor, roll_no } = req.query;

    let [rooms] = await db.query(
      "SELECT * FROM rooms ORDER BY hostel_name, floor, room_no"
    );

    // Attach current occupants
    for (let room of rooms) {
      const [allocs] = await db.query(
        "SELECT roll_no FROM room_allocations WHERE room_id=?",
        [room.id]
      );
      room.occupants_rolls = allocs.map((a) => a.roll_no);
      room.current_occupants = room.occupants_rolls.length;
      room.remaining = room.capacity - room.current_occupants;
    }

    let filteredRooms = rooms;

    if (roll_no) {
      filteredRooms = rooms.filter((r) => r.occupants_rolls.includes(roll_no));
    } else {
      if (hostel_name && hostel_name !== "all")
        filteredRooms = filteredRooms.filter(
          (r) => r.hostel_name === hostel_name
        );
      if (floor && floor !== "all")
        filteredRooms = filteredRooms.filter((r) => r.floor === floor);
    }

    res.json({ success: true, rooms: filteredRooms });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ------------------ Add Room ------------------
app.post("/admin/api/rooms/add", checkAdmin, async (req, res) => {
  const { hostel_name, room_no, floor, category, capacity } = req.body;
  if (!hostel_name || !room_no || !floor || !capacity) {
    return res.json({ success: false, message: "Missing required fields" });
  }
  try {
    await db.query(
      "INSERT INTO rooms (hostel_name, room_no, floor, category, capacity) VALUES (?,?,?, ?,?)",
      [hostel_name, room_no, floor, category, capacity]
    );
    res.json({ success: true, message: "Room added" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ------------------ Update Room Capacity ------------------
app.post("/admin/api/rooms/update/:id", checkAdmin, async (req, res) => {
  const roomId = req.params.id;
  const { capacity } = req.body;
  try {
    await db.query("UPDATE rooms SET capacity=? WHERE id=?", [
      capacity,
      roomId,
    ]);
    res.json({ success: true, message: "Capacity updated" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ------------------ Delete / Deactivate Room ------------------
app.post("/admin/api/rooms/delete/:id", checkAdmin, async (req, res) => {
  const roomId = req.params.id;
  try {
    await db.query("DELETE FROM rooms WHERE id=?", [roomId]);
    await db.query("DELETE FROM room_allocations WHERE room_id=?", [roomId]);
    res.json({ success: true, message: "Room deleted" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ------------------ Allocate Student ------------------
app.post("/admin/api/allocate", checkAdmin, async (req, res) => {
  const { roll_no, room_id } = req.body;
  if (!roll_no || !room_id)
    return res.json({ success: false, message: "Missing data" });

  try {
    // Check if student already allocated
    const [existing] = await db.query(
      "SELECT * FROM room_allocations WHERE roll_no=?",
      [roll_no]
    );
    if (existing.length > 0) {
      return res.json({
        success: false,
        message: "Student already allocated. Vacate first.",
      });
    }

    // Check room capacity
    const [roomRows] = await db.query("SELECT capacity FROM rooms WHERE id=?", [
      room_id,
    ]);
    if (roomRows.length === 0)
      return res.json({ success: false, message: "Room not found" });
    const capacity = roomRows[0].capacity;

    const [occupants] = await db.query(
      "SELECT COUNT(*) AS count FROM room_allocations WHERE room_id=?",
      [room_id]
    );
    if (occupants[0].count >= capacity)
      return res.json({ success: false, message: "Room full" });

    // Allocate
    await db.query(
      "INSERT INTO room_allocations (roll_no, room_id, allocated_at) VALUES (?,?,NOW())",
      [roll_no, room_id]
    );

    // Update hostel_applications & users
    const [roomInfo] = await db.query(
      "SELECT hostel_name, room_no FROM rooms WHERE id=?",
      [room_id]
    );
    const { hostel_name, room_no } = roomInfo[0];
    await db.query(
      "UPDATE hostel_applications SET hostel_name=?, room_no=? WHERE roll_no=?",
      [hostel_name, room_no, roll_no]
    );
    await db.query(
      "UPDATE users SET hostel_name=?, room_no=? WHERE roll_no=?",
      [hostel_name, room_no, roll_no]
    );

    res.json({ success: true, message: "Student allocated" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ------------------ Vacate Student ------------------
app.post("/admin/api/allocate/vacate", checkAdmin, async (req, res) => {
  const { roll_no, room_id } = req.body;
  if (!roll_no || !room_id)
    return res.json({ success: false, message: "Missing data" });

  try {
    await db.query(
      "DELETE FROM room_allocations WHERE roll_no=? AND room_id=?",
      [roll_no, room_id]
    );
    await db.query(
      "UPDATE hostel_applications SET hostel_name=NULL, room_no=NULL WHERE roll_no=?",
      [roll_no]
    );
    await db.query(
      "UPDATE users SET hostel_name=NULL, room_no=NULL WHERE roll_no=?",
      [roll_no]
    );
    res.json({ success: true, message: "Student vacated" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ================== Admin Applications List =================
// Get all applications

app.get("/admin/applications", checkAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT application_id, roll_no, full_name, course, branch, year, gender,
             food_preference, application_type, distance_km,
             approval_status, payment_status, rejection_reason
      FROM hostel_applications
      ORDER BY application_id DESC
    `);
    res.json({ success: true, applications: rows });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// --- Get single application details ---
app.get("/admin/applications/:id", checkAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query(
      "SELECT * FROM hostel_applications WHERE application_id=?",
      [id]
    );
    if (rows.length === 0)
      return res.json({ success: false, message: "Application not found" });
    res.json({ success: true, application: rows[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// --- Approve application ---
// --- Approve application (FINAL FIX) ---
app.post("/admin/applications/:id/approve", checkAdmin, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const id = req.params.id;

    // 1. FIX: Fetch the necessary student details, selecting 'contact' (the correct column name) instead of 'phone'.
    const [appRows] = await conn.query(
      "SELECT roll_no, full_name, email, contact FROM hostel_applications WHERE application_id=?",
      [id]
    );

    if (appRows.length === 0) {
      await conn.rollback();
      return res.json({ success: false, message: "Application not found" });
    }
    const application = appRows[0];

    // 2. Update hostel_applications status to Approved.
    await conn.query(
      "UPDATE hostel_applications SET approval_status='Approved', payment_status='Pending' WHERE application_id=?",
      [id]
    );

    // 3. FIX: Update the student's main profile in the users table.
    // We use application.contact to update the users.phone column.
    await conn.query(
      "UPDATE users SET full_name=?, email=?, phone=? WHERE roll_no=?",
      [
        application.full_name,
        application.email,
        application.contact,
        application.roll_no,
      ]
    );

    await conn.commit();
    res.json({
      success: true,
      message: "Application approved and user profile updated.",
    });
  } catch (err) {
    await conn.rollback();
    console.error("Application Approval Error:", err);
    res
      .status(500)
      .json({
        success: false,
        message:
          "Server error during approval process. Please check console for details.",
      });
  } finally {
    if (conn) conn.release();
  }
});
// --- Reject application ---
app.post("/admin/applications/:id/reject", checkAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { reason } = req.body;
    if (!reason)
      return res.json({ success: false, message: "Rejection reason required" });
    await db.query(
      "UPDATE hostel_applications SET approval_status='Rejected', rejection_reason=? WHERE application_id=?",
      [reason, id]
    );
    res.json({ success: true, message: "Application rejected" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

// ================= Billing Routes =================

const monthMap = {
  jan: "Jan",
  january: "Jan",
  feb: "Feb",
  february: "Feb",
  mar: "Mar",
  march: "Mar",
  apr: "Apr",
  april: "Apr",
  may: "May",
  jun: "Jun",
  june: "Jun",
  jul: "Jul",
  july: "Jul",
  aug: "Aug",
  august: "Aug",
  sep: "Sep",
  sept: "Sep",
  september: "Sep",
  oct: "Oct",
  october: "Oct",
  nov: "Nov",
  november: "Nov",
  dec: "Dec",
  december: "Dec",
};

function normalizeMonth(input) {
  if (!input) return null;
  const key = input.trim().toLowerCase();
  return monthMap[key] || null;
}

// ---------- Billing Summary ----------
app.get("/admin/api/billing-summary", checkAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.roll_no,
             u.full_name AS name,
             b.academic_year,
             SUM(b.monthly_fee) AS total_fee,
             SUM(b.paid_amount) AS total_paid,
             SUM(b.scholarship) AS total_scholarship,
             (SUM(b.paid_amount) + SUM(b.scholarship) - SUM(b.monthly_fee)) AS balance
      FROM student_billing b
      LEFT JOIN users u ON u.roll_no = b.roll_no
      WHERE b.academic_year = (
          SELECT MAX(b2.academic_year)
          FROM student_billing b2
          WHERE b2.roll_no = b.roll_no
      )
      GROUP BY b.roll_no, u.full_name, b.academic_year
      ORDER BY b.roll_no ASC
    `);

    const formatted = rows.map((r) => {
      let remaining = "-";
      let due = "-";
      if (r.balance > 0) remaining = r.balance;
      else if (r.balance < 0) due = Math.abs(r.balance);
      return {
        roll_no: r.roll_no,
        name: r.name,
        academic_year: r.academic_year,
        total_fee: r.total_fee > 0 ? r.total_fee : "-",
        total_paid: r.total_paid > 0 ? r.total_paid : "-",
        total_scholarship: r.total_scholarship > 0 ? r.total_scholarship : "-",
        due: due,
        remaining: remaining,
      };
    });

    res.json({ success: true, rows: formatted });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ---------- Add Billing Row / Student ----------
app.post("/admin/api/billing/add", checkAdmin, async (req, res) => {
  const {
    roll_no,
    student_name,
    room_no,
    hostel_name,
    course,
    branch,
    year,
    academic_year,
    month,
    hostel_fee = 0,
    monthly_fee = 0,
    paid_amount = 0,
    scholarship = 0,
    food_preference = "Veg",
  } = req.body;

  if (!roll_no || !month || !academic_year)
    return res.json({
      success: false,
      message: "Roll, month, and academic year required",
    });

  try {
    const normalizedMonth = normalizeMonth(month);
    if (!normalizedMonth)
      return res.json({ success: false, message: "Invalid month" });

    const [result] = await db.query(
      `
      INSERT INTO student_billing
      (roll_no, student_name, room_no, hostel_name, course, branch, year, academic_year, month, hostel_fee, monthly_fee, paid_amount, scholarship, food_preference)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `,
      [
        roll_no,
        student_name,
        room_no,
        hostel_name,
        course,
        branch,
        year,
        academic_year,
        normalizedMonth,
        hostel_fee,
        monthly_fee,
        paid_amount,
        scholarship,
        food_preference,
      ]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ---------- Billing Manage ----------
app.get("/admin/api/billing-manage/:roll_no", checkAdmin, async (req, res) => {
  const roll_no = req.params.roll_no;
  try {
    // Fetch student info
    const [studentRows] = await db.query(
      `
      SELECT u.roll_no, u.full_name AS name,
             IFNULL(sa.room_no,'-') AS room_no,
             IFNULL(sa.hostel_name,'-') AS hostel_name,
             sa.course, sa.branch, sa.year
      FROM users u
      LEFT JOIN hostel_applications sa ON sa.roll_no = u.roll_no
      WHERE u.roll_no = ?
      ORDER BY sa.application_date DESC
      LIMIT 1
    `,
      [roll_no]
    );

    if (!studentRows.length)
      return res.json({ success: false, message: "Student not found" });

    const student = studentRows[0];

    // Get all billing records grouped by academic year
    const [billingRows] = await db.query(
      `
      SELECT bill_id AS id, academic_year, month, monthly_fee, paid_amount, scholarship
      FROM student_billing
      WHERE roll_no = ?
      ORDER BY academic_year ASC,
               FIELD(month,'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec')
    `,
      [roll_no]
    );

    const billingByYear = {};
    billingRows.forEach((b) => {
      const yearKey = b.academic_year || "Unknown Year";
      if (!billingByYear[yearKey]) billingByYear[yearKey] = [];

      const monthly = b.monthly_fee || 0;
      const paid = b.paid_amount || 0;
      const scholarship = b.scholarship || 0;

      const remaining = Math.max(0, paid + scholarship - monthly);
      const due = Math.max(0, monthly - (paid + scholarship));

      billingByYear[yearKey].push({
        id: b.id,
        month: b.month,
        monthly_fee: monthly,
        paid_amount: paid,
        scholarship: scholarship,
        remaining: remaining.toFixed(2),
        due: due.toFixed(2),
      });
    });

    res.json({ success: true, student, billingByYear });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ---------- Save Billing Year ----------
app.post("/admin/api/billing/saveYear", checkAdmin, async (req, res) => {
  const { roll_no, academic_year, rows } = req.body;
  if (!roll_no || !academic_year || !Array.isArray(rows)) {
    return res.json({ success: false, message: "Missing fields" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(
      "DELETE FROM student_billing WHERE roll_no=? AND academic_year=?",
      [roll_no, academic_year]
    );

    for (const r of rows) {
      const month = normalizeMonth(r.month);
      if (!month) continue;
      const monthly = r.monthly_fee || 0;
      const paid = r.paid_amount || 0;
      const scholarship = r.scholarship || 0;

      await conn.query(
        `INSERT INTO student_billing 
         (roll_no, academic_year, month, monthly_fee, paid_amount, scholarship)
         VALUES (?,?,?,?,?,?)`,
        [roll_no, academic_year, month, monthly, paid, scholarship]
      );
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.json({ success: false, message: "Error saving data" });
  } finally {
    conn.release();
  }
});

// ---------- Save All Years ----------
app.post("/admin/api/billing/save-all", checkAdmin, async (req, res) => {
  const { roll_no, years } = req.body;
  if (!roll_no || !years)
    return res.json({ success: false, message: "Missing data" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    for (const yearObj of years) {
      const { academic_year, rows } = yearObj;

      await conn.query(
        `DELETE FROM student_billing WHERE roll_no=? AND academic_year=?`,
        [roll_no, academic_year]
      );

      for (const r of rows) {
        const month = normalizeMonth(r.month);
        if (!month) continue;
        const monthly = r.monthly_fee || 0;
        const paid = r.paid_amount || 0;
        const scholarship = r.scholarship || 0;

        await conn.query(
          `
          INSERT INTO student_billing
          (roll_no, academic_year, month, monthly_fee, paid_amount, scholarship)
          VALUES (?,?,?,?,?,?)
        `,
          [roll_no, academic_year, month, monthly, paid, scholarship]
        );
      }
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.json({ success: false, message: "Server error" });
  } finally {
    conn.release();
  }
});

//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ======================= GET ALL STUDENTS =======================

// ======================= GET ALL STUDENTS =======================
app.get("/api/students", async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM hostel_applications ORDER BY roll_no"
  );
  res.json(rows);
});

// ======================= GET SINGLE STUDENT =======================
app.get("/api/students/:roll_no", async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM hostel_applications WHERE roll_no=?",
    [req.params.roll_no]
  );
  if (rows.length) res.json(rows[0]);
  else res.status(404).json({ message: "Student not found" });
});

// ======================= ADD STUDENT =======================
app.post(
  "/api/students",
  upload.fields([{ name: "student_photo" }, { name: "certificate" }]),
  async (req, res) => {
    try {
      const body = req.body;

      const [exists] = await db.query(
        "SELECT * FROM hostel_applications WHERE roll_no=?",
        [body.roll_no]
      );
      if (exists.length)
        return res.status(400).json({ message: "Roll number exists" });

      const filteredBody = {};
      Object.keys(body).forEach((k) => {
        if (body[k] !== undefined && body[k] !== "") filteredBody[k] = body[k];
      });

      if (req.files["student_photo"])
        filteredBody.student_photo = req.files["student_photo"][0].filename;
      if (req.files["certificate"])
        filteredBody.certificate = req.files["certificate"][0].filename;

      filteredBody.approval_status = "Approved";
      filteredBody.payment_status = "Pending";

      const fields = Object.keys(filteredBody);
      const values = Object.values(filteredBody);
      const placeholders = fields.map(() => "?").join(",");

      await db.query(
        `INSERT INTO hostel_applications (${fields.join(
          ","
        )}) VALUES (${placeholders})`,
        values
      );
      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error adding student" });
    }
  }
);

// ======================= EDIT STUDENT =======================
app.put(
  "/api/students/:roll_no",
  upload.fields([{ name: "student_photo" }, { name: "certificate" }]),
  async (req, res) => {
    try {
      const roll_no = req.params.roll_no;
      const [existing] = await db.query(
        "SELECT * FROM hostel_applications WHERE roll_no=?",
        [roll_no]
      );
      if (!existing.length)
        return res.status(404).json({ message: "Student not found" });

      const old = existing[0];
      const body = req.body;

      const filteredBody = {};
      Object.keys(old).forEach((k) => {
        filteredBody[k] =
          body[k] !== undefined && body[k] !== "" ? body[k] : old[k];
      });

      if (req.files["student_photo"])
        filteredBody.student_photo = req.files["student_photo"][0].filename;
      else filteredBody.student_photo = old.student_photo;

      if (req.files["certificate"])
        filteredBody.certificate = req.files["certificate"][0].filename;
      else filteredBody.certificate = old.certificate;

      const fields = Object.keys(filteredBody);
      const values = Object.values(filteredBody);
      const setStr = fields.map((f) => `${f}=?`).join(",");
      await db.query(
        `UPDATE hostel_applications SET ${setStr} WHERE roll_no=?`,
        [...values, roll_no]
      );

      res.sendStatus(200);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error updating student" });
    }
  }
);

// ======================= DELETE STUDENT =======================
app.delete("/api/students/:roll_no", async (req, res) => {
  try {
    await db.query("DELETE FROM hostel_applications WHERE roll_no=?", [
      req.params.roll_no,
    ]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting student" });
  }
});

// ======================= GET ALL COMPLAINTS =======================
app.get("/api/complaints", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM complaints ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

// ======================= GET SINGLE COMPLAINT =======================
app.get("/api/complaints/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM complaints WHERE complaint_id=?",
      [req.params.id]
    );
    if (rows.length) res.json(rows[0]);
    else res.status(404).json({ message: "Complaint not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch complaint" });
  }
});

// ======================= ADD COMPLAINT =======================
app.post("/api/complaints", async (req, res) => {
  try {
    const { student_id, complaint_type, description } = req.body;

    if (!student_id || !complaint_type || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await db.query(
      "INSERT INTO complaints (student_id, complaint_type, description, status) VALUES (?, ?, ?, 'Pending')",
      [student_id, complaint_type, description]
    );

    res.status(201).json({ message: "Complaint added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add complaint" });
  }
});

// ======================= UPDATE COMPLAINT STATUS =======================
app.put("/api/complaints/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });

    const [result] = await db.query(
      "UPDATE complaints SET status=? WHERE complaint_id=?",
      [status, req.params.id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Complaint not found" });
    res.json({ message: "Complaint updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update complaint" });
  }
});

// ======================= DELETE COMPLAINT =======================
app.delete("/api/complaints/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM complaints WHERE complaint_id=?",
      [req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Complaint not found" });
    res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete complaint" });
  }
});

// NOTE: The following duplicate and conflicting /logout routes have been REMOVED:
/*
// Logout route (REMOVED: redirects to /login)
app.get("/logout", (req, res) => {
  // Destroy the session
  req.session.destroy(err => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Error logging out");
    }
    // Redirect to login page
    res.redirect("/login");
  });
});

// ================== Logout ================== (REMOVED: duplicate)
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.sendFile(path.join(__dirname, "public", "logout.html"));
  });
});
*/

//============= Start Server ==================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
