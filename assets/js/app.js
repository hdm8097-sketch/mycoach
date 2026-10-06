/* =========================================================
   MyCoach — التطبيق الرئيسي (التوجيه / اللوحة / النسخ الاحتياطي)
   ========================================================= */
const App = (() => {
  const TITLES = {
    dashboard: ["لوحة التحكم", "Dashboard & overview"],
    exercises: ["قاعدة التمارين", "Exercise library —  muscles, equipment, form"],
    plans: ["خطط التمارين", "Workout plans — templates & builder"],
    clients: ["متابعة العملاء", "Clients — measurements, attendance, sessions"],
    nutrition: ["التغذية والحميات", "Nutrition — calories, macros, meal plans"],
    three: ["المختبر ثلاثي الأبعاد", "3D studio — anatomy, motion lab & plate loader"],
    settings: ["الإعدادات", "Trainer profile & backup"]
  };
  let current = "dashboard";

  /* ---------- التوجيه ---------- */
  function go(view) {
    if (!TITLES[view]) view = "dashboard";
    current = view;
    UI.$$(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.view === view));
    UI.$$(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + view));
    UI.$("#viewTitle").textContent = TITLES[view][0];
    UI.$("#viewSub").textContent = TITLES[view][1];
    UI.$("#sidebar").classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (view !== "three" && typeof View3D !== "undefined") View3D.pause();
    render(view);
  }

  function render(view) {
    if (view === "dashboard") dashboard();
    if (view === "exercises") Exercises.render();
    if (view === "plans") Plans.render();
    if (view === "clients") Clients.render();
    if (view === "three") View3D.render();
    if (view === "settings") settings();
  }

  function refreshSidebar() {
    const st = Store.get();
    UI.$("#miniEx").textContent = Store.allExercises().length;
    UI.$("#miniPlans").textContent = st.plans.length;
    UI.$("#miniClients").textContent = st.clients.length;
  }

  /* ---------- لوحة التحكم ---------- */
  function dashboard() {
    const st = Store.get();
    const activeClients = st.clients.filter(c => c.planId).length;
    const sessions = st.clients.reduce((s, c) => s + (c.workouts || []).length, 0);
    const att = st.clients.reduce((s, c) => s + (c.attendance || []).length, 0);
    const exTotal = Store.allExercises().length;

    UI.$("#dashCards").innerHTML = `
      <div class="card"><div class="k">التمارين في المكتبة</div><div class="v">${exTotal}</div>
        <div class="s">${st.customExercises.length} منها مخصّصة لك</div></div>
      <div class="card i2"><div class="k">خطط التمارين</div><div class="v">${st.plans.length}</div>
        <div class="s">${st.plans.reduce((s, p) => s + p.days.reduce((x, d) => x + d.items.length, 0), 0)} تمرين داخل الخطط</div></div>
      <div class="card i3"><div class="k">العملاء</div><div class="v">${st.clients.length}</div>
        <div class="s">${activeClients} لديهم كورس نشط</div></div>
      <div class="card i4"><div class="k">جلسات مسجّلة</div><div class="v">${sessions + att}</div>
        <div class="s">تعاقب ${st.clients.length} عميل</div></div>`;

    // النشاط
    const act = st.activity || [];
    UI.$("#dashActivity").innerHTML = act.length
      ? act.slice(0, 8).map(a => `<div class="act"><span class="dot"></span>
          <div style="flex:1"><div class="t">${UI.esc(a.t)}</div>
          <div class="d">${UI.fmtDate(a.d)}</div></div></div>`).join("")
      : `<p class="muted">لا يوجد نشاط بعد — ابدأ بإضافة عميل أو خطة.</p>`;

    // تمرين اليوم
    const plan = (st.clients.find(c => c.planId) || {}).planId
      ? Store.getPlan(st.clients.find(c => c.planId).planId) : st.plans[0];
    if (!plan) {
      UI.$("#dashToday").innerHTML = UI.empty("🏋️", "لا توجد خطة لعرض تمرين اليوم",
        "أنشئ خطة أو استخدم أحد القوالب الجاهزة",
        `<button class="btn btn-primary" onclick="App.go('plans');setTimeout(()=>Plans.templates(),300)">تصفح القوالب</button>`);
      return;
    }
    const idx = (new Date().getDay() + 6) % 7;   // الاثنين = 0
    const day = plan.days[idx % plan.days.length];
    if (typeof plan.freeText === "string") {
      UI.$("#dashToday").innerHTML = `
        <div class="stat-line" style="margin-bottom:8px;font-size:13px">
          <span style="color:var(--brand2)">📌 ${UI.esc(plan.name)}</span> ·
          <span>✍️ خطة نصية</span>
          <button class="btn btn-sm btn-ghost" style="margin-right:auto" onclick="Plans.editor('${plan.id}')">فتح الخطة</button>
        </div>
        <div class="free-preview">${UI.esc(plan.freeText)}</div>`;
      return;
    }
    UI.$("#dashToday").innerHTML = `
      <div class="stat-line" style="margin-bottom:8px;font-size:13px">
        <span style="color:var(--brand2)">📌 ${UI.esc(plan.name)}</span> ·
        <span>${UI.esc(day.name)} — ${day.items.length} تمرين</span>
        <button class="btn btn-sm btn-ghost" style="margin-right:auto" onclick="Plans.editor('${plan.id}')">فتح الخطة</button>
      </div>
      ${day.items.map((it, i) => {
        const e = Store.getEx(it.ex) || { ar: "تمرين", en: "", m: "full" };
        return `<div class="ex-row" onclick="Exercises.open('${it.ex}')" style="cursor:pointer">
          <div><b>${i + 1}. ${UI.esc(e.ar)}</b><div class="en">${UI.esc(e.en)}</div></div>
          <span class="tag">${it.sets} مجموعات</span>
          <span class="tag">${UI.esc(it.reps)} تكرار</span>
          <span class="tag">${it.rest ? it.rest + "ث راحة" : "—"}</span>
        </div>`;
      }).join("")}`;
  }

  /* ---------- بحث عالمي ---------- */
  function search(q) {
    q = q.toLowerCase().trim();
    if (!q) return;
    const ex = Store.allExercises().filter(e => (e.ar + " " + e.en).toLowerCase().includes(q)).slice(0, 6);
    const pl = Store.get().plans.filter(p => (p.name + " " + (p.nameEn || "")).toLowerCase().includes(q)).slice(0, 5);
    const cl = Store.get().clients.filter(c => (c.name + " " + (c.phone || "")).toLowerCase().includes(q)).slice(0, 5);
    const none = !ex.length && !pl.length && !cl.length;
    UI.modal({
      title: `نتائج البحث عن «${q}»`, hideSave: true,
      body: none ? UI.empty("🔍", "لا توجد نتائج", "جرّب كلمة أخرى") : `
        ${ex.length ? `<div class="sect-title">تمارين (${ex.length})</div>
          ${ex.map(e => `<div class="ex-row" style="cursor:pointer" data-goex="${e.id}">
            <div><b>${UI.esc(e.ar)}</b><div class="en">${UI.esc(e.en)}</div></div>
            <span class="tag mus">${(MUSCLES[e.m] || {}).ar}</span><span></span>
            <span class="tag info">فتح</span></div>`).join("")}` : ""}
        ${pl.length ? `<div class="sect-title">خطط (${pl.length})</div>
          ${pl.map(p => `<div class="ex-row" style="cursor:pointer" data-goplan="${p.id}">
            <div><b>${UI.esc(p.name)}</b><div class="en">${UI.esc(p.kind)}</div></div>
            <span class="tag">${typeof p.freeText === "string" ? "✍️ خطة نصية" : p.days.length + " أيام"}</span><span></span>
            <span class="tag info">فتح</span></div>`).join("")}` : ""}
        ${cl.length ? `<div class="sect-title">عملاء (${cl.length})</div>
          ${cl.map(c => `<div class="ex-row" style="cursor:pointer" data-goclient="${c.id}">
            <div><b>${UI.esc(c.name)}</b><div class="en">${UI.esc(c.phone || "")}</div></div>
            <span class="tag">${(GOALS[c.goal] || {}).ar}</span><span></span>
            <span class="tag info">فتح</span></div>`).join("")}` : ""}`
    });
    UI.$("#modalBody").onclick = ev => {
      const t = ev.target.closest("[data-goex],[data-goplan],[data-goclient]"); if (!t) return;
      UI.closeModal();
      if (t.dataset.goex) { go("exercises"); setTimeout(() => Exercises.open(t.dataset.goex), 200); }
      if (t.dataset.goplan) { go("plans"); setTimeout(() => Plans.editor(t.dataset.goplan), 200); }
      if (t.dataset.goclient) { go("clients"); setTimeout(() => Clients.open(t.dataset.goclient), 200); }
    };
  }

  /* ---------- النسخ الاحتياطي ---------- */
  function backup() {
    const blob = new Blob([Store.export()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mycoach-backup-${UI.today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    UI.toast("تم تصدير النسخة الاحتياطية ⬇️");
  }

  function restore(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        Store.import(JSON.parse(r.result));
        refreshSidebar(); go(current);
        UI.toast("تم استيراد البيانات بنجاح ✓");
      } catch (e) { UI.toast("ملف غير صالح: " + e.message, "err"); }
    };
    r.readAsText(file);
  }

  /* ---------- الثيمات ---------- */
  const THEMES = [
    { k: "dark",   ar: "داكن كلاسيكي", en: "Dark Classic", ico: "🌙", short: "داكن",
      sw: ["#0d1117", "#161d2b", "#ff6b35", "#ffa542"] },
    { k: "light",  ar: "فاتح", en: "Light", ico: "☀️", short: "فاتح",
      sw: ["#f3f6fb", "#ffffff", "#ff6b35", "#e15514"] },
    { k: "ocean",  ar: "أزرق محيطي", en: "Ocean", ico: "🌊", short: "محيطي",
      sw: ["#061420", "#0e2032", "#22d3ee", "#7de3ff"] },
    { k: "violet", ar: "بنفسجي", en: "Violet", ico: "💜", short: "بنفسجي",
      sw: ["#0f0b1a", "#191231", "#a78bfa", "#c9bcff"] }
  ];
  const themeOf = k => THEMES.find(t => t.k === k) || THEMES[0];
  const currentTheme = () => (Store.get().settings || {}).theme || "dark";

  function applyTheme(key) {
    document.documentElement.setAttribute("data-theme", key);
    if (typeof View3D !== "undefined" && View3D.applyTheme) View3D.applyTheme();
    const lb = UI.$("#themeName");
    if (lb) lb.textContent = themeOf(key).short;
  }

  function setTheme(key) {
    const s = Store.get().settings;
    s.theme = key; Store.save();
    applyTheme(key);
    const active = document.querySelector(".view.active");
    if (active && active.id === "view-settings") settings();
  }

  function cycleTheme() {
    const i = THEMES.findIndex(t => t.k === currentTheme());
    const n = THEMES[(i + 1) % THEMES.length];
    setTheme(n.k);
    UI.toast("الثيم: " + n.ar + " ✓");
  }

  function themeCards() {
    return THEMES.map(t => `
      <button class="theme-card ${t.k === currentTheme() ? "active" : ""}" data-theme-key="${t.k}">
        <span class="theme-ico">${t.ico}</span>
        <span class="theme-name">${t.ar}<em>${t.en}</em></span>
        <span class="theme-sw">${t.sw.map(c => `<i style="background:${c}"></i>`).join("")}</span>
        <span class="theme-check">✓</span>
      </button>`).join("");
  }

  /* ---------- الإعدادات ---------- */
  function settings() {
    const s = Store.get().settings;
    UI.$("#setName").value = s.trainer || "";
    UI.$("#setGym").value = s.gym || "";
    UI.$("#setPhone").value = s.phone || "";
    const grid = UI.$("#themeGrid");
    if (grid) {
      grid.innerHTML = themeCards();
      grid.onclick = e => {
        const b = e.target.closest("[data-theme-key]");
        if (b) { setTheme(b.dataset.themeKey); UI.toast("الثيم: " + themeOf(b.dataset.themeKey).ar + " ✓"); }
      };
    }
  }

  /* ---------- التشغيل ---------- */
  function init() {
    Store.load();
    refreshSidebar();
    applyTheme(currentTheme());

    UI.$$("#mainNav .nav-item").forEach(b => b.onclick = () => go(b.dataset.view));
    UI.$("#navToggle").onclick = () => UI.$("#sidebar").classList.toggle("open");

    // وحدات
    Exercises.init(); Plans.init(); Clients.init(); Nutrition.init(); View3D.init();

    // أزرار اللوحة
    UI.$$(".quick-actions .qa").forEach(b => b.onclick = () => {
      go(b.dataset.go);
      if (b.dataset.act === "new") setTimeout(() => {
        if (b.dataset.go === "plans") Plans.newPlan();
        else Clients.form();
      }, 250);
    });

    // المودال
    UI.$("#modalClose").onclick = UI.closeModal;
    UI.$("#modalBackdrop").onclick = e => { if (e.target.id === "modalBackdrop") UI.closeModal(); };
    UI.$("#modalFoot").addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.hasAttribute("data-x")) UI.closeModal();
      if (b.hasAttribute("data-save")) {
        const cb = window.__modalSave;
        if (cb) cb(); else UI.closeModal();
      }
    });
    UI.$("#drawerClose").onclick = UI.closeDrawer;
    UI.$("#drawerBackdrop").onclick = e => { if (e.target.id === "drawerBackdrop") UI.closeDrawer(); };
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") { UI.closeModal(); UI.closeDrawer(); }
      if (e.key === "Enter" && !UI.$("#modalBackdrop").hidden && e.target.tagName !== "TEXTAREA") {
        const cb = window.__modalSave;
        if (cb && !e.target.closest("[multiple]")) { e.preventDefault(); cb(); }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); UI.$("#globalSearch").focus(); }
    });

    // بحث
    UI.$("#globalSearch").addEventListener("keydown", e => {
      if (e.key === "Enter") search(e.target.value);
    });

    // الثيم السريع من الشريط العلوي
    UI.$("#btnTheme").onclick = cycleTheme;

    // نسخ احتياطي
    UI.$("#btnBackup").onclick = backup;
    UI.$("#btnExport2").onclick = backup;
    UI.$("#btnRestore").onclick = UI.$("#btnImport2").onclick = () => UI.$("#fileRestore").click();
    UI.$("#fileRestore").onchange = e => { if (e.target.files[0]) restore(e.target.files[0]); e.target.value = ""; };
    UI.$("#btnReset").onclick = () => UI.confirm(
      "سيتم حذف <b>كل</b> الخطط والعملاء والقياسات نهائياً. هل أنت متأكد؟",
      () => { Store.reset(); refreshSidebar(); go("dashboard"); UI.toast("تم تصفير البيانات", "warn"); });

    UI.$("#btnSaveSettings").onclick = () => {
      const s = Store.get().settings;
      s.trainer = UI.$("#setName").value.trim();
      s.gym = UI.$("#setGym").value.trim();
      s.phone = UI.$("#setPhone").value.trim();
      Store.save(); UI.toast("حُفظت بياناتك ✓");
    };

    go("dashboard");
  }

  document.addEventListener("DOMContentLoaded", init);

  return { go, render, refreshSidebar, backup, search };
})();
