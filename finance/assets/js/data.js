/* ============================================================
   ميزانيتي | MIZANIYATI — البيانات الأساسية (عملات، تصنيفات، أنواع)
   ============================================================ */
const Data = (() => {
  const CURRENCIES = {
    YER: { sym: 'ر.ي', ar: 'ريال يمني', en: 'Yemeni Rial' },
    SAR: { sym: 'ر.س', ar: 'ريال سعودي', en: 'Saudi Riyal' },
    AED: { sym: 'د.إ', ar: 'درهم إماراتي', en: 'UAE Dirham' },
    QAR: { sym: 'ر.ق', ar: 'ريال قطري', en: 'Qatari Riyal' },
    KWD: { sym: 'د.ك', ar: 'دينار كويتي', en: 'Kuwaiti Dinar' },
    BHD: { sym: 'د.ب', ar: 'دينار بحريني', en: 'Bahraini Dinar' },
    OMR: { sym: 'ر.ع', ar: 'ريال عماني', en: 'Omani Rial' },
    EGP: { sym: 'ج.م', ar: 'جنيه مصري', en: 'Egyptian Pound' },
    JOD: { sym: 'د.أ', ar: 'دينار أردني', en: 'Jordanian Dinar' },
    MAD: { sym: 'د.م', ar: 'درهم مغربي', en: 'Moroccan Dirham' },
    TND: { sym: 'د.ت', ar: 'دينار تونسي', en: 'Tunisian Dinar' },
    DZD: { sym: 'د.ج', ar: 'دينار جزائري', en: 'Algerian Dinar' },
    LYD: { sym: 'د.ل', ar: 'دينار ليبي', en: 'Libyan Dinar' },
    SDG: { sym: 'ج.س', ar: 'جنيه سوداني', en: 'Sudanese Pound' },
    IQD: { sym: 'ع.د', ar: 'دينار عراقي', en: 'Iraqi Dinar' },
    SYP: { sym: 'ل.س', ar: 'ليرة سورية', en: 'Syrian Pound' },
    LBP: { sym: 'ل.ل', ar: 'ليرة لبنانية', en: 'Lebanese Pound' },
    TRY: { sym: '₺', ar: 'ليرة تركية', en: 'Turkish Lira' },
    USD: { sym: '$', ar: 'دولار أمريكي', en: 'US Dollar' },
    EUR: { sym: '€', ar: 'يورو', en: 'Euro' },
    GBP: { sym: '£', ar: 'جنيه إسترليني', en: 'British Pound' },
  };

  const ACC_TYPES = [
    { id: 'cash', ar: 'نقد', en: 'Cash', icon: 'cash' },
    { id: 'bank', ar: 'بنك', en: 'Bank', icon: 'bank' },
    { id: 'wallet', ar: 'محفظة إلكترونية', en: 'E-wallet', icon: 'wallet2' },
    { id: 'savings', ar: 'ادخار', en: 'Savings', icon: 'piggy' },
    { id: 'credit', ar: 'بطاقة ائتمان', en: 'Credit card', icon: 'credit' },
    { id: 'other', ar: 'أخرى', en: 'Other', icon: 'box' },
  ];

  /* التصنيفات الافتراضية — icon: مفتاح أيقونة Solar (icons.js) */
  const CATS = [
    { id: 'salary', type: 'income', ar: 'راتب', en: 'Salary', icon: 'salary', color: '#8b5cf6', essential: true },
    { id: 'freelance', type: 'income', ar: 'عمل حر', en: 'Freelance', icon: 'freelance', color: '#06b6d4', essential: false },
    { id: 'business', type: 'income', ar: 'مشروع/تجارة', en: 'Business', icon: 'business', color: '#f59e0b', essential: false },
    { id: 'investment', type: 'income', ar: 'استثمارات', en: 'Investments', icon: 'investment', color: '#10b981', essential: false },
    { id: 'rent_in', type: 'income', ar: 'إيجار مُستلم', en: 'Rent received', icon: 'rent_in', color: '#3b82f6', essential: false },
    { id: 'gift_in', type: 'income', ar: 'هدية/منحة', en: 'Gift/Grant', icon: 'gift_in', color: '#ec4899', essential: false },
    { id: 'other_in', type: 'income', ar: 'دخل آخر', en: 'Other income', icon: 'other_in', color: '#64748b', essential: false },

    { id: 'food', type: 'expense', ar: 'طعام وبقالة', en: 'Food & groceries', icon: 'food', color: '#f43f5e', essential: true },
    { id: 'housing', type: 'expense', ar: 'سكن وإيجار', en: 'Housing & rent', icon: 'housing', color: '#f97316', essential: true },
    { id: 'utilities', type: 'expense', ar: 'فواتير وخدمات', en: 'Utilities', icon: 'utilities', color: '#eab308', essential: true },
    { id: 'transport', type: 'expense', ar: 'مواصلات ووقود', en: 'Transport & fuel', icon: 'transport', color: '#84cc16', essential: true },
    { id: 'health', type: 'expense', ar: 'صحة وأدوية', en: 'Health & medicine', icon: 'health', color: '#ef4444', essential: true },
    { id: 'education', type: 'expense', ar: 'تعليم', en: 'Education', icon: 'education', color: '#0ea5e9', essential: true },
    { id: 'family', type: 'expense', ar: 'عائلة ومصروف بيت', en: 'Family & household', icon: 'family', color: '#6366f1', essential: true },
    { id: 'charity', type: 'expense', ar: 'صدقة وزكاة', en: 'Charity & Zakat', icon: 'charity', color: '#14b8a6', essential: true },
    { id: 'restaurants', type: 'expense', ar: 'مطاعم وقهوة', en: 'Restaurants & coffee', icon: 'restaurants', color: '#fb923c', essential: false },
    { id: 'shopping', type: 'expense', ar: 'تسوق وملابس', en: 'Shopping & clothes', icon: 'shopping', color: '#ec4899', essential: false },
    { id: 'entertainment', type: 'expense', ar: 'ترفيه واشتراكات', en: 'Entertainment & subs', icon: 'entertainment', color: '#a855f7', essential: false },
    { id: 'gifts', type: 'expense', ar: 'هدايا ومناسبات', en: 'Gifts & occasions', icon: 'gifts', color: '#f472b6', essential: false },
    { id: 'tech', type: 'expense', ar: 'تقنية وأجهزة', en: 'Tech & devices', icon: 'tech', color: '#3b82f6', essential: false },
    { id: 'travel', type: 'expense', ar: 'سفر', en: 'Travel', icon: 'travel', color: '#06b6d4', essential: false },
    { id: 'debt', type: 'expense', ar: 'سداد ديون/أقساط', en: 'Debt repayment', icon: 'debt', color: '#64748b', essential: true },
    { id: 'other_out', type: 'expense', ar: 'مصروف آخر', en: 'Other expense', icon: 'other_out', color: '#94a3b8', essential: false },
  ];

  const PALETTE = ['#34d399', '#f87171', '#60a5fa', '#fbbf24', '#a78bfa', '#22d3ee', '#f97316', '#ec4899', '#4ade80', '#94a3b8', '#c084fc', '#2dd4bf'];

  const catById = id => CATS.find(c => c.id === id) || CATS.find(c => c.id === 'other_out');
  const accTypeById = id => ACC_TYPES.find(a => a.id === id) || ACC_TYPES[5];
  const catName = c => (I18n.lang() === 'ar' ? c.ar : c.en);
  const accTypeName = a => (I18n.lang() === 'ar' ? a.ar : a.en);
  const curName = code => { const c = CURRENCIES[code]; return c ? (I18n.lang() === 'ar' ? c.ar : c.en) : code; };

  return { CURRENCIES, ACC_TYPES, CATS, PALETTE, catById, accTypeById, catName, accTypeName, curName };
})();
