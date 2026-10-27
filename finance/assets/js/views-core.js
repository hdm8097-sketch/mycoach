/* ============================================================
   ميزان | Mizan — الشاشات: لوحة التحكم + الحركات + الحسابات
   ============================================================ */

/* ---------- مشتركات الواجهة ---------- */
const UIX = {
  page(sub, extra) {
    return U.el('div', { class: 'page-head' },
      U.el('div', {}, U.el('h2', {}, sub.title), sub.desc ? U.el('p', { class: 'muted' }, sub.desc) : null),
      extra ? U.el('div', { class: 'page-actions' }, extra) : null);
  },
  kpi(label, value, sub, icon, tone = '') {
    return U.el('div', { class: `kpi ${tone}` },
      U.el('div', { class: 'kpi-top' }, U.el('span', { class: 'kpi-label' }, label),
        icon ? U.el('span', { class: 'kpi-ic' }, typeof icon === 'string' && typeof ic === 'function' ? ic(icon) : icon) : null),
      U.el('div', { class: 'kpi-val' }, value),
      sub ? U.el('div', { class: 'kpi-sub' }, sub) : null);
  },
  /* بطاقة إحصائية متدرجة (حسب الموك-أب) */
  statCard({ label, value, sub, icon, tone = 'violet', onClick }) {
    const card = U.el('div', { class: `stat-card ${tone}`, role: onClick ? 'button' : null, tabindex: onClick ? '0' : null },
      U.el('div', { class: 'stat-ic' }, ic(icon)),
      U.el('div', { class: 'stat-info' },
        U.el('div', { class: 'stat-label' }, label),
        U.el('div', { class: 'stat-val' }, value),
        sub ? U.el('div', { class: 'stat-sub' }, sub) : null),
      onClick ? U.el('button', { class: 'stat-go', 'aria-label': label, onclick: e => { e.stopPropagation(); onClick(); } }, ic('arrowUR')) : null);
    if (onClick) {
      card.addEventListener('click', onClick);
      card.addEventListener('keydown', e => { if (e.key === 'Enter') onClick(); });
    }
    return card;
  },
  card(title, ...body) {
    return U.el('section', { class: 'card' },
      title ? U.el('h3', { class: 'card-title' }, title) : null, ...body);
  },
  empty(msg, icon = 'inbox') {
    return U.el('div', { class: 'empty' },
      U.el('div', { class: 'empty-ic' }, typeof icon === 'string' ? ic(icon, '', 34) : icon), U.el('p', {}, msg));
  },
  catChip(catId) {
    const c = Data.catById(catId);
    return U.el('span', { class: 'chip', style: `--chip:${c.color}` }, ic(c.icon, 'chip-ic'), Data.catName(c));
  },
  /* صف حركة */
  txRow(data, x, { onEdit, compact = false } = {}) {
    const c = Data.catById(x.catId);
    const row = U.el('div', { class: 'tx-row' },
      U.el('div', { class: 'tx-ic', style: `background:${c.color}22;color:${c.color}` }, ic(c.icon)),
      U.el('div', { class: 'tx-mid' },
        U.el('div', { class: 'tx-title' }, Data.catName(c)),
        U.el('div', { class: 'tx-sub' },
          compact ? U.fmtDate(x.date, 'short') : U.fmtDate(x.date),
          x.note ? ` · ${x.note}` : '',
          compact ? '' : ` · ${Accounts.nameOf(data, x.accId)}`)),
      U.el('div', { class: `tx-amt ${x.type}` }, (x.type === 'income' ? '+' : '−') + U.fmtMoney(x.amount)));
    if (onEdit) {
      row.classList.add('clickable');
      row.addEventListener('click', () => onEdit(x));
    }
    return row;
  },
  /* نموذج حركة (إضافة/تعديل) */
  txForm(data, tx = {}) {
    const isEdit = !!tx.id;
    let type = tx.type || 'expense';
    const form = U.el('form', { class: 'form' });
    const accSel = U.el('select', { class: 'input', name: 'accId', required: true },
      data.accounts.map(a => U.el('option', { value: a.id, selected: a.id === tx.accId }, `${Data.accTypeName(Data.accTypeById(a.type))} — ${Accounts.nameOf(data, a.id)}`)));
    const catSel = U.el('select', { class: 'input', name: 'catId', required: true });
    const renderCats = () => {
      catSel.innerHTML = '';
      Data.CATS.filter(c => c.type === type).forEach(c =>
        catSel.append(U.el('option', { value: c.id, selected: c.id === tx.catId }, Data.catName(c))));
    };
    renderCats();
    const typeSeg = U.el('div', { class: 'seg' },
      ['expense', 'income'].map(tp => U.el('button', {
        type: 'button', class: `seg-btn ${tp === type ? 'on ' + tp : ''}`, dataset: { tp },
        onclick: e => {
          type = tp;
          form.querySelectorAll('.seg-btn').forEach(b => { b.className = 'seg-btn' + (b.dataset.tp === type ? ' on ' + type : ''); });
          renderCats();
        },
      }, ic(tp === 'expense' ? 'expense' : 'income', 'seg-ic'), t(tp))));
    form.append(
      typeSeg,
      U.el('div', { class: 'grid2' },
        U.el('label', { class: 'fld' }, t('amount'),
          U.el('input', { class: 'input', name: 'amount', type: 'number', step: 'any', min: '0', inputmode: 'decimal', required: true, value: tx.amount ?? '', placeholder: '0' })),
        U.el('label', { class: 'fld' }, t('date'),
          U.el('input', { class: 'input', name: 'date', type: 'date', required: true, value: tx.date || U.todayISO() }))),
      U.el('div', { class: 'grid2' },
        U.el('label', { class: 'fld' }, t('account'), accSel),
        U.el('label', { class: 'fld' }, t('category'), catSel)),
      U.el('label', { class: 'fld' }, t('note'),
        U.el('input', { class: 'input', name: 'note', value: tx.note || '', placeholder: t('optional') })),
    );
    return {
      form, type: () => type,
      values() {
        const fd = new FormData(form);
        return {
          type,
          amount: Number(fd.get('amount')),
          date: fd.get('date'),
          accId: fd.get('accId'),
          catId: fd.get('catId'),
          note: (fd.get('note') || '').toString().trim(),
        };
      },
      isEdit,
    };
  },
};

/* ============================================================
   لوحة التحكم
   ============================================================ */
const ViewDashboard = {
  route: 'dashboard',
  render(root) {
    const data = App.data();
    const mk = U.monthKey();
    const st = Advisor.monthStats(data, mk);
    const bal = Accounts.totalBalance(data);
    const nw = Accounts.netWorth(data);
    const bd = Advisor.catBreakdown(data, mk);
    const rate = st.income > 0 ? (st.savings / st.income) * 100 : 0;
    const sc = Advisor.score(data);
    const due = Recurring.dueList(data);
    const goTx = () => App.navigate('tx');

    root.innerHTML = '';
    /* الترحيب */
    root.append(U.el('div', { class: 'page-head greet' },
      U.el('div', {},
        U.el('h2', {}, t('dashHi', { name: data.profile.name })),
        U.el('p', { class: 'muted' }, `${U.fmtDate(U.todayISO(), 'short')} · ${t('dashSub')}`)),
      U.el('button', { class: 'btn btn-primary', onclick: () => this.quickAdd() }, ic('plus', 'btn-ic'), t('quickAdd'))));

    /* بطاقات الملخص المتدرجة */
    root.append(U.el('div', { class: 'stats-grid' },
      UIX.statCard({
        label: t('netBalance'), value: U.fmtCompact(bal), sub: t('accountsCount', { n: data.accounts.length }),
        icon: 'wallet', tone: 'violet', onClick: () => App.navigate('accounts'),
      }),
      UIX.statCard({
        label: t('monthIncome'), value: U.fmtCompact(st.income), sub: U.monthLabel(mk),
        icon: 'income', tone: 'teal', onClick: () => { ViewTx.filters = { q: '', type: 'income', catId: 'all', accId: 'all', month: mk }; goTx(); },
      }),
      UIX.statCard({
        label: t('monthExpense'), value: U.fmtCompact(st.expense), sub: U.monthLabel(mk),
        icon: 'expense', tone: 'pink', onClick: () => { ViewTx.filters = { q: '', type: 'expense', catId: 'all', accId: 'all', month: mk }; goTx(); },
      }),
      UIX.statCard({
        label: t('savingsRate'), value: `${rate.toFixed(0)}%`, sub: t('savingsRateHelp'),
        icon: 'savings', tone: 'blue', onClick: () => App.navigate('advisor'),
      })));

    /* العمودان: الرسومات + العمود الجانبي */
    const main = U.el('div', { class: 'dash-main' });
    const side = U.el('div', { class: 'dash-side' });

    /* المصروف حسب التصنيف */
    const donutBox = U.el('div', {});
    const donutCard = UIX.card(t('expenseByCat'), donutBox);
    if (bd.total > 0) {
      const items = Object.entries(bd.byCat).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([id, v]) => {
        const c = Data.catById(id);
        return { label: Data.catName(c), value: v, color: c.color };
      });
      U.Charts.donut(donutBox, items, { centerLabel: U.monthLabel(mk), centerValue: U.fmtCompact(bd.total) });
    } else donutBox.append(UIX.empty(t('noTxYet'), 'tx'));

    /* 6 أشهر */
    const months = Advisor.last(6);
    const incS = months.map(m => Advisor.monthStats(data, m).income);
    const expS = months.map(m => Advisor.monthStats(data, m).expense);
    const chartBox = U.el('div', {});
    const chartCard = UIX.card(t('incomeVsExpense'), chartBox,
      U.el('div', { class: 'legend-inline' },
        U.el('span', {}, U.el('i', { class: 'dot', style: 'background:var(--c-income)' }), t('income')),
        U.el('span', {}, U.el('i', { class: 'dot', style: 'background:var(--c-expense)' }), t('expense'))));
    U.Charts.barLine(chartBox, {
      labels: months.map(m => U.monthLabel(m, true)),
      series: [
        { name: t('income'), color: 'var(--c-income)', values: incS },
        { name: t('expense'), color: 'var(--c-expense)', values: expS },
      ],
      height: 190,
    });
    main.append(chartCard, donutCard);

    /* الدرجة الصحية */
    const scoreBox = U.el('div', {});
    const scoreCard = UIX.card(t('healthScore'), scoreBox);
    U.Charts.gauge(scoreBox, sc.total, sc.total >= 80 ? t('scoreExcellent') : sc.total >= 60 ? t('scoreGood') : sc.total >= 40 ? t('scoreFair') : t('scorePoor'));
    const partIcon = { savings: 'drop', emergency: 'umbrella', records: 'calendar', commitments: 'chain', budget: 'pie', diversification: 'basket' };
    scoreBox.append(U.el('div', { class: 'score-parts' },
      sc.parts.map(p => U.el('div', { class: 'score-part' },
        ic(partIcon[p.key] || 'pie', 'sp-ic'),
        U.el('span', { class: 'sp-metric' }, p.metric),
        U.el('span', { class: 'sp-bar' }, U.el('i', { style: `width:${(p.value / p.weight) * 100}%` }))))),
      U.el('button', { class: 'btn btn-ghost full', onclick: () => App.navigate('advisor') }, ic('advisor', 'btn-ic'), t('viewAll')));

    /* العمود الجانبي: أحدث الحركات + إحصاءات سريعة */
    const recent = data.tx.slice(0, 5);
    side.append(UIX.card(`${t('recentTx')}`,
      recent.length ? U.el('div', { class: 'list' }, recent.map(x => UIX.txRow(data, x, { compact: true, onEdit: e => App.openTx(e) })))
        : UIX.empty(t('noTxYet'), 'tx'),
      U.el('button', { class: 'btn btn-ghost full', onclick: goTx }, t('viewAll'))));

    const qstats = [
      { icon: 'pie', label: t('topCat'), value: (() => { const top = Object.entries(bd.byCat).sort((a, b) => b[1] - a[1])[0]; return top ? Data.catName(Data.catById(top[0])) : '—'; })() },
      { icon: 'wallet', label: t('netWorth'), value: U.fmtCompact(nw.net) },
      { icon: 'recurring', label: t('dueSoon'), value: String(due.length) },
      { icon: 'advisor', label: t('healthScore'), value: `${sc.total}/100` },
    ];
    side.append(UIX.card(t('quickStats'),
      U.el('div', { class: 'qstats' }, qstats.map(q => U.el('div', { class: 'qstat' },
        U.el('span', { class: 'qstat-ic' }, ic(q.icon)),
        U.el('div', {}, U.el('span', { class: 'qstat-label' }, q.label), U.el('b', {}, q.value)))))));

    root.append(U.el('div', { class: 'dash-layout' }, main, U.el('aside', { class: 'dash-aside' }, side, scoreCard)));
  },
  async quickAdd() {
    const data = App.data();
    const f = UIX.txForm(data);
    U.modal({
      title: `${icHTML('bolt')} ${t('quickAdd')}`, body: f.form,
      actions: [
        { label: t('cancel'), class: 'btn-ghost' },
        {
          label: t('save'), class: 'btn-primary', onClick: async close => {
            const v = f.values();
            if (!v.amount || v.amount <= 0) return U.toast(t('amountRequired'), 'err');
            Tx.add(App.data(), v);
            await App.save(); close(); U.toast(t('saved')); App.render();
          },
        },
      ],
    });
  },
};

/* ============================================================
   الحركات
   ============================================================ */
const ViewTx = {
  route: 'tx',
  filters: { q: '', type: 'all', catId: 'all', accId: 'all', month: '' },
  render(root) {
    const data = App.data();
    const f = this.filters;
    root.innerHTML = '';
    root.append(UIX.page({ title: t('txTitle'), desc: t('txCount', { n: data.tx.length }) },
      U.el('button', { class: 'btn btn-primary', onclick: () => this.edit(null) }, `＋ ${t('addTx')}`)));

    /* شريط الفلاتر */
    const qIn = U.el('input', { class: 'input grow', type: 'search', id: 'tx-search', placeholder: t('searchTx'), value: f.q });
    const typeSel = U.el('select', { class: 'input' },
      [['all', t('allTypes')], ['income', t('income')], ['expense', t('expense')]].map(([v, l]) => U.el('option', { value: v, selected: f.type === v }, l)));
    const catSel = U.el('select', { class: 'input' },
      U.el('option', { value: 'all', selected: f.catId === 'all' }, t('all')),
      Data.CATS.map(c => U.el('option', { value: c.id, selected: f.catId === c.id }, Data.catName(c))));
    const accSel = U.el('select', { class: 'input' },
      U.el('option', { value: 'all', selected: f.accId === 'all' }, t('all')),
      data.accounts.map(a => U.el('option', { value: a.id, selected: f.accId === a.id }, Accounts.nameOf(data, a.id))));
    const monthIn = U.el('input', { class: 'input', type: 'month', value: f.month });
    const apply = U.debounce(() => {
      f.q = qIn.value; f.type = typeSel.value; f.catId = catSel.value; f.accId = accSel.value; f.month = monthIn.value;
      this.renderList(listBox, sumBox, data);
    }, 220);
    [qIn, typeSel, catSel, accSel, monthIn].forEach(e => { e.addEventListener('input', apply); e.addEventListener('change', apply); });

    root.append(U.el('div', { class: 'filters' }, qIn, typeSel, catSel, accSel, monthIn,
      U.el('button', { class: 'btn btn-ghost', onclick: () => { this.filters = { q: '', type: 'all', catId: 'all', accId: 'all', month: '' }; this.render(root); } }, ic('close', 'btn-ic'))));

    const sumBox = U.el('div', { class: 'sum-bar' });
    const listBox = U.el('div', { class: 'list card-list' });
    root.append(sumBox, listBox);
    this.renderList(listBox, sumBox, data);
  },
  renderList(listBox, sumBox, data) {
    const f = this.filters;
    const list = Tx.filter(data, f);
    const tot = Tx.totals(list);
    sumBox.innerHTML = '';
    sumBox.append(
      U.el('span', { class: 'chip ok' }, `${t('sumIn')}: ${U.fmtMoney(tot.inc)}`),
      U.el('span', { class: 'chip bad' }, `${t('sumOut')}: ${U.fmtMoney(tot.exp)}`),
      U.el('span', { class: 'chip' }, `${t('netFlow')}: ${U.fmtMoney(tot.net)}`),
      U.el('span', { class: 'muted small' }, t('txCount', { n: list.length })));
    listBox.innerHTML = '';
    if (!list.length) { listBox.append(UIX.empty(t('emptyTx'), 'search')); return; }
    /* تجميع حسب اليوم */
    const groups = {};
    list.forEach(x => (groups[x.date] = groups[x.date] || []).push(x));
    Object.entries(groups).forEach(([date, items]) => {
      const dayTot = Tx.totals(items);
      listBox.append(U.el('div', { class: 'day-group' },
        U.el('div', { class: 'day-head' },
          U.el('span', {}, U.fmtDate(date)),
          U.el('span', { class: `day-net ${dayTot.net >= 0 ? 'income' : 'expense'}` }, U.fmtMoney(dayTot.net))),
        U.el('div', { class: 'card' }, items.map(x => UIX.txRow(data, x, { onEdit: e => this.edit(e) })))));
    });
  },
  edit(tx) {
    const data = App.data();
    const f = UIX.txForm(data, tx || {});
    const isEdit = !!tx;
    U.modal({
      title: isEdit ? `${icHTML('pen')} ${t('editTx')}` : `${icHTML('plus')} ${t('addTx')}`, body: f.form,
      actions: [
        isEdit ? {
          label: `${icHTML('trash')} ${t('delete')}`, class: 'btn-danger', onClick: async close => {
            if (!(await U.confirmBox(t('deleteTx'), { detail: t('deleteTxSub'), danger: true, okLabel: t('delete') }))) return;
            Tx.remove(App.data(), tx.id); await App.save(); close(); U.toast(t('deleted')); App.render();
          },
        } : { label: t('cancel'), class: 'btn-ghost' },
        {
          label: t('save'), class: 'btn-primary', onClick: async close => {
            const v = f.values();
            if (!v.amount || v.amount <= 0) return U.toast(t('amountRequired'), 'err');
            if (isEdit) Tx.update(data, tx.id, v); else Tx.add(data, v);
            await App.save(); close(); U.toast(t('saved')); App.render();
          },
        },
      ],
    });
  },
};

/* ============================================================
   الحسابات
   ============================================================ */
const ViewAccounts = {
  route: 'accounts',
  render(root) {
    const data = App.data();
    const bals = Accounts.balances(data);
    const nw = Accounts.netWorth(data);
    root.innerHTML = '';
    root.append(UIX.page({ title: t('accountsTitle'), desc: `${t('accountsCount', { n: data.accounts.length })} · ${t('totalAssets')}: ${U.fmtMoney(nw.assets)}` },
      U.el('button', { class: 'btn btn-primary', onclick: () => this.edit(null) }, `＋ ${t('addAccount')}`)));

    root.append(U.el('div', { class: 'kpis kpis-2' },
      UIX.kpi(t('totalAssets'), U.fmtMoney(nw.assets), '', 'trend'),
      UIX.kpi(t('netWorth'), U.fmtMoney(nw.net), nw.liab ? `${t('accCredit')}: ${U.fmtMoney(nw.liab)}` : '', 'pie')));

    root.append(U.el('div', { class: 'acc-grid' },
      data.accounts.map(a => {
        const v = bals[a.id] || 0;
        const at = Data.accTypeById(a.type);
        const txCount = data.tx.filter(x => x.accId === a.id).length;
        return U.el('div', { class: `card acc-card ${v < 0 ? 'neg' : ''}` },
          U.el('div', { class: 'acc-head' },
            U.el('span', { class: 'acc-ic' }, ic(at.icon)),
            U.el('div', { class: 'acc-names' },
              U.el('b', {}, Accounts.nameOf(data, a.id)),
              U.el('span', { class: 'muted small' }, `${Data.accTypeName(at)} · ${txCount} ${t('txCount', { n: '' }).trim()}`)),
            U.el('span', { class: `acc-bal ${v < 0 ? 'expense' : ''}` }, U.fmtMoney(v))),
          U.el('div', { class: 'acc-foot' },
            U.el('button', { class: 'btn btn-sm btn-ghost', onclick: () => this.edit(a) }, `${icHTML('pen')} ${t('edit')}`),
            U.el('button', {
              class: 'btn btn-sm btn-ghost danger', onclick: async () => {
                if (!(await U.confirmBox(t('deleteAccount'), { detail: t('deleteAccountSub'), danger: true, okLabel: t('delete') }))) return;
                try { Accounts.remove(data, a.id); } catch (e) { return U.toast(t('accountInUse'), 'err'); }
                await App.save(); U.toast(t('deleted')); App.render();
              },
            }, `${icHTML('trash')} ${t('delete')}`)));
      })));

    /* إضافة سريعة لحركة */
    root.append(U.el('button', { class: 'btn btn-ghost full mt', onclick: () => ViewDashboard.quickAdd() }, `${icHTML('bolt')} ${t('quickAdd')}`));
  },
  edit(acc) {
    const data = App.data();
    const isEdit = !!acc;
    const form = U.el('form', { class: 'form' },
      U.el('label', { class: 'fld' }, `${t('name')} (${t('language') === 'Language' ? 'AR' : 'عربي'})`,
        U.el('input', { class: 'input', name: 'nameAr', required: true, value: acc?.nameAr || '', placeholder: 'مثال: الحساب البنكي' })),
      U.el('label', { class: 'fld' }, `${t('name')} (EN)`,
        U.el('input', { class: 'input', name: 'nameEn', value: acc?.nameEn || '', placeholder: 'e.g. Bank account' })),
      U.el('label', { class: 'fld' }, t('type'),
        U.el('select', { class: 'input', name: 'type' },
          Data.ACC_TYPES.map(at => U.el('option', { value: at.id, selected: (acc?.type || 'cash') === at.id }, Data.accTypeName(at))))),
      U.el('label', { class: 'fld' }, t('openingBalance'),
        U.el('input', { class: 'input', name: 'opening', type: 'number', step: 'any', value: acc?.opening ?? 0 })));
    U.modal({
      title: isEdit ? `${icHTML('pen')} ${t('editAccount')}` : `${icHTML('plus')} ${t('addAccount')}`, body: form,
      actions: [
        { label: t('cancel'), class: 'btn-ghost' },
        {
          label: t('save'), class: 'btn-primary', onClick: async close => {
            const fd = new FormData(form);
            const nameAr = (fd.get('nameAr') || '').toString().trim();
            if (!nameAr) return U.toast(t('nameRequired'), 'err');
            const patch = { nameAr, nameEn: (fd.get('nameEn') || '').toString().trim() || nameAr, type: fd.get('type'), opening: Number(fd.get('opening')) || 0 };
            if (isEdit) Accounts.update(data, acc.id, patch); else Accounts.add(data, patch);
            await App.save(); close(); U.toast(t('saved')); App.render();
          },
        },
      ],
    });
  },
};
