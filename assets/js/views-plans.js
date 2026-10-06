/* =========================================================
   MyCoach — عرض خطط التمارين (قوالب + محرر + طباعة)
   ========================================================= */
const Plans = (() => {
  const f = { sort: "new", kind: "" };

  function init() {
    UI.$("#btnNewPlan").addEventListener("click", () => newPlan());
    UI.$("#btnNewTextPlan").addEventListener("click", () => textPlan());
    UI.$("#btnPlanTemplates").addEventListener("click", templates);
    UI.$("#planSort").addEventListener("change", e => { f.sort = e.target.value; render(); });
    UI.$("#planFilter").addEventListener("change", e => { f.kind = e.target.value; render(); });
  }

  /* ---------- القائمة ---------- */
  function render() {
    const plans = Store.get().plans.slice();
    if (f.kind) plans = plans.filter(p => p.kind === f.kind);
    plans.sort((a, b) => f.sort === "name" ? a.name.localeCompare(b.name, "ar") : b.createdAt - a.createdAt);

    // فلتر الأنواع
    const kinds = [...new Set(Store.get().plans.map(p => p.kind))];
    const sel = UI.$("#planFilter"), cur = f.kind;
    sel.innerHTML = `<option value="">كل الخطط / All plans (${Store.get().plans.length})</option>` +
      kinds.map(k => `<option value="${UI.esc(k)}" ${k === cur ? "selected" : ""}>${UI.esc(k)}</option>`).join("");

    if (!plans.length) {
      UI.$("#planGrid").innerHTML = UI.empty("📋", "لا توجد خطط بعد",
        "ابدأ من قالب جاهز أو أنشئ خطتك من الصفر",
        `<div class="filters" style="justify-content:center">
          <button class="btn btn-primary" onclick="document.getElementById('btnPlanTemplates').click()">🧩 قوالب جاهزة</button>
          <button class="btn btn-soft" onclick="document.getElementById('btnNewPlan').click()">+ خطة جديدة</button>
          <button class="btn btn-soft" onclick="document.getElementById('btnNewTextPlan').click()">✍️ خطة نصية</button></div>`);
      return;
    }

    UI.$("#planGrid").innerHTML = plans.map(p => {
      const isText = typeof p.freeText === "string";
      const exCount = p.days.reduce((s, d) => s + d.items.length, 0);
      const vol = p.days.reduce((s, d) => s + d.items.reduce((x, i) => x + (+i.sets || 0), 0), 0);
      const client = Store.get().clients.find(c => c.planId === p.id);
      const lines = isText ? p.freeText.split("\n").filter(x => x.trim()).length : 0;
      return `<article class="item">
        <div class="item-hd">
          <div><h3>${UI.esc(p.name)}</h3><div class="en">${UI.esc(p.nameEn || "")}</div></div>
          <div class="avatar ${UI.grad(p.id)}" style="width:36px;height:36px;flex:0 0 36px;font-size:15px">${isText ? "✍️" : "📋"}</div>
        </div>
        <div class="item-bd">
          <div>${UI.tag(p.kind, "mus")}${UI.tag(GOALS[p.goal] ? GOALS[p.goal].ar : "عام", "info")}
            ${LEVELS[p.level] ? UI.tag(LEVELS[p.level].ar) : ""}</div>
          ${isText ? `
          <div class="kv" style="margin-top:8px"><span>النوع</span><b style="color:var(--brand2)">خطة نصية حرّة</b></div>
          <div class="kv"><span>أسطر البرنامج</span><b>${lines}</b></div>
          <div class="kv"><span>أحرف</span><b>${p.freeText.length}</b></div>` : `
          <div class="kv" style="margin-top:8px"><span>الأيام</span><b>${p.days.length}</b></div>
          <div class="kv"><span>إجمالي التمارين</span><b>${exCount}</b></div>
          <div class="kv"><span>إجمالي المجموعات</span><b>${vol}</b></div>`}
          ${client ? `<div class="kv"><span>مسندة إلى</span><b style="color:var(--green)">👥 ${UI.esc(client.name)}</b></div>` : ""}
        </div>
        <div class="item-ft">
          <button class="btn btn-sm btn-ghost" data-dup="${p.id}">⧉ نسخ</button>
          <button class="btn btn-sm btn-ghost" data-print="${p.id}">🖨️</button>
          <button class="btn btn-sm btn-danger" data-del="${p.id}">🗑️</button>
          <button class="btn btn-sm btn-primary" data-edit="${p.id}">فتح وتعديل</button>
        </div>
      </article>`;
    }).join("");

    UI.$("#planGrid").onclick = ev => {
      const t = ev.target.closest("button"); if (!t) return;
      if (t.dataset.edit) editor(t.dataset.edit);
      if (t.dataset.dup) duplicate(t.dataset.dup);
      if (t.dataset.del) del(t.dataset.del);
      if (t.dataset.print) printPlan(t.dataset.print);
    };
  }

  /* ---------- قوالب جاهزة ---------- */
  function templates() {
    UI.modal({
      title: "قوالب جاهزة — اختر نقطة البداية",
      wide: true, hideSave: true,
      body: `<p class="muted" style="margin-top:0">كل قالب قابل للتعديل بالكامل بعد إنشائه.</p>
        <div class="grid-3">${PLAN_TEMPLATES.map(t => `
          <div class="item">
            <div class="item-hd"><div>
              <h3>${UI.esc(t.ar)}</h3><div class="en">${UI.esc(t.en)}</div></div></div>
            <div class="item-bd">
              <div>${UI.tag(t.kind, "mus")}${UI.tag(`${t.days} أيام`, "info")}${UI.tag(LEVELS[t.level].ar)}</div>
              <p style="font-size:13px;color:var(--muted);line-height:1.7;margin:9px 0 0">${UI.esc(t.desc)}</p>
              <div class="meta"><i>${t.dayList.reduce((s, d) => s + d.items.length, 0)} تمرين</i></div>
            </div>
            <div class="item-ft"><button class="btn btn-sm btn-primary" data-tpl="${t.id}">استخدام القالب →</button></div>
          </div>`).join("")}</div>`,
    });
    UI.$("#modalBody").onclick = ev => {
      const b = ev.target.closest("[data-tpl]"); if (!b) return;
      UI.closeModal(); fromTemplate(b.dataset.tpl);
    };
  }

  function fromTemplate(tplId) {
    const tpl = PLAN_TEMPLATES.find(t => t.id === tplId); if (!tpl) return;
    const p = {
      id: Store.uid("plan"),
      name: tpl.ar, nameEn: tpl.en, kind: tpl.kind, goal: tpl.goal, level: tpl.level,
      from: tpl.id, createdAt: Date.now(), notes: tpl.desc,
      days: tpl.dayList.map(d => ({
        id: Store.uid("day"), name: d.ar, nameEn: d.en,
        items: d.items.map(it => ({ ex: it[0], sets: it[1], reps: it[2], rest: it[3] }))
      }))
    };
    Store.get().plans.push(p);
    Store.log(`أنشأ خطة من قالب: ${tpl.ar}`);
    Store.save(); App.refreshSidebar(); render();
    UI.toast("أُنشئت الخطة من القالب ✓");
    editor(p.id);
  }

  function duplicate(id) {
    const p = Store.getPlan(id); if (!p) return;
    const copy = JSON.parse(JSON.stringify(p));
    copy.id = Store.uid("plan"); copy.name = p.name + " — نسخة"; copy.createdAt = Date.now();
    copy.days.forEach(d => d.id = Store.uid("day"));
    Store.get().plans.push(copy); Store.save(); render(); App.refreshSidebar();
    UI.toast("تم إنشاء نسخة من الخطة ✓");
  }

  function del(id) {
    const p = Store.getPlan(id);
    UI.confirm(`حذف الخطة «${UI.esc(p.name)}»؟ (سيُلغى ربطها بأي عميل)`, () => {
      const st = Store.get();
      st.plans = st.plans.filter(x => x.id !== id);
      st.clients.forEach(c => { if (c.planId === id) c.planId = null; });
      Store.save(); render(); App.refreshSidebar(); Clients.render();
      UI.toast("تم حذف الخطة", "warn");
    });
  }

  /* ---------- خطة جديدة ---------- */
  function newPlan() {
    UI.modal({
      title: "إنشاء خطة جديدة",
      body: `<div class="form-grid">
        <label>اسم الخطة (عربي) *<input type="text" id="nName" placeholder="مثال: خطة أحمد — تضخيم"></label>
        <label>الاسم بالإنجليزي<input type="text" id="nNameEn" placeholder="Bulking plan"></label>
        <label>الهدف / Goal<select id="nGoal">
          ${Object.entries(GOALS).map(([k, v]) => `<option value="${k}">${v.ar} · ${v.en}</option>`).join("")}</select></label>
        <label>المستوى / Level<select id="nLevel">
          ${Object.entries(LEVELS).map(([k, v]) => `<option value="${k}">${v.ar}</option>`).join("")}</select></label>
        <label>عدد الأيام / Days<input type="number" id="nDays" value="4" min="1" max="7"></label>
        <label>النوع / Kind<input type="text" id="nKind" value="مخصص" placeholder="تضخيم / خسارة / مبتدئ"></label>
      </div>
      <p class="muted" style="font-size:13px;margin-bottom:0">💡 يمكنك أيضاً البدء من <a href="#" id="lnkTpl" style="color:var(--brand2)">قالب جاهز</a> ثم تعديله.</p>`,
      saveText: "إنشاء الخطة",
      onSave() {
        const name = UI.$("#nName").value.trim();
        if (!name) return UI.toast("أدخل اسم الخطة", "err");
        const n = Math.max(1, Math.min(7, +UI.$("#nDays").value || 3));
        const p = {
          id: Store.uid("plan"), name,
          nameEn: UI.$("#nNameEn").value.trim(),
          goal: UI.$("#nGoal").value, level: UI.$("#nLevel").value,
          kind: UI.$("#nKind").value.trim() || "مخصص",
          createdAt: Date.now(), notes: "",
          days: Array.from({ length: n }, (_, i) => ({
            id: Store.uid("day"), name: `اليوم ${i + 1}`, nameEn: `Day ${i + 1}`, items: []
          }))
        };
        Store.get().plans.push(p);
        Store.log(`أنشأ خطة: ${name}`);
        Store.save(); UI.closeModal(); render(); App.refreshSidebar();
        UI.toast("أُنشئت الخطة ✓");
        editor(p.id);
      }
    });
    UI.$("#lnkTpl").onclick = e => { e.preventDefault(); templates(); };
  }

  /* ---------- المحرر ---------- */
  /* ---------- خطة نصية حرّة ---------- */
  const goalOpts = sel => Object.keys(GOALS).map(k =>
    `<option value="${k}" ${sel === k ? "selected" : ""}>${GOALS[k].ar} · ${GOALS[k].en}</option>`).join("");
  const levelOpts = sel => Object.keys(LEVELS).map(k =>
    `<option value="${k}" ${sel === k ? "selected" : ""}>${LEVELS[k].ar}</option>`).join("");

  function textPlan() {
    UI.modal({
      title: "خطة نصية حرّة — Free-text plan",
      wide: true,
      body: `<div class="form-grid">
        <label>اسم الخطة (عربي) *<input type="text" id="tName" placeholder="مثال: برنامج معتز — تضخيم 5 أيام"></label>
        <label>النوع / Kind<input type="text" id="tKind" value="نص حر" placeholder="تضخيم / خسارة / كارديو"></label>
        <label>الهدف / Goal<select id="tGoal">${goalOpts("bulk")}</select></label>
        <label>المستوى / Level<select id="tLevel">${levelOpts("intermediate")}</select></label>
      </div>
      <label style="margin-top:14px">البرنامج التدريبي — اكتب أو الصق هنا *
        <textarea id="tText" class="free-plan" dir="rtl"
          placeholder="مثال:&#10;السبت — صدر وترايسبس&#10;1) بنش بارا… 4×8 … 80 كجم&#10;2) دامبل فلاي… 3×12 … 22 كجم&#10;&#10;الأحد — أرجل&#10;1) سكوات… 4×6 … 100 كجم"></textarea></label>
      <p class="muted" style="font-size:12.5px;margin-bottom:0">يمكنك لصق البرنامج كاملاً من Word أو واتساب — يُحفظ كما هو،
      يُطبع بشكل منسّق، ويمكن تعيينه لأي متدرب.</p>`,
      saveText: "حفظ الخطة ✍️",
      onSave() {
        const name = UI.$("#tName").value.trim();
        const txt = UI.$("#tText").value.trim();
        if (!name) return UI.toast("أدخل اسم الخطة أولاً", "err");
        if (!txt) return UI.toast("اكتب أو الصق البرنامج التدريبي", "err");
        const p = {
          id: Store.uid("plan"), name, nameEn: "",
          goal: UI.$("#tGoal").value, level: UI.$("#tLevel").value,
          kind: UI.$("#tKind").value.trim() || "نص حر",
          freeText: txt, notes: "", createdAt: Date.now(),
          days: [{ id: Store.uid("day"), name: "البرنامج كاملاً", nameEn: "Full program", items: [] }]
        };
        Store.get().plans.push(p);
        Store.log(`أنشأ خطة نصية: ${name}`);
        Store.save(); UI.closeModal(); render(); App.refreshSidebar();
        UI.toast("حُفظت الخطة النصية ✓ افتحها للتعديل أو التعيين");
      }
    });
  }

  function textEditor(p) {
    UI.modal({
      title: "محرر الخطة النصية — Free-text editor",
      wide: true, hideSave: true,
      body: `<div class="form-grid">
        <label>اسم الخطة (عربي)<input type="text" id="teName" value="${UI.esc(p.name)}"></label>
        <label>الاسم بالإنجليزي<input type="text" id="teNameEn" value="${UI.esc(p.nameEn || "")}"></label>
        <label>الهدف / Goal<select id="teGoal">${goalOpts(p.goal)}</select></label>
        <label>المستوى / Level<select id="teLevel">${levelOpts(p.level)}</select></label>
      </div>
      <label style="margin-top:14px">البرنامج التدريبي
        <textarea id="teText" class="free-plan" dir="rtl">${UI.esc(p.freeText)}</textarea></label>
      <p class="muted" style="font-size:12.5px;margin-bottom:0">عدّل البرنامج بحرية — يُحفظ كما هو ويُطبع بشكل منسّق.</p>`,
    });
    UI.$("#modalFoot").innerHTML = `
      <button class="btn btn-ghost" id="edAssign">👥 تعيين لمتدرب</button>
      <button class="btn btn-ghost" id="edPrint">🖨️ طباعة</button>
      <button class="btn btn-soft" id="edClose">إغلاق</button>
      <button class="btn btn-primary" id="edSave">حفظ الخطة</button>`;
    UI.$("#edClose").onclick = () => UI.closeModal();
    UI.$("#edSave").onclick = () => {
      const name = UI.$("#teName").value.trim();
      const txt = UI.$("#teText").value.trim();
      if (!name) return UI.toast("أدخل اسم الخطة", "err");
      if (!txt) return UI.toast("البرنامج فارغ", "err");
      p.name = name;
      p.nameEn = UI.$("#teNameEn").value.trim();
      p.goal = UI.$("#teGoal").value;
      p.level = UI.$("#teLevel").value;
      p.freeText = txt;
      Store.save(); UI.closeModal(); render(); App.refreshSidebar();
      UI.toast("تم حفظ الخطة ✓");
    };
    UI.$("#edPrint").onclick = () => printPlan(p.id);
    UI.$("#edAssign").onclick = () => { UI.closeModal(); assign(p.id); };
  }

  function editor(id) {
    const p = Store.getPlan(id); if (!p) return;
    if (typeof p.freeText === "string") return textEditor(p);
    UI.modal({
      title: "محرر الخطة — Plan Builder",
      wide: true, hideSave: true,
      body: `<div id="edWrap"></div>`,
    });
    UI.$("#modalFoot").innerHTML = `
      <button class="btn btn-ghost" id="edAssign">👥 تعيين لعميل</button>
      <button class="btn btn-ghost" id="edPrint">🖨️ طباعة</button>
      <button class="btn btn-soft" id="edClose">إغلاق</button>
      <button class="btn btn-primary" id="edSave">حفظ الخطة</button>`;
    paint();
    UI.$("#edClose").onclick = () => UI.closeModal();
    UI.$("#edSave").onclick = () => { Store.save(); UI.closeModal(); render(); UI.toast("تم حفظ الخطة ✓"); };
    UI.$("#edPrint").onclick = () => printPlan(p.id);
    UI.$("#edAssign").onclick = () => { UI.closeModal(); assign(p.id); };

    function paint() {
      UI.$("#edWrap").innerHTML = `
        <div class="form-grid">
          <label>اسم الخطة (عربي)<input type="text" data-p="name" value="${UI.esc(p.name)}"></label>
          <label>الاسم بالإنجليزي<input type="text" data-p="nameEn" value="${UI.esc(p.nameEn || "")}"></label>
          <label>الهدف<select data-p="goal">${Object.entries(GOALS).map(([k, v]) =>
            `<option value="${k}" ${p.goal === k ? "selected" : ""}>${v.ar}</option>`).join("")}</select></label>
          <label>المستوى<select data-p="level">${Object.entries(LEVELS).map(([k, v]) =>
            `<option value="${k}" ${p.level === k ? "selected" : ""}>${v.ar}</option>`).join("")}</select></label>
        </div>
        <label style="margin-top:12px">ملاحظات على الخطة<textarea data-p="notes" rows="2">${UI.esc(p.notes || "")}</textarea></label>
        <div class="filters" style="margin-top:12px">
          <button class="btn btn-soft btn-sm" id="edAddDay">＋ إضافة يوم</button>
        </div>
        <div class="sep"></div>
        ${p.days.map((d, di) => dayBlock(d, di)).join("")}`;

      UI.$$("#edWrap [data-p]").forEach(el => el.onchange = () => { p[el.dataset.p] = el.value; });
      UI.$("#edAddDay").onclick = () => {
        p.days.push({ id: Store.uid("day"), name: `اليوم ${p.days.length + 1}`, nameEn: `Day ${p.days.length + 1}`, items: [] });
        paint();
      };
      UI.$$("#edWrap [data-day]").forEach(el => {
        el.onclick = ev => {
          const b = ev.target.closest("button"); if (!b) return;
          const d = p.days.find(x => x.id === el.dataset.day);
          if (b.hasAttribute("data-rem-day")) {
            if (p.days.length === 1) return UI.toast("يجب أن يبقى يوم واحد", "warn");
            UI.confirm("حذف هذا اليوم بالكامل؟", () => { p.days = p.days.filter(x => x.id !== d.id); paint(); });
          }
          else if (b.hasAttribute("data-add-ex")) {
            const exId = UI.$(`#sel_${d.id}`).value;
            if (!exId) return;
            const e = Store.getEx(exId);
            d.items.push({ ex: exId, sets: e.sets, reps: e.reps, rest: e.rest });
            paint();
          }
          else if (b.hasAttribute("data-rm-ex")) { d.items = d.items.filter((x, k) => k !== +b.dataset.rmEx); paint(); }
          else if (b.hasAttribute("data-up")) move(d, +b.dataset.up, -1);
          else if (b.hasAttribute("data-down")) move(d, +b.dataset.down, 1);
        };
      });
      UI.$$("#edWrap [data-item]").forEach(el => {
        el.onchange = () => {
          const [di, ii] = el.dataset.item.split(":").map(Number);
          const it = p.days[di].items[ii];
          it[el.dataset.f] = el.dataset.f === "sets" ? +el.value : el.value;
        };
      });
      UI.$$("#edWrap [data-dname]").forEach(el => el.onchange = () => {
        p.days.find(x => x.id === el.dataset.dname).name = el.value;
      });
    }

    function move(d, i, dir) {
      const j = i + dir; if (j < 0 || j >= d.items.length) return;
      const t = d.items[i]; d.items[i] = d.items[j]; d.items[j] = t; paint();
    }

    function dayBlock(d, di) {
      const opts = Store.allExercises()
        .slice().sort((a, b) => a.ar.localeCompare(b.ar, "ar"))
        .map(e => `<option value="${e.id}">${UI.esc(e.ar)} — ${UI.esc(e.en)}</option>`).join("");
      return `<div class="day" data-day="${d.id}">
        <div class="day-hd">
          <div style="flex:1">
            <h4>اليوم ${di + 1}</h4>
            <input type="text" data-dname="${d.id}" value="${UI.esc(d.name)}"
              style="margin-top:6px;background:#121826;border:1px solid var(--line);border-radius:9px;padding:7px 10px;width:100%">
          </div>
          <button class="btn btn-sm btn-danger" data-rem-day="1">حذف اليوم</button>
        </div>
        <div class="day-bd">
          ${d.items.length ? d.items.map((it, ii) => {
            const e = Store.getEx(it.ex) || { ar: "تمرين محذوف", en: "" };
            return `<div class="ex-row">
              <div class="ex-name" data-ex="${it.ex}">
                <b>${ii + 1}. ${UI.esc(e.ar)}</b><div class="en">${UI.esc(e.en)}</div>
              </div>
              <input type="number" data-item="${di}:${ii}" data-f="sets" value="${it.sets}" min="1" max="10" title="مجموعات">
              <input type="text" data-item="${di}:${ii}" data-f="reps" value="${UI.esc(it.reps)}" title="تكرارات">
              <div class="filters" style="gap:4px">
                <button class="btn btn-sm btn-ghost" data-up="${ii}" title="لأعلى">↑</button>
                <button class="btn btn-sm btn-ghost" data-down="${ii}" title="لأسفل">↓</button>
                <button class="rm" data-rm-ex="${ii}" title="حذف">✕</button>
              </div>
            </div>`;
          }).join("") : `<p class="muted" style="font-size:13px">لا توجد تمارين في هذا اليوم بعد.</p>`}
          <div class="filters" style="margin-top:12px">
            <select id="sel_${d.id}" style="flex:1;min-width:180px">${opts}</select>
            <button class="btn btn-sm btn-primary" data-add-ex="1">＋ إضافة تمرين</button>
          </div>
        </div>
      </div>`;
    }
  }

  /* ---------- تعيين لعميل ---------- */
  function assign(planId) {
    const p = Store.getPlan(planId);
    const clients = Store.get().clients;
    if (!clients.length) { UI.toast("أضف عميلاً أولاً", "warn"); App.go("clients"); return; }
    UI.modal({
      title: `تعيين «${p.name}» إلى عميل`,
      body: `<div class="form-grid">
        <label>العميل / Client<select id="asC">${clients.map(c =>
          `<option value="${c.id}">${UI.esc(c.name)} — ${(GOALS[c.goal] || {}).ar || ""}</option>`).join("")}</select></label>
      </div>
      <p class="muted" style="font-size:13px">سيصبح هذا هو الكورس الحالي للعميل، ويمكنك متابعة تقدّمه من صفحة العملاء.</p>`,
      saveText: "تعيين الخطة",
      onSave() {
        const c = Store.getClient(UI.$("#asC").value);
        c.planId = planId;
        Store.log(`سنّد خطة ${p.name} إلى ${c.name}`);
        Store.save(); UI.closeModal(); render(); Clients.render();
        UI.toast(`تم تعيين الخطة لـ ${c.name} ✓`);
      }
    });
  }

  /* ---------- الطباعة ---------- */
  function printPlan(id) {
    const p = Store.getPlan(id); if (!p) return;
    if (typeof p.freeText === "string") {
      UI.print(`<h1>${UI.esc(p.name)}</h1>
        <div class="p-sub">${UI.esc(p.nameEn || "")} · ${UI.esc(p.kind)} · خطة نصية حرّة
        · الهدف: ${(GOALS[p.goal] || {}).ar || "-"} · المستوى: ${(LEVELS[p.level] || {}).ar || "-"}</div>
        ${p.notes ? `<p><b>ملاحظات:</b> ${UI.esc(p.notes)}</p>` : ""}
        <div class="p-text">${UI.esc(p.freeText)}</div>${UI.printFooter()}`);
      return;
    }
    const exCount = p.days.reduce((s, d) => s + d.items.length, 0);
    let html = `<h1>${UI.esc(p.name)}</h1>
      <div class="p-sub">${UI.esc(p.nameEn || "")} · ${UI.esc(p.kind)} · ${p.days.length} أيام · ${exCount} تمرين
      · الهدف: ${(GOALS[p.goal] || {}).ar || "-"} · المستوى: ${(LEVELS[p.level] || {}).ar || "-"}</div>
      ${p.notes ? `<p><b>ملاحظات:</b> ${UI.esc(p.notes)}</p>` : ""}`;
    p.days.forEach((d, i) => {
      html += `<div class="p-day"><h3>اليوم ${i + 1} — ${UI.esc(d.name)}</h3>
        <table><thead><tr><th style="width:30px">#</th><th>التمرين / Exercise</th>
        <th style="width:70px">مجموعات</th><th style="width:90px">تكرارات</th><th style="width:80px">راحة (ث)</th></tr></thead><tbody>`;
      d.items.forEach((it, j) => {
        const e = Store.getEx(it.ex) || { ar: "—", en: "" };
        html += `<tr><td>${j + 1}</td><td>${UI.esc(e.ar)}<br><span style="color:#666;font-size:11px">${UI.esc(e.en)}</span></td>
          <td>${it.sets}</td><td>${UI.esc(it.reps)}</td><td>${it.rest || "-"}</td></tr>`;
      });
      html += `</tbody></table></div>`;
    });
    html += UI.printFooter();
    UI.print(html);
  }

  return { init, render, editor, templates, newPlan, assign, printPlan, fromTemplate, textPlan };
})();
