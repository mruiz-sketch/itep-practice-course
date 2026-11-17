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

// Where the "Verify e-mail" button sends the student back.
function returnUrl(schoolId) {
  const base = `${location.origin}${location.pathname}`;
  return `${base}?verified=1&id=${encodeURIComponent(schoolId)}`;
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
};
const wrap = (e) => (e instanceof AppError ? e : new AppError(e.code || "unknown", MESSAGES[e.code] || "Something went wrong. Please try again."));

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

  return {
    async signUp({ firstName, lastName, email, quarter, group, password }) {
      try {
        const schoolId = toSchoolId(email);
        const cred = await A.createUserWithEmailAndPassword(auth, email, password);
        await A.updateProfile(cred.user, { displayName: `${firstName} ${lastName}` });
        await F.setDoc(userRef(cred.user.uid), {
          firstName, lastName,
          quarter: Number(quarter), group,
          email, schoolId,
          role: "student",
          emailVerified: false,
          diagnosticCompleted: false,
          createdAt: F.serverTimestamp(),
        });
        await A.sendEmailVerification(cred.user, { url: returnUrl(schoolId) });
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
        const ref = userRef(cred.user.uid);
        const snap = await F.getDoc(ref);
        const profile = snap.exists() ? snap.data() : { schoolId, firstName: "" };
        await F.updateDoc(ref, { emailVerified: true, lastLogin: F.serverTimestamp() }).catch(() => {});
        return { ...profile, isNew: !profile.diagnosticCompleted };
      } catch (e) {
        if (e.code === "not-verified") { /* keep session so we can resend */ } else { await A.signOut(auth).catch(() => {}); }
        throw wrap(e);
      }
    },

    async resendVerification() {
      try {
        const user = auth.currentUser;
        if (!user) throw new AppError("no-session", "Log in again to resend the e-mail.");
        await A.sendEmailVerification(user, { url: returnUrl(toSchoolId(user.email)) });
        await A.signOut(auth);
      } catch (e) { throw wrap(e); }
    },

    async resetPassword(schoolId) {
      try { await A.sendPasswordResetEmail(auth, toEmail(schoolId), { url: returnUrl(schoolId) }); } catch (e) { throw wrap(e); }
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
  let pending = null; // account waiting for "resend"

  return {
    async signUp({ firstName, lastName, email, quarter, group, password }) {
      const db = load();
      const schoolId = toSchoolId(email);
      if (db[schoolId]) throw new AppError("auth/email-already-in-use", MESSAGES["auth/email-already-in-use"]);
      db[schoolId] = {
        profile: { firstName, lastName, quarter: Number(quarter), group, email, schoolId, role: "student", emailVerified: false, diagnosticCompleted: false, createdAt: new Date().toISOString() },
        pass: await hash(password),
      };
      save(db);
      const base = `${location.origin}${location.pathname}`;
      return { demoLink: `${base}?mode=verifyEmail&oobCode=demo-${encodeURIComponent(schoolId)}&id=${encodeURIComponent(schoolId)}`, firstName, email };
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
      return { ...acc.profile, isNew: !acc.profile.diagnosticCompleted };
    },

    async resendVerification() {
      const acc = load()[pending];
      if (!acc) throw new AppError("no-session", "Log in again to resend the e-mail.");
      const base = `${location.origin}${location.pathname}`;
      return { demoLink: `${base}?mode=verifyEmail&oobCode=demo-${encodeURIComponent(pending)}&id=${encodeURIComponent(pending)}`, firstName: acc.profile.firstName, email: acc.profile.email };
    },

    async resetPassword() {
      throw new AppError("demo", "Password reset works once Firebase is connected.");
    },

    async signOut() {},
  };
}

export async function createBackend() {
  return DEMO ? demoBackend() : firebaseBackend();
}
