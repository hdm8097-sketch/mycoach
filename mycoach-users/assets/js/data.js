/* =========================================================
   MyCoach — البيانات الأساسية (Exercises / Templates / Foods)
   ========================================================= */

const MUSCLES = {
  chest:     { ar: "صدر",      en: "Chest",      ico: "🫁" },
  back:      { ar: "ظهر",      en: "Back",       ico: "🔙" },
  shoulders: { ar: "أكتاف",    en: "Shoulders",  ico: "🔰" },
  legs:      { ar: "أرجل",     en: "Legs",       ico: "🦵" },
  glutes:    { ar: "أرداف",    en: "Glutes",     ico: "🍑" },
  biceps:    { ar: "بايسبس",   en: "Biceps",     ico: "💪" },
  triceps:   { ar: "ترايسبس",  en: "Triceps",    ico: "🤘" },
  core:      { ar: "كور",      en: "Core",       ico: "🎯" },
  calves:    { ar: "سمانة",    en: "Calves",     ico: "🦶" },
  forearms:  { ar: "ساعد",     en: "Forearms",   ico: "✊" },
  cardio:    { ar: "كارديو",   en: "Cardio",     ico: "❤️" },
  full:      { ar: "كامل",     en: "Full body",  ico: "⚡" }
};

const EQUIPMENT = {
  barbell:    { ar: "بارا",        en: "Barbell" },
  dumbbell:   { ar: "دمبل",        en: "Dumbbell" },
  machine:    { ar: "جهاز",        en: "Machine" },
  cable:      { ar: "كابل",        en: "Cable" },
  bodyweight: { ar: "وزن الجسم",   en: "Bodyweight" },
  kettlebell: { ar: "كيتلوبل",     en: "Kettlebell" },
  bands:      { ar: "مطاط",        en: "Bands" },
  cardio:     { ar: "جهاز كارديو", en: "Cardio machine" }
};

const LEVELS = {
  beginner:     { ar: "مبتدئ",   en: "Beginner" },
  intermediate: { ar: "متوسط",   en: "Intermediate" },
  advanced:     { ar: "متقدم",   en: "Advanced" }
};

const TYPES = {
  compound: { ar: "مركّب",   en: "Compound" },
  isolate:  { ar: "معزول",   en: "Isolation" },
  cardio:   { ar: "قلب",     en: "Cardio" }
};

const GOALS = {
  cut:      { ar: "خسارة دهون", en: "Fat loss" },
  bulk:     { ar: "تضخيم عضلي", en: "Muscle gain" },
  maintain: { ar: "ثبات ولياقة", en: "Maintain" },
  strength: { ar: "قوة وأداء",  en: "Strength" },
  general:  { ar: "لياقة عامة", en: "General fitness" }
};

/* ---------------- EXERCISES ---------------- */
const EXERCISES = [
/* ===== صدر CHEST ===== */
{id:"bench-press",ar:"ضغط صدر بالبارا",en:"Barbell Bench Press",m:"chest",ms:["chest","triceps"],eq:"barbell",lv:"intermediate",t:"compound",sets:4,reps:"6-10",rest:120,
 steps:["استلقِ على البنش واثبّت القدمين على الأرض.","أمسك البارا بعرض أكتافك وفكّك المشت.","اخفض البارا ببطء حتى تلمس أعلى صدرك.","ادفع للأعلى مع ضغط عضلات الصدر والثني الخفيف للكوعين."],
 tips:"لا ترفع مؤخرتك عن البنش، وحافظ على انحناء خفيف في أسفل الظهر."},
{id:"incline-db-press",ar:"ضغط صدر مائل بالدمبل",en:"Incline Dumbbell Press",m:"chest",ms:["chest","shoulders"],eq:"dumbbell",lv:"intermediate",t:"compound",sets:4,reps:"8-12",rest:90,
 steps:["اجلس على بنش مائل 30-45 درجة.","ارفع الدمبلين من مستوى الكتفين.","ادفع للأعلى مع تقارب بسيط دون تلامس.","اخفض بتحكم كامل."],
 tips:"الميلان الزائد (أكثر من 45°) يحوّل التركيز للأكتاف."},
{id:"flat-db-fly",ar:"فراي صدر مستقيم بالدمبل",en:"Flat Dumbbell Fly",m:"chest",ms:["chest"],eq:"dumbbell",lv:"beginner",t:"isolate",sets:3,reps:"10-15",rest:60,
 steps:["استلقِ على بنش مستقيم ودمبلان بميلان خفيف.","افتح الذراعين حتى إحساس بشدّ الصدر.","اجمع الكفّين كما لو أنك تحتضن جذع شجرة."],
 tips:"لا تنزل أكثر من مستوى الجسم لحماية الكتفين."},
{id:"cable-fly",ar:"فراي كابل منخفض",en:"Low-to-High Cable Fly",m:"chest",ms:["chest"],eq:"cable",lv:"beginner",t:"isolate",sets:3,reps:"12-15",rest:60,
 steps:["اضبط الكابلين على منخفض ومسند.","اسحب الكتفين للأمام مع ثبات الكوعين.","أعد ببطء مع فتح الصدر."],
 tips:"اجمع الكفّين أمام صدرك لا فوق رأسك."},
{id:"pushup", ar:"تمرين الضغط",en:"Push-Up",m:"chest",ms:["chest","triceps"],eq:"bodyweight",lv:"beginner",t:"compound",sets:4,reps:"15-25",rest:60,
 steps:["وضع اللوح مع استقامة الجسم من الرأس إلى الكعبين.","اخفض الجسد حتى يقترب صدرك من الأرض.","ادفع للأعلى مع شد الكور."],
 tips:"ارفع رديفك عند الاستراحة بدل الوقوف لتستفيد من الزمن."},
{id:"machine-press",ar:"جهاز ضغط صدر",en:"Chest Press Machine",m:"chest",ms:["chest","triceps"],eq:"machine",lv:"beginner",t:"compound",sets:3,reps:"10-12",rest:75,
 steps:["اضبط المقعد بحيث تكون مقبضات الجهاز عند مستوى صدرك.","ادفع للأعلى/للأمام دون فكّ ظهرك عن المسند.","أعد ببطء."],
 tips:"ممتاز للمبتدئين لتعلم العزل قبل البارا."},
{id:"dips-chest",ar:"دبس صدر",en:"Chest Dips",m:"chest",ms:["chest","triceps"],eq:"bodyweight",lv:"advanced",t:"compound",sets:3,reps:"8-12",rest:90,
 steps:["اثبت على عقلتَي الدبس.","ميل جسمك للأمام وانزل حتى إحساس بمدّ الصدر.","ادفع مع إبقاء الكوعين موجّهتين للخلف."],
 tips:"أضف وزناً فقط بعد إتقان 12 تكراراً بدون حمل."},

/* ===== ظهر BACK ===== */
{id:"deadlift",ar:"رفع الأرضي (ديادلكت)",en:"Deadlift",m:"back",ms:["back","legs","core"],eq:"barbell",lv:"advanced",t:"compound",sets:4,reps:"4-8",rest:150,
 steps:["قف بقدمي بعرض الوركين أمام البارا.","انحنِ من الوركين وأمسك البارا بعرض الكتفين.","امدد ظهرك واشدّ الكور ثم ارفع بالقدمين للأعلى.","أعد البارا للعرض بتحكم مع انحناء الوركين."],
 tips:"الظهر محايد طوال الحركة — أي انحناء أسفل يعني توقفاً."},
{id:"pullup",ar:"تمرين السحب (فوق العارضة)",en:"Pull-Up",m:"back",ms:["back","biceps"],eq:"bodyweight",lv:"intermediate",t:"compound",sets:4,reps:"6-12",rest:90,
 steps:["امسك العارضة بقبضة أوسع من الكتفين.","اسحب الكتفين للأسفل ثم ارفع صدرك نحو العارضة.","انزل ببطء حتى امتداد كامل."],
 tips:"ابدأ بالسحب السفلي (Lat Pulldown) إذا لم تصل 5 تكرارات."},
{id:"barbell-row",ar:"سحب بارا منحني",en:"Barbell Bent-Over Row",m:"back",ms:["back","biceps"],eq:"barbell",lv:"intermediate",t:"compound",sets:4,reps:"8-10",rest:90,
 steps:["انحنِ للأمام بزاوية 45 درجة مع ظهر مستقيم.","اسحب البارا نحو أسفل صدرك.","أعد ببطء مع ثبات الجذع."],
 tips:"لا تستخدم رجلاك للدفع — الحركة من الظهر فقط."},
{id:"lat-pulldown",ar:"سحب لاتس من كابل",en:"Lat Pulldown",m:"back",ms:["back","biceps"],eq:"cable",lv:"beginner",t:"compound",sets:3,reps:"10-12",rest:75,
 steps:["امسك المقبض بعرض أوسع قليلاً من الكتفين.","اسحب لأسفل حتى يلمس المقبض أعلى صدرك.","أعد بتحكم."],
 tips:"اسحب بالمرفقين للأسفل لا بأصابعك فقط."},
{id:"seated-row",ar:"سحب جلوس بالكابل",en:"Seated Cable Row",m:"back",ms:["back","biceps"],eq:"cable",lv:"beginner",t:"compound",sets:3,reps:"10-14",rest:75,
 steps:["اجلس وظهرك مستقيم والقدمان ثابتتين.","اسحب المقبض نحو بطنك مع دفع الكتفين للخلف.","أعد ببطء."],
 tips:"تجنّب تأرجح الجذع صعوداً وهبوطاً."},
{id:"single-db-row",ar:"سحب دمبلك بيد واحدة",en:"Single-Arm Dumbbell Row",m:"back",ms:["back","biceps"],eq:"dumbbell",lv:"beginner",t:"compound",sets:3,reps:"10-12",rest:60,
 steps:["ارتكئ على بنش بيد واحدة والقدم الأخرى للأمام.","اسحب الدمبل نحو الجيب الخلفي.","أعد بامتداد كامل."],
 tips:"لا تدر جذعك أثناء السحب."},
{id:"face-pull",ar:"سحب لوجه",en:"Face Pull",m:"back",ms:["shoulders","back"],eq:"cable",lv:"beginner",t:"isolate",sets:3,reps:"15-20",rest:45,
 steps:["اضبط الكابل على مستوى الوجه.","اسحب المقبض نحو وجهك مع فتح الكوعين للأعلى.","ارجع ببطء."],
 tips:"تمرين ممتاز لصحة الكتفين وتحسين الوضعية."},

/* ===== أكتاف SHOULDERS ===== */
{id:"ohp",ar:"ضغط علوي بالبارا",en:"Standing Barbell Overhead Press",m:"shoulders",ms:["shoulders","triceps"],eq:"barbell",lv:"intermediate",t:"compound",sets:4,reps:"6-10",rest:120,
 steps:["قف مستقيماً وامسك البارا أمام الترقوة.","اضبط الكور وادفع للأعلى حتى امتداد كامل.","أعد ببطء أمام الوجه."],
 tips:"شدّ المؤخرة يمنع زيادة الانحناء في أسفل الظهر."},
{id:"db-shoulder-press",ar:"ضغط كتف بالدمبل",en:"Dumbbell Shoulder Press",m:"shoulders",ms:["shoulders","triceps"],eq:"dumbbell",lv:"beginner",t:"compound",sets:3,reps:"8-12",rest:75,
 steps:["اجلس مع ظهر مستقيم والدمبلان بمستوى الأذنين.","ادفع للأعلى دون تلامس الدمبلين.","أعد بتحكم."],
 tips:"لا ترفع أكثر مما تستطيع باثنين معاً (تكرار إضافي بالدمبل الأثقل)."},
{id:"lateral-raise",ar:"رفع جانبي",en:"Lateral Raise",m:"shoulders",ms:["shoulders"],eq:"dumbbell",lv:"beginner",t:"isolate",sets:4,reps:"12-15",rest:45,
 steps:["قف والدمبلان بجانبيك ورفرفة خفيفة بالرسغين.","ارفع الذراعين حتى مستوى الكتفين.","أنزل ببطء دون تأرجح."],
 tips:"الحركة البطيئة أقوى — لا تستخدم القوة البدنية."},
{id:"front-raise",ar:"رفع أمامي",en:"Front Raise",m:"shoulders",ms:["shoulders"],eq:"dumbbell",lv:"beginner",t:"isolate",sets:3,reps:"10-15",rest:45,
 steps:["امسك الدمبل أمام فخذيك.","ارفع أحد الذراعين حتى مستوى الكتفين.","بدّل بين الذراعين أو معاً."],
 tips:"خفّف الوزن إن بدأت تتأرجح."},
{id:"rear-delt-fly",ar:"فراي خلفي للدمبل",en:"Bent-Over Rear Delt Fly",m:"shoulders",ms:["shoulders","back"],eq:"dumbbell",lv:"beginner",t:"isolate",sets:3,reps:"12-18",rest:45,
 steps:["انحنِ للأمام حتى يكاد جذعك يكون أفقياً.","افعذراعيك جانباً مع رفع المرفقين قليلاً.","أعد ببطء."],
 tips:"تخيّل أنك تحمل صينيتين ترفعهما لجانبي الطاولة."},
{id:"shrug",ar:"رفع ترابيس (شراغ)",en:"Dumbbell Shrug",m:"back",ms:["back"],eq:"dumbbell",lv:"beginner",t:"isolate",sets:3,reps:"12-15",rest:45,
 steps:["قف والدمبلان جانبيك.","ارفع كتفيك للأعلى بقدر الإمكان.","ثبّت ثانية ثم أنزل ببطء."],
 tips:"امتصاص كتفيك لأعلى ثم للخلف يعطي استجابة أفضل."},
{id:"arnold-press",ar:"ضغط أرنولد",en:"Arnold Press",m:"shoulders",ms:["shoulders","triceps"],eq:"dumbbell",lv:"intermediate",t:"compound",sets:3,reps:"10-12",rest:60,
 steps:["ابدأ أمام وجهك بقميص مواجهة لك.","ادر ذراعيك أثناء الضغط للأعلى.","أدر عكساً أثناء النزول."],
 tips:"حركة كاملة النطاق لاحتدام أفضل للعضلة."},

/* ===== أرجل LEGS ===== */
{id:"squat",ar:"سكوات بالبارا",en:"Barbell Back Squat",m:"legs",ms:["legs","glutes","core"],eq:"barbell",lv:"intermediate",t:"compound",sets:4,reps:"5-10",rest:150,
 steps:["ضع البارا فوق الترابيس لا على العنق.","قف بعرض الكتفين قليلاً وأصابع القدمين للخارج قليلاً.","انزل حتى فخذاك متوازيان مع الأرض أو أخفض.","ادفع من الكعبين للأسفل والصدر للأمام."],
 tips:"انظر للأمام ثابتاً وشدّ الكور خلال النزول والصعود."},
{id:"front-squat",ar:"سكوات أمامي",en:"Front Squat",m:"legs",ms:["legs","core","glutes"],eq:"barbell",lv:"advanced",t:"compound",sets:3,reps:"6-8",rest:120,
 steps:["ضع البارا فوق الترقوة الأمامية بمرفقين مرتفعين.","انزل بجذع مستقيم عمودياً.","ادفع للأعلى مع إبقاء المرفقين للأعلى."],
 tips:"يفوّت الميزانية الأمامية أي استدارة للجذع."},
{id:"leg-press",ar:"ضغط أرجل بالجهاز",en:"Leg Press",m:"legs",ms:["legs","glutes"],eq:"machine",lv:"beginner",t:"compound",sets:4,reps:"10-15",rest:90,
 steps:["اجلس والقدمان على اللوحة بعرض الوركين.","انزل حتى ركبتيك بزاوية 90 درجة.","ادفع دون فكّ ظهرك عن المسند."],
 tips:"لا تنزل أكثر من يستطيع ثبات حوضك."},
{id:"lunge",ar:"اندفاع (لونج)",en:"Walking Lunge",m:"legs",ms:["legs","glutes"],eq:"dumbbell",lv:"beginner",t:"compound",sets:3,reps:"12 لكل رجل",rest:75,
 steps:["قف معتدلاً والدمبلان بجانبيك.","خُطوة أمامية حتى تصبح ركبتاك بزاوية 90°.","ادفع بكعب القدم الأمامية للعودة أو للمتابعة للأمام."],
 tips:"لا تدع ركبتك الأمامية تتجاوز أصابع قدمك."},
{id:"rdl",ar:"رفع أرجل (RDL)",en:"Romanian Deadlift",m:"legs",ms:["legs","back"],eq:"barbell",lv:"intermediate",t:"compound",sets:3,reps:"8-12",rest:90,
 steps:["قف والبارا أمام فخذيك بظهر مستقيم.","انحنِ من الوركين وأنزل البارا على طول أرجلك.","استشعر شدّ خلف الفخذين ثم ارفع."],
 tips:"الساقان شبه ثابتتان — الحركة من الوركين فقط."},
{id:"leg-curl",ar:"فرد أرجل (جهاز)",en:"Leg Curl Machine",m:"legs",ms:["legs"],eq:"machine",lv:"beginner",t:"isolate",sets:3,reps:"12-15",rest:60,
 steps:["استلقِ وجهاز خلف الفخذين.","ادفع الحزام نحو المؤخرة ببطء.","أعد بتحكم كامل."],
 tips:"ارجع ببطء شديد في المرحلة العكسية."},
{id:"leg-extension",ar:"تمديد أرجل (جهاز)",en:"Leg Extension",m:"legs",ms:["legs"],eq:"machine",lv:"beginner",t:"isolate",sets:3,reps:"12-15",rest:60,
 steps:["اجلس ومسند الجهاز أسفل الركبتين.","مدّ ساقيك بالكامل واضبط ثانية.","أعد ببطء."],
 tips:"لا ترفع وزناً يحوّل الحركة إلى تأرجح."},
{id:"bulgarian-squat",ar:"سكوات بلغاري",en:"Bulgarian Split Squat",m:"legs",ms:["legs","glutes"],eq:"dumbbell",lv:"intermediate",t:"compound",sets:3,reps:"10 لكل رجل",rest:75,
 steps:["ضع مؤخر قدمك على بنش خلفك.","انزل حتى ركبتاك بزاوية 90°.","ادفع من كعب القدم الأمامية."],
 tips:"أثقل وأقوى من السكوات العادي لتصحيح عدم التوازن."},
{id:"hip-thrust",ar:"دفع حوض (هيب ثرست)",en:"Barbell Hip Thrust",m:"glutes",ms:["glutes","legs"],eq:"barbell",lv:"intermediate",t:"compound",sets:4,reps:"8-12",rest:90,
 steps:["استند بظهرك على بنش منخفض والبارا فوق الوركين.","ادفع بالحوض للأعلى حتى استقامة الجذع.","اضبط ثانية وأعد ببطء."],
 tips:"شدّ الأرداف في الأعلى شدّاً كاملاً لا نصف حركة."},
{id:"glute-kickback",ar:"ركل للأعلى (أرداف)",en:"Cable Glute Kickback",m:"glutes",ms:["glutes"],eq:"cable",lv:"beginner",t:"isolate",sets:3,reps:"15 لكل رجل",rest:45,
 steps:["امسك الكابل بكعب قدمك.","ارفع رجلك للخلف والأعلى مع ثبات الجذع.","أعد ببطء."],
 tips:"لا تقوّس أسفل ظهرك أثناء الركل."},

/* ===== بايسبس BICEPS ===== */
{id:"barbell-curl",ar:"باي سكواط بالبارا",en:"Barbell Curl",m:"biceps",ms:["biceps"],eq:"barbell",lv:"beginner",t:"isolate",sets:3,reps:"8-12",rest:60,
 steps:["قف معتدلاً وامسك البارا بقبضة أسفل الكتفين.","ارفع مع إبقاء الكوعين ثابتين جانبك.","أعد ببطء."],
 tips:"الجذع لا يتأرجح — إن وجدت تأرجحاً قلّل الوزن."},
{id:"db-curl",ar:"باي سكواط بالدمبل",en:"Dumbbell Curl",m:"biceps",ms:["biceps"],eq:"dumbbell",lv:"beginner",t:"isolate",sets:3,reps:"10-12",rest:60,
 steps:["قف والدمبلان بجانبيك براحتي يد للأمام.","ارفع أحدهما أو معاً مع دوران الكف للأعلى.","أعد ببطء."],
 tips:"الدوران (سوبركيشن) يزيد انقباض العضلة."},
{id:"hammer-curl",ar:"هامر كيرل",en:"Hammer Curl",m:"biceps",ms:["biceps","forearms"],eq:"dumbbell",lv:"beginner",t:"isolate",sets:3,reps:"10-14",rest:60,
 steps:["امسك الدمبل وكفاك متقابلتان (نيوترال).","ارفع دون تدوير الكف.","أعد ببطء."],
 tips:"يعمل على العضلة ذات الرأسين والساعد."},
{id:"preacher-curl",ar:"بريشر كيرل",en:"Preacher Curl",m:"biceps",ms:["biceps"],eq:"machine",lv:"beginner",t:"isolate",sets:3,reps:"10-12",rest:60,
 steps:["اجلس وذراعك على مسند البريشر.","امدد تماماً ثم ارفع دون رفع المرفقين عن المسند.","أعد ببطء."],
 tips:"لا تحدّد المرفق تماماً في الأعلى لتفادي الضغط."},

/* ===== ترايسبس TRICEPS ===== */
{id:"triceps-pushdown",ar:"دبل داون كيبل",en:"Cable Triceps Pushdown",m:"triceps",ms:["triceps"],eq:"cable",lv:"beginner",t:"isolate",sets:3,reps:"12-15",rest:60,
 steps:["امسك المقبض والمرفقان ملتصقان بجسمك.","ادفع لأسفل حتى امتداد كامل.","أعد ببطء حتى 90° فقط."],
 tips:"ثبات المرفقين هو سر النجاح هنا."},
{id:"skullcrusher",ar:" skulls crusher (بارا)",en:"Skullcrusher",m:"triceps",ms:["triceps"],eq:"barbell",lv:"intermediate",t:"isolate",sets:3,reps:"8-12",rest:75,
 steps:["استلقِ والبارا فوق صدرك بذراعين ممدودتين.","انزل البارا نحو الجبهة بثبات المرفقين.","امدد للأعلى."],
 tips:"حافظ على عمودية عظام الساعد."},
{id:"overhead-triceps",ar:"تمديد ترايسبس علوي",en:"Overhead Triceps Extension",m:"triceps",ms:["triceps"],eq:"dumbbell",lv:"beginner",t:"isolate",sets:3,reps:"12-15",rest:60,
 steps:["امسك دمبل كبيراً بذراعين فوق رأسك.","اخفض خلف رأسك بالكامل.","امدد للأعلى."],
 tips:"لا تضحك بالمرفقين للخارج كثيراً."},
{id:"bench-dip",ar:"دبس بين بنشين",en:"Bench Dip",m:"triceps",ms:["triceps","chest"],eq:"bodyweight",lv:"beginner",t:"compound",sets:3,reps:"12-20",rest:60,
 steps:["ضع يديك على حافة بنش خلفك وقدميك أمامك.","انزل بجسمك عمودياً.","ادفع بقوة."],
 tips:"أقصِل رجليك لزيادة الصعوبة."},

/* ===== كور CORE ===== */
{id:"plank",ar:"البلانك",en:"Plank",m:"core",ms:["core"],eq:"bodyweight",lv:"beginner",t:"isolate",sets:3,reps:"45-60 ثانية",rest:45,
 steps:["ارتكز على الساعدين والمشطين.","اجعل جسمك خطاً مستقيماً من الرأس إلى الكعبين.","شدّ الكور والأرداف."],
 tips:"ارفع رديفك إن شعرت بألم أسفل الظهر."},
{id:"hanging-leg-raise",ar:"رفع أرجل معلّق",en:"Hanging Leg Raise",m:"core",ms:["core"],eq:"bodyweight",lv:"advanced",t:"compound",sets:3,reps:"10-15",rest:60,
 steps:["اعلق على العارضة.","ارفع ساقيك حتى تصبحا أفقيتين أو تلامسان الذراعين.","أنزل ببطء دون تأرجح."],
 tips:"أرجل مستقيمة = أصعب، وركبتان منثنيتان = أسهل."},
{id:"crunch",ar:"كراش",en:"Crunch",m:"core",ms:["core"],eq:"bodyweight",lv:"beginner",t:"isolate",sets:3,reps:"15-25",rest:45,
 steps:["استلقِ ورجلاك منثنيتان.","ارفع كتفيك عن الأرض بالضغط من البطن.","أعد ببطء."],
 tips:"الحركة صغيرة والتركيز على الانقباض."},
{id:"russian-twist",ar:"تواء روسي",en:"Russian Twist",m:"core",ms:["core"],eq:"bodyweight",lv:"beginner",t:"isolate",sets:3,reps:"20 لكل جهة",rest:45,
 steps:["اجلس بميلان خفيف وقدمين مرتفعتين.","ادر جذعك يميناً ويساراً.","احتفظ بالوزن لزيادة الصعوبة."],
 tips:"الدوران من الجذع لا من الذراعين."},
{id:"cable-crunch",ar:"كراش كيبل",en:"Cable Crunch",m:"core",ms:["core"],eq:"cable",lv:"intermediate",t:"isolate",sets:3,reps:"12-20",rest:60,
 steps:["انحنِ للأسفل على الركبتين أمام مقبض الكابل.","اسحب الكابل بثنية الجذع للأمام.","أعد ببطء."],
 tips:"يسمح باستخدام أثقل من وزن جسمك."},
{id:"dead-bug",ar:"ديد باغ",en:"Dead Bug",m:"core",ms:["core"],eq:"bodyweight",lv:"beginner",t:"isolate",sets:3,reps:"12 لكل جهة",rest:40,
 steps:["استلقِ وذراعان للأعلى وركبتان بزاوية 90°.","مدّ ذراع وساق متعارضتين للأرض.","أعد الطرفين دون فكّ ظهرك."],
 tips:"أسفل ظهرك ملتصق بالأرض دائماً."},

/* ===== سمانة CALVES ===== */
{id:"calf-raise",ar:"رفع سمانة واقف",en:"Standing Calf Raise",m:"calves",ms:["calves"],eq:"machine",lv:"beginner",t:"isolate",sets:4,reps:"15-20",rest:45,
 steps:["قف على حافة منصة والوزن فوق كتفيك.","ارفع بقدر الإمكان على أصابع قدميك.","انزل لأسفل بضعّ شديد لشدّ السمانة."],
 tips:"تكيّف سريع جداً — كرّر الوزن الثقيل."},
{id:"seated-calf",ar:"رفع سمانة جالس",en:"Seated Calf Raise",m:"calves",ms:["calves"],eq:"machine",lv:"beginner",t:"isolate",sets:3,reps:"15-20",rest:45,
 steps:["اجلس والوزن فوق ركبتيك.","ارفع بأصابع قدميك ببطء.","اضبط ثانية."],
 tips:"يركّز على عضلة السمانة العميقة."},

/* ===== ساعد FOREARMS ===== */
{id:"wrist-curl",ar:"لفّ رسغ",en:"Wrist Curl",m:"forearms",ms:["forearms"],eq:"dumbbell",lv:"beginner",t:"isolate",sets:3,reps:"15-20",rest:40,
 steps:["اجلس والساعدان على فخذيك والراحتان للأعلى.","لفّ رسغيك للأعلى فقط.","أعد ببطء."],
 tips:"الحركة صغيرة ومركّزة على الساعد."},
{id:"farmers-carry",ar:"مشي الحمّال",en:"Farmer's Carry",m:"forearms",ms:["forearms","core"],eq:"dumbbell",lv:"beginner",t:"compound",sets:3,reps:"30-40 متر",rest:60,
 steps:["امسك وزنين ثقيلين بجانبيك.","امشِ مستقيماً بخطوات ثابتة.","ضع الأثقال بتحكم."],
 tips:"صدرك للأمام والكتفان للخلف."},

/* ===== كارديو CARDIO ===== */
{id:"treadmill",ar:"مشي/جري على السير",en:"Treadmill Walk / Run",m:"cardio",ms:["cardio","legs"],eq:"cardio",lv:"beginner",t:"cardio",sets:1,reps:"20-40 دقيقة",rest:0,
 steps:["ابدأ بإحماء 5 دقائق مشياً.","زد السرعة أو الميلان تدريجياً.","أنهِ بتهدئة 5 دقائق."],
 tips:"HIIT: 30 ثانية سرعة / 60 ثانية هدوء × 8 مرات."},
{id:"row-machine",ar:"جهاز التجديف",en:"Rowing Machine",m:"cardio",ms:["cardio","back"],eq:"cardio",lv:"beginner",t:"cardio",sets:1,reps:"15-25 دقيقة",rest:0,
 steps:["أمسك المقبض وقدمك في المرابط.","ادفع بالساقين ثم اسحب بالذراعين.","أعد بالترتيب العكسي."],
 tips:"رتبة السحب: أرجل ← جذع ← ذراعان."},
{id:"bike",ar:"دراجة ثابتة",en:"Stationary Bike",m:"cardio",ms:["cardio","legs"],eq:"cardio",lv:"beginner",t:"cardio",sets:1,reps:"20-40 دقيقة",rest:0,
 steps:["اضبط مقعدك حتى تكون ركبتاك بزاوية خفيفة.","ابدأ بدراجة خفيفة 5 دقائق.","زد المقاومة تدريجياً."],
 tips:"مناسب جداً لمن يعاني من ألم الركبة."},
{id:"burpee",ar:"بيربي",en:"Burpee",m:"full",ms:["full","legs","chest","core"],eq:"bodyweight",lv:"intermediate",t:"cardio",sets:4,reps:"10-15",rest:45,
 steps:["قف ثم انزل لوضع الضغط.","قفز قدميك للخلف وقم بتمرين ضغط.","اسحب قدميك وقفز للأعلى."],
 tips:"ابدأ نسخة بدون قفزة لتحسين اللياقة."},
{id:"jump-rope",ar:"قفز الحبل",en:"Jump Rope",m:"cardio",ms:["cardio","calves"],eq:"bodyweight",lv:"beginner",t:"cardio",sets:4,reps:"60 ثانية",rest:30,
 steps:["قف مستقيماً والمرفقان قريباً من الجذع.","اقفز من مشط القدمين فقط.","حافظ على إيقاع ثابت."],
 tips:"ممتاز كإحماء أو كارديو بين مجموعات."},
{id:"mountain-climber",ar:"متسلق الجبل",en:"Mountain Climber",m:"full",ms:["full","core"],eq:"bodyweight",lv:"beginner",t:"cardio",sets:4,reps:"30 ثانية",rest:30,
 steps:["ضع اللوح وكتفان فوق الرسغين.","اسحب ركبتك تباعاً نحو صدرك بسرعة.","ثبّت الحوض."],
 tips:"لا ترفع مؤخرتك أثناء الجري."}
];

/* ---------------- READY PLAN TEMPLATES ---------------- */
const PLAN_TEMPLATES = [
  {
    id:"tpl-ppl3", kind:"تضخيم / حجم", ar:"دفع · سحب · أرجل — 3 أيام", en:"Push / Pull / Legs — 3 days",
    goal:"bulk", level:"intermediate", days:3,
    desc:"التركيبة الذهبية للمتوسطين: كل عضلة تتكرر مرتين أسبوعياً بالتوازي بين حجم وقوة.",
    dayList:[
      {ar:"الدفع — صدر/أكتاف/ترايسبس", en:"Push — Chest / Shoulders / Triceps", items:[
        ["bench-press",4,"6-10",120],["incline-db-press",3,"8-12",90],["machine-press",3,"10-12",75],
        ["ohp",3,"8-10",90],["lateral-raise",4,"12-15",45],["triceps-pushdown",3,"12-15",45]]},
      {ar:"السحب — ظهر/بايسبس", en:"Pull — Back / Biceps", items:[
        ["pullup",4,"6-12",90],["barbell-row",4,"8-10",90],["seated-row",3,"10-12",75],
        ["face-pull",3,"15-20",45],["barbell-curl",3,"8-12",60],["hammer-curl",3,"10-14",60]]},
      {ar:"الأرجل — تضخيم", en:"Legs — Mass", items:[
        ["squat",4,"5-8",150],["rdl",3,"8-12",90],["leg-press",4,"10-15",90],
        ["leg-curl",3,"12-15",60],["calf-raise",4,"15-20",45],["plank",3,"45-60ث",45]]}
    ]
  },
  {
    id:"tpl-ppl6", kind:"تضخيم / حجم", ar:"دفع · سحب · أرجل — 6 أيام", en:"Push / Pull / Legs — 6 days",
    goal:"bulk", level:"advanced", days:6,
    desc:"تدريب كل عضلة مرتين أسبوعياً بتقسيم عالي — للمتقدمين ذوي التعافي الجيد.",
    dayList:[
      {ar:"دفع 1 — قوة", en:"Push 1 — Strength", items:[["bench-press",5,"4-6",150],["ohp",4,"6-8",120],["incline-db-press",3,"8-10",90],["lateral-raise",3,"12-15",45],["skullcrusher",3,"8-12",60]]},
      {ar:"سحب 1 — قوة", en:"Pull 1 — Strength", items:[["deadlift",4,"4-6",180],["pullup",4,"6-10",90],["single-db-row",3,"8-12",75],["face-pull",3,"15-20",45],["db-curl",3,"8-12",60]]},
      {ar:"أرجل 1 — قوة", en:"Legs 1 — Strength", items:[["squat",5,"4-6",180],["front-squat",3,"6-8",120],["leg-curl",3,"10-12",60],["calf-raise",4,"12-15",45]]},
      {ar:"دفع 2 — حجم", en:"Push 2 — Hypertrophy", items:[["incline-db-press",4,"8-12",90],["machine-press",3,"12-15",60],["dips-chest",3,"8-12",75],["lateral-raise",4,"15-20",40],["triceps-pushdown",3,"12-15",45]]},
      {ar:"سحب 2 — حجم", en:"Pull 2 — Hypertrophy", items:[["barbell-row",4,"8-12",90],["lat-pulldown",3,"10-12",60],["seated-row",3,"12-15",60],["shrug",3,"12-15",45],["hammer-curl",3,"12-15",45]]},
      {ar:"أرجل 2 — حجم", en:"Legs 2 — Hypertrophy", items:[["leg-press",4,"12-15",90],["bulgarian-squat",3,"10-12",75],["rdl",3,"10-12",90],["leg-extension",3,"15-20",45],["seated-calf",4,"15-20",45]]}
    ]
  },
  {
    id:"tpl-ul", kind:"توازن", ar:"علوي / سفلي — 4 أيام", en:"Upper / Lower — 4 days",
    goal:"maintain", level:"intermediate", days:4,
    desc:"توازن ممتاز بين التكرار والتعافي، مناسب لمعظم العملاء في منتصف العام.",
    dayList:[
      {ar:"علوي 1 — قوة", en:"Upper 1 — Strength", items:[["bench-press",4,"5-8",120],["barbell-row",4,"6-10",120],["ohp",3,"8-10",90],["lat-pulldown",3,"10-12",60],["barbell-curl",3,"8-12",60],["triceps-pushdown",3,"12-15",45]]},
      {ar:"سفلي 1 — قوة", en:"Lower 1 — Strength", items:[["squat",4,"5-8",150],["rdl",3,"8-10",90],["leg-press",3,"10-12",75],["calf-raise",4,"15-20",45],["plank",3,"45-60ث",45]]},
      {ar:"علوي 2 — حجم", en:"Upper 2 — Hypertrophy", items:[["incline-db-press",4,"8-12",75],["seated-row",4,"10-12",75],["lateral-raise",4,"12-15",45],["face-pull",3,"15-20",45],["db-curl",3,"10-12",60],["overhead-triceps",3,"12-15",60]]},
      {ar:"سفلي 2 — حجم", en:"Lower 2 — Hypertrophy", items:[["leg-press",4,"12-15",90],["bulgarian-squat",3,"10-12",75],["leg-curl",3,"12-15",60],["hip-thrust",3,"10-12",75],["seated-calf",4,"15-20",45],["russian-twist",3,"20/جهة",45]]}
    ]
  },
  {
    id:"tpl-full3", kind:"مبتدئ", ar:"كامل الجسم — 3 أيام (مبتدئ)", en:"Full Body — 3 days (Beginner)",
    goal:"general", level:"beginner", days:3,
    desc:"الأنسب لبداية الطريق: حركة أساسية لكل منطقة، حجم معتدل، وزمن قصير.",
    dayList:[
      {ar:"يوم 1 — كامل", en:"Day 1 — Full body", items:[["squat",3,"8-12",90],["machine-press",3,"10-12",60],["lat-pulldown",3,"10-12",60],["lateral-raise",3,"12-15",45],["plank",3,"30-45ث",40]]},
      {ar:"يوم 2 — كامل", en:"Day 2 — Full body", items:[["leg-press",3,"10-15",75],["incline-db-press",3,"10-12",60],["seated-row",3,"10-12",60],["db-curl",3,"12-15",45],["crunch",3,"15-20",40]]},
      {ar:"يوم 3 — كامل + كارديو", en:"Day 3 — Full body + cardio", items:[["rdl",3,"10-12",75],["bench-dip",3,"10-15",45],["single-db-row",3,"10-12",60],["front-raise",3,"12-15",45],["treadmill",1,"20 دقيقة",0]]}
    ]
  },
  {
    id:"tpl-bro", kind:"تضخيم / كلاسيكي", ar:"تقطيع كل عضلة — 5 أيام", en:"Bro Split — 5 days",
    goal:"bulk", level:"intermediate", days:5,
    desc:"النمط الكلاسيكي: تركيز كامل على عضلة واحدة لكل يوم — مناسب لمحبي الفصل التام.",
    dayList:[
      {ar:"الصدر", en:"Chest", items:[["bench-press",4,"6-10",120],["incline-db-press",3,"8-12",90],["flat-db-fly",3,"12-15",60],["dips-chest",3,"8-12",75],["machine-press",3,"12-15",60]]},
      {ar:"الظهر", en:"Back", items:[["deadlift",3,"4-6",150],["pullup",4,"6-12",90],["barbell-row",3,"8-10",90],["lat-pulldown",3,"10-12",60],["face-pull",3,"15-20",45]]},
      {ar:"الأكتاف", en:"Shoulders", items:[["ohp",4,"6-10",120],["arnold-press",3,"10-12",75],["lateral-raise",4,"12-15",45],["rear-delt-fly",3,"15-20",45],["shrug",3,"12-15",45]]},
      {ar:"الذراعان", en:"Arms", items:[["barbell-curl",3,"8-12",60],["preacher-curl",3,"10-12",60],["triceps-pushdown",3,"10-14",60],["skullcrusher",3,"8-12",75],["wrist-curl",3,"15-20",40]]},
      {ar:"الأرجل", en:"Legs", items:[["squat",4,"6-10",150],["leg-press",4,"12-15",90],["rdl",3,"8-12",90],["leg-curl",3,"12-15",60],["calf-raise",4,"15-20",45]]}
    ]
  },
  {
    id:"tpl-fatloss", kind:"خسارة دهون", ar:"خسارة دهون — 5 أيام (قوة + كارديو)", en:"Fat Loss — 5 days",
    goal:"cut", level:"intermediate", days:5,
    desc:"يحافظ على العضلات مع حرق أعلى، كارديو HIIT بعد كل حصة قصيرة.",
    dayList:[
      {ar:"صدر + كارديو", en:"Chest + Cardio", items:[["bench-press",4,"8-12",75],["incline-db-press",3,"10-12",60],["machine-press",3,"12-15",60],["pushup",2,"حتى الفشل",40],["treadmill",1,"10د HIIT",0]]},
      {ar:"ظهر + كارديو", en:"Back + Cardio", items:[["barbell-row",4,"8-12",75],["lat-pulldown",3,"10-12",60],["seated-row",3,"12-15",60],["face-pull",3,"15-20",40],["row-machine",1,"10د HIIT",0]]},
      {ar:"أكتاف + كور", en:"Shoulders + Core", items:[["ohp",3,"8-12",90],["lateral-raise",4,"15-20",40],["rear-delt-fly",3,"15-20",40],["plank",3,"45-60ث",40],["mountain-climber",3,"30ث",30]]},
      {ar:"أرجل", en:"Legs", items:[["squat",4,"8-12",90],["leg-press",3,"12-15",75],["bulgarian-squat",3,"10-12",60],["leg-curl",3,"15-20",45],["calf-raise",4,"20-25",40]]},
      {ar:"كامل + كارديو", en:"Full body + Cardio", items:[["deadlift",3,"6-8",120],["pushup",3,"15-20",45],["lat-pulldown",3,"12-15",45],["jump-rope",4,"60ث",30],["burpee",3,"10-12",45]]}
    ]
  }
];

/* ---------------- DIET TEMPLATES ---------------- */
const DIETS = [
  {id:"d-cut", ar:"خسارة دهون", en:"Fat Loss", goal:"cut", kcal:-450, protein:2.0, fat:0.8,
   color:"bad",
   notes:"عجز 400-500 سعرة، بروتين عالٍ لحماية العضلات، ماء 3-4 لتر، نوم 7-8 ساعات."},
  {id:"d-bulk", ar:"تضخيم عضلي", en:"Muscle Gain", goal:"bulk", kcal:350, protein:1.9, fat:0.9,
   color:"ok",
   notes:"فائض 300-400 سعرة فقط — الفائض الكبير يزيد الدهون أكثر من العضلات."},
  {id:"d-maint", ar:"ثبات / لياقة", en:"Maintenance", goal:"maintain", kcal:0, protein:1.6, fat:0.9,
   color:"info",
   notes:"سعرات على مستوى الاحتياج، ركّز على جودة الطعام وتوظيف السعرات في التمارين."},
  {id:"d-strength", ar:"قوة وأداء", en:"Strength", goal:"strength", kcal:150, protein:1.8, fat:1.0,
   color:"warn",
   notes:"فائض خفيف مع كربوهيدرات كافية قبل التمرين بساعتين لدعم الأداء."},
  {id:"d-keto-lite", ar:"كربوهيدرات منخفضة", en:"Low Carb", goal:"cut", kcal:-400, protein:2.2, fat:1.2,
   color:"warn",
   notes:"كربوهيدرات أقل من 100غ يومياً — يحتاج إشرافاً للرياضيين النشطين."},
  {id:"d-medit", ar:"نظام البحر المتوسط", en:"Mediterranean", goal:"maintain", kcal:-150, protein:1.7, fat:1.0,
   color:"ok",
   notes:"زيت زيتون، سمك، خضار، حبوب كاملة — ممتاز لصحة القلب واستدامة النظام."}
];

/* ---------------- FOODS (per 100g / وجبة) ---------------- */
const FOOD_CATS = {
  protein:{ar:"بروتين",en:"Protein"}, carb:{ar:"كربوهيدرات",en:"Carbs"}, veg:{ar:"خضار",en:"Vegetables"},
  fruit:{ar:"فواكه",en:"Fruits"}, dairy:{ar:"ألبان",en:"Dairy"}, fat:{ar:"دهون صحية",en:"Healthy fats"},
  snack:{ar:"وجبات خفيفة",en:"Snacks"}, drink:{ar:"مشروبات",en:"Drinks"}
};
const FOODS = [
  {ar:"صدر دجاج منزوع الجلد",en:"Chicken breast",cat:"protein",kcal:165,p:31,c:0,f:3.6},
  {ar:"لحم بقري مفروم 5%",en:"Lean ground beef",cat:"protein",kcal:137,p:21,c:0,f:5},
  {ar:"سمك سلمون",en:"Salmon",cat:"protein",kcal:208,p:20,c:0,f:13},
  {ar:"سمك تيلابيا",en:"Tilapia",cat:"protein",kcal:96,p:21,c:0,f:1.7},
  {ar:"تونة معلبة بالماء",en:"Tuna (canned in water)",cat:"protein",kcal:116,p:26,c:0,f:1},
  {ar:"بيض مسلوق",en:"Boiled egg",cat:"protein",kcal:155,p:13,c:1.1,f:11},
  {ar:"بياض البيض",en:"Egg whites",cat:"protein",kcal:52,p:11,c:0.7,f:0.2},
  {ar:"شريحة لحم ديك رومي",en:"Turkey slice",cat:"protein",kcal:135,p:29,c:0,f:1},
  {ar:"جبن قريش (كوتاج)",en:"Cottage cheese",cat:"dairy",kcal:98,p:11,c:3.4,f:4.3},
  {ar:"جبن أبيض قليل الدسم",en:"Low-fat white cheese",cat:"dairy",kcal:64,p:10,c:3,f:1},
  {ar:"زبادي يوناني 0%",en:"Greek yogurt 0%",cat:"dairy",kcal:59,p:10,c:3.6,f:0.4},
  {ar:"حليب كامل الدسم",en:"Whole milk",cat:"dairy",kcal:61,p:3.2,c:4.8,f:3.3},
  {ar:"حليب خالي الدسم",en:"Skim milk",cat:"dairy",kcal:34,p:3.4,c:5,f:0.1},
  {ar:"جبن شيدر",en:"Cheddar cheese",cat:"dairy",kcal:403,p:25,c:1.3,f:33},
  {ar:"أرز أبيض مطبوخ",en:"White rice (cooked)",cat:"carb",kcal:130,p:2.7,c:28,f:0.3},
  {ar:"أرز بني مطبوخ",en:"Brown rice (cooked)",cat:"carb",kcal:123,p:2.7,c:26,f:1},
  {ar:"معكرونة مسلوقة",en:"Pasta (cooked)",cat:"carb",kcal:158,p:5.8,c:31,f:0.9},
  {ar:"خبز أسمر",en:"Whole wheat bread",cat:"carb",kcal:247,p:13,c:41,f:3.4},
  {ar:"شوفان",en:"Oats",cat:"carb",kcal:389,p:17,c:66,f:6.9},
  {ar:"بطاطا مسلوقة",en:"Boiled potato",cat:"carb",kcal:87,p:2,c:20,f:0.1},
  {ar:"بطاطا حلوة",en:"Sweet potato",cat:"carb",kcal:86,p:1.6,c:20,f:0.1},
  {ar:"كينوا مسلوقة",en:"Quinoa (cooked)",cat:"carb",kcal:120,p:4.4,c:21,f:1.9},
  {ar:"برغل مسلوكي",en:"Bulgur (cooked)",cat:"carb",kcal:83,p:3.1,c:19,f:0.2},
  {ar:"ذرة",en:"Corn",cat:"carb",kcal:96,p:3.4,c:21,f:1.5},
  {ar:"عدس مسلوق",en:"Lentils (cooked)",cat:"carb",kcal:116,p:9,c:20,f:0.4},
  {ar:"حمص",en:"Chickpeas",cat:"carb",kcal:164,p:8.9,c:27,f:2.6},
  {ar:"موز",en:"Banana",cat:"fruit",kcal:89,p:1.1,c:23,f:0.3},
  {ar:"تفاح",en:"Apple",cat:"fruit",kcal:52,p:0.3,c:14,f:0.2},
  {ar:"برتقال",en:"Orange",cat:"fruit",kcal:47,p:0.9,c:12,f:0.1},
  {ar:"توت أزرق",en:"Blueberries",cat:"fruit",kcal:57,p:0.7,c:14,f:0.3},
  {ar:"تمر",en:"Dates",cat:"fruit",kcal:282,p:2.5,c:75,f:0.4},
  {ar:"عنب",en:"Grapes",cat:"fruit",kcal:69,p:0.7,c:18,f:0.2},
  {ar:"أفوكادو",en:"Avocado",cat:"fat",kcal:160,p:2,c:9,f:15},
  {ar:"زيت زيتون",en:"Olive oil",cat:"fat",kcal:884,p:0,c:0,f:100},
  {ar:"لوز",en:"Almonds",cat:"fat",kcal:579,p:21,c:22,f:50},
  {ar:"مكسرات مشكلة",en:"Mixed nuts",cat:"fat",kcal:607,p:20,c:21,f:54},
  {ar:"فول سوداني",en:"Peanut butter",cat:"fat",kcal:588,p:25,c:20,f:50},
  {ar:"بذور شيا",en:"Chia seeds",cat:"fat",kcal:486,p:17,c:42,f:31},
  {ar:"زعتر",en:"Zaatar",cat:"fat",kcal:270,p:10,c:40,f:15},
  {ar:"خس",en:"Lettuce",cat:"veg",kcal:15,p:1.4,c:3,f:0.2},
  {ar:"خيار",en:"Cucumber",cat:"veg",kcal:15,p:0.7,c:3.6,f:0.1},
  {ar:"طماطم",en:"Tomato",cat:"veg",kcal:18,p:0.9,c:3.9,f:0.2},
  {ar:"بروكلي",en:"Broccoli",cat:"veg",kcal:34,p:2.8,c:7,f:0.4},
  {ar:"سبانخ",en:"Spinach",cat:"veg",kcal:23,p:2.9,c:3.6,f:0.4},
  {ar:"جزر",en:"Carrot",cat:"veg",kcal:41,p:0.9,c:10,f:0.2},
  {ar:"كوسا",en:"Zucchini",cat:"veg",kcal:17,p:1.2,c:3.1,f:0.3},
  {ar:"فلفل مشوي",en:"Grilled pepper",cat:"veg",kcal:31,p:1,c:6,f:0.3},
  {ar:"حمص بالطحينة",en:"Hummus",cat:"snack",kcal:166,p:7.9,c:14,f:9.6},
  {ar:"فول مدمس",en:"Fava beans (ful)",cat:"snack",kcal:110,p:7.6,c:20,f:0.4},
  {ar:"بروتين واي (مخفوق)",en:"Whey protein shake",cat:"snack",kcal:400,p:80,c:8,f:6},
  {ar:"بار بروتين",en:"Protein bar",cat:"snack",kcal:350,p:33,c:34,f:10},
  {ar:"بسكويت شوفان",en:"Oat biscuit",cat:"snack",kcal:450,p:7,c:65,f:17},
  {ar:"قهوة بلا سكر",en:"Black coffee",cat:"drink",kcal:2,p:0.1,c:0,f:0},
  {ar:"شاي بلا سكر",en:"Tea (no sugar)",cat:"drink",kcal:1,p:0,c:0,f:0},
  {ar:"ماء",en:"Water",cat:"drink",kcal:0,p:0,c:0,f:0},
  {ar:"عصير برتقال طبيعي",en:"Orange juice",cat:"drink",kcal:45,p:0.7,c:10,f:0.2}
];

/* مكونات الوجبات — للاستخدام في توليد خطة اليوم */
const MEAL_SLOTS = [
  {key:"breakfast", ar:"الفطور", en:"Breakfast", pct:0.25, cats:["carb","dairy","protein","fruit"]},
  {key:"lunch",     ar:"الغداء", en:"Lunch",     pct:0.35, cats:["protein","carb","veg","fat"]},
  {key:"snack",     ar:"وجبة خفيفة", en:"Snack", pct:0.15, cats:["snack","fruit","dairy"]},
  {key:"dinner",    ar:"العشاء", en:"Dinner",    pct:0.25, cats:["protein","veg","carb","fat"]}
];
