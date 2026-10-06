/* =========================================================
   MyCoach — عرض متابعة العملاء
   ========================================================= */
const Clients = (() => {
  const f = { q: "", goal: "" };

  function init() {
    UI.$("#btnAddClient").addEventListener("click", () => form());
    UI.$("#clientSearch").addEventListener("input", e => { f.q = e.target.value.trim(); render(); });
    UI.$("#clientGoal").addEventListener("change", e => { f.goal = e.target.value; render(); });
    const s = UI.$("#clientGoal");
    Object.entries(GOALS).forEach(([k, v]) =>
      s.insertAdjacentHTML("beforeend", `<option value="${k}">${v.ar} · ${v.en}</option>`));
  }

  function lastM(c) { return (c.measurements || []).slice(-1)[0] || null; }
  function prevM(c) { const m = c.measurements || []; return m.length > 1 ? m[m.length - 2] : null; }
  function ensure(c) {
    ["measurements", "attendance", "workouts"].forEach(k => { if (!Array.isArray(c[k])) c[k] = []; });
    return c;
  }

  function render() {
    let list = Store.get().clients.slice();
    if (f.goal) list = list.filter(c => c.goal === f.goal);
    if (f.q) list = list.filter(c => (c.name + " " + (c.phone || "")).toLowerCase().includes(f.q.toLowerCase()));
    list.sort((a, b) => (b.joined || 0) - (a.joined || 0));

    if (!list.length) {
      UI.$("#clientGrid").innerHTML = UI.empty("👥", "لا يوجد عملاء",
        "أضف أول عميل لتبدأ متابعة قياساته وكورسه",
        `<button class="btn btn-primary" onclick="document.getElementById('btnAddClient').click()">+ عميل جديد</button>`);
      return;
    }

    UI.$("#clientGrid").innerHTML = list.map(c => {
      const m = lastM(c), pv = prevM(c);
      const plan = c.planId ? Store.getPlan(c.planId) : null;
      const dW = m && pv ? Math.round((m.weight - pv.weight) * 10) / 10 : null;
      const sessions = (c.workouts || []).length + (c.attendance || []).length;
      return `<article class="item">
        <div class="item-hd">
          <div style="display:flex;gap:10px;align-items:center">
            <div class="avatar ${UI.grad(c.id)}">${UI.esc(UI.initials(c.name))}</div>
            <div><h3>${UI.esc(c.name)}</h3><div class="en">${UI.esc(c.phone || "")}</div></div>
          </div>
          <button class="btn btn-sm btn-ghost" data-open="${c.id}" title="التفاصيل">⋯</button>
        </div>
        <div class="item-bd">
          <div>${UI.tag((GOALS[c.goal] || {}).ar || "عام", c.goal === "cut" ? "warn" : "mus")}
            ${UI.tag((LEVELS[c.level] || {}).ar || "مبتدئ", "ok")}
            ${plan ? UI.tag("📚 كورس نشط", "info") : UI.tag("لا يوجد كورس", "bad")}</div>
          <div class="kv" style="margin-top:8px"><span>الوزن الحالي</span><b>${m ? UI.kg(m.weight) : "—"}</b></div>
          <div class="kv"><span>الدهون</span><b>${m && m.fat ? m.fat + "%" : "—"}</b></div>
          <div class="kv"><span>تغيّر آخر أسبوعين</span>
            <b style="color:${dW == null ? "var(--muted)" : dW <= 0 ? "var(--green)" : "var(--yellow)"}">
            ${dW == null ? "—" : (dW > 0 ? "+" : "") + dW + " كجم"}</b></div>
          <div class="kv"><span>جلسات مسجّلة</span><b>${sessions}</b></div>
          ${plan ? `<div class="kv"><span>الكورس</span><b style="color:var(--brand2)">${UI.esc(plan.name)}</b></div>` : ""}
        </div>
        <div class="item-ft">
          <button class="btn btn-sm btn-ghost" data-report="${c.id}">🖨️ تقرير</button>
          <button class="btn btn-sm btn-ghost" data-edit="${c.id}">✏️</button>
          <button class="btn btn-sm btn-primary" data-open="${c.id}">الملف الكامل</button>
        </div>
      </article>`;
    }).join("");

    UI.$("#clientGrid").onclick = ev => {
      const t = ev.target.closest("button"); if (!t) return;
      if (t.dataset.open) open(t.dataset.open);
      if (t.dataset.edit) form(Store.getClient(t.dataset.edit));
      if (t.dataset.report) report(t.dataset.report);
    };
  }

  /* ---------- نموذج العميل ---------- */
  function form(c) {
    const editing = !!c;
    UI.modal({
      title: editing ? "تعديل بيانات العميل" : "إضافة عميل جديد",
      body: `<div class="form-grid">
        <label>الاسم الكامل *<input type="text" id="cName" value="${UI.esc(c ? c.name : "")}" placeholder="مثال: خالد العلي"></label>
        <label>رقم الهاتف<input type="tel" id="cPhone" value="${UI.esc(c ? c.phone || "" : "")}"></label>
        <label>الهدف / Goal<select id="cGoal">${Object.entries(GOALS).map(([k, v]) =>
          `<option value="${k}" ${c && c.goal === k ? "selected" : ""}>${v.ar} · ${v.en}</option>`).join("")}</select></label>
        <label>المستوى<select id="cLevel">${Object.entries(LEVELS).map(([k, v]) =>
          `<option value="${k}" ${c && c.level === k ? "selected" : ""}>${v.ar}</option>`).join("")}</select></label>
        <label>تاريخ البداية<input type="date" id="cJoin" value="${c ? new Date(c.joined).toISOString().slice(0, 10) : UI.today()}"></label>
        <label>الكورس المعيّن<select id="cPlan"><option value="">بدون كورس</option>${Store.get().plans.map(p =>
          `<option value="${p.id}" ${c && c.planId === p.id ? "selected" : ""}>${UI.esc(p.name)}</option>`).join("")}</select></label>
      </div>
      <label style="margin-top:12px">ملاحظات / Notes<textarea id="cNotes" rows="3">${UI.esc(c ? c.notes || "" : "")}</textarea></label>`,
      saveText: editing ? "حفظ التعديلات" : "إضافة العميل",
      onSave() {
        const name = UI.$("#cName").value.trim();
        if (!name) return UI.toast("أدخل اسم العميل", "err");
        const obj = c ? Object.assign(c, {}) : {
          id: Store.uid("c"), measurements: [], attendance: [], workouts: []
        };
        obj.name = name;
        obj.phone = UI.$("#cPhone").value.trim();
        obj.goal = UI.$("#cGoal").value;
        obj.level = UI.$("#cLevel").value;
        obj.joined = new Date(UI.$("#cJoin").value || UI.today()).getTime();
        obj.planId = UI.$("#cPlan").value || null;
        obj.notes = UI.$("#cNotes").value.trim();
        if (!editing) Store.get().clients.push(obj);
        Store.log(`${editing ? "عدّل" : "أضاف"} عميلاً: ${name}`);
        Store.save(); UI.closeModal(); render(); App.refreshSidebar();
        UI.toast(editing ? "تم الحفظ ✓" : "أُضيف العميل ✓");
        if (!editing) open(obj.id);
      }
    });
  }

  /* ---------- الملف الكامل ---------- */
  function open(id) {
    const c = Store.getClient(id); if (!c) return;
    ensure(c);
    UI.drawer(`${UI.esc(c.name)} <span style="font-size:12px;color:var(--muted)">${UI.esc(c.phone || "")}</span>`,
      `<div class="tabs" id="cTabs">
        <button class="tab active" data-t="ov">نظرة عامة</button>
        <button class="tab" data-t="me">القياسات</button>
        <button class="tab" data-t="at">الحضور</button>
        <button class="tab" data-t="wk">الجلسات</button>
      </div>
      <div id="cPane"></div>`);

    const panes = { ov: overview, me: measures, at: attend, wk: workouts };
    let cur = "ov";
    const paint = () => { UI.$("#cPane").innerHTML = panes[cur](c); bind(c); };
    UI.$$("#cTabs .tab").forEach(t => t.onclick = () => {
      UI.$$("#cTabs .tab").forEach(x => x.classList.remove("active"));
      t.classList.add("active"); cur = t.dataset.t; paint();
    });
    paint();

    function bind(c) {
      UI.$("#cPane").onclick = ev => {
        const b = ev.target.closest("button"); if (!b) return;
        if (b.hasAttribute("data-addm")) addMeasure(c, () => paint());
        else if (b.hasAttribute("data-adda")) addAttendance(c, () => paint());
        else if (b.hasAttribute("data-logw")) logWorkout(c, () => paint());
        else if (b.hasAttribute("data-assign")) { UI.closeDrawer(); Plans.assign(c.planId || (Store.get().plans[0] || {}).id); }
        else if (b.hasAttribute("data-edit")) form(c);
        else if (b.dataset.rmm) { c.measurements = c.measurements.filter(x => x.date != +b.dataset.rmm); Store.save(); paint(); render(); }
        else if (b.dataset.rma) { c.attendance = c.attendance.filter(x => x.date != +b.dataset.rma); Store.save(); paint(); }
        else if (b.dataset.rmw) { c.workouts = c.workouts.filter(x => x.id !== b.dataset.rmw); Store.save(); paint(); }
      };
    }
  }

  /* ----- نظرة عامة ----- */
  function overview(c) {
    const m = lastM(c), pv = prevM(c);
    const plan = c.planId ? Store.getPlan(c.planId) : null;
    const dW = m && pv ? Math.round((m.weight - pv.weight) * 10) / 10 : 0;
    const sessions = (c.workouts || []).length;
    const attendance = (c.attendance || []).length;
    return `
      <div class="panel"><div class="panel-bd">
        <div class="kv"><span>الهدف</span><b>${(GOALS[c.goal] || {}).ar}</b></div>
        <div class="kv"><span>المستوى</span><b>${(LEVELS[c.level] || {}).ar}</b></div>
        <div class="kv"><span>تاريخ البداية</span><b>${UI.fmtDate(c.joined)}</b></div>
        <div class="kv"><span>الوزن الحالي</span><b>${m ? UI.kg(m.weight) : "—"}</b></div>
        <div class="kv"><span>نسبة الدهون</span><b>${m && m.fat ? m.fat + "%" : "—"}</b></div>
        <div class="kv"><span>تغيّر الوزن الأخير</span>
          <b style="color:${dW <= 0 ? "var(--green)" : "var(--yellow)"}">${dW > 0 ? "+" : ""}${dW} كجم</b></div>
        <div class="kv"><span>الجلسات / الحضور</span><b>${sessions} / ${attendance}</b></div>
      </div></div>

      ${plan ? `<div class="sect-title">الكورس الحالي · CURRENT PLAN</div>
        <div class="panel"><div class="panel-bd">
          <b style="color:var(--brand2)">${UI.esc(plan.name)}</b>
          <p class="muted" style="font-size:13px;margin:6px 0 10px">${typeof plan.freeText === "string" ? "✍️ خطة نصية" : plan.days.length + " أيام"} · ${plan.kind}</p>
          ${typeof plan.freeText === "string"
            ? `<div class="free-preview">${UI.esc(plan.freeText)}</div>`
            : plan.days.map((d, i) => `<div class="kv"><span>اليوم ${i + 1}</span><b>${UI.esc(d.name)} — ${d.items.length} تمرين</b></div>`).join("")}
          <div class="filters" style="margin-top:12px">
            <button class="btn btn-sm btn-primary" data-logw>📝 تسجيل جلسة</button>
            <button class="btn btn-sm btn-ghost" data-assign>تغيير الكورس</button>
            <button class="btn btn-sm btn-ghost" onclick="UI.closeDrawer();Plans.editor('${plan.id}')">فتح الكورس</button>
          </div>
        </div></div>`
      : `<div class="panel"><div class="panel-bd">
          <p class="muted">لا يوجد كورس معيّن لهذا العميل بعد.</p>
          <button class="btn btn-sm btn-primary" data-assign>تعيين كورس</button></div></div>`}

      ${c.notes ? `<div class="sect-title">ملاحظات · NOTES</div>
        <div class="panel"><div class="panel-bd" style="font-size:14px;line-height:1.8;white-space:pre-wrap">${UI.esc(c.notes)}</div></div>` : ""}

      <div class="filters" style="margin-top:14px">
        <button class="btn btn-primary btn-sm" data-addm>＋ قياس جديد</button>
        <button class="btn btn-soft btn-sm" data-adda>📅 تسجيل حضور</button>
        <button class="btn btn-ghost btn-sm" data-edit>✏️ تعديل البيانات</button>
      </div>`;
  }

  /* ----- القياسات ----- */
  function measures(c) {
    const ms = (c.measurements || []).slice();
    if (!ms.length) return `<div class="panel"><div class="panel-bd">
      <p class="muted">لا توجد قياسات بعد.</p>
      <button class="btn btn-primary btn-sm" data-addm>＋ أضف أول قياس</button></div></div>`;
    const weights = ms.map(x => x.weight);
    const fats = ms.map(x => x.fat || 0);
    const labels = ms.map(x => new Date(x.date).toLocaleDateString("ar-EG", { month: "short", day: "numeric" }));
    const first = ms[0], last = ms[ms.length - 1];
    const dW = Math.round((last.weight - first.weight) * 10) / 10;
    return `
      <div class="macro-cards" style="margin-bottom:14px">
        <div class="card"><div class="k">بداية القياس</div><div class="v">${first.weight}</div><div class="s">كجم</div></div>
        <div class="card i2"><div class="k">الحالي</div><div class="v">${last.weight}</div><div class="s">كجم</div></div>
        <div class="card i3"><div class="k">الفرق الكلي</div><div class="v">${dW > 0 ? "+" : ""}${dW}</div><div class="s">كجم</div></div>
      </div>
      <div class="sect-title">منحنى الوزن · WEIGHT TREND</div>
      <div class="panel"><div class="panel-bd">${UI.lineChart(weights, { labels, unit: "kg" })}</div></div>
      <div class="sect-title">نسبة الدهون · BODY FAT</div>
      <div class="panel"><div class="panel-bd">${UI.lineChart(fats, { labels, unit: "%" })}</div></div>
      <div class="panel"><div class="panel-bd table-wrap">
        <table class="table"><thead><tr><th>التاريخ</th><th>الوزن</th><th>دهون</th><th>صدر</th><th>ساعد</th><th>خصر</th><th>فخذ</th><th></th></tr></thead>
        <tbody>${ms.slice().reverse().map(x => `<tr>
          <td>${UI.fmtDate(x.date)}</td><td class="num">${x.weight || "-"}</td><td class="num">${x.fat || "-"}</td>
          <td class="num">${x.chest || "-"}</td><td class="num">${x.arm || "-"}</td>
          <td class="num">${x.waist || "-"}</td><td class="num">${x.thigh || "-"}</td>
          <td><button class="btn btn-sm btn-ghost" data-rmm="${x.date}">✕</button></td></tr>`).join("")}</tbody></table>
      </div></div>
      <button class="btn btn-primary btn-sm" data-addm>＋ إضافة قياس جديد</button>`;
  }

  function addMeasure(c, done) {
    UI.modal({
      title: `قياس جديد — ${c.name}`,
      body: `<div class="form-grid">
        <label>التاريخ<input type="date" id="mDate" value="${UI.today()}"></label>
        <label>الوزن (كجم) *<input type="number" id="mW" step="0.1" placeholder="78.5"></label>
        <label>نسبة الدهون %<input type="number" id="mF" step="0.1" placeholder="اختياري"></label>
        <label>محيط الصدر (سم)<input type="number" id="mC" step="0.1"></label>
        <label>محيط الساعد (سم)<input type="number" id="mA" step="0.1"></label>
        <label>محيط الخصر (سم)<input type="number" id="mWa" step="0.1"></label>
        <label>محيط الفخذ (سم)<input type="number" id="mT" step="0.1"></label>
        <label>ملاحظة<input type="text" id="mN" placeholder="مثال: بعد أسبوعين نظام"></label>
      </div>`,
      saveText: "حفظ القياس",
      onSave() {
        ensure(c);
        const w = parseFloat(UI.$("#mW").value);
        if (!w) return UI.toast("أدخل الوزن", "err");
        const d = new Date(UI.$("#mDate").value || UI.today()).getTime();
        const rec = { date: d, weight: w, fat: parseFloat(UI.$("#mF").value) || null,
          chest: parseFloat(UI.$("#mC").value) || null, arm: parseFloat(UI.$("#mA").value) || null,
          waist: parseFloat(UI.$("#mWa").value) || null, thigh: parseFloat(UI.$("#mT").value) || null,
          note: UI.$("#mN").value.trim() };
        c.measurements = c.measurements.filter(x => x.date !== d);
        c.measurements.push(rec);
        c.measurements.sort((a, b) => a.date - b.date);
        Store.log(`سجّل قياساً لـ ${c.name}: ${w} كجم`);
        Store.save(); UI.closeModal(); render(); UI.toast("حُفظ القياس ✓"); done && done();
      }
    });
  }

  /* ----- الحضور ----- */
  function attend(c) {
    const list = (c.attendance || []).slice().reverse();
    if (!list.length) return `<div class="panel"><div class="panel-bd">
      <p class="muted">لا يوجد سجل حضور.</p>
      <button class="btn btn-primary btn-sm" data-adda>＋ تسجيل حضور</button></div></div>`;
    return `<div class="panel"><div class="panel-bd">
      ${list.map(a => `<div class="act"><span class="dot"></span>
        <div style="flex:1"><div class="t">${UI.fmtDate(a.date)}</div>
          <div class="d">${UI.esc(a.note || "حضور")}</div></div>
        <button class="btn btn-sm btn-ghost" data-rma="${a.date}">✕</button></div>`).join("")}
    </div></div>
    <button class="btn btn-primary btn-sm" data-adda>＋ تسجيل حضور</button>`;
  }

  function addAttendance(c, done) {
    UI.modal({
      title: `تسجيل حضور — ${c.name}`,
      body: `<div class="form-grid">
        <label>التاريخ<input type="date" id="aDate" value="${UI.today()}"></label>
        <label>ملاحظة على الجلسة<input type="text" id="aNote" placeholder="مثال: صدر + ترايسبس — أداء ممتاز"></label>
      </div>`,
      saveText: "تسجيل",
      onSave() {
        ensure(c);
        const d = new Date(UI.$("#aDate").value || UI.today()).getTime();
        c.attendance.push({ date: d, note: UI.$("#aNote").value.trim() || "حضور" });
        Store.log(`سجّل حضور ${c.name}`); Store.save(); UI.closeModal(); render();
        UI.toast("تم تسجيل الحضور ✓"); done && done();
      }
    });
  }

  /* ----- جلسات التمرين ----- */
  function workouts(c) {
    const list = (c.workouts || []).slice().reverse();
    const plan = c.planId ? Store.getPlan(c.planId) : null;
    let html = `<div class="filters" style="margin-bottom:14px">
      <button class="btn btn-primary btn-sm" data-logw ${plan ? "" : "disabled title='عيّن كورساً أولاً'"}>📝 تسجيل جلسة جديدة</button>
    </div>`;
    if (!list.length) return html + `<div class="panel"><div class="panel-bd">
      <p class="muted">لا توجد جلسات مسجّلة بعد. سجّل أول جلسة لتتبّع استمرارية العميل.</p></div></div>`;
    return html + `<div class="panel"><div class="panel-bd">
      ${list.map(w => {
        const p = Store.getPlan(w.planId);
        const pct = w.done && w.day ? Math.round(w.done.length / Math.max(1, w.count) * 100) : 0;
        return `<div class="act"><span class="dot" style="background:${pct >= 100 ? "var(--green)" : "var(--brand)"}"></span>
          <div style="flex:1">
            <div class="t">${UI.fmtDate(w.date)} — ${UI.esc(p ? p.name : "خطة محذوفة")} · ${UI.esc(w.dayName || "")}</div>
            <div class="d">${w.done ? w.done.length : 0}/${w.count} تمرين مكتمل ${w.note ? "· " + UI.esc(w.note) : ""}</div>
          </div>
          <button class="btn btn-sm btn-ghost" data-rmw="${w.id}">✕</button></div>`;
      }).join("")}
    </div></div>`;
  }

  function logWorkout(c, done) {
    const p = Store.getPlan(c.planId); if (!p) return UI.toast("لا يوجد كورس معيّن", "warn");
    UI.modal({
      title: `تسجيل جلسة — ${c.name}`,
      body: `<div class="form-grid">
        <label>التاريخ<input type="date" id="wDate" value="${UI.today()}"></label>
        <label>اليوم / Session<select id="wDay">${p.days.map((d, i) =>
          `<option value="${d.id}">اليوم ${i + 1} — ${UI.esc(d.name)}</option>`).join("")}</select></label>
      </div>
      <div class="sect-title">التمارين المنجزة</div>
      <div id="wList"></div>
      <label style="margin-top:12px">ملاحظة<input type="text" id="wNote" placeholder="مثال: زيادة الوزن عن الأسبوع الماضي"></label>`,
      saveText: "حفظ الجلسة",
      onSave() {
        ensure(c);
        const d = p.days.find(x => x.id === UI.$("#wDay").value);
        const doneIds = Array.from(UI.$$("#wList input:checked")).map(i => i.value);
        c.workouts.push({
          id: Store.uid("w"), date: new Date(UI.$("#wDate").value || UI.today()).getTime(),
          planId: p.id, day: d.id, dayName: d.name,
          done: doneIds, count: d.items.length, note: UI.$("#wNote").value.trim()
        });
        Store.log(`سجّل جلسة ${d.name} لـ ${c.name}`); Store.save(); UI.closeModal(); render();
        UI.toast("حُفظت الجلسة ✓"); done && done();
      }
    });
    const paintList = () => {
      const d = p.days.find(x => x.id === UI.$("#wDay").value);
      if (!d || !d.items.length) {
        UI.$("#wList").innerHTML = `<p class="muted" style="font-size:13px">لا توجد تمارين منظمة في هذه الخطة (خطة نصية) — سجّل الجلسة كإنجاز مع ملاحظة.</p>`;
        return;
      }
      UI.$("#wList").innerHTML = d.items.map(it => {
        const e = Store.getEx(it.ex) || { ar: "تمرين", en: "" };
        return `<label class="chk" style="justify-content:flex-start;margin:6px 0">
          <input type="checkbox" class="check" value="${it.ex}" checked>
          <span>${UI.esc(e.ar)} <span class="muted" style="font-size:12px">${it.sets}×${UI.esc(it.reps)}</span></span></label>`;
      }).join("");
    };
    UI.$("#wDay").onchange = paintList; paintList();
  }

  /* ---------- تقرير قابل للطباعة ---------- */
  function report(id) {
    const c = Store.getClient(id); if (!c) return;
    const ms = (c.measurements || []).slice();
    const last = ms.slice(-1)[0], first = ms[0];
    const plan = c.planId ? Store.getPlan(c.planId) : null;
    let html = `<h1>تقرير متابعة — ${UI.esc(c.name)}</h1>
      <div class="p-sub">${UI.esc(c.phone || "")} · الهدف: ${(GOALS[c.goal] || {}).ar} · المستوى: ${(LEVELS[c.level] || {}).ar}
      · تاريخ البداية: ${UI.fmtDate(c.joined)}</div>
      <div class="p-grid">
        <div class="p-box"><b>القياسات</b>
          <table><tbody>
            <tr><td>أول قياس</td><td>${first ? first.weight + " كجم" : "—"}</td><td>${first && first.fat ? first.fat + "%" : ""}</td></tr>
            <tr><td>آخر قياس</td><td>${last ? last.weight + " كجم" : "—"}</td><td>${last && last.fat ? last.fat + "%" : ""}</td></tr>
            <tr><td>الفرق</td><td>${first && last ? (last.weight - first.weight).toFixed(1) + " كجم" : "—"}</td><td></td></tr>
          </tbody></table></div>
        <div class="p-box"><b>الالتزام</b>
          <table><tbody>
            <tr><td>جلسات مسجّلة</td><td>${(c.workouts || []).length}</td></tr>
            <tr><td>حضور</td><td>${(c.attendance || []).length}</td></tr>
            <tr><td>الكورس</td><td>${plan ? UI.esc(plan.name) : "غير معيّن"}</td></tr>
          </tbody></table></div>
      </div>
      ${ms.length ? `<div class="p-day"><h3>جدول القياسات</h3><table>
        <thead><tr><th>التاريخ</th><th>وزن</th><th>دهون</th><th>صدر</th><th>ساعد</th><th>خصر</th><th>فخذ</th></tr></thead>
        <tbody>${ms.slice().reverse().map(x => `<tr><td>${UI.fmtDate(x.date)}</td><td>${x.weight || ""}</td>
          <td>${x.fat || ""}</td><td>${x.chest || ""}</td><td>${x.arm || ""}</td>
          <td>${x.waist || ""}</td><td>${x.thigh || ""}</td></tr>`).join("")}</tbody></table></div>` : ""}`;
    if (plan) {
      html += `<div class="p-day"><h3>الكورس: ${UI.esc(plan.name)}</h3>`;
      if (typeof plan.freeText === "string") {
        html += `<div class="p-text">${UI.esc(plan.freeText)}</div>`;
      } else {
        plan.days.forEach((d, i) => {
          html += `<p style="margin:8px 0 2px"><b>اليوم ${i + 1} — ${UI.esc(d.name)}</b></p><table><tbody>`;
          d.items.forEach(it => {
            const e = Store.getEx(it.ex) || { ar: "—" };
            html += `<tr><td>${UI.esc(e.ar)}</td><td>${it.sets} × ${UI.esc(it.reps)}</td><td>راحة ${it.rest || "-"}ث</td></tr>`;
          });
          html += `</tbody></table>`;
        });
      }
      html += `</div>`;
    }
    if (c.notes) html += `<div class="p-day"><h3>ملاحظات المدرب</h3><p>${UI.esc(c.notes)}</p></div>`;
    html += UI.printFooter();
    UI.print(html);
  }

  return { init, render, open, form, report };
})();
