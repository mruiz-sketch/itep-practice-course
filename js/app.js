// ============================================================
//  iTEP Practice Course — screens, animations and validation
// ============================================================
import { createBackend, DEMO, toSchoolId, AppError } from "./backend.js";
import { firebaseConfig, EMAIL_DOMAIN } from "./firebase-config.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const stage = $("#stage");
const signupForm = $("#signupForm");
const loginForm = $("#loginForm");
const sentPanel = $("#sentPanel");
const diag = $("#diag");
const toastEl = $("#toast");

let backend = null;
const backendReady = createBackend().then((b) => (backend = b)).catch((e) => {
  console.error(e);
  toast("Could not connect to the server. Check your internet connection.", "error", 6000);
});
if (DEMO) $("#demoBadge").hidden = false;

// ------------------------------------------------------------
//  Fit the 16:9 artboard to any screen (portrait on phones)
// ------------------------------------------------------------
function fit() {
  // Ignore the resize caused by the phone keyboard while typing
  const typing = /^(INPUT|SELECT)$/.test(document.activeElement?.tagName || "");
  if (typing && stage.style.transform) return;
  const w = innerWidth, h = innerHeight;
  const portrait = h > w * 1.1;
  stage.classList.toggle("portrait", portrait);
  const W = portrait ? 768 : 1366, H = portrait ? 1366 : 768;
  const s = Math.min(w / W, h / H);
  stage.style.transform = `scale(${s}) translate(-50%, -50%)`;
}
addEventListener("resize", fit);
fit();

// ------------------------------------------------------------
//  State machine
// ------------------------------------------------------------
const setState = (s) => { stage.dataset.state = s; };
function jumpTo(s) {
  stage.classList.add("no-anim");
  setState(s);
  void stage.offsetWidth;
  requestAnimationFrame(() => stage.classList.remove("no-anim"));
}
function showPanel(panel) {
  [signupForm, loginForm, sentPanel].forEach((p) => p.classList.toggle("show", p === panel));
}

let busy = false;
async function goSignup() {
  if (busy) return; busy = true;
  showPanel(null);
  setState("signup");
  await wait(650);
  showPanel(signupForm);
  updateSendButton();
  busy = false;
  setTimeout(() => $("#su-first").focus({ preventScroll: true }), 300);
}
async function goLogin({ prefill } = {}) {
  if (busy) return; busy = true;
  showPanel(null);
  setState("login");
  await wait(650);
  showPanel(loginForm);
  if (prefill) $("#li-id").value = prefill;
  busy = false;
  setTimeout(() => ($("#li-id").value ? $("#li-pass") : $("#li-id")).focus({ preventScroll: true }), 300);
}
async function goHome() {
  if (busy) return; busy = true;
  showPanel(null);
  await wait(250);
  setState("home");
  await wait(700);
  busy = false;
}
async function switchTo(target) {
  // signup <-> login passes through home so the buttons morph back
  await goHome();
  target === "signup" ? goSignup() : goLogin();
}

async function playIntro() {
  setState("s0");
  await wait(250);
  setState("s1");     // fade in + zoom in
  await wait(2200);
  setState("s2");     // rise; texts fade out, logo stays
  await wait(1000);
  setState("home");   // buttons fade in
}

// ------------------------------------------------------------
//  Toast
// ------------------------------------------------------------
let toastTimer;
function toast(msg, type = "", ms = 4200) {
  toastEl.textContent = msg;
  toastEl.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastEl.className = type), ms);
}

// ------------------------------------------------------------
//  Validation
// ------------------------------------------------------------
const PW_RULES = {
  len: (v) => v.length >= 8,
  upper: (v) => /[A-Z]/.test(v),
  lower: (v) => /[a-z]/.test(v),
  digit: (v) => /\d/.test(v),
  symbol: (v) => /[^A-Za-z0-9\s]/.test(v),
};
const EMAIL_RE = new RegExp(`^[a-z0-9._%+-]+@${EMAIL_DOMAIN.replace(/\./g, "\\.")}$`, "i");

function readSignup() {
  const f = signupForm.elements;
  return {
    firstName: f.firstName.value.trim().replace(/\s+/g, " "),
    lastName: f.lastName.value.trim().replace(/\s+/g, " "),
    email: f.email.value.trim().toLowerCase(),
    quarter: f.quarter.value,
    group: f.group.value.trim().toUpperCase(),
    password: f.password.value,
  };
}

function validateSignup(d) {
  const errors = [];
  const f = signupForm.elements;
  if (!d.firstName) errors.push([f.firstName, "Please write your first name."]);
  if (!d.lastName) errors.push([f.lastName, "Please write your last name."]);
  if (!d.email) errors.push([f.email, "Please write your institutional e-mail."]);
  else if (!EMAIL_RE.test(d.email)) errors.push([f.email, `Use your institutional e-mail (…@${EMAIL_DOMAIN}).`]);
  if (!d.quarter) errors.push([f.quarter, "Please choose your quarter."]);
  if (!d.group) errors.push([f.group, "Please write your group."]);
  if (!d.password) errors.push([f.password, "Please create a password."]);
  else if (!Object.values(PW_RULES).every((r) => r(d.password)))
    errors.push([f.password, "Password: 8+ characters with uppercase, lowercase, a number and a symbol."]);
  return errors;
}

function updatePwRules() {
  const v = signupForm.elements.password.value;
  $$(".pw-rules li").forEach((li) => li.classList.toggle("ok", PW_RULES[li.dataset.rule](v)));
}
function updateSendButton() {
  const incomplete = validateSignup(readSignup()).length > 0;
  $(".btn-send").classList.toggle("incomplete", incomplete);
}

function flagErrors(errors) {
  $$(".invalid").forEach((el) => el.classList.remove("invalid"));
  errors.forEach(([el]) => { void el.offsetWidth; el.classList.add("invalid"); });
  if (errors.length) {
    toast(errors.length > 1 && errors.some(([, m]) => m.startsWith("Please"))
      ? "Please complete all the fields marked with *."
      : errors[0][1], "error");
    errors[0][0].focus({ preventScroll: true });
  }
}

signupForm.addEventListener("input", (e) => {
  e.target.classList.remove("invalid");
  if (e.target.name === "password") updatePwRules();
  updateSendButton();
});
signupForm.addEventListener("change", updateSendButton);

// Email field: show a hint as soon as a different domain is typed
signupForm.elements.email.addEventListener("blur", (e) => {
  const v = e.target.value.trim();
  if (v && !EMAIL_RE.test(v)) { e.target.classList.add("invalid"); toast(`Only institutional e-mails are accepted (…@${EMAIL_DOMAIN}).`, "error"); }
});

// ------------------------------------------------------------
//  Create account
// ------------------------------------------------------------
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = readSignup();
  const errors = validateSignup(data);
  flagErrors(errors);
  if (errors.length) return;

  const btn = $(".btn-send");
  btn.disabled = true; btn.textContent = "Sending…";
  try {
    await backendReady;
    const res = await backend.signUp(data);
    $("#sentEmail").textContent = data.email;
    signupForm.reset(); updatePwRules();
    showPanel(sentPanel);
    toast("Account created! Check your e-mail.", "success");
    if (res && res.demoLink) openDemoInbox(res);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") flagErrors([[signupForm.elements.email, err.message]]);
    else toast(err.message, "error", 6000);
  } finally {
    btn.disabled = false; btn.textContent = "Send verification e-mail";
  }
});

// ------------------------------------------------------------
//  Log in
// ------------------------------------------------------------
loginForm.addEventListener("input", (e) => e.target.classList.remove("invalid"));
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = loginForm.elements;
  const schoolId = toSchoolId(f.schoolId.value);
  const password = f.password.value;
  const missing = [];
  if (!schoolId) missing.push([f.schoolId, "Please write your School ID."]);
  if (!password) missing.push([f.password, "Please write your password."]);
  flagErrors(missing);
  if (missing.length) return;

  const btn = $(".btn-dologin");
  btn.disabled = true; btn.textContent = "Logging in…";
  try {
    await backendReady;
    const profile = await backend.signIn(schoolId, password);
    $("[data-action='resend']").hidden = true;
    loginForm.reset();
    openDiagnostic(profile);
  } catch (err) {
    if (err.code === "not-verified") {
      $("[data-action='resend']").hidden = false;
      toast(err.message, "error", 7000);
    } else {
      flagErrors([[f.password, err.message]]);
    }
  } finally {
    btn.disabled = false; btn.textContent = "Log In";
  }
});

// ------------------------------------------------------------
//  Diagnostic screen
// ------------------------------------------------------------
function openDiagnostic(profile) {
  showPanel(null);
  $("#diagHello").textContent = profile.firstName ? `Welcome, ${profile.firstName}!` : "Welcome!";
  $("#diagUser").textContent = `School ID: ${profile.schoolId || ""}`;
  $(".btn-diag").innerHTML = profile.isNew ? "TAKE<br>DIAGNOSTIC TEST" : "CONTINUE<br>PRACTICING";
  document.body.classList.add("is-diag");
  diag.classList.add("show");
  diag.setAttribute("aria-hidden", "false");
}
async function logout() {
  await backend?.signOut();
  diag.classList.remove("show");
  diag.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-diag");
  await wait(400);
  goHome();
}

// ------------------------------------------------------------
//  Demo inbox
// ------------------------------------------------------------
function openDemoInbox({ demoLink, firstName, email }) {
  $("#demoTo").textContent = email;
  $("#demoName").textContent = firstName;
  $("#demoLink").href = demoLink;
  $("#demoInbox").hidden = false;
}

// ------------------------------------------------------------
//  Buttons
// ------------------------------------------------------------
document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-action], [data-toggle]");
  if (!t) return;

  if (t.dataset.toggle) {
    const input = document.getElementById(t.dataset.toggle);
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    t.textContent = show ? "HIDE" : "SHOW";
    t.setAttribute("aria-label", show ? "Hide password" : "Show password");
    return;
  }

  switch (t.dataset.action) {
    case "signup": if (stage.dataset.state === "home") goSignup(); break;
    case "login": if (stage.dataset.state === "home") goLogin(); break;
    case "back": goHome(); break;
    case "to-signup": switchTo("signup"); break;
    case "login-from-sent": switchTo("login"); break;
    case "logout": logout(); break;
    case "close-demo": $("#demoInbox").hidden = true; break;
    case "start-diagnostic": toast("The diagnostic test is coming soon. Stay tuned!", "", 3500); break;
    case "forgot": {
      const id = toSchoolId(loginForm.elements.schoolId.value);
      if (!id) { flagErrors([[loginForm.elements.schoolId, "Write your School ID first, then click “Forgot your password?”."]]); return; }
      try { await backendReady; await backend.resetPassword(id); toast(`We sent a password reset link to ${id}@${EMAIL_DOMAIN}.`, "success", 6000); }
      catch (err) { toast(err.message, "error"); }
      break;
    }
    case "resend": {
      try {
        await backendReady;
        const res = await backend.resendVerification();
        t.hidden = true;
        toast("Verification e-mail sent again. Check your inbox.", "success");
        if (res && res.demoLink) openDemoInbox(res);
      } catch (err) { toast(err.message, "error"); }
      break;
    }
  }
});

// Enter on home buttons etc. is handled natively; Esc goes back
addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!$("#demoInbox").hidden) $("#demoInbox").hidden = true;
    else if (["signup", "login"].includes(stage.dataset.state)) goHome();
  }
});

// ------------------------------------------------------------
//  Boot: normal intro, or coming back from the verification e-mail
// ------------------------------------------------------------
async function boot() {
  const q = new URLSearchParams(location.search);
  const mode = q.get("mode");
  const oobCode = q.get("oobCode");

  // Firebase links other than e-mail verification (e.g. password reset)
  // are forwarded to Firebase's own page.
  if (mode && mode !== "verifyEmail" && !DEMO) {
    location.replace(`https://${firebaseConfig.authDomain}/__/auth/action${location.search}`);
    return;
  }

  let id = q.get("id");
  if (!id && q.get("continueUrl")) {
    try { id = new URL(q.get("continueUrl")).searchParams.get("id"); } catch {}
  }

  if ((mode === "verifyEmail" && oobCode) || q.get("verified")) {
    history.replaceState(null, "", location.pathname);
    jumpTo("home");
    try {
      if (oobCode) { await backendReady; await backend.verify(oobCode); }
      toast("E-mail verified! Log in with your School ID.", "success", 5000);
    } catch (err) {
      toast(err.message, "error", 6000);
    }
    await wait(500);
    goLogin({ prefill: id || "" });
    return;
  }

  if (q.has("skipintro")) { jumpTo("home"); return; }
  await document.fonts.ready;
  playIntro();
}
boot();
