/* ============================================================
   ميزانيتي | MIZANIYATI — الشاشات: الميزانية + الفواتير المتكررة
   ============================================================ */

/* ============================================================
   الميزانية الشهرية
   ============================================================ */
const ViewBudget = {
  route: 'budget',
  month: U.monthKey(),
  render(root) {
    const data = App.data();
    const mk = this.month;
    root.innerHTML = '';
    root.append(UIX.page({ title: t('budgetTitle'), desc: t('budgetFor', { m: U.monthLabel(mk) }) },
      U.el('div', { class: 'page-actions' },
        U.el('button', { class: 'btn btn-ghost', onclick: () => { this.month = U.addMonths(this.month, -1); this.render(root); } }, ic('arrowL', 'btn-ic')),
        U.el('span', { class: 'month-tag' }, U.monthLabel(mk)),
        U.el('button', { class: 'btn btn-ghost', onclick: () => { this.month = U.addMonths(this.month, 1); this.render(root); } }, ic('arrowR', 'btn-ic')),
        U.el('button', { class: 'btn btn-primary', onclick: () => this.edit() }, icHTML('plus', 'btn-ic'), t('setBudget')))));

    const b = Budget.usage(data, mk);
    if (!b.rows.length) {
      root.append(UIX.empty(t('noBudgetYet'), 'budget'));
      root.append(U.el('button', { class: 'btn btn-primary', onclick: () => this.edit() }, icHTML('plus', 'btn-ic'), t('setBudget')));
      return;
    }

    /* شريط الإجمالي */
    const over = b.totalUsed > b.totalLimit;
    root.append(U.el('div', { class: 'card budget-total' },
      U.el('div', { class: 'bt-head' },
        U.el('span', {}, `${t('totalBudget')}: ${U.fmtMoney(b.totalLimit)}`),
        U.el('b', { class: over ? 'expense' : 'income' }, `${t('used')}: ${U.fmtMoney(b.totalUsed)}`)),
      U.el('div', { class: 'bar' },
        U.el('i', { class: `bar-fill ${over ? 'bad' : b.totalPct >= 80 ? 'warn' : 'ok'}`, style: `width:${Math.min(100, b.totalPct)}%` })),
      U.el('div', { class: 'bt-foot muted small' },
        over ? t('overBudget', { v: U.fmtMoney(b.totalUsed - b.totalLimit) }) : t('budgetLeft', { v: U.fmtMoney(b.totalLimit - b.totalUsed) }),
        ` · ${b.totalPct.toFixed(0)}% · ${t('carryNote')}`)));

    /* أقسام: ضروري / اختياري */
    const essential = b.rows.filter(r => Data.catById(r.catId).essential);
    const wants = b.rows.filter(r => !Data.catById(r.catId).essential);
    const rowEl = r => {
      const c = Data.catById(r.catId);
      const label = r.state === 'nolimit' ? t('spent') : r.pct >= 100 ? t('overBudget', { v: U.fmtMoney(r.used - r.limit) }) : t('budgetLeft', { v: U.fmtMoney(r.left) });
      return U.el('div', { class: 'budget-row' },
        U.el('div', { class: 'br-head' },
          U.el('span', { class: 'chip', style: `--chip:${c.color}` }, ic(c.icon, 'chip-ic'), Data.catName(c)),
          U.el('span', { class: 'br-amt' }, r.limit > 0 ? `${U.fmtMoney(r.used)} / ${U.fmtMoney(r.limit)}` : U.fmtMoney(r.used)),
          U.el('button', { class: 'icon-btn', title: t('edit'), onclick: () => this.edit(r.catId) }, ic('pen'))),
        U.el('div', { class: 'bar' },
          U.el('i', { class: `bar-fill ${r.state === 'bad' ? 'bad' : r.state === 'warn' ? 'warn' : r.state === 'nolimit' ? 'nolimit' : 'ok'}`, style: `width:${r.limit > 0 ? Math.min(100, r.pct) : (b.totalUsed ? Math.min(100, (r.used / b.totalUsed) * 100) : 0)}%` })),
        U.el('div', { class: 'muted small' }, `${r.limit > 0 ? r.pct.toFixed(0) + '% · ' : ''}${label}`));
    };
    root.append(U.el('div', { class: 'grid2 stretch' },
      UIX.card(`${icHTML('shield')} ${t('essentialRatio')}`, essential.length ? essential.map(rowEl) : U.el('p', { class: 'muted' }, t('noData'))),
      UIX.card(`${icHTML('star')} ${t('wantsRatio')}`, wants.length ? wants.map(rowEl) : U.el('p', { class: 'muted' }, t('noData')))));
  },
  edit(catId) {
    const data = App.data();
    const expenseCats = Data.CATS.filter(c => c.type === 'expense');
    const form = U.el('form', { class: 'form' },
      U.el('label', { class: 'fld' }, t('category'),
        U.el('select', { class: 'input', name: 'catId' },
          expenseCats.map(c => U.el('option', { value: c.id, selected: c.id === catId }, `${Data.catName(c)}${data.budgets?.[c.id] ? ' — ' + U.fmtMoney(data.budgets[c.id]) : ''}`)))),
      U.el('label', { class: 'fld' }, `${t('limit')} (${t('month')})`,
        U.el('input', { class: 'input', name: 'limit', type: 'number', min: '0', step: 'any', value: catId ? (data.budgets[catId] || '') : '' })),
      U.el('p', { class: 'muted small' }, t('carryNote')));
    U.modal({
      title: `${icHTML('budget')} ${t('setBudget')}`, body: form,
      actions: [
        { label: t('cancel'), class: 'btn-ghost' },
        {
          label: t('save'), class: 'btn-primary', onClick: async close => {
            const fd = new FormData(form);
            Budget.set(App.data(), fd.get('catId'), Number(fd.get('limit')) || 0);
            await App.save(); close(); U.toast(t('saved')); App.render();
          },
        },
      ],
    });
  },
};

/* ============================================================
   الفواتير المتكررة
   ============================================================ */
const ViewRecurring = {
  route: 'recurring',
  render(root) {
    const data = App.data();
    root.innerHTML = '';
    root.append(UIX.page({ title: t('recurringTitle'), desc: t('recurringSub') },
      U.el('button', { class: 'btn btn-primary', onclick: () => this.edit(null) }, icHTML('plus', 'btn-ic'), t('addRecurring'))));

    /* ملخص الشهري المكافئ */
    const monthly = data.recurring.filter(r => r.active !== false)
      .reduce((s, r) => s + Recurring.monthlyEquivalent(r), 0);
    const inc = Advisor.monthStats(data, U.monthKey()).income;
    root.append(U.el('div', { class: 'kpis kpis-2' },
      UIX.kpi(t('debtLoad'), U.fmtMoney(monthly), t('freqMonthly'), 'chain'),
      UIX.kpi(t('debtLoad') + ' %', inc > 0 ? `${((monthly / inc) * 100).toFixed(0)}%` : '—', t('of') + ' ' + t('monthIncome'), 'pie', monthly / Math.max(1, inc) > 0.5 ? 'expense' : '')));

    /* زر تنفيذ المستحق */
    const due = Recurring.dueList(data);
    if (due.length) {
      root.append(U.el('div', { class: 'card due-banner' },
        U.el('span', {}, icHTML('recurring'), ` ${t('runAll')} (${due.length})`),
        U.el('button', {
          class: 'btn btn-primary', onclick: async () => {
            due.forEach(r => Recurring.run(App.data(), r.id));
            await App.save(); U.toast(t('runDone')); App.render();
          },
        }, t('runNow'))));
    }

    if (!data.recurring.length) { root.append(UIX.empty(t('emptyRecurring'), 'inbox')); return; }

    const freqLabel = r => t('freq' + r.freq[0].toUpperCase() + r.freq.slice(1));
    root.append(U.el('div', { class: 'list card-list' },
      data.recurring.map(r => {
        const c = Data.catById(r.catId);
        const overdue = r.active !== false && r.nextDue <= U.todayISO();
        return U.el('div', { class: `card rec-card ${r.active === false ? 'off' : ''}` },
          U.el('div', { class: 'tx-row' },
            U.el('div', { class: 'tx-ic', style: `background:${c.color}22;color:${c.color}` }, ic(c.icon)),
            U.el('div', { class: 'tx-mid' },
              U.el('div', { class: 'tx-title' }, r.name, r.active === false ? U.el('span', { class: 'chip muted' }, t('inactive')) : null),
              U.el('div', { class: 'tx-sub' },
                `${freqLabel(r)} · ${Data.catName(c)} · ${Accounts.nameOf(data, r.accId)} · ${t('nextDue')}: `,
                U.el('b', { class: overdue ? 'expense' : '' }, U.fmtDate(r.nextDue, 'short')))),
            U.el('div', { class: 'tx-amt' }, U.fmtMoney(r.amount))),
          U.el('div', { class: 'acc-foot' },
            overdue ? U.el('button', {
              class: 'btn btn-sm btn-primary', onclick: async () => {
                Recurring.run(App.data(), r.id); await App.save(); U.toast(t('runDone')); App.render();
              },
            }, icHTML('bolt', 'btn-ic'), t('runNow')) : null,
            U.el('button', { class: 'btn btn-sm btn-ghost', onclick: () => this.edit(r) }, icHTML('pen', 'btn-ic'), t('edit')),
            U.el('button', {
              class: 'btn btn-sm btn-ghost', onclick: async () => {
                Recurring.update(App.data(), r.id, { active: r.active === false });
                await App.save(); App.render();
              },
            }, r.active === false ? icHTML('check', 'btn-ic') + ' ' + t('active') : icHTML('recurring', 'btn-ic') + ' ' + t('inactive')),
            U.el('button', {
              class: 'btn btn-sm btn-ghost danger', onclick: async () => {
                if (!(await U.confirmBox(t('deleteRecurring'), { danger: true, okLabel: t('delete') }))) return;
                Recurring.remove(App.data(), r.id); await App.save(); U.toast(t('deleted')); App.render();
              },
            }, icHTML('trash', 'btn-ic'), t('delete'))));
      })));
  },
  edit(r) {
    const data = App.data();
    const isEdit = !!r;
    const form = U.el('form', { class: 'form' },
      U.el('label', { class: 'fld' }, t('label'),
        U.el('input', { class: 'input', name: 'name', required: true, value: r?.name || '', placeholder: I18n.lang() === 'ar' ? 'مثال: اشتراك الإنترنت' : 'e.g. Internet subscription' })),
      U.el('div', { class: 'grid2' },
        U.el('label', { class: 'fld' }, t('amount'),
          U.el('input', { class: 'input', name: 'amount', type: 'number', min: '0', step: 'any', required: true, value: r?.amount ?? '' })),
        U.el('label', { class: 'fld' }, t('type'),
          U.el('select', { class: 'input', name: 'type' },
            U.el('option', { value: 'expense', selected: (r?.type || 'expense') === 'expense' }, t('expense')),
            U.el('option', { value: 'income', selected: r?.type === 'income' }, t('income'))))),
      U.el('div', { class: 'grid2' },
        U.el('label', { class: 'fld' }, t('category'),
          U.el('select', { class: 'input', name: 'catId' },
            Data.CATS.map(c => U.el('option', { value: c.id, selected: c.id === (r?.catId || 'utilities') }, Data.catName(c))))),
        U.el('label', { class: 'fld' }, t('account'),
          U.el('select', { class: 'input', name: 'accId' },
            data.accounts.map(a => U.el('option', { value: a.id, selected: a.id === r?.accId }, Accounts.nameOf(data, a.id)))))),
      U.el('label', { class: 'fld' }, t('frequency'),
        U.el('select', { class: 'input', name: 'freq' },
          [['weekly', t('freqWeekly')], ['monthly', t('freqMonthly')], ['quarterly', t('freqQuarterly')], ['yearly', t('freqYearly')]]
            .map(([v, l]) => U.el('option', { value: v, selected: (r?.freq || 'monthly') === v }, l)))),
      U.el('label', { class: 'check' },
        U.el('input', { type: 'checkbox', name: 'autoRun', checked: r?.autoRun !== false }), t('autoRun')));
    U.modal({
      title: isEdit ? `${icHTML('pen')} ${t('editRecurring')}` : `${icHTML('plus')} ${t('addRecurring')}`, body: form,
      actions: [
        { label: t('cancel'), class: 'btn-ghost' },
        {
          label: t('save'), class: 'btn-primary', onClick: async close => {
            const fd = new FormData(form);
            const patch = {
              name: (fd.get('name') || '').toString().trim(),
              amount: Number(fd.get('amount')) || 0,
              type: fd.get('type'), catId: fd.get('catId'), accId: fd.get('accId'),
              freq: fd.get('freq'), autoRun: !!fd.get('autoRun'),
            };
            if (!patch.name) return U.toast(t('nameRequired'), 'err');
            if (!patch.amount) return U.toast(t('amountRequired'), 'err');
            if (isEdit) Recurring.update(data, r.id, patch); else Recurring.add(data, patch);
            await App.save(); close(); U.toast(t('saved')); App.render();
          },
        },
      ],
    });
  },
};
