/* ============================================================
   ميزان | Mizan — محرك المستشار المالي (قواعد محلية)
   يعمل بالكامل داخل الجهاز بدون إنترنت — لا يُرسل أي بيانات.
   الدرجة = 6 مكونات: الادخار 30، الطوارئ 20، انتظام التسجيل 15،
   الالتزامات 15، الميزانية 10، التنويع 10.
   ============================================================ */
const Advisor = (() => {
  const last = monthsN => {
    const out = [];
    const d = new Date();
    for (let i = 0; i < monthsN; i++) out.push(U.addMonths(U.monthKey(d), -i));
    return out.reverse();
  };
  const monthTx = (data, mk) => data.tx.filter(x => U.monthOf(x.date) === mk);
  const sum = arr => arr.reduce((s, x) => s + (Number(x.amount) || 0), 0);

  /* ---------- مؤشرات شهرية ---------- */
  function monthStats(data, mk) {
    const tx = monthTx(data, mk);
    const income = sum(tx.filter(x => x.type === 'income'));
    const expense = sum(tx.filter(x => x.type === 'expense'));
    const savings = income - expense;
    const rate = income > 0 ? (savings / income) * 100 : 0;
    return { mk, income, expense, savings, rate, count: tx.length, tx };
  }

  /* تصنيفات المصروف مجمّعة: ضروري / رغبات */
  function catBreakdown(data, mk) {
    const tx = monthTx(data, mk).filter(x => x.type === 'expense');
    const byCat = {};
    for (const x of tx) byCat[x.catId] = (byCat[x.catId] || 0) + Number(x.amount || 0);
    let essential = 0, wants = 0;
    for (const [id, v] of Object.entries(byCat)) {
      if (Data.catById(id).essential) essential += v; else wants += v;
    }
    const total = essential + wants;
    return { byCat, essential, wants, total, essentialPct: total ? (essential / total) * 100 : 0, wantsPct: total ? (wants / total) * 100 : 0 };
  }

  /* صندوق الطوارئ: متوسط المصروف الضروري × 3–6 أشهر */
  function emergency(data) {
    const months = last(3);
    const essentialMonths = months.map(mk => catBreakdown(data, mk).essential);
    const avgEssential = essentialMonths.some(v => v > 0)
      ? essentialMonths.reduce((a, b) => a + b, 0) / essentialMonths.filter(v => v > 0).length
      : 0;
    /* السيولة = مجموع أرصدة الحسابات (نقد+بنك+ادخار) */
    const liquid = Accounts.totalBalance(data) ;
    const monthsCovered = avgEssential > 0 ? liquid / avgEssential : 0;
    return { avgEssential, liquid, monthsCovered, targetLow: 3, targetHigh: 6 };
  }

  /* عبء الالتزامات الثابتة من الدخل */
  function commitmentLoad(data) {
    const d = new Date();
    const mIncome = monthStats(data, U.monthKey(d)).income || monthStats(data, U.addMonths(U.monthKey(d), -1)).income;
    const monthlyRecurring = sum(data.recurring.filter(r => r.active !== false && r.freq === 'monthly').map(r => ({ amount: r.amount }))
      .concat(data.recurring.filter(r => r.active !== false && r.freq === 'quarterly').map(r => ({ amount: r.amount / 3 }))
        , data.recurring.filter(r => r.active !== false && r.freq === 'yearly').map(r => ({ amount: r.amount / 12 }))
        , data.recurring.filter(r => r.active !== false && r.freq === 'weekly').map(r => ({ amount: r.amount * 4.33 }))));
    const pct = mIncome > 0 ? (monthlyRecurring / mIncome) * 100 : 0;
    return { monthlyRecurring, income: mIncome, pct };
  }

  /* ---------- الدرجة ---------- */
  function score(data) {
    const parts = [];
    const months = last(3).map(mk => monthStats(data, mk)).filter(m => m.count > 0);
    const hasHistory = data.tx.length >= 5 && months.length >= 1;

    /* 1) الادخار (30) */
    const avgRate = months.length ? months.reduce((s, m) => s + m.rate, 0) / months.length : 0;
    const target = Number(data.profile.savingsTarget) || 20;
    let sSavings = 0;
    if (hasHistory) {
      if (avgRate >= target) sSavings = 30;
      else if (avgRate >= target * 0.6) sSavings = 30 * (avgRate / target);
      else if (avgRate > 0) sSavings = 10 * (avgRate / target);
      else sSavings = 0;
    }
    parts.push({ key: 'savings', weight: 30, value: Math.round(sSavings), metric: `${avgRate.toFixed(1)}%` });

    /* 2) الطوارئ (20) */
    const em = emergency(data);
    let sEm = 0;
    if (hasHistory) {
      if (em.monthsCovered >= 6) sEm = 20;
      else if (em.monthsCovered >= 3) sEm = 14 + 6 * ((em.monthsCovered - 3) / 3);
      else sEm = 14 * (em.monthsCovered / 3);
    }
    parts.push({ key: 'emergency', weight: 20, value: Math.round(sEm), metric: `${em.monthsCovered.toFixed(1)}m` });

    /* 3) انتظام التسجيل (15) */
    const activeMonths = new Set(data.tx.map(x => U.monthOf(x.date))).size;
    const spanMonths = Math.max(1, (Date.now() - (data.tx.length ? Math.min(...data.tx.map(x => +new Date(x.date))) : Date.now())) / (30 * 864e5));
    const coverage = Math.min(1, activeMonths / Math.max(1, spanMonths));
    const recent = last(2).some(mk => monthStats(data, mk).count > 0);
    const sReg = hasHistory ? 15 * (0.4 * coverage + 0.6 * (recent ? 1 : 0)) : 0;
    parts.push({ key: 'records', weight: 15, value: Math.round(sReg), metric: `${activeMonths}/${Math.round(spanMonths)}` });

    /* 4) الالتزامات الثابتة (15) */
    const cl = commitmentLoad(data);
    let sCommit = 0;
    if (hasHistory && cl.income > 0) {
      if (cl.pct <= 50) sCommit = 15;
      else if (cl.pct <= 70) sCommit = 15 * (1 - (cl.pct - 50) / 40);
      else sCommit = 0;
    } else if (hasHistory) sCommit = cl.monthlyRecurring > 0 ? 4 : 10;
    parts.push({ key: 'commitments', weight: 15, value: Math.round(sCommit), metric: `${cl.pct.toFixed(0)}%` });

    /* 5) الميزانية (10) */
    const mk = U.monthKey();
    const cats = new Set(monthTx(data, mk).filter(x => x.type === 'expense').map(x => x.catId));
    const setBudgets = Object.keys(data.budgets || {});
    const used = [...cats].filter(id => data.budgets[id] > 0).length;
    let sBudget = 0;
    if (hasHistory) {
      if (setBudgets.length === 0) sBudget = 2;              /* لا ميزانية */
      else sBudget = 10 * Math.min(1, (used + 1) / (cats.size + 1)) ;
    }
    parts.push({ key: 'budget', weight: 10, value: Math.round(sBudget), metric: `${setBudgets.length}` });

    /* 6) التنويع بين الحسابات (10) */
    const accs = data.accounts.filter(a => a.opening !== 0 || data.tx.some(x => x.accId === a.id));
    const withBalance = Accounts.balances(data);
    const active = accs.filter(a => Math.abs(withBalance[a.id] || 0) > 0).length;
    let sDiv = 0;
    if (hasHistory) sDiv = active >= 3 ? 10 : active === 2 ? 7 : active === 1 ? 4 : 0;
    parts.push({ key: 'diversify', weight: 10, value: Math.round(sDiv), metric: `${active}` });

    const total = parts.reduce((s, p) => s + p.value, 0);
    return { total, parts, avgRate, em, cl, hasHistory, months };
  }

  /* ---------- التوصيات ---------- */
  function insights(data) {
    const out = [];
    const s = score(data);
    const { avgRate, em, cl } = s;
    const target = Number(data.profile.savingsTarget) || 20;
    const mk = U.monthKey();
    const ms = monthStats(data, mk);
    const bd = catBreakdown(data, mk);

    if (!s.hasHistory) {
      out.push({ level: 'low', icon: 'pen', title: t('insightLow'), text: t('advisorEmpty') });
      return out;
    }

    /* الادخار */
    if (avgRate < 0) {
      out.push({ level: 'high', icon: 'danger', title: t('insightHigh'),
        text: I18n.lang() === 'ar'
          ? `إنفاقك يتجاوز دخلك بمعدل ${fmtPct(Math.abs(avgRate))} خلال آخر 3 أشهر. أوقف المصروفات الاختيارية فوراً وراجع الالتزامات الثابتة.`
          : `Your spending exceeds your income by ${fmtPct(Math.abs(avgRate))} over the last 3 months. Stop discretionary spending and review fixed commitments.` });
    } else if (avgRate < target / 2) {
      const need = ms.income > 0 ? (ms.income * (target - avgRate) / 100) : 0;
      out.push({ level: 'med', icon: 'danger', title: t('insightMed'),
        text: I18n.lang() === 'ar'
          ? `نسبة ادخارك ${fmtPct(avgRate)} — أقل من هدفك ${target}٪. خفّض بنداً اختيارياً بمقدار ${U.fmtMoney(need)} شهرياً لتصل للهدف.`
          : `Your savings rate is ${fmtPct(avgRate)} — below your ${target}% target. Cut one discretionary item by ${U.fmtMoney(need)}/month to reach it.` });
    } else {
      out.push({ level: 'low', icon: 'star', title: t('insightLow'),
        text: I18n.lang() === 'ar'
          ? `معدل ادخارك ${fmtPct(avgRate)} ممتاز (الهدف ${target}٪) — وجّه الفائض نحو صندوق الطوارئ أو استثمار.`
          : `Excellent savings rate of ${fmtPct(avgRate)} (target ${target}%) — direct the surplus to your emergency fund or investments.` });
    }

    /* الطوارئ */
    if (em.monthsCovered < 1) {
      out.push({ level: 'high', icon: 'umbrella', title: t('insightHigh'),
        text: I18n.lang() === 'ar'
          ? `صندوق الطوارئ يكفي ${em.monthsCovered.toFixed(1)} شهر فقط من مصروفك الضروري (${U.fmtMoney(em.avgEssential)}/شهر). الهدف 3–6 أشهر — ابدأ بأي مبلغ تتراكم.`
          : `Your emergency fund covers only ${em.monthsCovered.toFixed(1)} months of essential expenses (${U.fmtMoney(em.avgEssential)}/mo). Target 3–6 months — start with any amount.` });
    } else if (em.monthsCovered < 3) {
      out.push({ level: 'med', icon: 'umbrella', title: t('insightMed'),
        text: I18n.lang() === 'ar'
          ? `تغطيتك ${em.monthsCovered.toFixed(1)} أشهر من الطوارئ — استمر حتى تصل 3 أشهر على الأقل (تبقّى ${U.fmtMoney(Math.max(0, em.avgEssential * 3 - em.liquid))}).`
          : `You cover ${em.monthsCovered.toFixed(1)} emergency months — keep going to at least 3 (${U.fmtMoney(Math.max(0, em.avgEssential * 3 - em.liquid))} to go).` });
    }

    /* أكبر تسريب */
    if (bd.total > 0 && bd.wantsPct > 40) {
      const topWant = Object.entries(bd.byCat)
        .filter(([id]) => !Data.catById(id).essential)
        .sort((a, b) => b[1] - a[1])[0];
      if (topWant) {
        const cat = Data.catById(topWant[0]);
        out.push({ level: 'med', icon: 'filter', title: t('topLeak'),
          text: I18n.lang() === 'ar'
            ? `التصنيفات الاختيارية ${fmtPct(bd.wantsPct)} من مصروفك — الأكبر «${Data.catName(cat)}» بـ ${U.fmtMoney(topWant[1])} هذا الشهر. خفّضها 30٪ = توفير ${U.fmtMoney(topWant[1] * 0.3)} شهرياً.`
            : `Discretionary categories are ${fmtPct(bd.wantsPct)} of your spending — the biggest is «${Data.catName(cat)}» at ${U.fmtMoney(topWant[1])} this month. Cutting it 30% saves ${U.fmtMoney(topWant[1] * 0.3)}/month.` });
      }
    }

    /* الالتزامات */
    if (cl.pct > 50) {
      out.push({ level: cl.pct > 70 ? 'high' : 'med', icon: 'chain', title: t('debtLoad'),
        text: I18n.lang() === 'ar'
          ? `التزاماتك المتكررة تستهلك ${fmtPct(cl.pct)} من دخلك (${U.fmtMoney(cl.monthlyRecurring)}/شهر). الحد المريح تحت 50٪ — أعد التفاوض أو جدول السداد.`
          : `Your recurring commitments consume ${fmtPct(cl.pct)} of income (${U.fmtMoney(cl.monthlyRecurring)}/mo). Comfortable is under 50% — renegotiate or reschedule.` });
    }

    /* الميزانية */
    const overCats = Object.entries(data.budgets || {})
      .filter(([id, lim]) => lim > 0 && (bd.byCat[id] || 0) > lim)
      .map(([id, lim]) => ({ id, over: (bd.byCat[id] || 0) - lim }));
    if (overCats.length) {
      const totalOver = overCats.reduce((s2, c) => s2 + c.over, 0);
      out.push({ level: 'med', icon: 'pie', title: t('budgetBad'),
        text: I18n.lang() === 'ar'
          ? `${overCats.length} تصنيف تجاوز حد الميزانية هذا الشهر بمجموع ${U.fmtMoney(totalOver)}. راجع ${overCats.map(c => `«${Data.catName(Data.catById(c.id))}»`).join('، ')}.`
          : `${overCats.length} categories went over budget this month by ${U.fmtMoney(totalOver)} total. Review ${overCats.map(c => `«${Data.catName(Data.catById(c.id))}»`).join(', ')}.` });
    } else if (Object.keys(data.budgets || {}).length === 0) {
      out.push({ level: 'low', icon: 'budget', title: t('insightLow'),
        text: I18n.lang() === 'ar'
          ? 'لم تضع ميزانية بعد — الميزانية ترفع درجتك وتحميك من الانحراف. أضف حدوداً لأعلى 5 تصنيفات صرف لديك.'
          : 'No budget set yet — a budget raises your score and keeps you on track. Add caps for your top 5 spending categories.' });
    }

    /* الانتظام */
    if (s.parts.find(p => p.key === 'records').value < 8) {
      out.push({ level: 'low', icon: 'calendar', title: t('insightLow'),
        text: I18n.lang() === 'ar'
          ? 'سجلّك غير منتظم — سجّل حركاتك يومياً أو أسبوعياً حتى يعطيك المستشار تحليلاً أدق وتُظهر التقارير صورة صحيحة.'
          : 'Your records are irregular — log transactions daily or weekly so the advisor can analyze accurately and reports show a true picture.' });
    }

    /* دخل متنوع؟ */
    const incomeCats = new Set(data.tx.filter(x => x.type === 'income').map(x => x.catId));
    if (incomeCats.size === 1 && s.hasHistory) {
      out.push({ level: 'low', icon: 'basket', title: t('insightLow'),
        text: I18n.lang() === 'ar'
          ? 'دخلك يعتمد على مصدر واحد — فكّر في مصدر دخل إضافي (عمل حر، مشروع صغير) لتقليل المخاطر.'
          : 'Your income depends on a single source — consider an extra income stream (freelance, small project) to reduce risk.' });
    }

    const order = { high: 0, med: 1, low: 2 };
    return out.sort((a, b) => order[a.level] - order[b.level]);
  }

  const fmtPct = v => `${(Number(v) || 0).toFixed(1)}%`;

  /* ---------- حاسبة هدف الادخار ---------- */
  function goalPlan(data, amount, months) {
    const required = amount / Math.max(1, months);
    const s = score(data);
    const capacity = s.months.length
      ? s.months.reduce((a, m) => a + Math.max(0, m.savings), 0) / s.months.length
      : 0;
    let verdict = 'ok';
    if (capacity >= required) verdict = 'ok';
    else if (capacity >= required * 0.6) verdict = 'tight';
    else verdict = 'no';
    return { required, capacity, verdict, gap: Math.max(0, required - capacity) };
  }

  /* ---------- تحليل فترة ---------- */
  function periodReport(data, mk) {
    const cur = monthStats(data, mk);
    const prev = monthStats(data, U.addMonths(mk, -1));
    const bd = catBreakdown(data, mk);
    const topCats = Object.entries(bd.byCat).sort((a, b) => b[1] - a[1]);
    const cats = data.tx.filter(x => U.monthOf(x.date) === mk);
    const topTx = [...cats].sort((a, b) => b.amount - a.amount).slice(0, 5);
    const incomeByCat = {};
    cats.filter(x => x.type === 'income').forEach(x => incomeByCat[x.catId] = (incomeByCat[x.catId] || 0) + x.amount);
    return {
      cur, prev, bd, topCats, topTx,
      incomeByCat: Object.entries(incomeByCat).sort((a, b) => b[1] - a[1]),
      deltaIncome: prev.income ? ((cur.income - prev.income) / prev.income) * 100 : null,
      deltaExpense: prev.expense ? ((cur.expense - prev.expense) / prev.expense) * 100 : null,
      days: U.daysInMonth(mk),
      dailyAvg: cur.expense / U.daysInMonth(mk),
    };
  }

  return { monthStats, catBreakdown, emergency, commitmentLoad, score, insights, goalPlan, periodReport, last };
})();
