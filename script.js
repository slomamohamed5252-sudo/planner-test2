// 1. سجل التحديثات
const latestReleaseNotes = {
    ar: [
        "🔔 صفحة \"التحديثات\" الجديدة بتجمع كل تحديثات التطبيق في مكان واحد.",
        "📄 تصدير خطة الشهر كملف PDF بمقاس A4، بدعم كامل للعربي والإنجليزي.",
        "📌 دبوس تثبيت في الملاحظات والمشاريع، مع ترتيب حر بالسحب والإفلات أو الأسهم.",
        "📖 كروت الملاحظات والمراجع بقت أصغر مع زر \"اقرأ المزيد / عرض أقل\".",
        "🗂️ تبديل العرض في المراجع (الأحدث أولاً / حسب التصنيف) مع فلتر تصنيف تلقائي.",
        "🔍 خانة بحث فورية في الملاحظات والمراجع.",
        "✏️ تعديل اسم أي عادة + ترتيبها بالسحب والإفلات أو الأسهم."
    ],
    en: [
        "🔔 New \"Updates\" page collects the app's full update history in one place.",
        "📄 Export the monthly plan as an A4 PDF, with full Arabic and English support.",
        "📌 Pin notes and projects to the top, with free reordering via drag-and-drop or arrows.",
        "📖 Notes and reference cards are now compact with a \"Read more / Show less\" toggle.",
        "🗂️ Switch reference view (Newest first / By category) with an automatic category filter.",
        "🔍 Instant search box in Notes and Library.",
        "✏️ Edit any habit's name + reorder via drag-and-drop or arrows."
    ]
};

const APP_VERSION = 'v36';
function checkAndShowChangelog() {
    const savedVersion = localStorage.getItem('fp_version');
    if(savedVersion !== APP_VERSION) {
        setTimeout(() => {
            const content = document.getElementById('changelogContent');
            if(content) {
                content.innerHTML = latestReleaseNotes[currentLang].map(n => `✅ ${escapeHtml(n)}`).join('<br><br>');
                document.getElementById('changelogModal').classList.add('show');
            }
            // إضافة هذا الإصدار لسجل التحديثات الدائم (لو لسه مش مضاف)
            if (!updateLog.some(u => u.version === APP_VERSION)) {
                updateLog.unshift({ version: APP_VERSION, date: getTodayStr(), ar: latestReleaseNotes.ar, en: latestReleaseNotes.en });
                saveAll();
                if (typeof renderUpdatesLog === 'function') renderUpdatesLog();
            }
            localStorage.setItem('fp_version', APP_VERSION);
        }, 1500); 
    }
}
window.closeChangelog = () => { document.getElementById('changelogModal').classList.remove('show'); };

// 2. PWA & Silent Auto-Update
let deferredPrompt;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

window.addEventListener('beforeinstallprompt', (e) => { 
    e.preventDefault(); 
    deferredPrompt = e; 
    const installBtn = document.getElementById('installAppBtn'); 
    if(installBtn && !isStandalone) installBtn.style.display = 'inline-flex'; 
});

if ('serviceWorker' in navigator) {
    // updateViaCache: 'none' يمنع المتصفح من الاعتماد على أي كاش HTTP قديم
    // لملف sw.js نفسه، فبيجيب أحدث نسخة منه دايماً عند أي فحص تحديث،
    // بدل ما ننتظر 24 ساعة (سلوك المتصفح الافتراضي) أو نعتمد على تغيير رقم إصدار يدوي هنا.
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
        // فحص فوري عند فتح الصفحة
        reg.update().catch(() => {});
        // وفحص دوري كل دقيقتين طول ما الصفحة مفتوحة، عشان لو المستخدم سايب التاب فاتح لمدة طويلة
        setInterval(() => reg.update().catch(() => {}), 120000);
        // وفحص إضافي كل مرة يرجع فيها المستخدم للتاب (بعد ما كان في تاب/تطبيق تاني)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') reg.update().catch(() => {});
        });
    }).catch(e => console.log('SW Registration Error:', e));
    
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:var(--bg-color);z-index:999999;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:20px; text-align:center; padding: 20px; box-sizing: border-box;';
            
            const spinner = document.createElement('i');
            spinner.className = 'fa-solid fa-cloud-arrow-down fa-bounce';
            spinner.style.cssText = 'font-size:4rem; color:var(--primary);';
            
            const title = document.createElement('h2');
            title.style.cssText = 'color:var(--text-main); margin:0; font-family: "Inter", sans-serif;';
            title.innerText = currentLang === 'ar' ? 'جاري تحديث التطبيق...' : 'Updating App...';
            
            const subtitle = document.createElement('p');
            subtitle.style.cssText = 'color:var(--text-muted); font-size:1rem; margin:0; font-family: "Inter", sans-serif;';
            subtitle.innerText = currentLang === 'ar' ? 'يتم الآن تثبيت أحدث الميزات، يرجى الانتظار لحظات.' : 'Installing the latest features, please wait a moment.';
            
            overlay.appendChild(spinner);
            overlay.appendChild(title);
            overlay.appendChild(subtitle);
            document.body.appendChild(overlay);
            
            setTimeout(() => { window.location.reload(true); }, 1500);
        }
    });
}

// 2. Firebase Cloud Sync
const firebaseConfig = {
    apiKey: "AIzaSyA2Vx78wtKKzQ0dcWkIRw2Jl-mjHyWdp5A",
    authDomain: "eslam-planner.firebaseapp.com",
    projectId: "eslam-planner",
    storageBucket: "eslam-planner.appspot.com",
    messagingSenderId: "334354781516",
    appId: "1:334354781516:web:d7d3b13ba7157d617d2be9",
};

let useCloud = false, auth, db, currentUser = null, cloudUnsubscribe = [];
if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10) {
    try {
        firebase.initializeApp(firebaseConfig); 
        auth = firebase.auth(); 
        db = firebase.firestore(); 
        // تفعيل العمل بدون إنترنت: أي تعديل بيتم أوفلاين يتخزن محلياً في طابور الانتظار
        // وبيتبعت تلقائياً للسيرفر أول ما الاتصال يرجع، من غير ما نضطر نعمل أي كود إضافي.
        try {
            db.enablePersistence({ synchronizeTabs: true }).catch(err => {
                console.warn('Firestore offline persistence not enabled:', err.code);
            });
        } catch(e) { console.warn('Firestore offline persistence error:', e); }
        useCloud = true;
        
        auth.onAuthStateChanged(user => {
            const cloudStatus = document.getElementById('cloudStatus');
            if (user) {
                currentUser = user;
                if(cloudStatus) cloudStatus.innerHTML = `<span style="color:var(--success); font-weight:bold;"><i class="fa-solid fa-cloud-check"></i> ${currentLang === 'ar' ? 'متصل كـ:' : 'Connected as:'} ${escapeHtml(user.email)}</span> <button onclick="logoutCloud()" class="btn btn-secondary" style="padding:5px 10px; font-size:0.8rem; color: var(--danger);">${currentLang === 'ar' ? 'خروج آمن' : 'Logout'}</button>`;
                loadFromCloud();
            } else {
                currentUser = null;
                if (cloudUnsubscribe.length) { cloudUnsubscribe.forEach(u => u()); cloudUnsubscribe = []; }
                if(cloudStatus) cloudStatus.innerHTML = `<span style="color:var(--text-muted);"><i class="fa-solid fa-cloud-arrow-up"></i> ${currentLang === 'ar' ? 'غير متصل' : 'Offline'}</span> <button onclick="document.getElementById('authModal').classList.add('show')" class="btn btn-primary" style="padding:5px 10px; font-size:0.85rem;">${currentLang === 'ar' ? 'دخول للمزامنة' : 'Login to Sync'}</button>`;
            }
        });
    } catch(e) {
        console.error("Firebase Init Error:", e);
    }
}

// ----------------------------------------
// الحماية والتعقيم (XSS Prevention)
// ----------------------------------------
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function linkify(text) { 
    const safeText = escapeHtml(text); 
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%Sub=~_|])/ig; 
    const phoneRegex = /(\b\d{10,14}\b)/g; 
    return safeText.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`).replace(phoneRegex, phone => `<a href="tel:${phone}">${phone}</a>`); 
}

// ----------------------------------------
// نظام "اقرأ المزيد / عرض أقل" لكروت الملاحظات والمراجع
// ----------------------------------------
window.toggleCardExpand = (id) => {
    const el = document.getElementById('content-' + id);
    const btn = document.getElementById('btn-' + id);
    if (!el || !btn) return;
    const collapsed = el.classList.toggle('card-content-collapsed');
    btn.innerHTML = collapsed 
        ? (currentLang === 'ar' ? 'اقرأ المزيد <i class="fa-solid fa-chevron-down"></i>' : 'Read more <i class="fa-solid fa-chevron-down"></i>')
        : (currentLang === 'ar' ? 'عرض أقل <i class="fa-solid fa-chevron-up"></i>' : 'Show less <i class="fa-solid fa-chevron-up"></i>');
};
// بعد الرندر، بيخفي زرار "اقرأ المزيد" تلقائياً لو المحتوى أصلاً بيتسع في المساحة المصغّرة من غير قص
function setupReadMoreButtons(container) {
    if (!container) return;
    requestAnimationFrame(() => {
        container.querySelectorAll('.card-content-collapsed').forEach(el => {
            const btn = document.getElementById('btn-' + el.id.replace('content-', ''));
            if (!btn) return;
            btn.style.display = (el.scrollHeight > el.clientHeight + 2) ? '' : 'none';
        });
    });
}

// ----------------------------------------
// الترجمة واللغات
// ----------------------------------------
const i18n = {
    ar: {
        nav_dash: "لوحة التحكم", nav_month: "خطة الشهر", nav_today: "اليوم", nav_pomodoro: "مؤقت التركيز", nav_kanban: "المشاريع", nav_habits: "متتبع العادات", nav_finance: "المتتبع المالي", nav_lib: "مكتبة المراجع", nav_notes: "الملاحظات", nav_settings: "الإعدادات والمزامنة",
        btn_invite: "دعوة", btn_install: "تثبيت التطبيق",
        title_dash: "لوحة التحكم والإحصائيات", btn_clear_comp: "مسح المكتملة", btn_clear_today: "مسح مهام اليوم", btn_hide_dash: "إخفاء مهام اليوم", btn_reset_stats: "تصفير الإحصائيات",
        card_tasks: "المهام اليوم", card_bal: "الرصيد المتاح", card_habits: "إنجاز العادات",
        title_finance: "المتتبع المالي", btn_add_trans: "معاملة", fin_inc: "الدخل", fin_exp: "المصروفات", fin_bal: "الرصيد", btn_edit_trans: "تعديل المعاملة",
        title_lib: "المراجع والأصول", btn_add_ref: "إضافة مرجع", btn_edit_ref: "تعديل المرجع", lib_dictate_hint: "المحتوى",
        btn_prev: "السابق", btn_next: "التالي",
        title_today: "جدول اليوم", btn_add: "إضافة", btn_edit_task: "تعديل المهمة", btn_update: "تحديث",
        title_pom: "مؤقت التركيز (Pomodoro)", btn_work: "عمل", btn_break: "استراحة", btn_start: "ابدأ", btn_pause: "إيقاف مؤقت", btn_reset: "إعادة", btn_stop_alarm: "إيقاف الرنين",
        title_kanban: "لوحة المشاريع", kb_todo: "💡 أفكار/مهام", kb_inprog: "⏳ التنفيذ", kb_done: "✅ مكتملة", btn_edit_kb: "تعديل المشروع",
        title_habits: "متتبع العادات", 
        title_notes: "الملاحظات", btn_add_note: "إضافة ملاحظة", btn_edit_note: "تعديل الملاحظة",
        title_settings: "الإعدادات والمزامنة", label_name: "الاسم", btn_save_local: "حفظ البيانات محلياً",
        title_appearance: "المظهر والألوان 🎨",
        title_sync: "المزامنة السحابية الحية ☁️", sync_desc: "عند تسجيل الخروج سيتم مسح بياناتك من هذا الجهاز لضمان السرية، وستبقى آمنة في حسابك.",
        title_backup: "النسخ الاحتياطي اليدوي", btn_download: "تنزيل البيانات", btn_restore: "استرجاع ملف",
        chart_done: "مكتملة", chart_pend: "غير مكتملة", btn_cancel: "إلغاء", btn_save: "حفظ", title_login: "تسجيل الدخول للمزامنة",
        title_update_log: "سجل التحديثات 🔄",
        btn_check_update: "البحث عن تحديث / تنشيط التطبيق",
        card_pomodoro_blocks: "جلسات التركيز اليوم",
        pom_log_title: "سجل جلسات التركيز ⏱️",
        pom_work_log: "جلسة تركيز عمل",
        pom_break_log: "جلسة استراحة ونقاهة",
        pom_no_log: "لم يتم تسجيل أي جلسات تركيز بعد.",
        title_quick_dump: "تفريغ الدماغ السريع ⚡", btn_qd_kanban: "كمشروع", btn_qd_note: "كملاحظة",
        empty_state_title: "لوحتك بيضاء بانتظار إنجازاتك! ✨", empty_state_desc: "الرسم البياني نائم الآن.. ابدأ بإنجاز أول مهمة لتشغيله.",
        doughnut_title: "مؤشر النشاط الشامل 📊",
        budget_index: "مؤشر الميزانية 📊", opt_inc: "إيراد (+)", opt_exp: "مصروف (-)", opt_save: "إيداع/ادخار (🔒)", opt_withdraw: "تسييل/سحب (🔓)",
        fin_savings: "المدخرات 🔒", fin_bal_avail: "المتاح للصرف", fin_net_worth: "صافي الثروة (إجمالي الأصول):",
        cat_other: "أخرى", cat_food: "🍔 طعام", cat_trans: "🚕 مواصلات", cat_shop: "🛒 تسوق", cat_bills: "💡 فواتير", cat_work: "💻 عمل", cat_fun: "🎉 ترفيه",
        cat_gold: "🪙 ذهب", cat_stocks: "📈 أسهم", cat_deposit: "🏦 وديعة بنكية", cat_emergency: "🛡️ صندوق طوارئ",
        lib_search_ph: "🔍 بحث في المراجع...", notes_search_ph: "🔍 بحث في الملاحظات...",
        lib_view_date: "الأحدث أولاً", lib_view_cat: "عرض حسب التصنيف", lib_cat_all: "كل التصنيفات",
        nav_updates: "التحديثات", title_updates: "سجل تحديثات التطبيق 🔄"
    },
    en: {
        nav_dash: "Dashboard", nav_month: "Monthly Plan", nav_today: "Today", nav_pomodoro: "Focus Timer", nav_kanban: "Projects", nav_habits: "Habit Tracker", nav_finance: "Finance", nav_lib: "Library", nav_notes: "Notes", nav_settings: "Settings & Sync",
        btn_invite: "Invite", btn_install: "Install App",
        title_dash: "Dashboard & Stats", btn_clear_comp: "Clear Completed", btn_clear_today: "Clear Today", btn_hide_dash: "Hide from Dash", btn_reset_stats: "Reset Stats",
        card_tasks: "Today's Tasks", card_bal: "Available Balance", card_habits: "Habits Rate",
        title_finance: "Finance Tracker", btn_add_trans: "Transaction", fin_inc: "Income", fin_exp: "Expense", fin_bal: "Balance", btn_edit_trans: "Edit Transaction",
        title_lib: "Library & Assets", btn_add_ref: "Add Reference", btn_edit_ref: "Edit Reference", lib_dictate_hint: "Content",
        btn_prev: "Previous", btn_next: "Next",
        title_today: "Today's Schedule", btn_add: "Add Task", btn_edit_task: "Edit Task", btn_update: "Update",
        title_pom: "Focus Timer (Pomodoro)", btn_work: "Work", btn_break: "Break", btn_start: "Start", btn_pause: "Pause", btn_reset: "Reset", btn_stop_alarm: "Stop Alarm",
        title_kanban: "Projects Board", kb_todo: "💡 Ideas / To-Do", kb_inprog: "⏳ In Progress", kb_done: "✅ Done", btn_edit_kb: "Edit Project",
        title_habits: "Habit Tracker", 
        title_notes: "Notes", btn_add_note: "Add Note", btn_edit_note: "Edit Note",
        title_settings: "Settings & Sync", label_name: "Name", btn_save_local: "Save Locally",
        title_appearance: "Appearance & Colors 🎨",
        title_sync: "Live Cloud Sync ☁️", sync_desc: "Logging out will securely wipe data from this device. It remains safe in your cloud account.",
        title_backup: "Manual Backup", btn_download: "Download Data", btn_restore: "Restore File",
        chart_done: "Completed", chart_pend: "Pending", btn_cancel: "Cancel", btn_save: "Save", title_login: "Login to Sync",
        title_update_log: "Update Log 🔄",
        btn_check_update: "Check for Updates / Refresh App",
        card_pomodoro_blocks: "Focus Sessions Today",
        pom_log_title: "Focus Session Log ⏱️",
        pom_work_log: "Focus Work Session",
        pom_break_log: "Rest & Break Session",
        pom_no_log: "No focus sessions logged yet.",
        title_quick_dump: "Quick Brain Dump ⚡", btn_qd_kanban: "As Project", btn_qd_note: "As Note",
        empty_state_title: "Your canvas is blank! ✨", empty_state_desc: "Charts are sleeping.. Complete a task to wake them up.",
        doughnut_title: "Overall Activity Index 📊",
        budget_index: "Budget Index 📊", opt_inc: "Income (+)", opt_exp: "Expense (-)", opt_save: "Deposit/Save (🔒)", opt_withdraw: "Liquidate/Withdraw (🔓)",
        fin_savings: "Savings 🔒", fin_bal_avail: "Available to Spend", fin_net_worth: "Net Worth (Total Assets):",
        cat_other: "Other", cat_food: "🍔 Food", cat_trans: "🚕 Transport", cat_shop: "🛒 Shopping", cat_bills: "💡 Bills", cat_work: "💻 Work", cat_fun: "🎉 Entertainment",
        cat_gold: "🪙 Gold", cat_stocks: "📈 Stocks", cat_deposit: "🏦 Bank Deposit", cat_emergency: "🛡️ Emergency Fund",
        lib_search_ph: "🔍 Search references...", notes_search_ph: "🔍 Search notes...",
        lib_view_date: "Newest first", lib_view_cat: "View by category", lib_cat_all: "All categories",
        nav_updates: "Updates", title_updates: "App Update Log 🔄"
    }
};

let currentLang = localStorage.getItem('fp_lang') || 'ar';

window.updateFinCategories = (typeId, catId) => {
    const typeEl = document.getElementById(typeId);
    const catEl = document.getElementById(catId);
    if(!typeEl || !catEl) return;
    
    let val = typeEl.value;
    let cats = [];
    if(val === 'save' || val === 'withdraw') {
        cats = [ {v:'gold', l:i18n[currentLang].cat_gold}, {v:'stocks', l:i18n[currentLang].cat_stocks}, {v:'deposit', l:i18n[currentLang].cat_deposit}, {v:'emergency', l:i18n[currentLang].cat_emergency}, {v:'other', l:i18n[currentLang].cat_other} ];
    } else {
        cats = [ {v:'other', l:i18n[currentLang].cat_other}, {v:'food', l:i18n[currentLang].cat_food}, {v:'transport', l:i18n[currentLang].cat_trans}, {v:'shopping', l:i18n[currentLang].cat_shop}, {v:'bills', l:i18n[currentLang].cat_bills}, {v:'work', l:i18n[currentLang].cat_work}, {v:'fun', l:i18n[currentLang].cat_fun} ];
    }
    
    let oldVal = catEl.value;
    catEl.innerHTML = cats.map(c => `<option value="${c.v}">${c.l}</option>`).join('');
    if(Array.from(catEl.options).some(o => o.value === oldVal)) catEl.value = oldVal;
};

function setLanguage(lang) {
    currentLang = lang; localStorage.setItem('fp_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.getAttribute('data-i18n'); if(i18n[lang][key]) el.innerHTML = i18n[lang][key]; });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => { const key = el.getAttribute('data-i18n-ph'); if(i18n[lang][key]) el.placeholder = i18n[lang][key]; });
    const toggleBtn = document.getElementById('langLabel'); if(toggleBtn) toggleBtn.innerHTML = lang === 'ar' ? 'EN' : 'AR';
    const kbInp = document.getElementById('newKbItem'); if(kbInp) kbInp.placeholder = lang === 'ar' ? 'اكتب اسم المشروع / المهمة هنا... (اضغط Enter لسطر جديد)' : 'Type project name... (Press Enter for new line)';
    const hbInp = document.getElementById('newHabitInput'); if(hbInp) hbInp.placeholder = lang === 'ar' ? 'عادة جديدة...' : 'New habit...';
    
    window.updateFinCategories('finType', 'finCategory');
    window.updateFinCategories('editFinType', 'editFinCategory');
}

function initColorTheme() {
    let savedTheme = localStorage.getItem('fp_color_theme') || 'theme-green';
    if(savedTheme !== 'theme-green') document.documentElement.classList.add(savedTheme);
    document.querySelectorAll('.color-btn').forEach(btn => {
        if(btn.dataset.theme === savedTheme) btn.classList.add('active');
        btn.onclick = () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.documentElement.classList.remove('theme-blue', 'theme-purple', 'theme-orange', 'theme-rose');
            let newTheme = btn.dataset.theme;
            if(newTheme !== 'theme-green') document.documentElement.classList.add(newTheme);
            localStorage.setItem('fp_color_theme', newTheme);
            renderDashboard();
        };
    });
}

// ----------------------------------------
// تهيئة البيانات ومحرك الحفظ المحصن
// ----------------------------------------
let tasks = [], notes = [], profile = { name: '', phone: '' }, kanbanTasks = { todo: [], inprogress: [], done: [] }, habits = [], finances = [], library = [], pomodoroLog = [], updateLog = [];
let lastModified = parseInt(localStorage.getItem('fp_last_modified')) || 0;

try { updateLog = JSON.parse(localStorage.getItem('fp_update_log')) || []; } catch(e) { updateLog = []; }
try { tasks = JSON.parse(localStorage.getItem('fp_tasks')) || []; } catch(e) { tasks = []; }
try { notes = JSON.parse(localStorage.getItem('fp_notes')) || []; } catch(e) { notes = []; }
try { profile = JSON.parse(localStorage.getItem('fp_profile')) || { name: '', phone: '' }; } catch(e) { profile = { name: '', phone: '' }; }
try { kanbanTasks = JSON.parse(localStorage.getItem('fp_kanban')) || { todo: [], inprogress: [], done: [] }; } catch(e) { kanbanTasks = { todo: [], inprogress: [], done: [] }; }
try { habits = JSON.parse(localStorage.getItem('fp_habits')) || []; } catch(e) { habits = []; }
try { finances = JSON.parse(localStorage.getItem('fp_finance')) || []; } catch(e) { finances = []; }
try { library = JSON.parse(localStorage.getItem('fp_library')) || []; } catch(e) { library = []; }
try { pomodoroLog = JSON.parse(localStorage.getItem('fp_pomodoro_log')) || []; } catch(e) { pomodoroLog = []; }

const getTodayStr = () => { const d = new Date(); return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]; };
let currentTodayStr = getTodayStr(); let currentDailyDate = currentTodayStr; let currentMonthView = new Date().getMonth(); let currentYearView = new Date().getFullYear();
let shouldScrollToToday = false; // بيتفعل بس لما ندخل "خطة الشهر" قادمين من أداة تانية
const monthNamesAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]; const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let myChart = null;

setInterval(() => { 
    let checkDate = getTodayStr(); 
    if (checkDate !== currentTodayStr) { 
        currentTodayStr = checkDate; 
        if(currentDailyDate === currentTodayStr) { 
            const vd = document.getElementById('viewDailyDate');
            if(vd) vd.value = currentTodayStr; 
            renderViews(); 
        } 
    } 
}, 60000);

// كتابة البيانات في localStorage فقط، من غير لمس الوقت أو السحابة
function persistLocalOnly() {
    try {
        localStorage.setItem('fp_tasks', JSON.stringify(tasks));
        localStorage.setItem('fp_notes', JSON.stringify(notes));
        localStorage.setItem('fp_kanban', JSON.stringify(kanbanTasks));
        localStorage.setItem('fp_habits', JSON.stringify(habits));
        localStorage.setItem('fp_finance', JSON.stringify(finances));
        localStorage.setItem('fp_library', JSON.stringify(library));
        localStorage.setItem('fp_profile', JSON.stringify(profile));
        localStorage.setItem('fp_pomodoro_log', JSON.stringify(pomodoroLog));
        localStorage.setItem('fp_update_log', JSON.stringify(updateLog));
        localStorage.setItem('fp_last_modified', String(lastModified));
    } catch(err) {
        console.error("Local storage save error:", err);
    }
}

// إظهار/إخفاء تنبيه بصري لو فشلت آخر عملية مزامنة سحابية
function setCloudSyncWarning(hasError) {
    const cloudStatus = document.getElementById('cloudStatus');
    if (!cloudStatus) return;
    let warn = cloudStatus.querySelector('.sync-warning');
    if (hasError && !warn) {
        warn = document.createElement('span');
        warn.className = 'sync-warning';
        warn.style.cssText = 'color:var(--danger); margin-left:8px; font-weight:bold;';
        warn.title = currentLang === 'ar' ? 'فشلت آخر مزامنة سحابية، بياناتك محفوظة محلياً فقط على هذا الجهاز' : 'Last cloud sync failed — your data is saved locally on this device only';
        warn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        cloudStatus.appendChild(warn);
    } else if (!hasError && warn) {
        warn.remove();
    }
}

// دالة الحفظ المعزولة ضد الانهيار
function saveAll() {
    lastModified = Date.now();
    persistLocalOnly();

    if (useCloud && currentUser) { 
        try {
            const userRef = db.collection('users').doc(currentUser.uid);

            // المستند الرئيسي: بيانات خفيفة بس (المهام، الملاحظات، الكانبان، العادات، المالية، المكتبة، البروفايل)
            // بنمسح صراحة أي حقل monthlyData قديم متراكم من نسخ سابقة، عشان لو هو سبب تخطي حد الـ 1MB،
            // المستند يرجع يصغر ويقدر يتحفظ تاني بدل ما يفضل عالق فوق الحد للأبد
            userRef.set({ 
                tasks, notes, kanbanTasks, habits, finances, library, profile, lastModified, updateLog,
                monthlyData: firebase.firestore.FieldValue.delete()
            }, {merge: true}).then(() => {
                setCloudSyncWarning(false);
            }).catch(e => {
                console.error("Cloud save failed:", e);
                setCloudSyncWarning(true);
            }); 

            // الخطط الشهرية: كل مفتاح (يوم/شهر) في مستنده الخاص جوه subcollection منفصلة،
            // فمهما البيانات كبرت بمرور الوقت، المستند الرئيسي فوق يفضل صغير ومحفوظ دايماً
            const batch = db.batch();
            let hasMonthlyWrites = false;
            for(let i=0; i<localStorage.length; i++) { 
                let k = localStorage.key(i); 
                if(k && k.startsWith('PlannerMonthData_')) {
                    batch.set(userRef.collection('monthlyData').doc(k), { value: localStorage.getItem(k) });
                    hasMonthlyWrites = true;
                }
            } 
            if (hasMonthlyWrites) {
                batch.commit().catch(e => {
                    console.error("Monthly data cloud save failed:", e);
                    setCloudSyncWarning(true);
                });
            }
        } catch(e) {
            console.error("Cloud data parsing error:", e);
        }
    }
}

function loadFromCloud() { 
    if(!useCloud || !currentUser) return;
    if (cloudUnsubscribe.length) { cloudUnsubscribe.forEach(u => u()); cloudUnsubscribe = []; }

    const userRef = db.collection('users').doc(currentUser.uid);

    // onSnapshot بيفتح قناة مباشرة مع Firestore: أي جهاز تاني يحفظ حاجة،
    // كل الأجهزة الأخرى المسجلة بنفس الحساب وفاتحة التطبيق تستقبل التحديث فوراً
    // من غير ما تحتاج تعمل Refresh، وبيتجنب مشكلة مقارنة ساعات الأجهزة المختلفة.
    const unsubMain = userRef.onSnapshot(doc => {
        if (!doc.exists) { setCloudSyncWarning(false); return; }
        if (doc.metadata.hasPendingWrites) return; // ده انعكاس لحفظنا إحنا نفسنا، متلزمش نطبقه تاني

        const data = doc.data(); 
        if(Array.isArray(data.tasks)) tasks = data.tasks; 
        if(Array.isArray(data.notes)) notes = data.notes; 
        if(data.kanbanTasks && typeof data.kanbanTasks === 'object') kanbanTasks = data.kanbanTasks; 
        if(Array.isArray(data.habits)) habits = data.habits; 
        if(Array.isArray(data.finances)) finances = data.finances; 
        if(Array.isArray(data.library)) library = data.library; 
        if(data.profile) profile = data.profile; 
        if(Array.isArray(data.updateLog)) updateLog = data.updateLog;
        if (typeof data.lastModified === 'number') lastModified = data.lastModified;
        persistLocalOnly(); 
        renderViews(); 
        setCloudSyncWarning(false);
    }, e => {
        console.error("Cloud sync error:", e);
        setCloudSyncWarning(true);
    });

    // مستمع منفصل لـ subcollection الخطط الشهرية
    const unsubMonthly = userRef.collection('monthlyData').onSnapshot(snap => {
        snap.docChanges().forEach(change => {
            if (change.doc.metadata.hasPendingWrites) return;
            if (change.type === 'removed') {
                localStorage.removeItem(change.doc.id);
            } else {
                const val = change.doc.data().value;
                if (typeof val === 'string') localStorage.setItem(change.doc.id, val);
            }
        });
        renderViews();
    }, e => {
        console.error("Monthly cloud sync error:", e);
        setCloudSyncWarning(true);
    });

    cloudUnsubscribe = [unsubMain, unsubMonthly];
}

// ----------------------------------------
// دوال الفتح والإغلاق
// ----------------------------------------
window.openTaskModal = () => { document.getElementById('taskTitle').value = ''; document.getElementById('taskDate').value = currentDailyDate; document.getElementById('taskModal').classList.add('show'); };
window.openNoteModal = () => { document.getElementById('noteTitle').value = ''; document.getElementById('noteContent').value = ''; document.getElementById('noteDate').value = currentTodayStr; document.getElementById('notePhone').value = ''; document.getElementById('noteModal').classList.add('show'); };
window.openLibModal = () => { document.getElementById('libTitle').value = ''; document.getElementById('libCategory').value = ''; document.getElementById('libContent').value = ''; document.getElementById('libPhone').value = ''; document.getElementById('libraryModal').classList.add('show'); };
window.openFinModal = () => { document.getElementById('finDesc').value = ''; document.getElementById('finAmount').value = ''; document.getElementById('finDate').value = currentTodayStr; document.getElementById('financeModal').classList.add('show'); setTimeout(() => { if(window.updateFinColor) updateFinColor('finType', 'finAmount'); }, 50); };

window.clearDailyTasks = (type) => { 
    if(type === 'completed') { 
        if(confirm(currentLang==='ar'?'مسح المهام المكتملة لهذا اليوم فقط؟':'Clear completed tasks for today?')) { 
            tasks = tasks.filter(t => !(t.completed && t.date === currentTodayStr)); 
            saveAll(); renderViews(); 
        } 
    } 
    else if (type === 'today') { 
        if(confirm(currentLang==='ar'?'حذف جميع مهام اليوم نهائياً؟':'Delete all tasks for today permanently?')) { 
            tasks = tasks.filter(t => t.date !== currentTodayStr); 
            saveAll(); renderViews(); 
        } 
    } 
};
window.archiveDashboardToday = () => { if(confirm(currentLang==='ar'?'إخفاء مهام اليوم من لوحة الإحصائيات؟':'Hide today\'s tasks from Dashboard?')) { localStorage.setItem('fp_dash_cleared', currentTodayStr); renderDashboard(); } };
window.resetStats = () => { if(confirm(currentLang==='ar'?'تصفير الإحصائيات والرسم البياني؟':'Reset dashboard stats?')) { localStorage.setItem('fp_stats_reset', getTodayStr()); renderDashboard(); } };
window.handleAuth = async (action) => { 
    const email = document.getElementById('authEmail').value, pass = document.getElementById('authPassword').value, errEl = document.getElementById('authError'); 
    errEl.innerText = ''; 
    if(!email || !pass) return; 
    try { 
        if(action === 'login') await auth.signInWithEmailAndPassword(email, pass); 
        else await auth.createUserWithEmailAndPassword(email, pass); 
        document.getElementById('authModal').classList.remove('show'); 
    } catch(err) { 
        errEl.style.color = 'var(--danger)'; 
        errEl.innerText = err.message; 
    } 
};
window.resetPassword = async () => { 
    const email = document.getElementById('authEmail').value; 
    const errEl = document.getElementById('authError'); 
    if(!email) { 
        errEl.style.color = 'var(--warning)'; 
        errEl.innerText = currentLang === 'ar' ? 'يرجى كتابة البريد الإلكتروني.' : 'Please enter email.'; 
        return; 
    } 
    try { 
        await auth.sendPasswordResetEmail(email); 
        errEl.style.color = 'var(--success)'; 
        errEl.innerText = currentLang === 'ar' ? 'تم إرسال رابط الاستعادة!' : 'Reset link sent!'; 
    } catch(err) { 
        errEl.style.color = 'var(--danger)'; 
        errEl.innerText = err.message; 
    } 
};

// تسجيل خروج آمن يضمن المزامنة قبل المسح
window.logoutCloud = async () => { 
    if(confirm(currentLang === 'ar' ? 'هل تريد تسجيل الخروج؟ سيتم تفريغ البيانات المحلية والتأكد من مزامنتها سحابياً.' : 'Logout and wipe local data?')) {
        try {
            saveAll();
            if (cloudUnsubscribe.length) { cloudUnsubscribe.forEach(u => u()); cloudUnsubscribe = []; }
            await auth.signOut();
            localStorage.clear(); 
            location.reload(); 
        } catch(e) {
            console.error("Logout error:", e);
            location.reload();
        }
    }
};

// ----------------------------------------
// الإملاء الصوتي
// ----------------------------------------
let dictationRecognition = null; let isDictating = false; 
let currentStartBtn = null, currentStopBtn = null, currentStatus = null, currentInput = null;

window.startContinuousDictation = (inputId, langId, statusId, startBtnId, stopBtnId) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { 
        alert(currentLang === 'ar' ? 'متصفحك لا يدعم الإملاء الصوتي.' : 'Speech to text not supported on this browser.'); 
        return; 
    }
    
    if(isDictating) stopContinuousDictation(); 
    
    currentStartBtn = document.getElementById(startBtnId);
    currentStopBtn = document.getElementById(stopBtnId);
    currentStatus = document.getElementById(statusId);
    currentInput = document.getElementById(inputId);
    
    dictationRecognition = new SpeechRecognition(); 
    dictationRecognition.continuous = false; 
    dictationRecognition.interimResults = false; 
    dictationRecognition.lang = document.getElementById(langId).value;

    dictationRecognition.onstart = () => { 
        isDictating = true; 
        currentStartBtn.style.display = 'none'; currentStopBtn.style.display = 'inline-flex';
        currentStatus.innerText = currentLang === 'ar' ? 'تحدث، وسيكتب عند صمتك...' : 'Speak, it writes when you pause...'; 
        currentStatus.style.color = 'var(--danger)'; 
    };

    dictationRecognition.onresult = (event) => { 
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + ' ';
        }
        if (finalTranscript.trim().length > 0) {
            let currentText = currentInput.value;
            currentInput.value = currentText + (currentText.endsWith(' ') || currentText === '' ? '' : ' ') + finalTranscript.trim();
        }
    };

    dictationRecognition.onend = () => { 
        if(isDictating) { 
            try { dictationRecognition.start(); } catch(e) {} 
        } else {
            currentStartBtn.style.display = 'inline-flex'; currentStopBtn.style.display = 'none';
            currentStatus.innerText = currentLang === 'ar' ? 'المحتوى' : 'Content'; 
            currentStatus.style.color = 'var(--text-main)'; 
        }
    };

    dictationRecognition.onerror = () => {};
    try { dictationRecognition.start(); } catch(e) {}
};

window.stopContinuousDictation = () => { 
    isDictating = false; 
    if(dictationRecognition) {
        try { dictationRecognition.stop(); } catch(e) {}
    }
    if(currentStartBtn) { currentStartBtn.style.display = 'inline-flex'; currentStopBtn.style.display = 'none'; }
    if(currentStatus) { currentStatus.innerText = currentLang === 'ar' ? 'المحتوى' : 'Content'; currentStatus.style.color = 'var(--text-main)'; }
};

document.addEventListener('DOMContentLoaded', () => {
    checkAndShowChangelog();
    
    const setTodayDateAuto = () => {
        const today = new Date();
        const localDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        const viewDailyDate = document.getElementById('viewDailyDate');
        if (viewDailyDate && viewDailyDate.value !== localDate) {
            viewDailyDate.value = localDate;
            currentDailyDate = localDate;
            renderDaily();
        }
    };
    
    setTodayDateAuto(); 
    setInterval(setTodayDateAuto, 60000);
    
    const savedFontSize = localStorage.getItem('plannerFontSize') || '16px';
    document.documentElement.style.fontSize = savedFontSize;
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    if (fontSizeSelect) fontSizeSelect.value = savedFontSize;

    const installBtn = document.getElementById('installAppBtn');
    if (installBtn && !isStandalone) {
        if (isIOS) {
            installBtn.style.display = 'inline-flex'; 
            installBtn.addEventListener('click', () => {
                alert(currentLang === 'ar' ? '🍎 لتثبيت التطبيق على آيفون:\n1. اضغط على زر "مشاركة" (Share) أسفل المتصفح.\n2. اختر "إضافة للشاشة الرئيسية" (Add to Home Screen).' : '🍎 To install on iPhone:\n1. Tap the Share icon.\n2. Tap "Add to Home Screen".');
            });
        } else {
            installBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') { deferredPrompt = null; installBtn.style.display = 'none'; }
                } else {
                    alert(currentLang === 'ar' ? 'يرجى التثبيت من قائمة المتصفح.' : 'Please install via browser menu.');
                }
            });
        }
    } else if (installBtn && isStandalone) {
        installBtn.style.display = 'none'; 
    }

    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const authPassword = document.getElementById('authPassword');
    const togglePasswordIcon = document.getElementById('togglePasswordIcon');

    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = authPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            authPassword.setAttribute('type', type);
            togglePasswordIcon.classList.toggle('fa-eye');
            togglePasswordIcon.classList.toggle('fa-eye-slash');
        });
    }

    initTheme(); initColorTheme(); initModals(); initProfile(); initBackup(); setLanguage(currentLang);
    
    document.getElementById('langToggleBtn').onclick = () => { setLanguage(currentLang === 'ar' ? 'en' : 'ar'); };
    
    document.getElementById('shareEmptyBtn').onclick = () => {
        const text = currentLang === 'ar' ? "جربت تطبيق Planner Pro Max لتنظيم الوقت وإدارة المهام وكان ممتاز! جربه مجاناً من هنا: https://eslam-planner.github.io/" : "Try out Planner Pro Max for free: https://eslam-planner.github.io/";
        const url = "https://eslam-planner.github.io/";
        
        if (navigator.share && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) { 
            navigator.share({ title: 'Planner Pro Max', text: text, url: url }).catch(console.error);
        } else { 
            document.getElementById('shareWa').href = `https://wa.me/?text=${encodeURIComponent(text)}`;
            document.getElementById('shareFb').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            document.getElementById('shareX').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
            document.getElementById('shareTg').href = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
            document.getElementById('shareModal').classList.add('show');
        }
    };

    document.getElementById('copyLinkBtn').onclick = () => {
        const linkInput = document.getElementById('shareLinkInput');
        linkInput.select(); document.execCommand('copy');
        const btn = document.getElementById('copyLinkBtn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => { btn.innerHTML = originalHtml; }, 2000);
    };

    const viewDailyDate = document.getElementById('viewDailyDate');
    if(viewDailyDate) { 
        viewDailyDate.value = currentDailyDate; 
        viewDailyDate.addEventListener('change', (e) => { currentDailyDate = e.target.value; renderDaily(); }); 
    }
    
    const taskHour = document.getElementById('taskHour'); 
    if(taskHour) {
        taskHour.innerHTML = ''; 
        for(let i = 6; i <= 23; i++) { 
            let opt = document.createElement('option'); 
            opt.value = i; 
            opt.textContent = i === 12 ? '12 PM' : (i > 12 ? `${i - 12} PM` : `${i} AM`); 
            taskHour.appendChild(opt); 
        }
    }
    
    document.getElementById('prevMonthBtn').onclick = () => { currentMonthView--; if(currentMonthView < 0) { currentMonthView = 11; currentYearView--; } renderViews(); };
    document.getElementById('nextMonthBtn').onclick = () => { currentMonthView++; if(currentMonthView > 11) { currentMonthView = 0; currentYearView++; } renderViews(); };
    
    document.querySelectorAll('.nav-item').forEach(link => { 
        link.addEventListener('click', (e) => { 
            e.preventDefault(); 
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); 
            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active')); 
            e.currentTarget.classList.add('active'); 
            let target = e.currentTarget.getAttribute('data-target'); 
            document.getElementById(target).classList.add('active'); 
            if (target === 'monthlyView') shouldScrollToToday = true;
            renderViews(); 
        }); 
    });
    
    initPomodoro(); 
    renderViews();
});

function renderViews() { 
    renderDashboard(); renderMonthly(); renderDaily(); renderKanban(); renderHabits(); renderFinance(); renderLibrary(); renderNotes(); 
    if(typeof renderPomodoroLog === 'function') renderPomodoroLog();
    if(typeof renderUpdatesLog === 'function') renderUpdatesLog();
}

// ----------------------------------------
// جدول اليوم
// ----------------------------------------
function renderDaily() { 
    const container = document.getElementById('plannerContainer'); 
    if(!container) return;
    container.innerHTML = ''; 
    const todayTasks = tasks.filter(t => t.date === currentDailyDate); 
    for(let hour = 6; hour <= 23; hour++) { 
        const hourTasks = todayTasks.filter(t => t.hour == hour); 
        let timeLabel = hour === 12 ? '12 PM' : (hour > 12 ? `${hour - 12} PM` : `${hour} AM`);
        let html = hourTasks.map(t => `
            <div class="daily-task-item ${t.completed ? 'completed' : ''}" onclick="editTask(${t.id})" style="display:flex; justify-content:space-between; padding:10px; border:1px solid var(--border-color); border-radius:8px; margin-bottom:5px; background:var(--card-bg); cursor:pointer;">
                <div style="flex:1;"><input type="checkbox" ${t.completed ? 'checked' : ''} onclick="event.stopPropagation()" onchange="toggleTask(${t.id})"> <span style="text-decoration:${t.completed?'line-through':'none'}">${escapeHtml(t.title)}</span></div>
                <button onclick="event.stopPropagation(); delTask(${t.id})" class="no-print icon-btn" style="color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
            </div>
        `).join(''); 
        container.innerHTML += `<div style="display:flex; margin-bottom:1rem; gap:1rem; align-items:flex-start;"><div style="width:60px; font-weight:bold; color:var(--primary); margin-top:10px;">${timeLabel}</div><div style="flex:1; min-height:45px;">${html||`<span style="color:var(--text-muted); font-size:0.8rem; display:block; padding:10px; opacity: 0.5;">...</span>`}</div></div>`; 
    } 
}

document.getElementById('saveTaskBtn').onclick = () => { 
    const t = document.getElementById('taskTitle').value; 
    if(!t || !t.trim()) return; 
    tasks.push({ 
        id: Date.now(), 
        title: t.trim(), 
        date: document.getElementById('taskDate').value, 
        hour: document.getElementById('taskHour').value, 
        completed: false 
    }); 
    saveAll(); 
    document.getElementById('taskModal').classList.remove('show'); 
    renderDaily(); 
    renderDashboard(); 
};
window.toggleTask = id => { tasks = tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t); saveAll(); renderDaily(); renderDashboard(); };
window.delTask = id => { tasks = tasks.filter(t => t.id !== id); saveAll(); renderDaily(); renderDashboard(); };

window.editTask = (id) => {
    let task = tasks.find(t => t.id === id); if(!task) return;
    document.getElementById('editTaskId').value = task.id; 
    document.getElementById('editTaskTitle').value = task.title; 
    document.getElementById('editTaskDate').value = task.date;
    let hourSelect = document.getElementById('editTaskHour'); 
    hourSelect.innerHTML = '';
    for(let i = 6; i <= 23; i++) { 
        let opt = document.createElement('option'); 
        opt.value = i; 
        opt.textContent = i === 12 ? '12 PM' : (i > 12 ? `${i - 12} PM` : `${i} AM`); 
        if(i == task.hour) opt.selected = true; 
        hourSelect.appendChild(opt); 
    }
    document.getElementById('editTaskModal').classList.add('show');
};

document.getElementById('updateTaskBtn').onclick = () => {
    let id = parseInt(document.getElementById('editTaskId').value); 
    let title = document.getElementById('editTaskTitle').value; 
    let dateStr = document.getElementById('editTaskDate').value;
    let hour = document.getElementById('editTaskHour').value;
    
    if(!title || !title.trim()) return; 
    let task = tasks.find(t => t.id === id);
    
    if(task) { 
        let oldDate = task.date;
        let oldTitle = task.title;

        task.title = title.trim(); 
        task.date = dateStr; 
        task.hour = hour; 
        
        if(dateStr !== oldDate) { 
            if (task.isMonthly) {
                let cleanOldText = oldTitle.replace('📌 خطة الشهر: ', '').replace('📌 Month Plan: ', '').trim();
                let cleanNewText = title.replace('📌 خطة الشهر: ', '').replace('📌 Month Plan: ', '').trim();

                let [oY, oM, oD] = oldDate.split('-');
                let oldKey = `PlannerMonthData_${parseInt(oY)}_${parseInt(oM)-1}_${parseInt(oD)}`;
                let oldMonthText = localStorage.getItem(oldKey) || "";
                if (cleanOldText && oldMonthText.includes(cleanOldText)) {
                    let newOldText = oldMonthText.replace(cleanOldText, '').trim();
                    newOldText = newOldText.replace(/^\s*[\r\n]/gm, '');
                    localStorage.setItem(oldKey, newOldText);
                }

                let [nY, nM, nD] = dateStr.split('-');
                let newKey = `PlannerMonthData_${parseInt(nY)}_${parseInt(nM)-1}_${parseInt(nD)}`;
                let newMonthText = localStorage.getItem(newKey) || "";
                if (!newMonthText.includes(cleanNewText)) {
                    localStorage.setItem(newKey, newMonthText ? newMonthText + '\n' + cleanNewText : cleanNewText);
                }
            } else {
                let [y, m, d] = dateStr.split('-');
                let storageKey = `PlannerMonthData_${parseInt(y)}_${parseInt(m)-1}_${parseInt(d)}`; 
                let currentText = localStorage.getItem(storageKey) || ""; 
                let timeTxt = hour == 12 ? '12 PM' : (hour > 12 ? (hour-12)+' PM' : hour+' AM'); 
                localStorage.setItem(storageKey, currentText ? currentText + '\n- ' + title + ' ('+timeTxt+')' : '- ' + title + ' ('+timeTxt+')'); 
            }
        } 
        
        saveAll(); 
        renderViews(); 
        document.getElementById('editTaskModal').classList.remove('show'); 
    }
};

// ----------------------------------------
// الملاحظات
// ----------------------------------------
function renderNotes() { 
    const container = document.getElementById('notesContainer');
    if(!container) return;

    const searchInput = document.getElementById('notesSearchInput');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    // المثبتة (pinned) تظهر أولاً، وبعدين باقي الملاحظات بترتيبها المحفوظ (اللي ممكن يتغير بالسحب/الأسهم)
    let items = notes.map((n, idx) => ({...n, _idx: idx})).sort((a, b) => (b.pinned?1:0) - (a.pinned?1:0));
    if (query) {
        items = items.filter(n => 
            (n.title || '').toLowerCase().includes(query) || 
            (n.content || '').toLowerCase().includes(query)
        );
    }

    if (items.length === 0) {
        const msg = notes.length === 0 
            ? (currentLang==='ar'?'لا توجد ملاحظات.':'No notes.') 
            : (currentLang==='ar'?'لا توجد نتائج.':'No results.');
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); grid-column: 1/-1;">${msg}</p>`;
        return;
    }
    container.innerHTML = '';
    items.forEach(note => { 
        let contactHTML = note.phone ? `<div style="display:flex; gap:10px; margin-bottom:10px;"><a href="tel:${escapeHtml(note.phone)}" class="icon-btn" style="color:var(--primary);"><i class="fa-solid fa-phone"></i></a><a href="https://wa.me/${escapeHtml(note.phone).replace(/\+/g,'')}" target="_blank" rel="noopener noreferrer" class="icon-btn" style="color:#25D366;"><i class="fa-brands fa-whatsapp"></i></a></div>` : '';
        container.innerHTML += `<div class="note-card" draggable="true" data-note-id="${note.id}" ondragstart="noteDragStart(event)" ondragover="noteDragOver(event)" ondrop="noteDrop(event)" ondragend="noteDragEnd(event)" onclick="editNote(${note.id})">
            <div class="no-print" style="position:absolute; top:10px; left:10px; display:flex; gap:6px; align-items:center;">
                <button class="icon-btn" style="color:${note.pinned?'var(--primary)':'var(--text-muted)'};" onclick="event.stopPropagation(); toggleNotePin(${note.id})" title="${currentLang==='ar'?'تثبيت':'Pin'}"><i class="fa-solid fa-thumbtack"></i></button>
                <button class="icon-btn" style="color:var(--text-muted);" onclick="event.stopPropagation(); moveNotePosition(${note.id}, -1)" title="${currentLang==='ar'?'لأعلى':'Up'}"><i class="fa-solid fa-chevron-up"></i></button>
                <button class="icon-btn" style="color:var(--text-muted);" onclick="event.stopPropagation(); moveNotePosition(${note.id}, 1)" title="${currentLang==='ar'?'لأسفل':'Down'}"><i class="fa-solid fa-chevron-down"></i></button>
                <button class="delete-note" style="position:static;" onclick="event.stopPropagation(); deleteNote(${note.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
            ${note.pinned ? `<i class="fa-solid fa-thumbtack" style="position:absolute; top:10px; right:10px; color:var(--primary); font-size:0.8rem;"></i>` : ''}
            <span class="note-date"><i class="fa-solid fa-calendar"></i> ${escapeHtml(note.date)}</span><h3 style="margin-bottom: 0.5rem;">${escapeHtml(note.title)}</h3>${contactHTML}<div class="render-area card-content-collapsed" id="content-note-${note.id}" style="background:none; border:none; padding:0;">${linkify(note.content)}</div><button class="read-more-btn no-print" id="btn-note-${note.id}" onclick="event.stopPropagation(); toggleCardExpand('note-${note.id}')">${currentLang==='ar'?'اقرأ المزيد <i class="fa-solid fa-chevron-down"></i>':'Read more <i class="fa-solid fa-chevron-down"></i>'}</button></div>`; 
    });
    setupReadMoreButtons(container);
}
window.toggleNotePin = id => { let n = notes.find(x => x.id === id); if(n) { n.pinned = !n.pinned; saveAll(); renderNotes(); } };
window.moveNotePosition = (id, direction) => {
    const idx = notes.findIndex(n => n.id === id);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= notes.length) return;
    [notes[idx], notes[newIdx]] = [notes[newIdx], notes[idx]];
    saveAll();
    renderNotes();
};
let draggedNoteId = null;
window.noteDragStart = (e) => { draggedNoteId = parseInt(e.currentTarget.dataset.noteId); e.currentTarget.style.opacity = '0.4'; };
window.noteDragOver = (e) => { e.preventDefault(); };
window.noteDrop = (e) => {
    e.preventDefault();
    const targetId = parseInt(e.currentTarget.dataset.noteId);
    if (draggedNoteId === null || draggedNoteId === targetId) return;
    const fromIdx = notes.findIndex(n => n.id === draggedNoteId);
    const toIdx = notes.findIndex(n => n.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = notes.splice(fromIdx, 1);
    notes.splice(toIdx, 0, moved);
    saveAll();
    renderNotes();
};
window.noteDragEnd = (e) => { e.currentTarget.style.opacity = '1'; draggedNoteId = null; };
document.getElementById('saveNoteBtn').onclick = () => { 
    const t = document.getElementById('noteTitle').value, c = document.getElementById('noteContent').value, d = document.getElementById('noteDate').value, p = document.getElementById('notePhone').value; 
    if(!t && !c) return;
    notes.unshift({ id: Date.now(), title: t.trim() || (currentLang==='ar'?'ملاحظة جديدة':'New Note'), content: c, date: d, phone: p, pinned: false }); 
    saveAll(); 
    document.getElementById('noteModal').classList.remove('show'); 
    stopContinuousDictation(); 
    renderNotes(); 
};
window.deleteNote = id => { notes = notes.filter(n => n.id !== id); saveAll(); renderNotes(); };

window.editNote = (id) => {
    let n = notes.find(x => x.id === id); if(!n) return;
    document.getElementById('editNoteId').value = n.id; 
    document.getElementById('editNoteTitle').value = n.title; 
    document.getElementById('editNoteDate').value = n.date; 
    document.getElementById('editNoteContent').value = n.content; 
    document.getElementById('editNotePhone').value = n.phone || '';
    document.getElementById('editNoteModal').classList.add('show');
};
document.getElementById('updateNoteBtn').onclick = () => {
    let id = parseInt(document.getElementById('editNoteId').value); 
    let n = notes.find(x => x.id === id);
    if(n) { 
        n.title = document.getElementById('editNoteTitle').value.trim(); 
        n.date = document.getElementById('editNoteDate').value; 
        n.content = document.getElementById('editNoteContent').value; 
        n.phone = document.getElementById('editNotePhone').value; 
        saveAll(); 
        renderNotes(); 
        document.getElementById('editNoteModal').classList.remove('show'); 
        stopContinuousDictation(); 
    }
};

// ----------------------------------------
// مكتبة المراجع
// ----------------------------------------
function renderLibrary() { 
    const container = document.getElementById('libraryContainer');
    if(!container) return;

    const searchInput = document.getElementById('libSearchInput');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const viewMode = document.getElementById('libViewModeSelect') ? document.getElementById('libViewModeSelect').value : 'date';
    const catFilterEl = document.getElementById('libCategoryFilterSelect');
    const catFilter = catFilterEl ? catFilterEl.value : 'all';

    // تحديث قائمة التصنيفات المتاحة في الفلتر (لو فيه تصنيفات جديدة اتضافت)
    if (catFilterEl) {
        const cats = [...new Set(library.map(l => l.category || 'عام'))].sort();
        const currentVal = catFilterEl.value;
        catFilterEl.innerHTML = `<option value="all">${i18n[currentLang].lib_cat_all}</option>` + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
        if (cats.includes(currentVal) || currentVal === 'all') catFilterEl.value = currentVal;
    }

    let items = library.slice();

    // فلترة البحث (بتشتغل على العنوان والمحتوى والتصنيف)
    if (query) {
        items = items.filter(l => 
            (l.title || '').toLowerCase().includes(query) || 
            (l.content || '').toLowerCase().includes(query) ||
            (l.category || '').toLowerCase().includes(query)
        );
    }

    const renderCard = l => {
        let contactHTML = l.phone ? `<a href="tel:${escapeHtml(l.phone)}" style="margin-left:10px; color:var(--primary);"><i class="fa-solid fa-phone"></i></a><a href="https://wa.me/${escapeHtml(l.phone).replace(/\+/g,'')}" target="_blank" rel="noopener noreferrer" style="margin-left:10px; color:#25D366;"><i class="fa-brands fa-whatsapp"></i></a>` : '';
        return `<div class="lib-card" onclick="editLib(${l.id})"><button class="icon-btn no-print" style="position:absolute; top:10px; left:10px; color:var(--danger);" onclick="event.stopPropagation(); delLib(${l.id})"><i class="fa-solid fa-trash"></i></button><span class="lib-cat">${escapeHtml(l.category)}</span><h3>${contactHTML}${escapeHtml(l.title)}</h3><div class="render-area card-content-collapsed" id="content-lib-${l.id}">${linkify(l.content)}</div><button class="read-more-btn no-print" id="btn-lib-${l.id}" onclick="event.stopPropagation(); toggleCardExpand('lib-${l.id}')">${currentLang==='ar'?'اقرأ المزيد <i class="fa-solid fa-chevron-down"></i>':'Read more <i class="fa-solid fa-chevron-down"></i>'}</button></div>`;
    };

    const emptyMsg = library.length === 0 
        ? `<p style="text-align:center; color:var(--text-muted); grid-column: 1/-1;">${currentLang==='ar'?'أضف مرجعك الأول.':'Add your first reference.'}</p>`
        : `<p style="text-align:center; color:var(--text-muted); grid-column: 1/-1;">${currentLang==='ar'?'لا توجد نتائج.':'No results.'}</p>`;

    if (viewMode === 'category') {
        let filteredItems = catFilter === 'all' ? items : items.filter(l => (l.category || 'عام') === catFilter);
        if (filteredItems.length === 0) { container.innerHTML = emptyMsg; return; }
        // تجميع حسب التصنيف، وترتيب المجموعات أبجدياً، وكل مجموعة بترتيب الأحدث أولاً
        const groups = {};
        filteredItems.forEach(l => { const c = l.category || 'عام'; (groups[c] = groups[c] || []).push(l); });
        container.innerHTML = Object.keys(groups).sort().map(cat => {
            const catItems = groups[cat].sort((a, b) => b.id - a.id);
            return `<div style="grid-column: 1/-1; font-weight:bold; color:var(--primary); margin:10px 0 5px; padding-bottom:5px; border-bottom:2px solid var(--border-color);">${escapeHtml(cat)}</div>` +
                   `<div style="grid-column: 1/-1; display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:15px;">${catItems.map(renderCard).join('')}</div>`;
        }).join('');
    } else {
        items.sort((a, b) => b.id - a.id); // الأحدث أولاً (id مبني على Date.now())
        container.innerHTML = items.map(renderCard).join('') || emptyMsg;
    }
    setupReadMoreButtons(container);
}
window.onLibViewModeChange = () => {
    const viewMode = document.getElementById('libViewModeSelect').value;
    const catFilterEl = document.getElementById('libCategoryFilterSelect');
    if (catFilterEl) catFilterEl.style.display = viewMode === 'category' ? '' : 'none';
    renderLibrary();
};
document.getElementById('saveLibBtn').onclick = () => { 
    let t = document.getElementById('libTitle').value, c = document.getElementById('libCategory').value, text = document.getElementById('libContent').value, p = document.getElementById('libPhone').value; 
    if(!t || !t.trim()) return;
    library.push({ id: Date.now(), title: t.trim(), category: c || 'عام', content: text, phone: p }); 
    saveAll(); 
    document.getElementById('libraryModal').classList.remove('show'); 
    stopContinuousDictation(); 
    renderLibrary(); 
};
window.delLib = id => { library = library.filter(l => l.id !== id); saveAll(); renderLibrary(); };

window.editLib = (id) => {
    let l = library.find(x => x.id === id); if(!l) return;
    document.getElementById('editLibId').value = l.id; 
    document.getElementById('editLibTitle').value = l.title; 
    document.getElementById('editLibCategory').value = l.category; 
    document.getElementById('editLibContent').value = l.content; 
    document.getElementById('editLibPhone').value = l.phone || '';
    document.getElementById('editLibModal').classList.add('show');
};
document.getElementById('updateLibBtn').onclick = () => {
    let id = parseInt(document.getElementById('editLibId').value); 
    let l = library.find(x => x.id === id);
    if(l) { 
        l.title = document.getElementById('editLibTitle').value.trim(); 
        l.category = document.getElementById('editLibCategory').value; 
        l.content = document.getElementById('editLibContent').value; 
        l.phone = document.getElementById('editLibPhone').value; 
        saveAll(); 
        renderLibrary(); 
        document.getElementById('editLibModal').classList.remove('show'); 
        stopContinuousDictation(); 
    }
};

// ----------------------------------------
// خطة الشهر (محصنة 100% برمجياً)
// ----------------------------------------
function renderMonthly() { 
    const container = document.getElementById('monthlyContainer'); 
    if(!container) return;
    container.innerHTML = ''; 
    const mNames = currentLang === 'ar' ? monthNamesAr : monthNamesEn; 
    document.getElementById('monthlyTitle').innerText = `${mNames[currentMonthView]} ${currentYearView}`; 
    const daysInMonth = new Date(currentYearView, currentMonthView + 1, 0).getDate(); 
    let dayText = currentLang === 'ar' ? 'اليوم:' : 'Day:'; 
    let placeholderText = currentLang === 'ar' ? 'اكتب خطتك (الروابط تعمل تلقائياً)' : 'Type your plan (links work automatically)'; 
    let phonePlaceholder = currentLang === 'ar' ? 'رقم الهاتف...' : 'Phone...';
    
    const todayObj = new Date();
    const isCurrentMonth = (todayObj.getMonth() === currentMonthView && todayObj.getFullYear() === currentYearView);
    const todayDate = todayObj.getDate();

    for(let i = 1; i <= daysInMonth; i++) { 
        let storageKey = `PlannerMonthData_${currentYearView}_${currentMonthView}_${i}`; 
        let phoneKey = storageKey + '_phone'; 
        
        let savedText = localStorage.getItem(storageKey) || ""; 
        let savedPhone = localStorage.getItem(phoneKey) || "";
        
        const dayDiv = document.createElement('div'); 
        dayDiv.className = 'month-day-card'; 
        
        if (isCurrentMonth && i === todayDate) {
            dayDiv.id = 'todayMonthCard';
            dayDiv.style.border = '2px solid var(--primary)';
        }

        let isTodayText = (isCurrentMonth && i === todayDate) ? (currentLang === 'ar' ? '(اليوم)' : '(Today)') : '';

        let contactIcons = savedPhone ? `
            <div style="display:inline-flex; gap:10px; margin-right:10px;">
                <a href="tel:${escapeHtml(savedPhone)}" class="no-print" style="color:var(--primary); font-size:1.1rem;"><i class="fa-solid fa-phone"></i></a>
                <a href="https://wa.me/${escapeHtml(savedPhone).replace(/\+/g,'')}" target="_blank" rel="noopener noreferrer" class="no-print" style="color:#25D366; font-size:1.1rem;"><i class="fa-brands fa-whatsapp"></i></a>
            </div>` : '';

        // إنشاء العناصر بصورة آمنة لمنع كسر الـ textarea والـ attributes
        dayDiv.innerHTML = `
            <div class="month-day-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>${dayText} ${i} ${mNames[currentMonthView]} <b style="color:var(--primary);">${isTodayText}</b></span>
                ${contactIcons}
            </div>
            <textarea class="multi-line-input no-print" rows="3" data-key="${storageKey}" data-day="${i}" placeholder="${placeholderText}"></textarea>
            <input type="tel" class="no-print" data-phone-key="${phoneKey}" placeholder="${phonePlaceholder}" 
                style="width:100%; margin-top:5px; padding:8px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:0.85rem;">
            <div class="render-area">${linkify(savedText)}</div>`; 
            
        // تعيين القيم برمجياً لحصانة تامة ضد XSS
        const ta = dayDiv.querySelector('textarea');
        const phoneInp = dayDiv.querySelector('input[type="tel"]');
        if(ta) ta.value = savedText;
        if(phoneInp) phoneInp.value = savedPhone;

        container.appendChild(dayDiv); 
    } 
    
    document.querySelectorAll('.multi-line-input').forEach(ta => { 
        ta.oninput = e => { 
            e.target.nextElementSibling.nextElementSibling.innerHTML = linkify(e.target.value); 
        }; 
        ta.onchange = e => { 
            let newText = e.target.value;
            localStorage.setItem(e.target.dataset.key, newText); 

            let dayNum = parseInt(e.target.getAttribute('data-day'));
            let dStr = String(dayNum).padStart(2, '0');
            let mStr = String(currentMonthView + 1).padStart(2, '0');
            let targetDateStr = `${currentYearView}-${mStr}-${dStr}`;

            let existingTaskIndex = tasks.findIndex(t => t.date === targetDateStr && t.isMonthly === true);

            if (newText.trim() === "") {
                if (existingTaskIndex !== -1) tasks.splice(existingTaskIndex, 1);
            } else {
                let taskLabel = (currentLang === 'ar' ? '📌 خطة الشهر: ' : '📌 Month Plan: ') + newText.trim();
                if (existingTaskIndex !== -1) {
                    tasks[existingTaskIndex].title = taskLabel;
                } else {
                    tasks.push({ id: Date.now(), title: taskLabel, date: targetDateStr, hour: 6, completed: false, isMonthly: true });
                }
            }
            saveAll(); 
            if (typeof currentDailyDate !== 'undefined' && currentDailyDate === targetDateStr) renderDaily();
        }; 
    }); 

    document.querySelectorAll('input[data-phone-key]').forEach(inp => {
        inp.onchange = e => {
            localStorage.setItem(e.target.dataset.phoneKey, e.target.value);
            renderMonthly();
        };
    });

    if (isCurrentMonth && shouldScrollToToday) {
        shouldScrollToToday = false;
        setTimeout(() => {
            let todayCard = document.getElementById('todayMonthCard');
            if (todayCard) todayCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
}

// ----------------------------------------
// مؤقت التركيز
// ----------------------------------------
let pomTimer, targetTime = 0, pomTimeLeft = 25 * 60, isPomRunning = false, pomMode = 'work', workDuration = 25;

function initPomodoro() { 
    const d = document.getElementById('timerDisplay'); 
    const wd = document.getElementById('pomWorkDuration'); 
    const alarm = document.getElementById('pomAlarmSound'); 
    const stopBtn = document.getElementById('stopAlarmBtn'); 
    const startBtn = document.getElementById('pomStart'); 
    const pauseBtn = document.getElementById('pomPause');

    const unlockAudio = () => {
        if(alarm) {
            alarm.load(); 
            alarm.volume = 1.0;
            alarm.play().then(() => {
                alarm.pause();
                alarm.currentTime = 0;
            }).catch(() => {});
        }
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });

    const updateTimeDisplay = () => { 
        if(d) d.innerText = `${Math.floor(pomTimeLeft/60).toString().padStart(2,'0')}:${(pomTimeLeft%60).toString().padStart(2,'0')}`; 
    }; 
    
    document.getElementById('pomMinus').onclick = () => { if(!isPomRunning && workDuration > 15) { workDuration -= 5; if(pomMode==='work'){ pomTimeLeft = workDuration*60; updateTimeDisplay();} if(wd) wd.innerText = workDuration; } }; 
    document.getElementById('pomPlus').onclick = () => { if(!isPomRunning && workDuration < 60) { workDuration += 5; if(pomMode==='work'){ pomTimeLeft = workDuration*60; updateTimeDisplay();} if(wd) wd.innerText = workDuration; } }; 
    
    const setMode = (m, mins) => { 
        clearInterval(pomTimer); isPomRunning=false; pomMode=m; pomTimeLeft=mins*60; updateTimeDisplay(); 
        document.getElementById('pomWork').classList.toggle('active', m==='work'); 
        document.getElementById('pomBreak').classList.toggle('active', m==='break'); 
        if(startBtn) startBtn.style.display = 'inline-flex'; 
        if(pauseBtn) pauseBtn.style.display = 'inline-flex'; 
        if(stopBtn) stopBtn.style.display = 'none'; 
        if(alarm) { alarm.pause(); alarm.currentTime = 0; }
    }; 
    
    document.getElementById('pomWork').onclick = () => setMode('work', workDuration); 
    document.getElementById('pomBreak').onclick = () => setMode('break', 5); 
    
    startBtn.onclick = () => { 
        if(isPomRunning) return;
        const tomato = document.getElementById('tomatoIcon'); if(tomato) tomato.classList.add('running'); 
        if(alarm) { alarm.play().then(()=>alarm.pause()).catch(()=>{}); }
        
        isPomRunning = true; 
        targetTime = Date.now() + (pomTimeLeft * 1000); 
        pomTimer = setInterval(() => { 
            let remaining = Math.round((targetTime - Date.now()) / 1000); 
            if(remaining <= 0) { 
                clearInterval(pomTimer); 
                isPomRunning=false; 
                pomTimeLeft=0; 
                updateTimeDisplay(); 
                if(tomato) tomato.classList.remove('running');
                
                if(window.logPomodoroSession) window.logPomodoroSession(pomMode, pomMode === 'work' ? workDuration : 5);
                if(alarm) { alarm.currentTime = 0; alarm.play().catch(e=>console.log("Audio play blocked:", e)); }
                
                startBtn.style.display = 'none'; 
                pauseBtn.style.display = 'none'; 
                stopBtn.style.display = 'inline-flex'; 
            } else { 
                pomTimeLeft = remaining; 
                updateTimeDisplay(); 
            } 
        }, 1000); 
    }; 
    
    pauseBtn.onclick = () => { clearInterval(pomTimer); isPomRunning=false; const tomato = document.getElementById('tomatoIcon'); if(tomato) tomato.classList.remove('running'); }; 
    document.getElementById('pomReset').onclick = () => setMode(pomMode, pomMode==='work'?workDuration:5); 
    stopBtn.onclick = () => { 
        if(alarm){ alarm.pause(); alarm.currentTime = 0; }
        const tomato = document.getElementById('tomatoIcon'); if(tomato) tomato.classList.remove('running'); 
        setMode(pomMode === 'work' ? 'break' : 'work', pomMode === 'work' ? 5 : workDuration); 
    };
    
    updateTimeDisplay(); 
}

// ----------------------------------------
// المشاريع (Kanban)
// ----------------------------------------
function renderKanban() {
    // FLIP: نلقط مواضع الكروت الحالية قبل ما نعيد الرسم، عشان نحركها بسلاسة بدل القفزة المفاجئة
    const firstRects = {};
    document.querySelectorAll('.kb-card[data-kb-id]').forEach(el => {
        firstRects[el.dataset.kbId] = el.getBoundingClientRect();
    });

    ['todo', 'inprogress', 'done'].forEach(col => {
        const container = document.querySelector(`.kanban-items[data-status="${col}"]`);
        if(!container) return;

        // المثبتة (pinned) تظهر أولاً في نفس العمود
        const sortedItems = [...kanbanTasks[col]].sort((a, b) => (b.pinned?1:0) - (a.pinned?1:0));
        
        container.innerHTML = sortedItems.map(i => {
            let subs = i.subtasks || [];
            let subsHTML = subs.map((sub, idx) => `
                <div style="display:flex; align-items:center; gap:8px; margin-top:8px; padding: 5px; background: var(--bg-main); border-radius: 4px; border: 1px solid var(--border-color);">
                    <input type="checkbox" ${sub.done ? 'checked' : ''} onchange="toggleSubtask(${i.id}, '${col}', ${idx})" style="cursor:pointer; width: 15px; height: 15px;">
                    <span style="flex:1; text-decoration: ${sub.done ? 'line-through' : 'none'}; color: ${sub.done ? 'var(--text-muted)' : 'var(--text-main)'}; font-size: 0.9rem; white-space: pre-wrap; word-break: break-word;">${escapeHtml(sub.text)}</span>
                    <button onclick="editSubtask(${i.id}, '${col}', ${idx})" class="icon-btn no-print" style="font-size:0.8rem; color:var(--text-muted);" title="تعديل"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="delSubtask(${i.id}, '${col}', ${idx})" class="icon-btn no-print" style="font-size:0.8rem; color:var(--danger);" title="حذف"><i class="fa-solid fa-trash"></i></button>
                </div>
            `).join('');

            return `<div class="kb-card" draggable="true" data-kb-id="${i.id}" data-kb-col="${col}" ondragstart="drag(event, ${i.id}, '${col}')" ondragover="allowDrop(event)" ondrop="dropOnCard(event, ${i.id}, '${col}')" style="cursor:grab; border-right: 4px solid var(--primary); position:relative;">
                ${i.pinned ? `<i class="fa-solid fa-thumbtack" style="position:absolute; top:8px; left:8px; color:var(--primary); font-size:0.8rem;"></i>` : ''}
                <div style="display:flex; justify-content:space-between; align-items: flex-start; margin-bottom:5px;">
                    <strong style="font-size: 1rem; flex:1;">${escapeHtml(i.text)}</strong>
                    <div style="display:flex; gap:8px; align-items: center; flex-wrap:wrap;">
                        ${i.phone ? `<a href="https://wa.me/${escapeHtml(i.phone).replace(/\+/g,'')}" target="_blank" rel="noopener noreferrer" class="no-print" style="color:#25D366; font-size:1.2rem;"><i class="fa-brands fa-whatsapp"></i></a>` : ''}
                        <button onclick="toggleKbPin(${i.id}, '${col}')" class="icon-btn no-print" style="color:${i.pinned?'var(--primary)':'var(--text-main)'};" title="${currentLang==='ar'?'تثبيت':'Pin'}"><i class="fa-solid fa-thumbtack"></i></button>
                        <button onclick="moveKbPosition(${i.id}, '${col}', -1)" class="icon-btn no-print" style="color:var(--text-main);" title="${currentLang==='ar'?'لأعلى':'Up'}"><i class="fa-solid fa-arrow-up"></i></button>
                        <button onclick="moveKbPosition(${i.id}, '${col}', 1)" class="icon-btn no-print" style="color:var(--text-main);" title="${currentLang==='ar'?'لأسفل':'Down'}"><i class="fa-solid fa-arrow-down"></i></button>
                        <button onclick="moveKb(${i.id}, '${col}', -1)" class="icon-btn no-print" style="color:var(--text-main);"><i class="fa-solid fa-arrow-right"></i></button>
                        <button onclick="addSubtask(${i.id}, '${col}')" class="icon-btn no-print" style="color:var(--primary);"><i class="fa-solid fa-plus"></i></button>
                        <button onclick="editKb(${i.id}, '${col}')" class="icon-btn no-print" style="color:var(--text-muted);"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="delKb(${i.id}, '${col}')" class="icon-btn no-print" style="color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
                        <button onclick="moveKb(${i.id}, '${col}', 1)" class="icon-btn no-print" style="color:var(--text-main);"><i class="fa-solid fa-arrow-left"></i></button>
                    </div>
                </div>
                <div style="margin-top: 10px;">${subsHTML}</div>
            </div>`;
        }).join('');
    });

    // FLIP: نحرك كل كارت من مكانه القديم لمكانه الجديد بانتقال ناعم بدل القفزة المفاجئة
    document.querySelectorAll('.kb-card[data-kb-id]').forEach(el => {
        const first = firstRects[el.dataset.kbId];
        if (!first) return;
        const last = el.getBoundingClientRect();
        const dx = first.left - last.left;
        const dy = first.top - last.top;
        if (dx || dy) {
            el.style.transition = 'none';
            el.style.transform = `translate(${dx}px, ${dy}px)`;
            requestAnimationFrame(() => {
                el.style.transition = 'transform 0.3s ease';
                el.style.transform = '';
            });
        }
    });
}

window.addKanbanItem = () => { 
    const inp = document.getElementById('newKbItem'); 
    if(inp && inp.value.trim()) { 
        kanbanTasks.todo.push({id: Date.now(), text: inp.value.trim(), subtasks: [], pinned: false}); 
        inp.value = ''; saveAll(); renderKanban(); 
    } 
};
window.delKb = (id, c) => { kanbanTasks[c] = kanbanTasks[c].filter(i => i.id !== id); saveAll(); renderKanban(); };
window.moveKb = (id, c, d) => { 
    const cols=['todo','inprogress','done']; 
    let idx=cols.indexOf(c), n=idx+d; 
    if(n>=0 && n<cols.length){ 
        let i=kanbanTasks[c].find(x=>x.id===id); 
        kanbanTasks[c]=kanbanTasks[c].filter(x=>x.id!==id); 
        kanbanTasks[cols[n]].push(i); saveAll(); renderKanban(); 
    } 
};
window.moveKbPosition = (id, col, direction) => {
    const idx = kanbanTasks[col].findIndex(x => x.id === id);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= kanbanTasks[col].length) return;
    [kanbanTasks[col][idx], kanbanTasks[col][newIdx]] = [kanbanTasks[col][newIdx], kanbanTasks[col][idx]];
    saveAll();
    renderKanban();
};
window.toggleKbPin = (id, col) => {
    let i = kanbanTasks[col].find(x => x.id === id);
    if (i) { i.pinned = !i.pinned; saveAll(); renderKanban(); }
};

window.drag = (ev, id, col) => { ev.dataTransfer.setData("id", id); ev.dataTransfer.setData("col", col); };
window.allowDrop = ev => ev.preventDefault();
window.drop = ev => { 
    ev.preventDefault(); 
    let tc = ev.target.closest('.kanban-items').getAttribute('data-status');
    let id = parseInt(ev.dataTransfer.getData("id"));
    let sc = ev.dataTransfer.getData("col");
    if(sc && tc && sc!==tc){ 
        let i=kanbanTasks[sc].find(x=>x.id===id); 
        kanbanTasks[sc]=kanbanTasks[sc].filter(x=>x.id!==id); 
        kanbanTasks[tc].push(i); saveAll(); renderKanban(); 
    } 
};
window.dropOnCard = (ev, targetId, targetCol) => {
    ev.preventDefault();
    ev.stopPropagation(); // منع وصول الحدث لـ drop() بتاع العمود، عشان نتحكم في الموضع بالظبط
    let id = parseInt(ev.dataTransfer.getData("id"));
    let sc = ev.dataTransfer.getData("col");
    if (!sc || id === targetId) return;
    let item = kanbanTasks[sc].find(x => x.id === id);
    if (!item) return;
    kanbanTasks[sc] = kanbanTasks[sc].filter(x => x.id !== id);
    let targetIdx = kanbanTasks[targetCol].findIndex(x => x.id === targetId);
    if (targetIdx === -1) targetIdx = kanbanTasks[targetCol].length;
    kanbanTasks[targetCol].splice(targetIdx, 0, item);
    saveAll();
    renderKanban();
};

window.editKb = (id, col) => { 
    let k = kanbanTasks[col].find(x => x.id === id); if(!k) return; 
    document.getElementById('editKbId').value = k.id; 
    document.getElementById('editKbCol').value = col; 
    document.getElementById('editKbText').value = k.text; 
    document.getElementById('editKbModal').classList.add('show'); 
};
document.getElementById('updateKbBtn').onclick = () => { 
    let id = parseInt(document.getElementById('editKbId').value); 
    let col = document.getElementById('editKbCol').value; 
    let k = kanbanTasks[col].find(x => x.id === id); 
    let newTxt = document.getElementById('editKbText').value;
    if(k && newTxt.trim()) { 
        k.text = newTxt.trim(); 
        saveAll(); renderKanban(); 
        document.getElementById('editKbModal').classList.remove('show'); 
    } 
};

window.addSubtask = (id, col) => {
    let text = prompt(currentLang === 'ar' ? 'أدخل اسم القسم الفرعي:' : 'Enter subtask name:');
    if(text && text.trim()) {
        let task = kanbanTasks[col].find(t => t.id === id);
        if(!task.subtasks) task.subtasks = [];
        task.subtasks.push({text: text.trim(), done: false});
        saveAll(); renderKanban();
    }
};
window.toggleSubtask = (id, col, subIdx) => {
    let task = kanbanTasks[col].find(t => t.id === id);
    if(task && task.subtasks[subIdx]) {
        task.subtasks[subIdx].done = !task.subtasks[subIdx].done;
        saveAll(); renderKanban();
    }
};
window.editSubtask = (id, col, subIdx) => {
    let task = kanbanTasks[col].find(t => t.id === id);
    if(!task || !task.subtasks[subIdx]) return;
    let oldText = task.subtasks[subIdx].text;
    let newText = prompt(currentLang === 'ar' ? 'تعديل القسم الفرعي:' : 'Edit subtask:', oldText);
    if(newText && newText.trim()) {
        task.subtasks[subIdx].text = newText.trim();
        saveAll(); renderKanban();
    }
};
window.delSubtask = (id, col, subIdx) => {
    if(confirm(currentLang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) {
        let task = kanbanTasks[col].find(t => t.id === id);
        if(task) {
            task.subtasks.splice(subIdx, 1);
            saveAll(); renderKanban();
        }
    }
};

// ----------------------------------------
// لوحة التحكم والإحصائيات
// ----------------------------------------
function renderDashboard() { 
    let dashClearedStr = localStorage.getItem('fp_dash_cleared');
    let activeTasks = (dashClearedStr === currentTodayStr) ? [] : tasks.filter(t => t.date === currentTodayStr); 
    let completed = activeTasks.filter(t => t.completed).length;
    let dtEl = document.getElementById('dashTasks');
    if(dtEl) dtEl.innerText = `${completed} / ${activeTasks.length}`;
    
    let tPercent = activeTasks.length > 0 ? (completed / activeTasks.length) * 100 : 0;
    let fillT = document.getElementById('fillTasks');
    if(fillT) fillT.setAttribute('stroke-dasharray', `${tPercent}, 100`);
    
    let todayWorkBlocks = pomodoroLog.filter(log => log.date === currentTodayStr && log.type === 'work').length;
    const dashPomEl = document.getElementById('dashPomodoro');
    if(dashPomEl) dashPomEl.innerText = todayWorkBlocks; 

    let pPercent = todayWorkBlocks >= 8 ? 100 : (todayWorkBlocks / 8) * 100;
    let fillP = document.getElementById('fillPomodoro');
    if(fillP) fillP.setAttribute('stroke-dasharray', `${pPercent}, 100`);

    let tHC = 0, dHC = 0;
    habits.forEach(h => { 
        for(let i=1; i<=30; i++) { 
            tHC++; 
            if(h.days && h.days[`${currentYearView}-${currentMonthView}-${i}`]) dHC++; 
        } 
    });
    let dhEl = document.getElementById('dashHabits');
    let habitPercentValue = tHC === 0 ? 0 : Math.round((dHC/tHC)*100);
    if(dhEl) dhEl.innerText = `${habitPercentValue}%`;
    
    let fillH = document.getElementById('fillHabits');
    if(fillH) fillH.setAttribute('stroke-dasharray', `${habitPercentValue}, 100`);

    let inc = 0, exp = 0, sav = 0;
    finances.forEach(f => {
        let amt = Number(f.amount) || 0;
        if(f.type === 'income') inc += amt;
        else if(f.type === 'expense') exp += amt;
        else if(f.type === 'save') sav += amt;
        else if(f.type === 'withdraw') sav -= amt;
    });
    let balance = inc - exp - sav;
    let dbEl = document.getElementById('dashBalance');
    if(dbEl) dbEl.innerText = `${balance}`; 

    let bPercent = inc > 0 ? Math.max(0, (balance / inc) * 100) : (balance > 0 ? 100 : 0);
    let fillB = document.getElementById('fillFinance');
    if(fillB) fillB.setAttribute('stroke-dasharray', `${bPercent}, 100`);

    let resetDate = localStorage.getItem('fp_stats_reset') || "2000-01-01";
    const canvasEl = document.getElementById('tasksChart'); 
    if(!canvasEl) return; 
    
    const ctx = canvasEl.getContext('2d');
    if(typeof myChart !== 'undefined' && myChart !== null) { myChart.destroy(); }
    
    let labels = []; let dataDone = []; let dataPending = [];
    for(let i=6; i>=0; i--) { 
        let d = new Date(); d.setDate(d.getDate() - i); 
        let dateStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]; 
        labels.push(d.toLocaleDateString(currentLang==='ar'?'ar-EG':'en-US', {weekday: 'short'}));
        let dayTasks = tasks.filter(t => t.date === dateStr && t.date >= resetDate); 
        dataDone.push(dayTasks.filter(t => t.completed).length); 
        dataPending.push(dayTasks.filter(t => !t.completed).length);
    } 
    
    let primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#25D366';
    myChart = new Chart(ctx, { 
        type: 'bar', 
        data: { labels: labels, datasets: [ { label: i18n[currentLang].chart_done, data: dataDone, backgroundColor: primaryColor }, { label: i18n[currentLang].chart_pend, data: dataPending, backgroundColor: '#ef4444' } ] }, 
        options: { responsive: true, scales: { y: { beginAtZero: true, ticks: {stepSize: 1} } } } 
    });
}

// ----------------------------------------
// المتتبع المالي ومحفظة الاستثمار
// ----------------------------------------
let finChartInstance = null; 

function renderFinance() { 
    const container = document.getElementById('financeContainer'); 
    let inc = 0, exp = 0, sav = 0;
    
    const budgetTitle = document.getElementById('budgetTitleText');
    const btnSetBudget = document.getElementById('btnSetBudget');
    const searchInput = document.getElementById('financeSearchInput');
    const monthFilter = document.getElementById('financeMonthFilter');

    if(budgetTitle && btnSetBudget) {
        budgetTitle.innerText = currentLang === 'ar' ? 'الميزانية الشهرية' : 'Monthly Budget';
        btnSetBudget.innerText = currentLang === 'ar' ? 'تحديد الميزانية' : 'Set Budget';
    }
    if(searchInput && monthFilter) {
        searchInput.placeholder = currentLang === 'ar' ? 'بحث عن معاملة...' : 'Search transactions...';
        monthFilter.options[0].text = currentLang === 'ar' ? 'كل الأشهر' : 'All Months';
        monthFilter.options[1].text = currentLang === 'ar' ? 'هذا الشهر' : 'This Month';
        monthFilter.options[2].text = currentLang === 'ar' ? 'الشهر الماضي' : 'Last Month';
    }

    let searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
    let filterValue = monthFilter ? monthFilter.value : 'all';
    
    let currentDate = new Date();
    let currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    let lastMonthDate = new Date(); lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    let lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    let filteredFinances = finances.filter(f => {
        let matchesSearch = f.desc.toLowerCase().includes(searchQuery) || (f.category && f.category.toLowerCase().includes(searchQuery));
        let matchesMonth = true;
        if(filterValue === 'current') matchesMonth = f.date.startsWith(currentMonthStr);
        else if(filterValue === 'last') matchesMonth = f.date.startsWith(lastMonthStr);
        return matchesSearch && matchesMonth;
    });

    let html = filteredFinances.sort((a,b) => new Date(b.date) - new Date(a.date)).map(f => { 
        let amtNum = Number(f.amount) || 0;
        if(f.type === 'income') inc += amtNum; 
        else if(f.type === 'expense') exp += amtNum; 
        else if(f.type === 'save') sav += amtNum;
        else if(f.type === 'withdraw') sav -= amtNum;
        
        let icon = f.type === 'income' ? '<i class="fa-solid fa-arrow-trend-up"></i>' : 
                   f.type === 'expense' ? '<i class="fa-solid fa-arrow-trend-down"></i>' : 
                   f.type === 'save' ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-lock-open"></i>';
                   
        let bgStyle = f.type === 'income' ? 'border: 1px solid var(--success); background-color: rgba(16, 185, 129, 0.05);' : 
                      f.type === 'expense' ? 'border: 1px solid var(--danger); background-color: rgba(239, 68, 68, 0.05);' : 
                      f.type === 'save' ? 'border: 1px solid #3b82f6; background-color: rgba(59, 130, 246, 0.05);' : 
                      'border: 1px solid #f59e0b; background-color: rgba(245, 158, 11, 0.05);';
        
        let catLabel = f.category || '';
        if (catLabel === 'other') catLabel = i18n[currentLang].cat_other;
        else if (catLabel === 'food') catLabel = i18n[currentLang].cat_food;
        else if (catLabel === 'transport') catLabel = i18n[currentLang].cat_trans;
        else if (catLabel === 'shopping') catLabel = i18n[currentLang].cat_shop;
        else if (catLabel === 'bills') catLabel = i18n[currentLang].cat_bills;
        else if (catLabel === 'work') catLabel = i18n[currentLang].cat_work;
        else if (catLabel === 'fun') catLabel = i18n[currentLang].cat_fun;
        else if (catLabel === 'gold') catLabel = i18n[currentLang].cat_gold;
        else if (catLabel === 'stocks') catLabel = i18n[currentLang].cat_stocks;
        else if (catLabel === 'deposit') catLabel = i18n[currentLang].cat_deposit;
        else if (catLabel === 'emergency') catLabel = i18n[currentLang].cat_emergency;

        let catBadge = catLabel ? `<span style="background:var(--bg-color); padding:3px 8px; border-radius:6px; font-size:0.75rem; margin-right:8px; border:1px solid var(--border-color);">${escapeHtml(catLabel)}</span>` : '';
        
        return `<div class="fin-item" style="cursor:pointer; transition: all 0.3s ease; ${bgStyle}" onclick="editFin(${f.id})">
            <div>
                <small>${escapeHtml(f.date)}</small><br>
                <b style="color: var(--text-main);">${escapeHtml(f.desc)}</b> ${catBadge}
            </div>
            <div style="display:flex; align-items:center; gap:15px;">
                <span class="fin-amt" style="color: inherit; font-weight: bold; font-size: 1.1rem;">${icon} ${amtNum}</span>
                <button class="icon-btn no-print" onclick="event.stopPropagation(); delFin(${f.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`; 
    }).join('');
    
    let netBalance = inc - exp - sav;
    let netWorth = inc - exp;

    document.getElementById('totalIncome').innerText = inc; 
    document.getElementById('totalExpense').innerText = exp; 
    if(document.getElementById('totalSavings')) document.getElementById('totalSavings').innerText = sav;
    if(document.getElementById('netBalance')) document.getElementById('netBalance').innerText = netBalance; 
    if(document.getElementById('netWorth')) document.getElementById('netWorth').innerText = netWorth; 

    if(container) container.innerHTML = html || `<p style="text-align:center; color:var(--text-muted);">${currentLang==='ar'?'لا توجد معاملات مطابقة.':'No transactions found.'}</p>`; 

    const ctx = document.getElementById('financeChart');
    if(ctx && window.Chart) {
        if(finChartInstance) finChartInstance.destroy();
        
        let dataArr = (inc === 0 && exp === 0 && sav === 0) ? [1] : [exp, Math.max(0, sav), Math.max(0, netBalance)];
        let bgColors = (inc === 0 && exp === 0 && sav === 0) ? ['#e5e7eb'] : ['#ef4444', '#3b82f6', '#10b981'];
        let labelsArr = (inc === 0 && exp === 0 && sav === 0) ? 
                        (currentLang === 'ar' ? ['لا توجد بيانات'] : ['No Data']) : 
                        (currentLang === 'ar' ? ['المصروفات', 'المدخرات', 'المتاح للصرف'] : ['Expenses', 'Savings', 'Available']);

        finChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: labelsArr, datasets: [{ data: dataArr, backgroundColor: bgColors, borderWidth: 0, hoverOffset: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, circumference: 180, rotation: -90, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { color: '#6b7280', font: {family: 'Inter'} } } } }
        });
    }

    let budgetLimit = parseFloat(localStorage.getItem('fp_monthly_budget')) || 0;
    let budgetBar = document.getElementById('budgetProgressBar');
    let budgetSpentText = document.getElementById('budgetSpentText');
    let budgetLimitText = document.getElementById('budgetLimitText');
    let budgetAlert = document.getElementById('budgetAlertText');

    if(budgetBar && budgetSpentText && budgetLimitText) {
        budgetLimitText.innerText = budgetLimit > 0 ? (currentLang === 'ar' ? `الميزانية: ${budgetLimit}` : `Budget: ${budgetLimit}`) : (currentLang === 'ar' ? 'لم يتم التحديد' : 'Not set');
        budgetSpentText.innerText = currentLang === 'ar' ? `تم صرف: ${exp}` : `Spent: ${exp}`;

        if(budgetLimit > 0) {
            let percent = (exp / budgetLimit) * 100;
            if(percent > 100) percent = 100;
            budgetBar.style.width = percent + '%';
            
            if(percent < 75) {
                budgetBar.style.backgroundColor = 'var(--success)';
                if(budgetAlert) budgetAlert.style.display = 'none';
            } else if(percent < 90) {
                budgetBar.style.backgroundColor = 'var(--warning)';
                if(budgetAlert) { budgetAlert.style.display = 'block'; budgetAlert.style.color = 'var(--warning)'; budgetAlert.innerText = currentLang === 'ar' ? '⚠️ انتبه: اقتربت من تخطي الميزانية!' : '⚠️ Alert: Nearing budget limit!'; }
            } else {
                budgetBar.style.backgroundColor = 'var(--danger)';
                if(budgetAlert) { budgetAlert.style.display = 'block'; budgetAlert.style.color = 'var(--danger)'; budgetAlert.innerText = currentLang === 'ar' ? '🚨 تحذير: لقد تخطيت الميزانية الآمنة!' : '🚨 Warning: Budget limit exceeded!'; }
            }
        } else {
            budgetBar.style.width = '0%';
            if(budgetAlert) budgetAlert.style.display = 'none';
        }
    }
}

window.setMonthlyBudget = () => {
    let currentBudget = localStorage.getItem('fp_monthly_budget') || '';
    let msg = currentLang === 'ar' ? 'أدخل الحد الأقصى للمصروفات هذا الشهر:' : 'Enter your maximum monthly budget limit:';
    let val = prompt(msg, currentBudget);
    if(val !== null && val.trim() !== '' && !isNaN(val)) { 
        localStorage.setItem('fp_monthly_budget', val); 
        renderFinance(); 
    } else if (val !== null && val.trim() === '') { 
        localStorage.removeItem('fp_monthly_budget'); 
        renderFinance(); 
    }
};

document.getElementById('saveFinBtn').onclick = () => { 
    let desc = document.getElementById('finDesc').value; 
    let amt = document.getElementById('finAmount').value;
    let catEl = document.getElementById('finCategory');
    let cat = catEl ? catEl.value : 'other';

    if(!desc || !amt || isNaN(amt)) return; 
    finances.push({ 
        id: Date.now(), 
        desc: desc.trim(), 
        amount: parseFloat(amt), 
        type: document.getElementById('finType').value, 
        category: cat, 
        date: document.getElementById('finDate').value 
    }); 
    saveAll(); 
    document.getElementById('financeModal').classList.remove('show'); 
    stopContinuousDictation(); 
    renderFinance(); 
    renderDashboard();
};

window.editFin = (id) => { 
    let f = finances.find(x => x.id === id); 
    if(!f) return; 
    document.getElementById('editFinId').value = f.id; 
    document.getElementById('editFinDesc').value = f.desc; 
    document.getElementById('editFinAmount').value = f.amount; 
    document.getElementById('editFinType').value = f.type; 
    window.updateFinCategories('editFinType', 'editFinCategory');
    let catEl = document.getElementById('editFinCategory');
    if(catEl) catEl.value = f.category || 'other';
    document.getElementById('editFinDate').value = f.date; 
    document.getElementById('editFinModal').classList.add('show');
    setTimeout(() => { if(window.updateFinColor) updateFinColor('editFinType', 'editFinAmount'); }, 50); 
};

document.getElementById('updateFinBtn').onclick = () => { 
    let id = parseInt(document.getElementById('editFinId').value);
    let desc = document.getElementById('editFinDesc').value; 
    let amt = document.getElementById('editFinAmount').value; 
    if(!desc || !amt || isNaN(amt)) return; 
    
    let f = finances.find(x => x.id === id);
    if(f) { 
        f.desc = desc.trim(); 
        f.amount = parseFloat(amt); 
        f.type = document.getElementById('editFinType').value; 
        let catEl = document.getElementById('editFinCategory');
        if(catEl) f.category = catEl.value;
        f.date = document.getElementById('editFinDate').value; 
        saveAll(); 
        renderFinance(); 
        renderDashboard(); 
        document.getElementById('editFinModal').classList.remove('show'); 
        stopContinuousDictation(); 
    } 
};

window.delFin = id => { 
    finances = finances.filter(f => f.id !== id); 
    saveAll(); 
    renderFinance(); 
    renderDashboard(); 
};

// ----------------------------------------
// متتبع العادات
// ----------------------------------------
function renderHabits() { 
    let dim = new Date(currentYearView, currentMonthView + 1, 0).getDate(); 
    let habitText = currentLang === 'ar' ? 'العادة' : 'Habit'; 
    let html = `<table class="habit-table"><thead><tr><th>${habitText}</th>`; 
    for(let i=1; i<=dim; i++) html += `<th>${i}</th>`; 
    html += `</tr></thead><tbody>`; 
    habits.forEach((h, idx) => { 
        html += `<tr draggable="true" data-habit-id="${h.id}" ondragstart="habitDragStart(event)" ondragover="habitDragOver(event)" ondrop="habitDrop(event)" ondragend="habitDragEnd(event)">
            <td class="habit-name">
                <div class="no-print" style="display:inline-flex; align-items:center; gap:2px; vertical-align:middle;">
                    <i class="fa-solid fa-grip-vertical" style="cursor:grab; color:var(--text-muted); font-size:0.75rem;" title="${currentLang==='ar'?'اسحب لإعادة الترتيب':'Drag to reorder'}"></i>
                    <span style="display:inline-flex; flex-direction:column; line-height:0.6;">
                        <button class="icon-btn" style="color:var(--text-muted); font-size:0.65rem; padding:0;" onclick="moveHabit(${h.id}, -1)" ${idx===0?'disabled style="opacity:0.3;"':''} title="${currentLang==='ar'?'لأعلى':'Up'}"><i class="fa-solid fa-caret-up"></i></button>
                        <button class="icon-btn" style="color:var(--text-muted); font-size:0.65rem; padding:0;" onclick="moveHabit(${h.id}, 1)" ${idx===habits.length-1?'disabled style="opacity:0.3;"':''} title="${currentLang==='ar'?'لأسفل':'Down'}"><i class="fa-solid fa-caret-down"></i></button>
                    </span>
                    <button class="icon-btn" style="color:red;" onclick="delHabit(${h.id})">x</button>
                </div>
                <span onclick="editHabit(${h.id})" style="cursor:pointer;" title="${currentLang==='ar'?'اضغط للتعديل':'Click to edit'}"> ${escapeHtml(h.name)}</span>
            </td>`; 
        for(let i=1; i<=dim; i++) { 
            let k = `${currentYearView}-${currentMonthView}-${i}`; 
            html += `<td><div class="habit-check ${h.days && h.days[k]?'done':''}" onclick="toggleHabit(${h.id}, '${k}')">✓</div></td>`; 
        } 
        html += `</tr>`; 
    }); 
    const hbContainer = document.getElementById('habitsContainer');
    if(hbContainer) hbContainer.innerHTML = html + `</tbody></table>`; 
}
window.addNewHabit = () => { 
    const inp = document.getElementById('newHabitInput'); 
    if(inp && inp.value.trim()){ 
        habits.push({id:Date.now(), name:inp.value.trim(), days:{}}); 
        saveAll(); 
        inp.value=''; 
        renderHabits(); 
        renderDashboard(); 
    } 
};
window.editHabit = (id) => {
    let h = habits.find(x => x.id === id);
    if(!h) return;
    const newName = prompt(currentLang==='ar' ? 'عدّل اسم العادة:' : 'Edit habit name:', h.name);
    if (newName !== null && newName.trim()) {
        h.name = newName.trim();
        saveAll();
        renderHabits();
        renderDashboard();
    }
};
window.moveHabit = (id, direction) => {
    const idx = habits.findIndex(h => h.id === id);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= habits.length) return;
    [habits[idx], habits[newIdx]] = [habits[newIdx], habits[idx]];
    saveAll();
    renderHabits();
};
let draggedHabitId = null;
window.habitDragStart = (e) => {
    draggedHabitId = parseInt(e.currentTarget.dataset.habitId);
    e.currentTarget.style.opacity = '0.4';
};
window.habitDragOver = (e) => { e.preventDefault(); };
window.habitDrop = (e) => {
    e.preventDefault();
    const targetId = parseInt(e.currentTarget.dataset.habitId);
    if (draggedHabitId === null || draggedHabitId === targetId) return;
    const fromIdx = habits.findIndex(h => h.id === draggedHabitId);
    const toIdx = habits.findIndex(h => h.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = habits.splice(fromIdx, 1);
    habits.splice(toIdx, 0, moved);
    saveAll();
    renderHabits();
};
window.habitDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    draggedHabitId = null;
};
window.toggleHabit = (id, k) => { 
    let h = habits.find(x=>x.id===id); 
    if(h) {
        if(!h.days) h.days = {};
        h.days[k] = !h.days[k]; 
        saveAll(); 
        renderHabits(); 
        renderDashboard(); 
    }
};
window.delHabit = id => { habits = habits.filter(h=>h.id!==id); saveAll(); renderHabits(); renderDashboard(); };

function initProfile() { 
    const pn = document.getElementById('profileName');
    if(pn) pn.value = profile.name; 
    document.getElementById('saveProfileBtn').onclick = () => { 
        profile.name = document.getElementById('profileName').value.trim(); 
        saveAll(); 
        alert(currentLang === 'ar' ? "تم الحفظ!" : "Saved!"); 
    }; 
}

// ----------------------------------------
// النسخ الاحتياطي المحصن (Schema Validation)
// ----------------------------------------
function initBackup() { 
    document.getElementById('backupBtn').onclick = () => { 
        let d = {}; 
        for(let i=0; i<localStorage.length; i++) {
            let k = localStorage.key(i);
            d[k] = localStorage.getItem(k); 
        }
        const a = document.createElement('a'); 
        a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], {type:"application/json"})); 
        a.download = `Planner_Backup_${getTodayStr()}.json`; 
        a.click(); 
    }; 
    
    document.getElementById('restoreFile').onchange = e => { 
        const file = e.target.files[0];
        if(!file) return;
        const r = new FileReader(); 
        r.onload = ev => { 
            try {
                const d = JSON.parse(ev.target.result); 
                if(typeof d !== 'object' || d === null) throw new Error("Invalid format");
                
                // قائمة المفاتيح المسموح باسترجاعها فقط لمنع تلويث الذاكرة أو الهجمات
                const allowedPrefixes = ['fp_', 'PlannerMonthData_'];
                for(let k in d) {
                    if(allowedPrefixes.some(p => k.startsWith(p))) {
                        localStorage.setItem(k, d[k]);
                    }
                }
                alert(currentLang === 'ar' ? "تم استرجاع البيانات بنجاح!" : "Data restored successfully!");
                location.reload(); 
            } catch(err) {
                alert(currentLang === 'ar' ? "ملف النسخة الاحتياطية غير صالح أو تالف!" : "Invalid or corrupt backup file!");
            }
        }; 
        r.readAsText(file); 
    }; 
}

function initModals() { 
    document.querySelectorAll('.close-modal').forEach(b => b.onclick = () => { 
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('show')); 
        stopContinuousDictation(); 
    }); 
}

function initTheme() { 
    if(localStorage.getItem('dark_mode')==='true') document.body.classList.add('dark-mode'); 
    document.getElementById('themeToggle').onclick = () => { 
        document.body.classList.toggle('dark-mode'); 
        localStorage.setItem('dark_mode', document.body.classList.contains('dark-mode')); 
    }; 
}

window.changeFontSize = (size) => {
    document.documentElement.style.fontSize = size;
    localStorage.setItem('plannerFontSize', size);
};

window.renderUpdatesLog = () => {
    const container = document.getElementById('updatesLogContainer');
    if(!container) return;
    if (updateLog.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted);">${currentLang==='ar'?'هيظهر هنا كل تحديث جديد للتطبيق أول ما يصدر.':'New app updates will appear here as they are released.'}</p>`;
        return;
    }
    container.innerHTML = updateLog.map((entry, idx) => {
        const items = (entry[currentLang] || entry.ar || []).map(n => `<div style="margin-bottom:8px;">✅ ${escapeHtml(n)}</div>`).join('');
        return `<div class="lib-card" style="margin-bottom:15px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <h3 style="margin:0; color:var(--primary);">${escapeHtml(entry.version)} ${idx===0 ? `<span style="font-size:0.75rem; background:var(--primary); color:#fff; padding:2px 8px; border-radius:10px; margin-${currentLang==='ar'?'right':'left'}:8px;">${currentLang==='ar'?'الأحدث':'Latest'}</span>` : ''}</h3>
                <span style="color:var(--text-muted); font-size:0.85rem;"><i class="fa-solid fa-calendar"></i> ${escapeHtml(entry.date)}</span>
            </div>
            <div>${items}</div>
        </div>`;
    }).join('');
};

const manualUpBtn = document.getElementById('manualUpdateBtn');
if(manualUpBtn) {
    manualUpBtn.onclick = () => {
        const originalHtml = manualUpBtn.innerHTML;
        manualUpBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ' + (currentLang === 'ar' ? 'جاري البحث...' : 'Checking...');
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) {
                    reg.update().then(() => {
                        if (reg.waiting) {
                            reg.waiting.postMessage({ action: 'skipWaiting' });
                        } else {
                            setTimeout(() => {
                                alert(currentLang === 'ar' ? 'أنت تستخدم أحدث نسخة بالفعل!' : 'You are already on the latest version!');
                                manualUpBtn.innerHTML = originalHtml;
                            }, 800);
                        }
                    });
                } else {
                    manualUpBtn.innerHTML = originalHtml;
                }
            });
        } else {
            manualUpBtn.innerHTML = originalHtml;
        }
    };
}

window.updateFinColor = (typeId, amountId) => {
    const typeEl = document.getElementById(typeId);
    const amtEl = document.getElementById(amountId);
    let catId = typeId === 'finType' ? 'finCategory' : 'editFinCategory';

    if(typeEl && amtEl) {
        if(typeEl.value === 'income') {
            typeEl.style.color = 'var(--success)'; typeEl.style.borderColor = 'var(--success)'; typeEl.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
            amtEl.style.color = 'var(--success)'; amtEl.style.borderColor = 'var(--success)'; amtEl.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
        } else if(typeEl.value === 'expense') {
            typeEl.style.color = 'var(--danger)'; typeEl.style.borderColor = 'var(--danger)'; typeEl.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
            amtEl.style.color = 'var(--danger)'; amtEl.style.borderColor = 'var(--danger)'; amtEl.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
        } else if(typeEl.value === 'save') {
            typeEl.style.color = '#3b82f6'; typeEl.style.borderColor = '#3b82f6'; typeEl.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
            amtEl.style.color = '#3b82f6'; amtEl.style.borderColor = '#3b82f6'; amtEl.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
        } else if(typeEl.value === 'withdraw') {
            typeEl.style.color = '#f59e0b'; typeEl.style.borderColor = '#f59e0b'; typeEl.style.backgroundColor = 'rgba(245, 158, 11, 0.05)';
            amtEl.style.color = '#f59e0b'; amtEl.style.borderColor = '#f59e0b'; amtEl.style.backgroundColor = 'rgba(245, 158, 11, 0.05)';
        }
    }
    if(window.updateFinCategories) window.updateFinCategories(typeId, catId);
};

// ----------------------------------------
// تصدير التقارير (Excel & PDF)
// ----------------------------------------
window.exportFinanceExcel = () => {
    if(finances.length === 0) return alert(currentLang === 'ar' ? 'لا توجد بيانات لتصديرها' : 'No data to export');
    
    let inc = 0, exp = 0, sav = 0;
    const sortedFinances = [...finances].sort((a,b) => new Date(b.date) - new Date(a.date));
    
    const labels = {
        ar: { date: 'التاريخ', desc: 'الوصف', type: 'النوع', amt: 'المبلغ', inc: 'إيراد (+)', exp: 'مصروف (-)', save: 'إيداع/استثمار (🔒)', withdraw: 'تسييل/سحب (🔓)', totalInc: 'إجمالي الدخل', totalExp: 'إجمالي المصروفات', totalSav: 'إجمالي المدخرات', balance: 'المتاح للصرف', worth: 'صافي الثروة' },
        en: { date: 'Date', desc: 'Description', type: 'Type', amt: 'Amount', inc: 'Income (+)', exp: 'Expense (-)', save: 'Deposit (🔒)', withdraw: 'Withdraw (🔓)', totalInc: 'Total Income', totalExp: 'Total Expense', totalSav: 'Total Savings', balance: 'Available Balance', worth: 'Net Worth' }
    }[currentLang];

    const rows = sortedFinances.map(f => {
        const amtNum = Number(f.amount) || 0;
        let typeStr = '';
        if(f.type === 'income') { inc += amtNum; typeStr = labels.inc; }
        else if(f.type === 'expense') { exp += amtNum; typeStr = labels.exp; }
        else if(f.type === 'save') { sav += amtNum; typeStr = labels.save; }
        else if(f.type === 'withdraw') { sav -= amtNum; typeStr = labels.withdraw; }

        return { [labels.date]: f.date, [labels.desc]: f.desc, [labels.type]: typeStr, [labels.amt]: amtNum };
    });

    rows.push({ [labels.date]: '', [labels.desc]: '', [labels.type]: '', [labels.amt]: '' });
    rows.push({ [labels.date]: labels.totalInc, [labels.desc]: '', [labels.type]: '', [labels.amt]: inc });
    rows.push({ [labels.date]: labels.totalExp, [labels.desc]: '', [labels.type]: '', [labels.amt]: exp });
    rows.push({ [labels.date]: labels.totalSav, [labels.desc]: '', [labels.type]: '', [labels.amt]: sav });
    rows.push({ [labels.date]: labels.balance, [labels.desc]: '', [labels.type]: '', [labels.amt]: inc - exp - sav });
    rows.push({ [labels.date]: labels.worth, [labels.desc]: '', [labels.type]: '', [labels.amt]: inc - exp });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentLang === 'ar' ? "التقرير المالي" : "Finance Report");
    XLSX.writeFile(wb, currentLang === 'ar' ? "تقرير_المحفظة_المالية.xlsx" : "Finance_Portfolio.xlsx");
};

window.exportMonthPDF = () => {
    const dim = new Date(currentYearView, currentMonthView + 1, 0).getDate();
    const monthNames = {
        ar: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
        en: ['January','February','March','April','May','June','July','August','September','October','November','December']
    }[currentLang];

    let daysHTML = '';
    let hasContent = false;
    for (let d = 1; d <= dim; d++) {
        const storageKey = `PlannerMonthData_${currentYearView}_${currentMonthView}_${d}`;
        const text = localStorage.getItem(storageKey);
        const phone = localStorage.getItem(storageKey + '_phone');
        if (!text && !phone) continue;
        hasContent = true;
        daysHTML += `<div style="margin-bottom:18px; padding:14px; border:1px solid #e5e7eb; border-radius:10px; page-break-inside: avoid;">
            <div style="font-weight:700; color:#3b82f6; margin-bottom:8px; font-size:14px;">${d} ${monthNames[currentMonthView]} ${currentYearView}</div>
            ${text ? `<div style="white-space:pre-wrap; word-break:break-word; color:#111827; font-size:13px; line-height:1.6;">${escapeHtml(text)}</div>` : ''}
            ${phone ? `<div style="margin-top:8px; color:#4b5563; font-size:12px;" dir="ltr">📞 ${escapeHtml(phone)}</div>` : ''}
        </div>`;
    }

    if (!hasContent) return alert(currentLang === 'ar' ? 'لا توجد بيانات لتصديرها في هذا الشهر' : 'No data to export for this month');

    const element = document.createElement('div');
    element.style.padding = '30px';
    element.style.direction = currentLang === 'ar' ? 'rtl' : 'ltr';
    element.style.fontFamily = 'Inter, sans-serif';
    element.innerHTML = `
        <div style="text-align:center; margin-bottom:30px; border-bottom: 3px solid #3b82f6; padding-bottom: 15px;">
            <h1 style="color:#111827; margin:0; font-size: 24px; font-weight:700;">Planner Pro Max</h1>
            <h3 style="color:#6b7280; margin-top:5px; font-size: 14px;">${currentLang==='ar' ? `خطة شهر ${monthNames[currentMonthView]} ${currentYearView}` : `${monthNames[currentMonthView]} ${currentYearView} Plan`}</h3>
        </div>
        ${daysHTML}
    `;

    const opt = {
        margin: [0.4, 0.4],
        filename: currentLang === 'ar' ? `خطة_${monthNames[currentMonthView]}_${currentYearView}.pdf` : `Plan_${monthNames[currentMonthView]}_${currentYearView}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2.5, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
};

window.exportFinancePDF = () => {
    if(finances.length === 0) return alert(currentLang === 'ar' ? 'لا توجد بيانات لتصديرها' : 'No data to export');
    
    const element = document.createElement('div');
    element.style.padding = '30px';
    element.style.direction = currentLang === 'ar' ? 'rtl' : 'ltr';
    element.style.fontFamily = 'Inter, sans-serif';
    
    const labels = {
        ar: { title: 'تقرير المحفظة الاستثمارية والمالية', inc: 'الدخل', exp: 'المصروفات', sav: 'المدخرات', bal: 'المتاح', date: 'التاريخ', desc: 'البيان', amt: 'القيمة' },
        en: { title: 'Financial & Investment Portfolio Report', inc: 'Income', exp: 'Expenses', sav: 'Savings', bal: 'Available', date: 'Date', desc: 'Description', amt: 'Value' }
    }[currentLang];

    let inc = 0, exp = 0, sav = 0;
    
    let rows = [...finances].sort((a,b) => new Date(b.date) - new Date(a.date)).map(f => {
        let color = '', sign = '';
        const amtNum = Number(f.amount) || 0;
        if(f.type === 'income') { inc += amtNum; color = '#10b981'; sign = '+'; }
        else if(f.type === 'expense') { exp += amtNum; color = '#ef4444'; sign = '-'; }
        else if(f.type === 'save') { sav += amtNum; color = '#3b82f6'; sign = '🔒'; }
        else if(f.type === 'withdraw') { sav -= amtNum; color = '#f59e0b'; sign = '🔓'; }

        return `<tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'right' : 'left'}; color:#4b5563;">${escapeHtml(f.date)}</td>
            <td style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'right' : 'left'}; font-weight:500;">${escapeHtml(f.desc)}</td>
            <td style="padding:12px 10px; color:${color}; font-weight:700; text-align:${currentLang === 'ar' ? 'left' : 'right'};" dir="ltr">${amtNum} ${sign}</td>
        </tr>`;
    }).join('');

    let netBal = inc - exp - sav;

    element.innerHTML = `
        <div style="text-align:center; margin-bottom:30px; border-bottom: 3px solid #3b82f6; padding-bottom: 15px;">
            <h1 style="color:#111827; margin:0; font-size: 24px; font-weight:700;">Planner Pro Max</h1>
            <h3 style="color:#6b7280; margin-top:5px; font-size: 14px;">${labels.title}</h3>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:30px; background:#f9fafb; padding:20px; border-radius:12px; border:1px solid #e5e7eb; gap: 10px; flex-wrap: wrap;">
            <div style="text-align:center; flex:1; min-width:80px;">
                <strong style="color:#4b5563; font-size:12px; display:block; margin-bottom:5px;">${labels.inc}</strong>
                <span style="color:#10b981; font-size:1.2rem; font-weight:700;">${inc}</span>
            </div>
            <div style="text-align:center; flex:1; border-right:1px solid #e5e7eb; border-left:1px solid #e5e7eb; min-width:80px;">
                <strong style="color:#4b5563; font-size:12px; display:block; margin-bottom:5px;">${labels.exp}</strong>
                <span style="color:#ef4444; font-size:1.2rem; font-weight:700;">${exp}</span>
            </div>
            <div style="text-align:center; flex:1; border-right:${currentLang==='ar'?'none':'1px solid #e5e7eb'}; border-left:${currentLang==='ar'?'1px solid #e5e7eb':'none'}; min-width:80px;">
                <strong style="color:#4b5563; font-size:12px; display:block; margin-bottom:5px;">${labels.sav}</strong>
                <span style="color:#3b82f6; font-size:1.2rem; font-weight:700;">${sav}</span>
            </div>
            <div style="text-align:center; flex:1; min-width:80px;">
                <strong style="color:#4b5563; font-size:12px; display:block; margin-bottom:5px;">${labels.bal}</strong>
                <span style="color:#25D366; font-size:1.2rem; font-weight:800;">${netBal}</span>
            </div>
        </div>
        <table style="width:100%; border-collapse: collapse; background:#ffffff;">
            <thead style="background:#1f2937; color:#ffffff;">
                <tr>
                    <th style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'right' : 'left'}; border-top-right-radius:6px; font-size:13px;">${labels.date}</th>
                    <th style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'right' : 'left'}; font-size:13px;">${labels.desc}</th>
                    <th style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'left' : 'right'}; border-top-left-radius:6px; font-size:13px;">${labels.amt}</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;

    const opt = {
        margin: [0.4, 0.4],
        filename: currentLang === 'ar' ? 'تقرير_المحفظة_المالية.pdf' : 'Finance_Portfolio_Report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2.5, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
};

// ----------------------------------------
// جلسات التركيز (Pomodoro Log)
// ----------------------------------------
window.getFormattedTime = (logTime, lang) => {
    if (!logTime) return '';
    let hours = 0, minutes = 0;
    const match24 = logTime.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
        hours = parseInt(match24[1], 10);
        minutes = parseInt(match24[2], 10);
    } else {
        let cleanTime = logTime.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
        const nums = cleanTime.match(/\d+/g);
        if (nums && nums.length >= 2) {
            hours = parseInt(nums[0], 10);
            minutes = parseInt(nums[1], 10);
            const isPM = logTime.includes('م') || logTime.toLowerCase().includes('pm');
            const isAM = logTime.includes('ص') || logTime.toLowerCase().includes('am');
            if (isPM && hours < 12) hours += 12;
            if (isAM && hours === 12) hours = 0;
        } else {
            return escapeHtml(logTime);
        }
    }
    
    const dateObj = new Date();
    dateObj.setHours(hours);
    dateObj.setMinutes(minutes);
    return dateObj.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
};

window.logPomodoroSession = (type, duration) => {
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    pomodoroLog.unshift({
        id: Date.now(),
        date: getTodayStr(),
        time: timeString,
        type: type,
        duration: duration
    });
    
    saveAll();
    renderPomodoroLog();
    renderDashboard();
};

window.renderPomodoroLog = () => {
    const container = document.getElementById('pomodoroLogContainer');
    if (!container) return;
    
    if (pomodoroLog.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:15px;">${i18n[currentLang].pom_no_log}</p>`;
        return;
    }
    
    container.innerHTML = pomodoroLog.map(log => {
        const isWork = log.type === 'work';
        const badgeColor = isWork ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)';
        const textColor = isWork ? '#ef4444' : '#10b981';
        const icon = isWork ? '🍅' : '☕';
        const typeText = isWork ? i18n[currentLang].pom_work_log : i18n[currentLang].pom_break_log;
        const minText = currentLang === 'ar' ? 'دقائق' : 'mins';
        const displayTime = window.getFormattedTime(log.time, currentLang);
        
        return `
            <div class="daily-task-item" style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border:1px solid var(--border-color); border-radius:10px; background:var(--card-bg); font-size:0.88rem; transition: all 0.25s ease;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:1.1rem;">${icon}</span>
                    <div>
                        <strong style="color:var(--text-main); display:block;">${typeText}</strong>
                        <small style="color:var(--text-muted); font-size:0.75rem;"><i class="fa-regular fa-calendar"></i> ${escapeHtml(log.date)} | <i class="fa-regular fa-clock"></i> ${displayTime}</small>
                    </div>
                </div>
                <span style="background:${badgeColor}; color:${textColor}; padding:4px 8px; border-radius:6px; font-weight:700; font-size:0.8rem;">${Number(log.duration)} ${minText}</span>
            </div>
        `;
    }).join('');
};

window.clearPomodoroLog = () => {
    if(confirm(currentLang === 'ar' ? 'هل تريد مسح سجل جلسات التركيز بالكامل؟' : 'Are you sure you want to clear the focus log?')) {
        pomodoroLog = [];
        saveAll();
        renderPomodoroLog();
        renderDashboard();
    }
};

window.exportPomodoroExcel = () => {
    if(pomodoroLog.length === 0) return alert(currentLang === 'ar' ? 'لا توجد جلسات مسجلة لتصديرها' : 'No logged sessions to export');
    
    const labels = {
        ar: { date: 'التاريخ', time: 'التوقيت', type: 'نوع الجلسة', duration: 'المدة (بالدقائق)', work: 'تركيز عمل 🍅', break: 'استراحة ونقاهة ☕', totalBlocks: 'إجمالي جلسات التركيز الشاملة (البلوكات)' },
        en: { date: 'Date', time: 'Time', type: 'Session Type', duration: 'Duration (Minutes)', work: 'Focus Work 🍅', break: 'Rest & Break ☕', totalBlocks: 'Total Completed Focus Blocks' }
    }[currentLang];

    const data = [...pomodoroLog].reverse().map(log => ({
        [labels.date]: log.date,
        [labels.time]: window.getFormattedTime(log.time, currentLang),
        [labels.type]: log.type === 'work' ? labels.work : labels.break,
        [labels.duration]: log.duration
    }));
    
    let totalWorkCount = pomodoroLog.filter(l => l.type === 'work').length;
    data.push({});
    data.push({ [labels.date]: labels.totalBlocks, [labels.time]: '', [labels.type]: '', [labels.duration]: totalWorkCount });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentLang === 'ar' ? "سجل الإنتاجية" : "Productivity Log");
    XLSX.writeFile(wb, currentLang === 'ar' ? "سجل_جلسات_التركيز_الشامل.xlsx" : "Comprehensive_Pomodoro_Focus_Log.xlsx");
};

window.exportPomodoroPDF = () => {
    if(pomodoroLog.length === 0) return alert(currentLang === 'ar' ? 'لا توجد جلسات مسجلة لتصديرها' : 'No logged sessions to export');
    
    const element = document.createElement('div');
    element.style.padding = '30px';
    element.style.direction = currentLang === 'ar' ? 'rtl' : 'ltr';
    element.style.fontFamily = 'Inter, sans-serif';
    
    const labels = {
        ar: { reportTitle: 'تقرير مؤشرات سجل الإنتاجية والتركيز الشامل', totalTitle: 'إجمالي جلسات العمل المنجزة', date: 'التاريخ', time: 'التوقيت', type: 'نوع الجلسة / البلوك', dur: 'المدة الزمنية', work: 'جلسة تركيز عمل', break: 'جلسة استراحة ونقاهة' },
        en: { reportTitle: 'Comprehensive Productivity & Focus Metrics Report', totalTitle: 'Total Focus Sessions Completed', date: 'Date', time: 'Time', type: 'Session / Block Type', dur: 'Duration', work: 'Focus Work Session', break: 'Rest & Break Session' }
    }[currentLang];

    let totalWorkCount = pomodoroLog.filter(l => l.type === 'work').length;
    const minText = currentLang === 'ar' ? 'دقائق' : 'mins';

    let rows = [...pomodoroLog].map(log => {
        let isWork = log.type === 'work';
        let color = isWork ? '#ef4444' : '#10b981';
        let textStr = isWork ? labels.work : labels.break;
        let displayTime = window.getFormattedTime(log.time, currentLang);
        return `<tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'right' : 'left'}; color:#4b5563;">${escapeHtml(log.date)}</td>
            <td style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'right' : 'left'}; color:#4b5563;">${displayTime}</td>
            <td style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'right' : 'left'}; font-weight:600; color:${color};">${textStr}</td>
            <td style="padding:12px 10px; font-weight:700; text-align:${currentLang === 'ar' ? 'left' : 'right'}; color:#111827;">${Number(log.duration)} ${minText}</td>
        </tr>`;
    }).join('');

    element.innerHTML = `
        <div style="text-align:center; margin-bottom:30px; border-bottom: 3px solid #ef4444; padding-bottom: 15px;">
            <h1 style="color:#111827; margin:0; font-size: 24px; font-weight:700;">Planner Pro Max</h1>
            <h3 style="color:#6b7280; margin-top:5px; font-size: 14px;">${labels.reportTitle}</h3>
        </div>
        <div style="margin-bottom:30px; background:#f9fafb; padding:20px; border-radius:12px; border:1px solid #e5e7eb; text-align:center;">
            <strong style="color:#4b5563; font-size:13px; display:block; margin-bottom:5px;">${labels.totalTitle}</strong>
            <span style="color:#ef4444; font-size:2rem; font-weight:800;">🍅 ${totalWorkCount}</span>
        </div>
        <table style="width:100%; border-collapse: collapse; background:#ffffff;">
            <thead style="background:#1f2937; color:#ffffff;">
                <tr>
                    <th style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'right' : 'left'}; font-size:13px;">${labels.date}</th>
                    <th style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'right' : 'left'}; font-size:13px;">${labels.time}</th>
                    <th style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'right' : 'left'}; font-size:13px;">${labels.type}</th>
                    <th style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'left' : 'right'}; font-size:13px;">${labels.dur}</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;

    const opt = {
        margin: [0.4, 0.4],
        filename: currentLang === 'ar' ? 'تقرير_سجل_جلسات_التركيز.pdf' : 'Productivity_Focus_Log_Report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2.5, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
};

// ----------------------------------------
// تفريغ الدماغ السريع
// ----------------------------------------
window.openQuickDump = () => {
    document.getElementById('qdTitle').value = '';
    document.getElementById('qdContent').value = '';
    document.getElementById('quickDumpModal').classList.add('show');
    setTimeout(() => { document.getElementById('qdTitle').focus(); }, 300);
};

document.getElementById('saveQdToKanban').onclick = () => {
    let title = document.getElementById('qdTitle').value.trim();
    let content = document.getElementById('qdContent').value.trim();
    if(!title && !content) return;
    
    let finalTitle = title || (currentLang === 'ar' ? `فكرة سريعة (${getTodayStr()})` : `Quick Idea (${getTodayStr()})`);
    let fullText = content ? `📌 ${finalTitle}\n\n${content}` : `📌 ${finalTitle}`;
    
    kanbanTasks.todo.unshift({id: Date.now(), text: fullText, subtasks: []});
    saveAll();
    renderKanban();
    
    document.getElementById('quickDumpModal').classList.remove('show');
    stopContinuousDictation();
    document.querySelector('.nav-item[data-target="kanbanView"]').click();
};

document.getElementById('saveQdToNotes').onclick = () => {
    let title = document.getElementById('qdTitle').value.trim();
    let content = document.getElementById('qdContent').value.trim();
    if(!title && !content) return;
    
    let finalTitle = title || (currentLang === 'ar' ? `فكرة سريعة (${getTodayStr()})` : `Quick Idea (${getTodayStr()})`);
    notes.unshift({ id: Date.now(), title: finalTitle, content: content, date: getTodayStr(), phone: '' });
    saveAll();
    renderNotes();
    
    document.getElementById('quickDumpModal').classList.remove('show');
    stopContinuousDictation();
    document.querySelector('.nav-item[data-target="notesView"]').click();
};