/* ============================================================
   ميزانيتي | MIZANIYATI — الشاشات: المستشار + التقارير + الإعدادات
   ============================================================ */

/* بطاقة توصية (تستخدم في اللوحة والمستشار) */
UIX.insight = function (i) {
  return U.el('div', { class: `ins ins-${i.level}` },
    U.el('span', { class: 'ins-ic' }, typeof i.icon === 'string' && typeof Icons !== 'undefined' && Icons[i.icon] ? ic(i.icon) : i.icon),
    U.el('div', { class: 'ins-body' },
      U.el('div', { class: 'ins-title' }, i.title),
      U.el('p', { class: 'ins-text' }, i.text)));
};

/* ============================================================
   المستشار المالي
   ============================================================ */
const ViewAdvisor = {
  route: 'advisor',
  render(root) {
    const data = App.data();
    root.innerHTML = '';
    root.append(UIX.page({ title: t('advisorTitle'), desc: t('advisorSub') },
      U.el('button', { class: 'btn btn-primary', onclick: () => { U.toast(t('analyzeNow'), 'info'); this.render(root); } }, icHTML('advisor', 'btn-ic'), t('analyzeNow'))));

    if (data.tx.length < 5) { root.append(UIX.empty(t('advisorEmpty'), 'advisor')); }

    const sc = Advisor.score(data);
    const { avgRate, em, cl } = sc;
    const target = Number(data.profile.savingsTarget) || 20;

    /* الدرجة + المكونات */
    const gaugeBox = U.el('div', {});
    const partsBox = U.el('div', { class: 'score-parts vert' },
      sc.parts.map(p => {
        const pct = p.weight ? (p.value / p.weight) * 100 : 0;
        return U.el('div', { class: 'sp-row' },
          U.el('span', { class: 'sp-name' },
            p.key === 'savings' ? `${icHTML('drop')} ${t('savingsRate')}` :
            p.key === 'emergency' ? `${icHTML('umbrella')} ${t('emergencyFund')}` :
            p.key === 'records' ? `${icHTML('calendar')} ${t('txTitle')}` :
            p.key === 'commitments' ? `${icHTML('chain')} ${t('debtLoad')}` :
            p.key === 'budget' ? `${icHTML('pie')} ${t('budgetTitle')}` : `${icHTML('basket')} ${t('navAccounts')}`),
          U.el('span', { class: 'sp-val' }, `${p.value}/${p.weight}`),
          U.el('span', { class: 'sp-bar wide' }, U.el('i', { style: `width:${Math.min(100, pct)}%` })));
      }));
    U.Charts.gauge(gaugeBox, sc.total, sc.total >= 80 ? t('scoreExcellent') : sc.total >= 60 ? t('scoreGood') : sc.total >= 40 ? t('scoreFair') : t('scorePoor'));
    root.append(U.el('div', { class: 'grid2 stretch' },
      UIX.card(`${icHTML('gauge')} ${t('healthScore')}`, gaugeBox, U.el('p', { class: 'muted small center' }, t('weightsNote'))),
      UIX.card(`${icHTML('stats')} ${t('ruleExplained')}`, partsBox)));

    /* مؤشرات سريعة */
    const mk = U.monthKey();
    const bd = Advisor.catBreakdown(data, mk);
    root.append(U.el('div', { class: 'kpis' },
      UIX.kpi(t('savingsRate'), `${avgRate.toFixed(1)}%`, `${t('of')} ${t('thisMonth')}`, 'drop', avgRate >= target ? 'income' : avgRate < 0 ? 'expense' : ''),
      UIX.kpi(t('essentialRatio'), `${bd.essentialPct.toFixed(0)}%`, U.fmtMoney(bd.essential), 'shield'),
      UIX.kpi(t('wantsRatio'), `${bd.wantsPct.toFixed(0)}%`, U.fmtMoney(bd.wants), 'star', bd.wantsPct > 40 ? 'expense' : ''),
      UIX.kpi(t('emergencyFund'), `${em.monthsCovered.toFixed(1)}`, `${t('of')} ${t('month')}`, 'umbrella', em.monthsCovered >= 3 ? 'income' : 'expense')));

    /* صندوق الطوارئ */
    root.append(UIX.card(`${icHTML('umbrella')} ${t('emergencyFund')}`,
      U.el('p', { class: 'muted' }, t('emergencyFundSub')),
      U.el('div', { class: 'bar big' }, U.el('i', { class: `bar-fill ${em.monthsCovered >= 3 ? 'ok' : em.monthsCovered >= 1 ? 'warn' : 'bad'}`, style: `width:${Math.min(100, (em.monthsCovered / 6) * 100)}%` })),
      U.el('div', { class: 'muted small' },
        em.monthsCovered <= 0 ? t('noEmergency') : t('monthsCovered', { n: em.monthsCovered.toFixed(1) }),
        ` · ${t('total')}: ${U.fmtMoney(em.liquid)} · ${t('essential') || ''} ${U.fmtMoney(em.avgEssential)}/${t('month')}`)));

    /* التوصيات */
    const ins = Advisor.insights(data);
    root.append(UIX.card(`${icHTML('info')} ${t('insights')}`,
      ins.length ? U.el('div', { class: 'ins-list' }, ins.map(i => UIX.insight(i))) : UIX.empty(t('noData'), 'info')));

    /* حاسبة هدف الادخار */
    const form = U.el('form', { class: 'form inline-form' },
      U.el('div', { class: 'grid2' },
        U.el('label', { class: 'fld' }, t('goalAmount'),
          U.el('input', { class: 'input', name: 'amt', type: 'number', min: '0', step: 'any', value: '1000000', required: true })),
        U.el('label', { class: 'fld' }, t('goalMonths'),
          U.el('select', { class: 'input', name: 'mo' }, [3, 6, 12, 24, 36].map(m => U.el('option', { value: m, selected: m === 12 }, `${m} ${t('month')}`))))));
    const result = U.el('div', { class: 'goal-result' });
    const calc = () => {
      const fd = new FormData(form);
      const g = Advisor.goalPlan(data, Number(fd.get('amt')) || 0, Number(fd.get('mo')) || 12);
      result.innerHTML = '';
      result.append(
        UIX.kpi(t('requiredMonthly'), U.fmtMoney(g.required), `${t('goalMonths')}: ${fd.get('mo')}`, 'budget'),
        UIX.kpi(t('yourCapacity'), U.fmtMoney(g.capacity), '', 'drop', g.capacity >= g.required ? 'income' : 'expense'),
        U.el('p', { class: `goal-verdict ${g.verdict}` },
          g.verdict === 'ok' ? t('goalVerdictOk') : g.verdict === 'tight' ? t('goalVerdictTight') : t('goalVerdictNo'),
          g.gap > 0 ? ` — ${t('gap') || ''} ${U.fmtMoney(g.gap)}` : ''));
    };
    form.addEventListener('input', calc);
    root.append(UIX.card(`${icHTML('budget')} ${t('savingsGoal')}`, form, result));
    calc();
  },
};

/* ============================================================
   التقارير
   ============================================================ */
const ViewReports = {
  route: 'reports',
  month: U.monthKey(),
  render(root) {
    const data = App.data();
    const mk = this.month;
    const r = Advisor.periodReport(data, mk);
    root.innerHTML = '';
    root.append(UIX.page({ title: t('reportsTitle'), desc: t('reportsSub') },
      U.el('div', { class: 'page-actions' },
        U.el('button', { class: 'btn btn-ghost', onclick: () => { this.month = U.addMonths(mk, -1); this.render(root); } }, ic('arrowL', 'btn-ic')),
        U.el('span', { class: 'month-tag' }, U.monthLabel(mk)),
        U.el('button', { class: 'btn btn-ghost', onclick: () => { this.month = U.addMonths(mk, 1); this.render(root); } }, ic('arrowR', 'btn-ic')),
        U.el('button', { class: 'btn btn-ghost', onclick: () => this.csv(data, mk) }, icHTML('download', 'btn-ic'), t('exportCsv')),
        U.el('button', { class: 'btn btn-primary', onclick: () => window.print() }, icHTML('printer', 'btn-ic'), t('printReport')))));

    if (!r.cur.count) { root.append(UIX.empty(t('reportEmpty'), 'doc')); }

    /* الملخص + التغيّر */
    const delta = (cur, prev, invert = false) => {
      if (prev == null || prev === 0) return U.el('span', { class: 'muted small' }, '—');
      const pct = ((cur - prev) / prev) * 100;
      const good = invert ? pct <= 0 : pct >= 0;
      return U.el('span', { class: `delta ${good ? 'income' : 'expense'}` }, `${icHTML(pct >= 0 ? 'arrowUp' : 'arrowDown', 'delta-ic')} ${Math.abs(pct).toFixed(1)}%`);
    };
    root.append(U.el('div', { class: 'kpis' },
      UIX.kpi(t('monthIncome'), U.fmtMoney(r.cur.income), delta(r.cur.income, r.prev.income), 'income', 'income'),
      UIX.kpi(t('monthExpense'), U.fmtMoney(r.cur.expense), delta(r.cur.expense, r.prev.expense, true), 'expense', 'expense'),
      UIX.kpi(t('netFlow'), U.fmtMoney(r.cur.savings), `${t('vsPrev')}: ${U.fmtMoney(r.prev.savings)}`, 'pie', r.cur.savings >= 0 ? 'income' : 'expense'),
      UIX.kpi(t('dailyAvg'), U.fmtMoney(r.dailyAvg), `${r.cur.count} ${t('txCount', { n: '' }).trim()}`, 'calendar')));

    /* الاتجاه 12 شهر */
    const months = Advisor.last(12);
    const chartBox = U.el('div', {});
    const chartCard = UIX.card(`${icHTML('trend')} ${t('trend')}`, chartBox);
    U.Charts.barLine(chartBox, {
      labels: months.map(m => U.monthLabel(m, true)),
      series: [
        { name: t('income'), color: 'var(--c-income)', values: months.map(m => Advisor.monthStats(data, m).income) },
        { name: t('expense'), color: 'var(--c-expense)', values: months.map(m => Advisor.monthStats(data, m).expense) },
      ],
      height: 200,
    });

    /* أعلى المصروفات */
    const topCard = UIX.card(`${icHTML('crown')} ${t('topExpenses')}`,
      r.topCats.length ? U.el('div', { class: 'list' },
        r.topCats.slice(0, 8).map(([id, v]) => {
          const c = Data.catById(id);
          const pct = r.bd.total ? (v / r.bd.total) * 100 : 0;
          return U.el('div', { class: 'rank-row' },
            U.el('span', { class: 'chip', style: `--chip:${c.color}` }, ic(c.icon, 'chip-ic'), Data.catName(c)),
            U.el('span', { class: 'rank-bar' }, U.el('i', { style: `width:${pct}%` })),
            U.el('b', {}, U.fmtMoney(v)),
            U.el('span', { class: 'muted small' }, `${pct.toFixed(0)}%`));
        })) : U.el('p', { class: 'muted' }, t('noData')));

    root.append(U.el('div', { class: 'grid2 stretch' }, chartCard, topCard));

    /* مصادر الدخل */
    if (r.incomeByCat.length) {
      root.append(UIX.card(`${icHTML('wallet')} ${t('topIncome')}`,
        U.el('div', { class: 'list' }, r.incomeByCat.map(([id, v]) => {
          const c = Data.catById(id);
          return U.el('div', { class: 'rank-row' },
            U.el('span', { class: 'chip', style: `--chip:${c.color}` }, ic(c.icon, 'chip-ic'), Data.catName(c)),
            U.el('span', { class: 'rank-bar' }, U.el('i', { style: `width:${r.cur.income ? (v / r.cur.income) * 100 : 0}%` })),
            U.el('b', {}, U.fmtMoney(v)),
            U.el('span', { class: 'muted small' }, `${r.cur.income ? ((v / r.cur.income) * 100).toFixed(0) : 0}%`));
        }))));
    }

    /* جدول تفصيلي قابل للطباعة */
    const rows = r.topCats.map(([id, v]) => {
      const c = Data.catById(id);
      const lim = Budget.limitOf(data, id);
      return [Data.catName(c), v.toFixed(2), lim > 0 ? lim.toFixed(2) : '—', lim > 0 ? ((v / lim) * 100).toFixed(0) + '%' : '—'];
    });
    const table = U.el('div', { class: 'table-wrap card' },
      U.el('h3', { class: 'card-title no-print' }, `${icHTML('doc')} ${t('reportSummary')} — ${U.monthLabel(mk)}`),
      U.el('table', { class: 'table' },
        U.el('thead', {}, U.el('tr', {}, [t('category'), t('total'), t('limit'), '%'].map(h => U.el('th', {}, h)))),
        U.el('tbody', {},
          U.el('tr', {}, U.el('td', {}, `${icHTML('income')} ${t('monthIncome')}`), U.el('td', {}, U.fmtMoney(r.cur.income)), U.el('td', {}, '—'), U.el('td', {}, '—')),
          U.el('tr', {}, U.el('td', {}, `${icHTML('expense')} ${t('monthExpense')}`), U.el('td', {}, U.fmtMoney(r.cur.expense)), U.el('td', {}, '—'), U.el('td', {}, '—')),
          rows.map(row => U.el('tr', {}, row.map((cell, i) => U.el('td', { class: i ? 'num' : '' }, cell))))),
        U.el('tfoot', {}, U.el('tr', {}, U.el('td', {}, `${icHTML('pie')} ${t('netFlow')}`), U.el('td', {}, U.fmtMoney(r.cur.savings)), U.el('td', {}, ''), U.el('td', {}, '')))));
    root.append(table);
  },
  csv(data, mk) {
    const list = Tx.filter(data, { month: mk });
    const rows = [[t('date'), t('type'), t('category'), t('account'), t('amount'), t('note')]];
    list.forEach(x => rows.push([
      x.date, x.type === 'income' ? t('income') : t('expense'),
      Data.catName(Data.catById(x.catId)), Accounts.nameOf(data, x.accId), x.amount, x.note || '',
    ]));
    U.download(`mizaniyati-${mk}.csv`, U.toCSV(rows), 'text/csv');
  },
};
