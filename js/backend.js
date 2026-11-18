// ============================================================
//  Backend: Firebase (Auth + Firestore) or local DEMO mode.
//  Both expose the same functions so the UI does not care.
// ============================================================
import { firebaseConfig, EMAIL_DOMAIN } from "./firebase-config.js";

const SDK = "https://www.gstatic.com/firebasejs/11.0.2";
export const DEMO = !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("PASTE_");

export class AppError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

export const toEmail = (schoolId) => `${schoolId.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
export const toSchoolId = (value) => value.trim().toLowerCase().replace(new RegExp(`@${EMAIL_DOMAIN.replace(/\./g, "\\.")}$`), "");
// "IAEV-31", "iaev 31" and "IAEV31" are the same group
export const groupKey = (g) => String(g || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

function returnUrl(schoolId) {
  return `${location.origin}${location.pathname}?verified=1&id=${encodeURIComponent(schoolId)}`;
}

const MESSAGES = {
  "auth/email-already-in-use": "This e-mail already has an account. Please log in.",
  "auth/invalid-credential": "School ID or password is incorrect.",
  "auth/wrong-password": "School ID or password is incorrect.",
  "auth/user-not-found": "School ID or password is incorrect.",
  "auth/invalid-email": "Please write a valid School ID.",
  "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
  "auth/network-request-failed": "No internet connection. Please try again.",
  "auth/invalid-action-code": "This verification link was already used or is no longer valid.",
  "auth/expired-action-code": "This verification link expired. Log in to get a new one.",
  "auth/weak-password": "Your password is too weak.",
  "auth/missing-password": "Please write your password.",
  "permission-denied": "You don't have permission to see this information yet.",
};
const wrap = (e) => (e instanceof AppError ? e : new AppError(e.code || "unknown", MESSAGES[e.code] || "Something went wrong. Please try again."));

function newProfile({ firstName, lastName, email, quarter, group, role, teacherCode }) {
  const schoolId = toSchoolId(email);
  const base = { firstName, lastName, email, schoolId, role, emailVerified: false };
  return role === "teacher"
    ? { ...base, teacherCode, approved: false, setupComplete: false, quarters: [], groups: {} }
    : { ...base, quarter: Number(quarter), group, groupKey: groupKey(group), diagnosticCompleted: false };
}

// ------------------------------------------------------------
//  FIREBASE
// ------------------------------------------------------------
async function firebaseBackend() {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-firestore.js`),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  auth.languageCode = "en";
  await A.setPersistence(auth, A.browserSessionPersistence); // logs out when the tab closes (shared lab PCs)
  const db = F.getFirestore(app);
  const userRef = (uid) => F.doc(db, "users", uid);
  // If this site's address is not yet in Firebase's authorized domains, send the
  // e-mail without the "continue" link instead of failing the sign-up.
  async function sendVerification(user, schoolId) {
    try { await A.sendEmailVerification(user, { url: returnUrl(schoolId) }); }
    catch (e) {
      if (/unauthorized-continue-uri|invalid-continue-uri/.test(e.code || "")) await A.sendEmailVerification(user);
      else throw e;
    }
  }

  return {
    async signUp(data) {
      try {
        const profile = newProfile(data);
        const cred = await A.createUserWithEmailAndPassword(auth, data.email, data.password);
        await A.updateProfile(cred.user, { displayName: `${data.firstName} ${data.lastName}` });
        await F.setDoc(userRef(cred.user.uid), { ...profile, createdAt: F.serverTimestamp() });
        await sendVerification(cred.user, profile.schoolId);
        await A.signOut(auth);
        return {};
      } catch (e) { throw wrap(e); }
    },

    async verify(oobCode) {
      try { await A.applyActionCode(auth, oobCode); } catch (e) { throw wrap(e); }
    },

    async signIn(schoolId, password) {
      try {
        const cred = await A.signInWithEmailAndPassword(auth, toEmail(schoolId), password);
        await cred.user.reload();
        if (!cred.user.emailVerified) {
          throw new AppError("not-verified", "Please verify your e-mail first. Check your inbox (and spam folder).");
        }
        await cred.user.getIdToken(true); // refresh token so rules see email_verified = true
        const ref = userRef(cred.user.uid);
        const snap = await F.getDoc(ref);
        const profile = snap.exists() ? snap.data() : { schoolId, firstName: "", role: "student" };
        await F.updateDoc(ref, { emailVerified: true, lastLogin: F.serverTimestamp() }).catch(() => {});
        return { ...profile, uid: cred.user.uid, isNew: !profile.diagnosticCompleted };
      } catch (e) {
        if (e.code !== "not-verified") await A.signOut(auth).catch(() => {});
        throw wrap(e);
      }
    },

    async resendVerification() {
      try {
        const user = auth.currentUser;
        if (!user) throw new AppError("no-session", "Log in again to resend the e-mail.");
        await sendVerification(user, toSchoolId(user.email));
        await A.signOut(auth);
      } catch (e) { throw wrap(e); }
    },

    async resetPassword(schoolId) {
      try { await A.sendPasswordResetEmail(auth, toEmail(schoolId), { url: returnUrl(schoolId) }); } catch (e) { throw wrap(e); }
    },

    async saveTeacherSetup(quarters, groups) {
      try {
        await F.updateDoc(userRef(auth.currentUser.uid), { quarters, groups, setupComplete: true });
      } catch (e) { throw wrap(e); }
    },

    async saveDiagnostic(result) {
      try {
        await F.updateDoc(userRef(auth.currentUser.uid), { ...result, diagnosticCompleted: true, diagnosticAt: F.serverTimestamp() });
      } catch (e) { throw wrap(e); }
    },

    async getMyProfile() {
      const snap = await F.getDoc(userRef(auth.currentUser.uid));
      return snap.data();
    },

    async listStudents(quarter, key) {
      try {
        const q = F.query(
          F.collection(db, "users"),
          F.where("role", "==", "student"),
          F.where("quarter", "==", Number(quarter)),
          F.where("groupKey", "==", key),
        );
        const res = await F.getDocs(q);
        return res.docs.map((d) => d.data());
      } catch (e) { throw wrap(e); }
    },

    async signOut() { await A.signOut(auth); },
  };
}

// ------------------------------------------------------------
//  DEMO (localStorage) — for testing before Firebase is set up
// ------------------------------------------------------------
function demoBackend() {
  const KEY = "itep_demo_accounts";
  let memory = {}; // fallback when the browser blocks localStorage
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return memory; } };
  const save = (db) => { memory = db; try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} };
  const hash = async (s) => {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  };
  const link = (id) => `${location.origin}${location.pathname}?mode=verifyEmail&oobCode=demo-${encodeURIComponent(id)}&id=${encodeURIComponent(id)}`;
  let pending = null; // account waiting for "resend"
  let current = null; // signed-in school ID

  return {
    async signUp(data) {
      const db = load();
      const profile = newProfile(data);
      if (db[profile.schoolId]) throw new AppError("auth/email-already-in-use", MESSAGES["auth/email-already-in-use"]);
      if (profile.role === "teacher") profile.approved = true; // demo only
      db[profile.schoolId] = { profile: { ...profile, createdAt: new Date().toISOString() }, pass: await hash(data.password) };
      save(db);
      return { demoLink: link(profile.schoolId), firstName: data.firstName, email: data.email };
    },

    async verify(oobCode) {
      const id = decodeURIComponent(oobCode.replace(/^demo-/, ""));
      const db = load();
      if (!db[id]) throw new AppError("auth/invalid-action-code", MESSAGES["auth/invalid-action-code"]);
      db[id].profile.emailVerified = true; save(db);
    },

    async signIn(schoolId, password) {
      const db = load(); const acc = db[schoolId];
      if (!acc || acc.pass !== (await hash(password))) throw new AppError("auth/invalid-credential", MESSAGES["auth/invalid-credential"]);
      if (!acc.profile.emailVerified) { pending = schoolId; throw new AppError("not-verified", "Please verify your e-mail first. Check your inbox (and spam folder)."); }
      acc.profile.lastLogin = new Date().toISOString(); save(db);
      current = schoolId;
      return { ...acc.profile, uid: schoolId, isNew: !acc.profile.diagnosticCompleted };
    },

    async resendVerification() {
      const acc = load()[pending];
      if (!acc) throw new AppError("no-session", "Log in again to resend the e-mail.");
      return { demoLink: link(pending), firstName: acc.profile.firstName, email: acc.profile.email };
    },

    async resetPassword() { throw new AppError("demo", "Password reset works once Firebase is connected."); },

    async saveTeacherSetup(quarters, groups) {
      const db = load(); Object.assign(db[current].profile, { quarters, groups, setupComplete: true }); save(db);
    },

    async getMyProfile() { return load()[current]?.profile; },

    async saveDiagnostic(result) {
      const db = load(); Object.assign(db[current].profile, result, { diagnosticCompleted: true, diagnosticAt: new Date().toISOString() }); save(db);
    },

    async listStudents(quarter, key) {
      return Object.values(load()).map((a) => a.profile)
        .filter((p) => p.role === "student" && p.quarter === Number(quarter) && p.groupKey === key);
    },

    async signOut() { current = null; },
  };
}

export async function createBackend() {
  return DEMO ? demoBackend() : firebaseBackend();
}
