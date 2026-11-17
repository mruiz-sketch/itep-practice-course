// ============================================================
//  Teacher area: quarters → groups → folders → courses → roster
// ============================================================
import { groupKey } from "./backend.js";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const QUARTERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const ORD = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
export const quarterName = (q) => (Number(q) === 0 ? "Immersion" : `${ORD[q]} quarter`);
const quarterShort = (q) => (Number(q) === 0 ? "0 · Immersion" : ORD[q]);

const FOLDER_SVG = `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M6 10a4 4 0 0 1 4-4h9.2a4 4 0 0 1 2.9 1.2L25 10h13a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4z" opacity=".9"/><path fill="#fff" opacity=".25" d="M6 16h36v4H6z"/></svg>`;
const COURSE_SVG = `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="6" width="32" height="36" rx="5" fill="none" stroke="currentColor" stroke-width="3"/><path d="M15 16h18M15 23h18M15 30h11" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`;

export function createTeacherArea({ backend, toast, onLogout }) {
  const root = $("#teacher");
  const views = { quarters: $("#tQuarters"), groups: $("#tGroups"), dash: $("#tDash") };
  let profile = null;
  let picked = new Set();
  let draftGroups = {};

  function show(name) {
    Object.entries(views).forEach(([k, el]) => el.classList.toggle("show", k === name));
  }

  // ---------- Step 1: quarters ----------
  function renderQuarters() {
    const grid = $("#qGrid");
    grid.innerHTML = QUARTERS.map((q) =>
      `<button type="button" class="q-chip ${picked.has(q) ? "on" : ""}" data-q="${q}" aria-pressed="${picked.has(q)}">${q === 0 ? "0 · <small>Immersion</small>" : ORD[q]}</button>`
    ).join("");
  }
  $("#qGrid").addEventListener("click", (e) => {
    const b = e.target.closest(".q-chip"); if (!b) return;
    const q = Number(b.dataset.q);
    picked.has(q) ? picked.delete(q) : picked.add(q);
    b.classList.toggle("on", picked.has(q));
    b.setAttribute("aria-pressed", picked.has(q));
  });

  // ---------- Step 2: groups ----------
  function renderGroups() {
    const qs = [...picked].sort((a, b) => a - b);
    $("#gList").innerHTML = qs.map((q) => `
      <div class="g-row">
        <span>${esc(quarterName(q))}</span>
        <div class="chip-box" data-q="${q}">
          ${(draftGroups[q] || []).map((g) => chip(g)).join("")}
          <input type="text" aria-label="Groups for ${esc(quarterName(q))}" placeholder="${(draftGroups[q] || []).length ? "" : "Add a group…"}" />
        </div>
      </div>`).join("");
  }
  const chip = (g) => `<span class="g-chip">${esc(g)}<button type="button" data-remove="${esc(g)}" aria-label="Remove ${esc(g)}">×</button></span>`;

  function addGroups(box, raw) {
    const q = box.dataset.q;
    const list = draftGroups[q] || (draftGroups[q] = []);
    raw.split(/[,;\n]+/).map((s) => s.trim().toUpperCase().slice(0, 16)).filter(Boolean).forEach((g) => {
      if (!list.some((x) => groupKey(x) === groupKey(g))) {
        list.push(g);
        box.querySelector("input").insertAdjacentHTML("beforebegin", chip(g));
      }
    });
    box.querySelector("input").placeholder = "";
    box.classList.remove("invalid");
  }
  $("#gList").addEventListener("keydown", (e) => {
    if (e.target.tagName !== "INPUT") return;
    const box = e.target.closest(".chip-box");
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (e.target.value.trim()) { addGroups(box, e.target.value); e.target.value = ""; }
    } else if (e.key === "Backspace" && !e.target.value) {
      const list = draftGroups[box.dataset.q] || [];
      const last = list.pop();
      if (last) box.querySelectorAll(".g-chip")[list.length]?.remove();
    }
  });
  $("#gList").addEventListener("paste", (e) => {
    if (e.target.tagName !== "INPUT") return;
    e.preventDefault();
    addGroups(e.target.closest(".chip-box"), e.clipboardData.getData("text"));
  });
  $("#gList").addEventListener("focusout", (e) => {
    if (e.target.tagName === "INPUT" && e.target.value.trim()) { addGroups(e.target.closest(".chip-box"), e.target.value); e.target.value = ""; }
  });
  $("#gList").addEventListener("click", (e) => {
    const rm = e.target.closest("[data-remove]");
    const box = e.target.closest(".chip-box");
    if (rm) {
      const q = box.dataset.q;
      draftGroups[q] = (draftGroups[q] || []).filter((g) => g !== rm.dataset.remove);
      rm.parentElement.remove();
    } else if (box) box.querySelector("input").focus();
  });

  async function createCourses(btn) {
    // pick up anything still typed in the inputs
    document.querySelectorAll("#gList .chip-box").forEach((box) => {
      const inp = box.querySelector("input");
      if (inp.value.trim()) { addGroups(box, inp.value); inp.value = ""; }
    });
    const quarters = [...picked].sort((a, b) => a - b);
    const missing = quarters.filter((q) => !(draftGroups[q] || []).length);
    if (missing.length) {
      missing.forEach((q) => document.querySelector(`.chip-box[data-q="${q}"]`)?.classList.add("invalid"));
      toast(`Add at least one group for: ${missing.map(quarterName).join(", ")}.`, "error");
      return;
    }
    const groups = {};
    quarters.forEach((q) => (groups[q] = draftGroups[q]));
    btn.disabled = true;
    try {
      await backend.saveTeacherSetup(quarters, groups);
      Object.assign(profile, { quarters, groups, setupComplete: true });
      toast("Your courses are ready!", "success");
      openFolders();
    } catch (err) { toast(err.message, "error"); }
    finally { btn.disabled = false; }
  }

  // ---------- Dashboard ----------
  function crumbs(parts) {
    $("#crumbs").innerHTML = parts.map((p, i) => i === parts.length - 1
      ? `<span class="here">${esc(p.label)}</span>`
      : `<button type="button" data-crumb="${i}">${esc(p.label)}</button><span class="sep">›</span>`).join("");
    $("#crumbs").onclick = (e) => { const b = e.target.closest("[data-crumb]"); if (b) parts[b.dataset.crumb].go(); };
  }

  function openFolders() {
    show("dash");
    crumbs([{ label: "My courses" }]);
    const qs = (profile.quarters || []).slice().sort((a, b) => a - b);
    $("#tContent").innerHTML = `
      <h2>MY COURSES</h2>
      <div class="card-grid">
        ${qs.map((q) => {
          const n = (profile.groups?.[q] || []).length;
          return `<button type="button" class="card" data-folder="${q}">${FOLDER_SVG}
            <div class="c-title">${esc(quarterName(q))}</div>
            <div class="c-sub">${n} ${n === 1 ? "course" : "courses"}</div></button>`;
        }).join("")}
      </div>`;
    $("#tContent").onclick = (e) => { const b = e.target.closest("[data-folder]"); if (b) openFolder(Number(b.dataset.folder)); };
  }

  function openFolder(q) {
    show("dash");
    crumbs([{ label: "My courses", go: openFolders }, { label: quarterName(q) }]);
    const groups = profile.groups?.[q] || [];
    $("#tContent").innerHTML = `
      <h2>${esc(quarterName(q).toUpperCase())}</h2>
      <div class="card-grid">
        ${groups.map((g) => `<button type="button" class="card course" data-course="${esc(g)}">${COURSE_SVG}
          <div class="c-title">${esc(g)}</div>
          <div class="c-sub">${esc(quarterName(q))}</div></button>`).join("")}
      </div>`;
    $("#tContent").onclick = (e) => { const b = e.target.closest("[data-course]"); if (b) openCourse(q, b.dataset.course); };
  }

  async function openCourse(q, g) {
    show("dash");
    crumbs([{ label: "My courses", go: openFolders }, { label: quarterName(q), go: () => openFolder(q) }, { label: g }]);
    $("#tContent").onclick = null;
    $("#tContent").innerHTML = `
      <div class="course-head"><h2>${esc(g)} · ${esc(quarterName(q))}</h2><span class="count" id="rosterCount"></span></div>
      <div class="tabs" role="tablist"><button type="button" class="tab on" role="tab" aria-selected="true">Students</button></div>
      <div id="rosterBox"><p class="empty">Loading students…</p></div>`;
    const box = $("#rosterBox");

    if (!profile.approved) {
      box.innerHTML = `<div class="notice"><strong>Your teacher account is waiting for approval.</strong><br>
        Once the platform administrator approves it, the students of this course will appear here automatically.</div>`;
      return;
    }
    try {
      const list = await backend.listStudents(q, groupKey(g));
      list.sort((a, b) =>
        a.lastName.localeCompare(b.lastName, "es", { sensitivity: "base" }) ||
        a.firstName.localeCompare(b.firstName, "es", { sensitivity: "base" }));
      $("#rosterCount").textContent = `${list.length} ${list.length === 1 ? "student" : "students"}`;
      if (!list.length) {
        box.innerHTML = `<p class="empty">No students yet.<br>Students appear here automatically when they create their account with quarter <strong>${esc(quarterShort(q))}</strong> and group <strong>${esc(g)}</strong>.</p>`;
        return;
      }
      box.innerHTML = `
        <table class="roster">
          <thead><tr><th>#</th><th>Last name</th><th>First name</th><th>School ID</th><th class="hide-sm">E-mail</th><th>Diagnostic test</th></tr></thead>
          <tbody>${list.map((s, i) => `
            <tr><td class="num">${i + 1}</td><td>${esc(s.lastName)}</td><td>${esc(s.firstName)}</td>
            <td>${esc(s.schoolId)}</td><td class="hide-sm">${esc(s.email)}</td><td>${diagnostic(s)}</td></tr>`).join("")}
          </tbody>
        </table>`;
    } catch (err) {
      box.innerHTML = `<div class="notice">${esc(err.message)}</div>`;
    }
  }

  function diagnostic(s) {
    if (s.diagnosticLevel || s.diagnosticScore != null) {
      const parts = [s.diagnosticLevel, s.diagnosticScore != null ? `${s.diagnosticScore}` : ""].filter(Boolean);
      return `<span class="pill done">${esc(parts.join(" · "))}</span>`;
    }
    return `<span class="pill">Not taken yet</span>`;
  }

  // ---------- Open / close ----------
  function startSetup() {
    picked = new Set(profile.quarters || []);
    draftGroups = JSON.parse(JSON.stringify(profile.groups || {}));
    renderQuarters();
    show("quarters");
  }

  root.addEventListener("click", (e) => {
    const a = e.target.closest("[data-action]"); if (!a) return;
    switch (a.dataset.action) {
      case "t-next":
        if (!picked.size) { toast("Please select at least one quarter.", "error"); return; }
        renderGroups(); show("groups");
        setTimeout(() => $("#gList input")?.focus({ preventScroll: true }), 400);
        break;
      case "t-back": show("quarters"); break;
      case "t-create": createCourses(a); break;
      case "t-edit": startSetup(); break;
    }
  });

  return {
    open(p) {
      profile = p;
      $("#teacherUser").textContent = `Teacher: ${p.firstName} ${p.lastName}`;
      document.body.classList.add("is-diag");
      root.classList.add("show");
      root.setAttribute("aria-hidden", "false");
      p.setupComplete ? openFolders() : startSetup();
    },
    close() {
      root.classList.remove("show");
      root.setAttribute("aria-hidden", "true");
      Object.values(views).forEach((v) => v.classList.remove("show"));
      profile = null;
    },
  };
}
