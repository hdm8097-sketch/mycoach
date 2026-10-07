/* =========================================================
   MyCoach — التغذية (حاسبة / حميات / أطعمة / خطة اليوم)
   ========================================================= */
const Nutrition = (() => {
  let calc = null;      // آخر نتيجة حساب
  let dayPlan = null;   // خطة اليوم المولّدة

  const inputs = ["nSex", "nAge", "nHeight", "nWeight", "nAct", "nGoal", "nBFVal"];

  function init() {
    inputs.forEach(id => {
      const el = UI.$("#" + id);
      if (el) el.addEventListener("change", () => { runCalc(); });
    });
    UI.$("#nBF").addEventListener("change", e => {
      UI.$("#nBFWrap").hidden = !e.target.checked;
      runCalc();
    });
    UI.$("#nutTabs").onclick = e => {
      const t = e.target.closest(".tab"); if (!t) return;
      UI.$$("#nutTabs .tab").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      UI.$$(".tab-pane").forEach(p => p.classList.remove("active"));
      UI.$("#tab-" + t.dataset.tab).classList.add("active");
      if (t.dataset.tab === "day") renderDay();
    };
    UI.$("#foodSearch").addEventListener("input", renderFoods);
    UI.$("#foodCat").addEventListener("change", renderFoods);
    UI.$("#btnAddFood").addEventListener("click", foodForm);
    UI.$("#btnGenDay").addEventListener("click", () => generate(true));
    UI.$("#btnPrintDay").addEventListener("click", printDay);

    Object.entries(FOOD_CATS).forEach(([k, v]) =>
      UI.$("#foodCat").insertAdjacentHTML("beforeend", `<option value="${k}">${v.ar} · ${v.en}</option>`));

    runCalc();
    renderDiets();
    renderFoods();
  }

  /* ================= الحاسبة ================= */
  function targets() {
    const w = +UI.$("#nWeight").value || 70, h = +UI.$("#nHeight").value || 170,
          a = +UI.$("#nAge").value || 25, act = +UI.$("#nAct").value || 1.55,
          sex = UI.$("#nSex").value, goal = UI.$("#nGoal").value,
          useBF = UI.$("#nBF").checked, bf = +UI.$("#nBFVal").value || 0;

    let bmr;
    if (useBF && bf > 3) {
      const lbm = w * (1 - bf / 100);
      bmr = 370 + 21.6 * lbm;
    } else {
      bmr = sex === "m" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161;
    }
    const tdee = bmr * act;
    const plan = DIETS.find(d => d.goal === goal) || DIETS[2];
    const kcal = tdee + plan.kcal;

    const protein = Math.round(plan.protein * w);
    const fat = Math.round(plan.fat * w);
    const carbs = Math.max(40, Math.round((kcal - protein * 4 - fat * 9) / 4));
    const bmi = w / Math.pow(h / 100, 2);
    return { w, h, a, act, sex, goal, bf, bmr, tdee, kcal, protein, fat, carbs, plan,
             water: Math.round(w * 0.035 * 10) / 10, bmi, planDiet: plan };
  }

  function runCalc() {
    calc = targets();
    const bmiCls = calc.bmi < 18.5 ? "info" : calc.bmi < 25 ? "ok" : calc.bmi < 30 ? "warn" : "bad";
    const bmiTxt = calc.bmi < 18.5 ? "نقص وزن" : calc.bmi < 25 ? "وزن طبيعي" : calc.bmi < 30 ? "زيادة وزن" : "سمنة";
    const pPct = calc.protein * 4 / calc.kcal * 100,
          fPct = calc.fat * 9 / calc.kcal * 100,
          cPct = 100 - pPct - fPct;

    UI.$("#calcResults").innerHTML = `
      <div class="kv"><span>أيض الأساس (BMR)</span><b>${Math.round(calc.bmr).toLocaleString("en-US")} سعرة</b></div>
      <div class="kv"><span>إجمالي الاحتياج (TDEE)</span><b>${Math.round(calc.tdee).toLocaleString("en-US")} سعرة</b></div>
      <div class="kv"><span>الهدف اليومي</span><b class="big-num" style="font-size:26px">${Math.round(calc.kcal).toLocaleString("en-US")}</b></div>
      <div class="kv"><span>سعرات حسب الهدف</span><b>${calc.plan.ar} (${calc.plan.kcal > 0 ? "+" : ""}${calc.plan.kcal})</b></div>
      <div class="kv"><span>مؤشر كتلة الجسم BMI</span><b>${UI.tag(calc.bmi.toFixed(1) + " — " + bmiTxt, bmiCls)}</b></div>
      <div class="kv"><span>ماء يومياً</span><b>${calc.water} لتر</b></div>

      <div class="sect-title">المكرونز · MACROS</div>
      <div class="macro-bar">
        <div style="flex:${pPct};background:var(--brand)">${Math.round(pPct)}% بروتين</div>
        <div style="flex:${cPct};background:var(--accent)">${Math.round(cPct)}% كربوهيدرات</div>
        <div style="flex:${fPct};background:var(--yellow)">${Math.round(fPct)}% دهون</div>
      </div>
      <div class="macro-cards">
        <div class="card"><div class="k">بروتين · Protein</div><div class="v">${calc.protein}غ</div><div class="s">${calc.plan.protein}غ/كجم</div></div>
        <div class="card i2"><div class="k">كربوهيدرات · Carbs</div><div class="v">${calc.carbs}غ</div><div class="s">${Math.round(calc.carbs * 4 / calc.w * 10) / 10}غ/كجم</div></div>
        <div class="card i3"><div class="k">دهون · Fat</div><div class="v">${calc.fat}غ</div><div class="s">${calc.plan.fat}غ/كجم</div></div>
      </div>

      <div class="sect-title">توزيع الوجبات · MEALS</div>
      ${MEAL_SLOTS.map(m => `<div class="kv"><span>${m.ar} · ${m.en}</span>
        <b>${Math.round(calc.kcal * m.pct).toLocaleString("en-US")} سعرة</b></div>`).join("")}

      <div class="panel" style="margin-top:14px"><div class="panel-bd" style="font-size:13.5px;line-height:1.9">
        💡 ${UI.esc(calc.plan.notes)}<br>
        ⏱️ وزّع البروتين على 4 وجبات (25-40غ للوجبة) لأفضل امتصاص وبناء عضلي.
      </div></div>

      <div class="filters" style="margin-top:12px">
        <button class="btn btn-primary" id="btnToDay">🍽️ ولّد خطة اليوم</button>
        <button class="btn btn-ghost" id="btnPrintCalc">🖨️ طباعة القياسات</button>
      </div>`;

    UI.$("#btnToDay").onclick = () => {
      generate(true);
      UI.$$("#nutTabs .tab").forEach(x => x.classList.toggle("active", x.dataset.tab === "day"));
      UI.$$(".tab-pane").forEach(p => p.classList.toggle("active", p.id === "tab-day"));
      renderDay();
    };
    UI.$("#btnPrintCalc").onclick = printCalc;
    renderDiets();
  }

  function printCalc() {
    UI.print(`<h1>حساب السعرات والمكرونز</h1>
      <div class="p-sub">${calc.sex === "m" ? "ذكر" : "أنثى"} · ${calc.a} سنة · ${calc.h} سم · ${calc.w} كجم
        ${calc.bf ? " · دهون " + calc.bf + "%" : ""}</div>
      <div class="p-grid">
        <div class="p-box"><b>الطاقة</b><table><tbody>
          <tr><td>BMR</td><td>${Math.round(calc.bmr)} سعرة</td></tr>
          <tr><td>TDEE</td><td>${Math.round(calc.tdee)} سعرة</td></tr>
          <tr><td>الهدف اليومي</td><td><b>${Math.round(calc.kcal)} سعرة</b></td></tr>
          <tr><td>BMI</td><td>${calc.bmi.toFixed(1)}</td></tr>
          <tr><td>ماء</td><td>${calc.water} لتر</td></tr>
        </tbody></table></div>
        <div class="p-box"><b>المكرونز</b><table><tbody>
          <tr><td>بروتين</td><td>${calc.protein} غ</td></tr>
          <tr><td>كربوهيدرات</td><td>${calc.carbs} غ</td></tr>
          <tr><td>دهون</td><td>${calc.fat} غ</td></tr>
        </tbody></table></div>
      </div>
      <div class="p-day"><h3>توزيع الوجبات</h3><table><tbody>
        ${MEAL_SLOTS.map(m => `<tr><td>${m.ar}</td><td>${Math.round(calc.kcal * m.pct)} سعرة</td>
          <td>بروتين ~${Math.round(calc.protein * m.pct)}غ</td></tr>`).join("")}
      </tbody></table></div>
      <div class="p-day"><h3>ملاحظات</h3><p>${UI.esc(calc.plan.notes)}</p></div>` + UI.printFooter());
  }

  /* ================= الحميات ================= */
  function renderDiets() {
    if (!calc) return;
    UI.$("#dietGrid").innerHTML = DIETS.map(d => {
      const kcal = calc.tdee + d.kcal;
      const p = Math.round(d.protein * calc.w), f = Math.round(d.fat * calc.w);
      const c = Math.max(40, Math.round((kcal - p * 4 - f * 9) / 4));
      const active = calc.planDiet.id === d.id;
      return `<article class="item" style="${active ? "border-color:var(--brand)" : ""}">
        <div class="item-hd"><div><h3>${UI.esc(d.ar)}</h3><div class="en">${UI.esc(d.en)}</div></div>
          ${active ? UI.tag("مُوصى به لك", "mus") : ""}</div>
        <div class="item-bd">
          <div class="kv"><span>السعرات اليومية</span><b style="color:var(--brand2)">${Math.round(kcal).toLocaleString("en-US")}</b></div>
          <div class="kv"><span>البروتين</span><b>${p}غ</b></div>
          <div class="kv"><span>الكربوهيدرات</span><b>${c}غ</b></div>
          <div class="kv"><span>الدهون</span><b>${f}غ</b></div>
          <p class="muted" style="font-size:12.5px;line-height:1.7;margin:10px 0 0">${UI.esc(d.notes)}</p>
        </div>
        <div class="item-ft"><button class="btn btn-sm btn-soft" data-diet="${d.goal}">اعتماد هذا الهدف</button></div>
      </article>`;
    }).join("");
    UI.$("#dietGrid").onclick = e => {
      const b = e.target.closest("[data-diet]"); if (!b) return;
      UI.$("#nGoal").value = b.dataset.diet; runCalc();
      UI.toast("تم تحديث الهدف في الحاسبة ✓");
    };
  }

  /* ================= جدول الأطعمة ================= */
  function renderFoods() {
    const q = (UI.$("#foodSearch").value || "").toLowerCase().trim();
    const cat = UI.$("#foodCat").value;
    let list = Store.allFoods();
    if (cat) list = list.filter(f => f.cat === cat);
    if (q) list = list.filter(f => (f.ar + " " + f.en).toLowerCase().includes(q));
    const custom = id => (Store.get().customFoods || []).some(x => x.id === id);

    UI.$("#foodTable").innerHTML = `
      <thead><tr>
        <th>الطعام / Food</th><th>الفئة</th><th>سعرات (100غ)</th>
        <th>بروتين</th><th>كربوهيدرات</th><th>دهون</th><th></th>
      </tr></thead>
      <tbody>${list.map(f => `<tr>
        <td><b>${UI.esc(f.ar)}</b><div class="en" style="font-size:11px;color:var(--muted)">${UI.esc(f.en)}</div></td>
        <td>${UI.tag((FOOD_CATS[f.cat] || {}).ar || "")}</td>
        <td class="num"><b>${f.kcal}</b></td>
        <td class="num">${f.p}غ</td>
        <td class="num">${f.c}غ</td>
        <td class="num">${f.f}غ</td>
        <td>${custom(f.id) ? `<button class="btn btn-sm btn-ghost" data-delf="${f.id}">🗑️</button>` : ""}</td>
      </tr>`).join("") || `<tr><td colspan="7" class="muted" style="text-align:center;padding:24px">لا توجد نتائج</td></tr>`}
      </tbody>`;

    UI.$("#foodTable").onclick = e => {
      const b = e.target.closest("[data-delf]"); if (!b) return;
      const arr = Store.get().customFoods;
      const i = arr.findIndex(x => x.id === b.dataset.delf);
      if (i > -1) arr.splice(i, 1);
      Store.save(); renderFoods(); UI.toast("حُذف الطعام", "warn");
    };
  }

  function foodForm() {
    UI.modal({
      title: "إضافة طعام جديد",
      body: `<div class="form-grid">
        <label>الاسم بالعربي *<input type="text" id="fdAr"></label>
        <label>الاسم بالإنجليزي *<input type="text" id="fdEn"></label>
        <label>الفئة / Category<select id="fdCat">${Object.entries(FOOD_CATS).map(([k, v]) =>
          `<option value="${k}">${v.ar} · ${v.en}</option>`).join("")}</select></label>
        <label>السعرات (لكل 100غ/مل) *<input type="number" id="fdK" min="0"></label>
        <label>بروتين (غ)<input type="number" id="fdP" step="0.1" value="0"></label>
        <label>كربوهيدرات (غ)<input type="number" id="fdC" step="0.1" value="0"></label>
        <label>دهون (غ)<input type="number" id="fdF" step="0.1" value="0"></label>
      </div>`,
      saveText: "إضافة",
      onSave() {
        const ar = UI.$("#fdAr").value.trim(), en = UI.$("#fdEn").value.trim(), k = +UI.$("#fdK").value;
        if (!ar || !en || isNaN(k)) return UI.toast("أكمل الحقول المطلوبة", "err");
        Store.get().customFoods.push({
          id: Store.uid("f"), ar, en, cat: UI.$("#fdCat").value, kcal: k,
          p: +UI.$("#fdP").value || 0, c: +UI.$("#fdC").value || 0, f: +UI.$("#fdF").value || 0
        });
        Store.log(`أضاف طعاماً: ${ar}`); Store.save(); UI.closeModal(); renderFoods();
        UI.toast("أُضيف الطعام ✓");
      }
    });
  }

  /* ================= خطة اليوم ================= */
  function pick(pool, n) {
    const a = pool.slice();
    const out = [];
    while (out.length < n && a.length) out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
    return out;
  }
  const grams = (kcalShare, food) => {
    let g = Math.round((kcalShare / (food.kcal || 1)) * 100 / 5) * 5;
    const cap = food.cat === "drink" ? 500 : 400;
    return Math.max(15, Math.min(cap, g));
  };

  function generate(announce) {
    if (!calc) runCalc();
    const all = Store.allFoods();
    const meals = MEAL_SLOTS.map(slot => {
      const pool = all.filter(f => slot.cats.includes(f.cat) && f.kcal > 0);
      const items = [];
      const roles = slot.key === "breakfast"
        ? ["carb", "dairy", "fruit"]
        : slot.key === "snack"
        ? ["snack", "fruit", "dairy"]
        : ["protein", "carb", "veg"];
      const share = calc.kcal * slot.pct;
      const shares = [0.45, 0.35, 0.20];
      roles.forEach((role, i) => {
        const cands = pool.filter(f => f.cat === role);
        const chosen = pick(cands.length ? cands : pool, 1)[0];
        if (!chosen) return;
        const g = grams(share * shares[i], chosen);
        items.push({ id: chosen.id, ar: chosen.ar, en: chosen.en, cat: chosen.cat, g,
          kcal: Math.round(chosen.kcal * g / 100),
          p: Math.round(chosen.p * g / 100), c: Math.round(chosen.c * g / 100),
          f: Math.round(chosen.f * g / 100) });
      });
      return { key: slot.key, ar: slot.ar, en: slot.en, pct: slot.pct, items };
    });
    dayPlan = { date: UI.today(), kcal: calc.kcal, protein: calc.protein, carbs: calc.carbs,
                fat: calc.fat, meals };
    Store.get().dayPlan = dayPlan; Store.save();
    if (announce) UI.toast("تم توليد خطة اليوم ✓");
    renderDay();
  }

  function totals(items) {
    return items.reduce((s, i) => ({ kcal: s.kcal + i.kcal, p: s.p + i.p, c: s.c + i.c, f: s.f + i.f }),
      { kcal: 0, p: 0, c: 0, f: 0 });
  }

  function renderDay() {
    if (!dayPlan) dayPlan = Store.get().dayPlan || null;
    if (!dayPlan) { calc ? generate(false) : (dayPlan = Store.get().dayPlan); }
    if (!dayPlan) { UI.$("#dayPlan").innerHTML = `<p class="muted">اضغط «توليد» لإنشاء خطة.</p>`; return; }

    const t = totals(dayPlan.meals.flatMap(m => m.items));
    UI.$("#dayPlan").innerHTML = `
      <div class="macro-cards" style="margin-bottom:14px">
        <div class="card"><div class="k">السعرات المحققة</div><div class="v">${t.kcal}</div>
          <div class="s">من ${dayPlan.kcal} سعرة</div></div>
        <div class="card i2"><div class="k">بروتين</div><div class="v">${t.p}غ</div><div class="s">هدف ${dayPlan.protein}غ</div></div>
        <div class="card i3"><div class="k">كربوهيدرات / دهون</div><div class="v">${t.c} / ${t.f}غ</div>
          <div class="s">هدف ${dayPlan.carbs} / ${dayPlan.fat}غ</div></div>
      </div>
      ${dayPlan.meals.map(m => {
        const mt = totals(m.items);
        return `<div class="day">
          <div class="day-hd" style="cursor:default">
            <h4>${UI.esc(m.ar)} <span class="en" style="display:inline;font-size:11px">${m.en}</span></h4>
            <b style="color:var(--brand2)">${mt.kcal} سعرة</b>
          </div>
          <div class="day-bd">
            <table class="table"><tbody>
              ${m.items.map(i => `<tr>
                <td><b>${UI.esc(i.ar)}</b><div class="en" style="font-size:11px">${UI.esc(i.en)}</div></td>
                <td class="num">${i.g} غ/مل</td>
                <td class="num">${i.kcal} سعرة</td>
                <td class="num">ب ${i.p} · ك ${i.c} · د ${i.f}</td></tr>`).join("")}
            </tbody></table>
            <div class="stat-line">مجموع الوجبة: ${mt.kcal} سعرة · بروتين ${mt.p}غ · كربوهيدرات ${mt.c}غ · دهون ${mt.f}غ</div>
          </div></div>`;
      }).join("")}
      <div class="filters" style="margin-top:14px">
        <button class="btn btn-primary" onclick="document.getElementById('btnGenDay').click()">🎲 توليد خطة أخرى</button>
        <button class="btn btn-ghost" onclick="document.getElementById('btnPrintDay').click()">🖨️ طباعة</button>
      </div>`;
  }

  function printDay() {
    if (!dayPlan) return UI.toast("ولّد الخطة أولاً", "warn");
    const t = totals(dayPlan.meals.flatMap(m => m.items));
    let html = `<h1>خطة التغذية اليومية</h1>
      <div class="p-sub">${dayPlan.date} · الهدف ${dayPlan.kcal} سعرة · بروتين ${dayPlan.protein}غ · كربوهيدرات ${dayPlan.carbs}غ · دهون ${dayPlan.fat}غ</div>
      <div class="p-box"><b>الإجمالي المحقق:</b> ${t.kcal} سعرة — بروتين ${t.p}غ · كربوهيدرات ${t.c}غ · دهون ${t.f}غ</div>`;
    dayPlan.meals.forEach(m => {
      const mt = totals(m.items);
      html += `<div class="p-day"><h3>${m.ar} — ${mt.kcal} سعرة</h3><table>
        <thead><tr><th>الطعام</th><th>الكمية</th><th>سعرات</th><th>ب/ك/د</th></tr></thead><tbody>
        ${m.items.map(i => `<tr><td>${UI.esc(i.ar)} — ${UI.esc(i.en)}</td><td>${i.g} غ</td>
          <td>${i.kcal}</td><td>${i.p}/${i.c}/${i.f}</td></tr>`).join("")}
        </tbody></table></div>`;
    });
    html += `<div class="p-day"><h3>إرشادات</h3><p>💧 اشرب ${calc ? calc.water : ""} لتر ماء يومياً · 🕐 وزّع الوجبات كل 3-4 ساعات ·
      🏋️ وجبة الكربوهيدرات قبل التمرين بساعتين ووجبة البروتين بعدها بنصف ساعة.</p></div>` + UI.printFooter();
    UI.print(html);
  }

  return { init, runCalc, renderFoods, renderDiets, generate, getCalc: () => calc };
})();
