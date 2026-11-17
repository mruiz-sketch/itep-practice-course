// ============================================================
//  iTEP Practice Course — screens, animations and validation
// ============================================================
import { createBackend, DEMO, toSchoolId, AppError } from "./backend.js";
import { firebaseConfig, EMAIL_DOMAIN } from "./firebase-config.js";
import { createTeacherArea } from "./teacher.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const stage = $("#stage");
const signupForm = $("#signupForm");
const teacherForm = $("#teacherForm");
const loginForm = $("#loginForm");
const sentPanel = $("#sentPanel");
const diag = $("#diag");
const toastEl = $("#toast");

let backend = null;
let teacherArea = null;
const backendReady = createBackend().then((b) => {
  backend = b;
  teacherArea = createTeacherArea({ backend, toast, onLogout: logout });
}).catch((e) => {
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
  [signupForm, teacherForm, loginForm, sentPanel].forEach((p) => p.classList.toggle("show", p === panel));
}
// Cross-fade the text of a morphing button
async function setLabel(sel, text) {
  const btn = $(sel), lbl = $(".lbl", btn);
  if (lbl.textContent === text) return;
  btn.classList.add("swap");
  await wait(250);
  lbl.textContent = text;
  btn.classList.remove("swap");
}
const setTeacherLabel = (t) => setLabel(".btn-teacher", t);
const isTeacherState = () => ["thome", "tsignup", "tlogin"].includes(stage.dataset.state);
let lastSignupRole = "student";

let busy = false;
async function goSignup(role = "student") {
  if (busy) return; busy = true;
  const form = role === "teacher" ? teacherForm : signupForm;
  showPanel(null);
  if (role === "teacher") setTeacherLabel("TEACHER ACCOUNT");
  setState(role === "teacher" ? "tsignup" : "signup");
  await wait(650);
  showPanel(form);
  updateSendButton(form);
  busy = false;
  setTimeout(() => form.elements.firstName.focus({ preventScroll: true }), 300);
}
async function goLogin({ prefill, teacher = false } = {}) {
  if (busy) return; busy = true;
  showPanel(null);
  setLabel(".btn-login", teacher ? "TEACHER LOG IN" : "LOG IN");
  setState(teacher ? "tlogin" : "login");
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
  setTeacherLabel("ARE YOU A TEACHER?");
  setLabel(".btn-login", "LOG IN");
  await wait(700);
  busy = false;
}
// Teachers' own entrance: "ARE YOU A TEACHER?" becomes a title with CREATE ACCOUNT / LOG IN below
async function goTeacherHome() {
  if (busy) return; busy = true;
  const fromForm = stage.dataset.state !== "home";
  showPanel(null);
  if (fromForm) await wait(250);
  setState("thome");
  setTeacherLabel("ARE YOU A TEACHER?");
  setLabel(".btn-login", "LOG IN");
  await wait(700);
  busy = false;
}
async function switchTo(target, teacher = isTeacherState()) {
  // signup <-> login passes through the (teacher) home so the buttons morph back
  if (teacher) { await goTeacherHome(); target === "signup" ? goSignup("teacher") : goLogin({ teacher: true }); }
  else { await goHome(); target === "signup" ? goSignup() : goLogin(); }
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
//  Validation (student and teacher forms)
// ------------------------------------------------------------
const PW_RULES = {
  len: (v) => v.length >= 8,
  upper: (v) => /[A-Z]/.test(v),
  lower: (v) => /[a-z]/.test(v),
  digit: (v) => /\d/.test(v),
  symbol: (v) => /[^A-Za-z0-9\s]/.test(v),
};
const EMAIL_RE = new RegExp(`^[a-z0-9._%+-]+@${EMAIL_DOMAIN.replace(/\./g, "\\.")}$`, "i");

function readForm(form) {
  const f = form.elements;
  const d = {
    role: form === teacherForm ? "teacher" : "student",
    firstName: f.firstName.value.trim().replace(/\s+/g, " "),
    lastName: f.lastName.value.trim().replace(/\s+/g, " "),
    email: f.email.value.trim().toLowerCase(),
    password: f.password.value,
  };
  if (f.quarter) d.quarter = f.quarter.value;
  if (f.group) d.group = f.group.value.trim().toUpperCase();
  return d;
}

function validateForm(form, d) {
  const errors = [];
  const f = form.elements;
  if (!d.firstName) errors.push([f.firstName, "Please write your first name."]);
  if (!d.lastName) errors.push([f.lastName, "Please write your last name."]);
  if (!d.email) errors.push([f.email, "Please write your institutional e-mail."]);
  else if (!EMAIL_RE.test(d.email)) errors.push([f.email, `Use your institutional e-mail (…@${EMAIL_DOMAIN}).`]);
  if (f.quarter && !d.quarter) errors.push([f.quarter, "Please choose your quarter."]);
  if (f.group && !d.group) errors.push([f.group, "Please write your group."]);
  if (!d.password) errors.push([f.password, "Please create a password."]);
  else if (!Object.values(PW_RULES).every((r) => r(d.password)))
    errors.push([f.password, "Password: 8+ characters with uppercase, lowercase, a number and a symbol."]);
  return errors;
}

function updatePwRules(form) {
  const v = form.elements.password.value;
  $$(".pw-rules li", form).forEach((li) => li.classList.toggle("ok", PW_RULES[li.dataset.rule](v)));
}
function updateSendButton(form) {
  const incomplete = validateForm(form, readForm(form)).length > 0;
  $(".btn-send", form).classList.toggle("incomplete", incomplete);
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

// ------------------------------------------------------------
//  Create account (students and teachers)
// ------------------------------------------------------------
[signupForm, teacherForm].forEach((form) => {
  form.addEventListener("input", (e) => {
    e.target.classList.remove("invalid");
    if (e.target.name === "password") updatePwRules(form);
    updateSendButton(form);
  });
  form.addEventListener("change", () => updateSendButton(form));

  // Email field: show a hint as soon as a different domain is typed
  form.elements.email.addEventListener("blur", (e) => {
    const v = e.target.value.trim();
    if (v && !EMAIL_RE.test(v)) { e.target.classList.add("invalid"); toast(`Only institutional e-mails are accepted (…@${EMAIL_DOMAIN}).`, "error"); }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = readForm(form);
    const errors = validateForm(form, data);
    flagErrors(errors);
    if (errors.length) return;

    const btn = $(".btn-send", form);
    btn.disabled = true; btn.textContent = "Sending…";
    try {
      await backendReady;
      const res = await backend.signUp(data);
      lastSignupRole = data.role;
      $("#sentEmail").textContent = data.email;
      form.reset(); updatePwRules(form);
      showPanel(sentPanel);
      toast("Account created! Check your e-mail.", "success");
      if (res && res.demoLink) openDemoInbox(res);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") flagErrors([[form.elements.email, err.message]]);
      else toast(err.message, "error", 6000);
    } finally {
      btn.disabled = false; btn.textContent = "Send verification e-mail";
    }
  });
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
    showPanel(null);
    if (profile.role === "teacher") teacherArea.open(profile);
    else openDiagnostic(profile);
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
//  Diagnostic screen (students)
// ------------------------------------------------------------
function openDiagnostic(profile) {
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
  teacherArea?.close();
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
    case "signup":
      if (stage.dataset.state === "home") goSignup("student");
      else if (stage.dataset.state === "thome") goSignup("teacher");
      break;
    case "login":
      if (stage.dataset.state === "home") goLogin();
      else if (stage.dataset.state === "thome") goLogin({ teacher: true });
      break;
    case "tsignup": if (stage.dataset.state === "home") goTeacherHome(); break;
    case "back": goBack(); break;
    case "to-signup": switchTo("signup"); break;
    case "login-from-sent": switchTo("login", lastSignupRole === "teacher"); break;
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
    else if (["signup", "login", "thome", "tsignup", "tlogin"].includes(stage.dataset.state)) goBack();
  }
});

function goBack() {
  ["tsignup", "tlogin"].includes(stage.dataset.state) ? goTeacherHome() : goHome();
}

// Student clicked the link in the verification e-mail
async function returnFromEmail(oobCode, id) {
  try {
    if (oobCode) { await backendReady; await backend.verify(oobCode); }
    toast("E-mail verified! Log in with your School ID.", "success", 5000);
  } catch (err) {
    toast(err.message, "error", 6000);
  }
  await wait(500);
  goLogin({ prefill: id || "" });
}

// Demo inbox: verify inside the page (no reload needed)
$("#demoLink").addEventListener("click", async (e) => {
  e.preventDefault();
  const url = new URL(e.currentTarget.href);
  $("#demoInbox").hidden = true;
  showPanel(null);
  setState("home");
  await wait(700);
  returnFromEmail(url.searchParams.get("oobCode"), url.searchParams.get("id"));
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
    try { history.replaceState(null, "", location.pathname); } catch {}
    jumpTo("home");
    returnFromEmail(oobCode, id);
    return;
  }

  if (q.has("skipintro")) { jumpTo("home"); return; }
  await document.fonts.ready;
  playIntro();
}
boot();
