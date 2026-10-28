/* ============================================================
   ميزانيتي | MIZANIYATI — الخزنة المشفّرة (تشفير + تخزين + دخول)
   البيانات كلها مشفّرة بـ AES-256-GCM، والمفتاح مشتق من رمزك
   السري عبر PBKDF2 (250k جولة). رمز الطوارئ يلتفّ حول المفتاح.
   ============================================================ */
const Vault = (() => {
  const LS_KEY = 'mizan.vault';
  const LS_META = 'mizan.meta';
  const ITER = 250000;
  let mem = null;          // البيانات المفكوكة في الذاكرة فقط
  let memKey = null;       // مفتاح AES المشتق من الرمز السري
  let listeners = [];

  /* ---------- أدوات ---------- */
  const now = () => Date.now();
  function genRecoveryCode() {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    return `MZ-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
  }
  const normRecovery = s => String(s || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
    .replace(/^MZ/, '').padEnd(12, '0').slice(0, 12);

  async function deriveKey(pin, saltB64) {
    return U.Crypto.deriveKey(pin, U.Crypto.unb64(saltB64), ITER);
  }
  const newSalt = () => U.Crypto.b64(crypto.getRandomValues(new Uint8Array(16)));

  /* ---------- إنشاء / فتح ----------
     البنية: مفتاح أساسي عشوائي يُشفّر البيانات، ويُلفّ مرتين:
       env.pin → حوله بمفتاح الرمز السري (ملح + لفّ)
       env.rec → حوله بمفتاح رمز الطوارئ (ملح + لفّ)
     بذلك: تغيير الرمز لا يعيد تشفير البيانات، ورمز الطوارئ يبقى صالحاً. */
  async function wrapMaster(masterRaw, password, salt) {
    const key = await deriveKey(password, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, masterRaw);
    return { iv: U.Crypto.b64(iv), ct: U.Crypto.b64(ct) };
  }
  async function unwrapMaster(pack, password, salt) {
    const key = await deriveKey(password, salt);
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: U.Crypto.unb64(pack.iv) }, key, U.Crypto.unb64(pack.ct));
  }
  const importMaster = raw => crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);

  async function create({ name, pin, currency = 'YER', sync = null }) {
    /* مفتاح فك التشفير الأساسي يُولَّد عشوائياً ثم يُلفّ حوله بمفتاحين */
    const master = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    const masterRaw = await crypto.subtle.exportKey('raw', master);
    const recCode = genRecoveryCode();
    const pinSalt = newSalt(), recSalt = newSalt();
    const pinWrap = await wrapMaster(masterRaw, pin, pinSalt);
    /* نوحّد شكل رمز الطوارئ قبل اشتقاق المفتاح (بدون شرطات ولا بادئة) */
    const recWrap = await wrapMaster(masterRaw, normRecovery(recCode), recSalt);

    mem = defaultData(name, currency, sync);
    memKey = master;
    const blob = await encryptEnvelope(master);
    const env = {
      v: 1, iter: ITER,
      pin: { salt: pinSalt, ...pinWrap },
      rec: { salt: recSalt, ...recWrap },
      updatedAt: now(),
      ...blob,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(env));
    localStorage.setItem(LS_META, JSON.stringify({ createdAt: now(), version: 1 }));
    fire();
    return { recovery: recCode };
  }

  async function unlock(pin) {
    const env = readEnv();
    if (!env) throw new Error('NO_VAULT');
    /* البنية القديمة (ملح واحد بلا لفّ) — دعم للتوافق */
    if (!env.pin && env.salt) {
      let key;
      try { key = await deriveKey(pin, env.salt); } catch { throw new Error('BAD_PIN'); }
      let data;
      try { data = await decryptEnvelope(env, key); } catch { throw new Error('BAD_PIN'); }
      mem = data; memKey = key; fire();
      return mem;
    }
    let masterRaw;
    try { masterRaw = await unwrapMaster(env.pin, pin, env.pin.salt); } catch { throw new Error('BAD_PIN'); }
    const master = await importMaster(masterRaw);
    let data;
    try { data = await decryptEnvelope(env, master); } catch { throw new Error('BAD_PIN'); }
    mem = data; memKey = master;
    fire();
    return mem;
  }

  /* الاستعادة برمز الطوارئ + تعيين رمز سري جديد */
  async function recover(recCode, newPin) {
    const env = readEnv();
    if (!env) throw new Error('NO_VAULT');
    const code = normRecovery(recCode);
    let masterRaw;
    try { masterRaw = await unwrapMaster(env.rec, code, env.rec.salt); } catch { throw new Error('BAD_RECOVERY'); }
    /* لفّ المفتاح الأساسي حول الرمز الجديد — رمز الطوارئ يبقى كما هو */
    const pinSalt = newSalt();
    const pinWrap = await wrapMaster(masterRaw, newPin, pinSalt);
    env.pin = { salt: pinSalt, ...pinWrap };
    delete env.salt; /* الملح القديم لم يعد مستخدماً */
    env.updatedAt = now();
    localStorage.setItem(LS_KEY, JSON.stringify(env));
    const master = await importMaster(masterRaw);
    mem = await decryptEnvelope(env, master); memKey = master;
    fire();
    return mem;
  }

  async function changePin(oldPin, newPin) {
    const env = readEnv();
    if (!env) throw new Error('NO_VAULT');
    let masterRaw;
    if (env.pin) {
      try { masterRaw = await unwrapMaster(env.pin, oldPin, env.pin.salt); } catch { throw new Error('BAD_PIN'); }
    } else if (env.salt) {
      /* البنية القديمة */
      try { await decryptEnvelope(env, await deriveKey(oldPin, env.salt)); } catch { throw new Error('BAD_PIN'); }
      masterRaw = await crypto.subtle.exportKey('raw', memKey);
    } else throw new Error('BAD_PIN');
    const pinSalt = newSalt();
    const pinWrap = await wrapMaster(masterRaw, newPin, pinSalt);
    env.pin = { salt: pinSalt, ...pinWrap };
    delete env.salt;
    env.updatedAt = now();
    localStorage.setItem(LS_KEY, JSON.stringify(env));
  }

  /* ---------- التشفير الداخلي ---------- */
  async function encryptEnvelope(key) {
    const { iv, ct } = await U.Crypto.encJSON(key, mem);
    return { iv, ct };
  }
  async function decryptEnvelope(env, key) {
    return U.Crypto.decJSON(key, { iv: env.iv, ct: env.ct });
  }
  const readEnv = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch { return null; } };

  /* ---------- الحفظ ---------- */
  async function save(data) {
    if (!memKey) throw new Error('LOCKED');
    mem = data || mem;
    mem.updatedAt = now();
    const env = readEnv() || {};
    const blob = await encryptEnvelope(memKey);
    Object.assign(env, blob, { updatedAt: now() });
    localStorage.setItem(LS_KEY, JSON.stringify(env));
    fire();
  }
  async function replaceData(data) { mem = data; await save(data); }

  function lock() { mem = null; memKey = null; fire(); }
  const isUnlocked = () => !!mem;
  const exists = () => !!localStorage.getItem(LS_KEY);
  const data = () => mem;
  const meta = () => { try { return JSON.parse(localStorage.getItem(LS_META)) || {}; } catch { return {}; } };
  const updatedAt = () => (readEnv() || {}).updatedAt || 0;

  /* فك تشفير نسخة سحابية (للمزامنة) — يحتاج الرمز السري */
  async function decryptCloud(env, pin) {
    if (env.pin) {
      const masterRaw = await unwrapMaster(env.pin, pin, env.pin.salt);
      return decryptEnvelope(env, await importMaster(masterRaw));
    }
    /* البنية القديمة */
    const key = await deriveKey(pin, env.salt);
    return decryptEnvelope(env, key);
  }
  /* تجهيز نسخة مشفّرة للرفع */
  async function exportEnvelope() {
    const env = readEnv();
    if (!env) throw new Error('NO_VAULT');
    const blob = await encryptEnvelope(memKey);
    return { ...env, ...blob, updatedAt: now() };
  }
  /* استبدال الخزنة بالكامل بنسخة مستوردة (ملف احتياطي مشفّر) */
  async function importEnvelope(env, pin) {
    if (!env || !env.ct) throw new Error('BAD_FILE');
    const d = await decryptCloud(env, pin);
    localStorage.setItem(LS_KEY, JSON.stringify(env));
    /* استعادة المفتاح الأساسي في الذاكرة من الظرف المستورد */
    if (env.pin) {
      const masterRaw = await unwrapMaster(env.pin, pin, env.pin.salt);
      memKey = await importMaster(masterRaw);
    } else {
      memKey = await deriveKey(pin, env.salt);
    }
    mem = d; fire();
    return d;
  }

  /* ---------- البيانات الافتراضية ---------- */
  function defaultData(name, currency, sync) {
    return {
      v: 1,
      updatedAt: now(),
      profile: { name: name || 'صاحب الخزنة', currency: currency || 'YER', savingsTarget: 20 },
      settings: { theme: 'light', autoLockMin: 15, lang: 'ar' },
      sync: sync || { enabled: false, owner: '', repo: 'mizaniyati-vault', branch: 'main', pat: '', path: 'vault.enc.json', lastSync: 0, log: [] },
      accounts: [
        { id: 'acc_cash', nameAr: 'النقد', nameEn: 'Cash', type: 'cash', opening: 0, createdAt: now() },
      ],
      tx: [],
      budgets: {},          // { catId: حد }
      recurring: [],
    };
  }

  const onChange = fn => listeners.push(fn);
  const fire = () => listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });

  return {
    create, unlock, recover, changePin, save, lock, replaceData, decryptCloud, exportEnvelope, importEnvelope,
    isUnlocked, exists, data, meta, updatedAt, onChange,
    get mem() { return mem; },
    normRecovery,
  };
})();
