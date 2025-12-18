const SESSION_TIMEOUT_MS = 1000 * 60 * 15; // 15 minutes (Must match server.js maxAge)
const WARNING_TIME_MS = 1000 * 60 * 2; // Show warning 2 minutes before timeout (120,000 ms)

let timerInterval;
let expirationTime = Date.now() + SESSION_TIMEOUT_MS;

// ----------------------------------------------------
// 1. HTML Element Injection for the Timer
// ----------------------------------------------------
function injectTimerUI() {
  const timerDiv = document.createElement("div");
  timerDiv.id = "session-timer-bar";
  timerDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background-color: #f8d7da; /* Light Red/Warning Color */
        color: #721c24; /* Dark Red Text */
        text-align: center;
        padding: 5px 0;
        font-weight: bold;
        z-index: 10000;
        display: none; /* Initially hidden */
    `;
  document.body.prepend(timerDiv);
  return timerDiv;
}

// ----------------------------------------------------
// 2. Timer Update and Check Logic
// ----------------------------------------------------
function startSessionTimer() {
  const timerElement = document.getElementById("session-timer-bar");
  if (!timerElement) return;

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    const remainingTimeMS = expirationTime - Date.now();
    const remainingMinutes = Math.floor(remainingTimeMS / (1000 * 60));
    const remainingSeconds = Math.floor((remainingTimeMS % (1000 * 60)) / 1000);

    if (remainingTimeMS <= 0) {
      clearInterval(timerInterval);
      timerElement.textContent = "Session Expired. Redirecting to Login...";
      // Force the client to log out and redirect
      window.location.href =
        "/logout?error=" +
        encodeURIComponent("Your session has expired due to inactivity.");
      return;
    }

    // Show the timer only when it enters the warning zone
    if (remainingTimeMS <= WARNING_TIME_MS) {
      timerElement.style.display = "block";
      timerElement.textContent = `⚠️ Session expires in ${remainingMinutes
        .toString()
        .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    } else {
      // Hide the timer when there's plenty of time left
      timerElement.style.display = "none";
    }
  }, 1000);
}

// ----------------------------------------------------
// 3. Activity Reset/Refresh Logic
// ----------------------------------------------------

// This function sends a request to the server to reset the session's maxAge.
// It hits the server to keep the session alive.
async function resetSessionActivity() {
  try {
    // Send a request to a non-data, low-overhead endpoint to keep the session alive
    // We'll create a simple /keep-alive endpoint in server.js
    await fetch("/keep-alive", { method: "POST" });

    // Update the client-side expiration time
    expirationTime = Date.now() + SESSION_TIMEOUT_MS;

    // Restart the timer to reflect the new expiration time
    startSessionTimer();
  } catch (e) {
    console.error("Keep-alive failed, session may be invalid:", e);
    // Do not redirect here, let the main timer handle the final timeout/redirect
  }
}

// Listen for user activity (mouse movement, keyboard input)
function setupActivityListeners() {
  ["mousemove", "keydown", "scroll", "touchstart"].forEach((eventType) => {
    document.addEventListener(eventType, throttle(resetSessionActivity, 60000)); // Throttle to once per minute
  });
}

// Simple throttle function (prevents flooding the server with requests)
function throttle(func, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall > delay) {
      lastCall = now;
      func.apply(this, args);
    }
  };
}

// ----------------------------------------------------
// 4. Initialization
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // 1. Inject the visible timer bar
  injectTimerUI();

  // 2. Start the timer immediately
  startSessionTimer();

  // 3. Set up listeners to reset the timer on activity
  setupActivityListeners();
});
