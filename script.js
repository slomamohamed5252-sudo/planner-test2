// 1. سجل التحديثات (اكتب تحديثاتك هنا في كل إصدار جديد)
const latestReleaseNotes = {
    ar: [
        "تحسين سرعة استجابة التطبيق بشكل عام."
    ],
    en: [
        "Improved overall app responsiveness."
    ]
};

// كود إظهار صندوق التحديثات التلقائي
const APP_VERSION = 'v17'; // يجب تغييره هنا مع كل تحديث رئيسي مستقبلاً
function checkAndShowChangelog() {
    const savedVersion = localStorage.getItem('fp_version');
    if(savedVersion !== APP_VERSION) {
        setTimeout(() => {
            const content = document.getElementById('changelogContent');
            if(content) {
                content.innerHTML = latestReleaseNotes[currentLang].map(n => `✅ ${n}`).join('<br><br>');
                document.getElementById('changelogModal').classList.add('show');
            }
            localStorage.setItem('fp_version', APP_VERSION);
        }, 1500); // تظهر بعد ثانية ونصف من الدخول
    }
}
window.closeChangelog = () => { document.getElementById('changelogModal').classList.remove('show'); };

// 2. PWA & Update Notification
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; const installBtn = document.getElementById('installAppBtn'); if(installBtn) installBtn.style.display = 'inline-flex'; });

let newWorker;
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
            newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    const toast = document.getElementById('updateToast');
                    if(toast) {
                        // جلب التحديثات حسب لغة المستخدم الحالية وحقنها في الـ HTML
                        const notesTitle = currentLang === 'ar' ? '<strong>الجديد في هذا الإصدار:</strong><br>' : '<strong>What\'s new in this version:</strong><br>';
                        const notesList = latestReleaseNotes[currentLang].map(note => `- ${note}`).join('<br>');
                        
                        document.getElementById('updateMessageList').innerHTML = notesTitle + notesList;
                        
                        toast.style.display = 'block'; 
                        toast.classList.add('show');
                    }
                }
            });
        });
    }).catch(e=>console.log(e));
    
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) { window.location.reload(true); refreshing = true; }
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

let useCloud = false, auth, db, currentUser = null;
if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 10) {
    firebase.initializeApp(firebaseConfig); 
    auth = firebase.auth(); 
    db = firebase.firestore(); 
    useCloud = true;
    
    // ملاحظة إسلام: تم حذف سطر db.enablePersistence() نهائياً لحل خطأ Assertion المسبب لتوقف التطبيق
    
    auth.onAuthStateChanged(user => {
        const cloudStatus = document.getElementById('cloudStatus');
        if (user) {
            currentUser = user;
            if(cloudStatus) cloudStatus.innerHTML = `<span style="color:var(--success); font-weight:bold;"><i class="fa-solid fa-cloud-check"></i> ${currentLang === 'ar' ? 'متصل كـ:' : 'Connected as:'} ${user.email}</span> <button onclick="logoutCloud()" class="btn btn-secondary" style="padding:5px 10px; font-size:0.8rem; color: var(--danger);">${currentLang === 'ar' ? 'خروج آمن' : 'Logout'}</button>`;
            loadFromCloud();
        } else {
            currentUser = null;
            if(cloudStatus) cloudStatus.innerHTML = `<span style="color:var(--text-muted);"><i class="fa-solid fa-cloud-arrow-up"></i> ${currentLang === 'ar' ? 'غير متصل' : 'Offline'}</span> <button onclick="document.getElementById('authModal').classList.add('show')" class="btn btn-primary" style="padding:5px 10px; font-size:0.85rem;">${currentLang === 'ar' ? 'دخول للمزامنة' : 'Login to Sync'}</button>`;
        }
    });
}

// ----------------------------------------
// الترجمة واللغات (تعمل بشكل مثالي ولا تمس بياناتك)
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
        title_quick_dump: "تفريغ الدماغ السريع ⚡", btn_qd_kanban: "كمشروع", btn_qd_note: "كملاحظة"
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
        title_quick_dump: "Quick Brain Dump ⚡", btn_qd_kanban: "As Project", btn_qd_note: "As Note"
    }
};

let currentLang = localStorage.getItem('fp_lang') || 'ar';
function setLanguage(lang) {
    currentLang = lang; localStorage.setItem('fp_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'; document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.getAttribute('data-i18n'); if(i18n[lang][key]) el.innerHTML = i18n[lang][key]; });
    const toggleBtn = document.getElementById('langLabel'); if(toggleBtn) toggleBtn.innerHTML = lang === 'ar' ? 'EN' : 'AR';
    const kbInp = document.getElementById('newKbItem'); if(kbInp) kbInp.placeholder = lang === 'ar' ? 'اكتب اسم المشروع / المهمة هنا... (اضغط Enter لسطر جديد)' : 'Type project name... (Press Enter for new line)';
    const hbInp = document.getElementById('newHabitInput'); if(hbInp) hbInp.placeholder = lang === 'ar' ? 'عادة جديدة...' : 'New habit...';
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

let tasks = JSON.parse(localStorage.getItem('fp_tasks')) || []; let notes = JSON.parse(localStorage.getItem('fp_notes')) || []; let profile = JSON.parse(localStorage.getItem('fp_profile')) || { name: '', phone: '' }; let kanbanTasks = JSON.parse(localStorage.getItem('fp_kanban')) || { todo: [], inprogress: [], done: [] }; let habits = JSON.parse(localStorage.getItem('fp_habits')) || []; let finances = JSON.parse(localStorage.getItem('fp_finance')) || []; let library = JSON.parse(localStorage.getItem('fp_library')) || [];
let pomodoroLog = JSON.parse(localStorage.getItem('fp_pomodoro_log')) || [];
const getTodayStr = () => { const d = new Date(); return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]; };
let currentTodayStr = getTodayStr(); let currentDailyDate = currentTodayStr; let currentMonthView = new Date().getMonth(); let currentYearView = new Date().getFullYear();
const monthNamesAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]; const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let myChart = null;

setInterval(() => { let checkDate = getTodayStr(); if (checkDate !== currentTodayStr) { currentTodayStr = checkDate; if(currentDailyDate === currentTodayStr) { document.getElementById('viewDailyDate').value = currentTodayStr; renderViews(); } } }, 60000);

function saveAll() {
    localStorage.setItem('fp_tasks', JSON.stringify(tasks)); localStorage.setItem('fp_notes', JSON.stringify(notes)); localStorage.setItem('fp_kanban', JSON.stringify(kanbanTasks)); localStorage.setItem('fp_habits', JSON.stringify(habits)); localStorage.setItem('fp_finance', JSON.stringify(finances)); localStorage.setItem('fp_library', JSON.stringify(library)); localStorage.setItem('fp_profile', JSON.stringify(profile)); localStorage.setItem('fp_pomodoro_log', JSON.stringify(pomodoroLog));
    if (useCloud && currentUser) { let monthlyData = {}; for(let i=0; i<localStorage.length; i++) { let k = localStorage.key(i); if(k.startsWith('PlannerMonthData_')) monthlyData[k] = localStorage.getItem(k); } db.collection('users').doc(currentUser.uid).set({ tasks, notes, kanbanTasks, habits, finances, library, profile, monthlyData }, {merge: true}).catch(e => console.log(e)); }
}
function loadFromCloud() { db.collection('users').doc(currentUser.uid).get().then(doc => { if (doc.exists) { const data = doc.data(); if(data.tasks) tasks = data.tasks; if(data.notes) notes = data.notes; if(data.kanbanTasks) kanbanTasks = data.kanbanTasks; if(data.habits) habits = data.habits; if(data.finances) finances = data.finances; if(data.library) library = data.library; if(data.profile) profile = data.profile; if(data.monthlyData) { for(let k in data.monthlyData) localStorage.setItem(k, data.monthlyData[k]); } saveAll(); renderViews(); } }); }

// ----------------------------------------
// دوال الفتح لتفريغ النوافذ 100%
// ----------------------------------------
window.openTaskModal = () => { document.getElementById('taskTitle').value = ''; document.getElementById('taskDate').value = currentDailyDate; document.getElementById('taskModal').classList.add('show'); };
window.openNoteModal = () => { document.getElementById('noteTitle').value = ''; document.getElementById('noteContent').value = ''; document.getElementById('noteDate').value = currentTodayStr; document.getElementById('notePhone').value = ''; document.getElementById('noteModal').classList.add('show'); };
window.openLibModal = () => { document.getElementById('libTitle').value = ''; document.getElementById('libCategory').value = ''; document.getElementById('libContent').value = ''; document.getElementById('libPhone').value = ''; document.getElementById('libraryModal').classList.add('show'); };
window.openFinModal = () => { document.getElementById('finDesc').value = ''; document.getElementById('finAmount').value = ''; document.getElementById('finDate').value = currentTodayStr; document.getElementById('financeModal').classList.add('show'); setTimeout(() => { if(window.updateFinColor) updateFinColor('finType', 'finAmount'); }, 50); };

window.clearDailyTasks = (type) => { 
    if(type === 'completed') { if(confirm(currentLang==='ar'?'مسح المهام المكتملة لهذا اليوم فقط؟':'Clear completed tasks for today?')) { tasks = tasks.filter(t => !(t.completed && t.date === currentTodayStr)); saveAll(); renderViews(); } } 
    else if (type === 'today') { if(confirm(currentLang==='ar'?'حذف جميع مهام اليوم نهائياً؟':'Delete all tasks for today permanently?')) { tasks = tasks.filter(t => t.date !== currentTodayStr); saveAll(); renderViews(); } } 
};
window.archiveDashboardToday = () => { if(confirm(currentLang==='ar'?'إخفاء مهام اليوم من لوحة الإحصائيات؟':'Hide today\'s tasks from Dashboard?')) { localStorage.setItem('fp_dash_cleared', currentTodayStr); renderDashboard(); } };
window.resetStats = () => { if(confirm(currentLang==='ar'?'تصفير الإحصائيات والرسم البياني؟':'Reset dashboard stats?')) { localStorage.setItem('fp_stats_reset', getTodayStr()); renderDashboard(); } };
window.handleAuth = async (action) => { const email = document.getElementById('authEmail').value, pass = document.getElementById('authPassword').value, errEl = document.getElementById('authError'); errEl.innerText = ''; if(!email || !pass) return; try { if(action === 'login') await auth.signInWithEmailAndPassword(email, pass); else await auth.createUserWithEmailAndPassword(email, pass); document.getElementById('authModal').classList.remove('show'); } catch(err) { errEl.style.color = 'var(--danger)'; errEl.innerText = err.message; } };
window.resetPassword = async () => { const email = document.getElementById('authEmail').value; const errEl = document.getElementById('authError'); if(!email) { errEl.style.color = 'var(--warning)'; errEl.innerText = currentLang === 'ar' ? 'يرجى كتابة البريد الإلكتروني.' : 'Please enter email.'; return; } try { await auth.sendPasswordResetEmail(email); errEl.style.color = 'var(--success)'; errEl.innerText = currentLang === 'ar' ? 'تم إرسال رابط الاستعادة!' : 'Reset link sent!'; } catch(err) { errEl.style.color = 'var(--danger)'; errEl.innerText = err.message; } };
window.logoutCloud = () => { auth.signOut().then(() => { localStorage.clear(); location.reload(); }); };

function linkify(text) { const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%Sub=~_|])/ig; const phoneRegex = /(\b\d{10,14}\b)/g; return text.replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`).replace(phoneRegex, phone => `<a href="tel:${phone}">${phone}</a>`); }

// ----------------------------------------
// برمجة الذكاء الاصطناعي (الحل الشامل والمستقر لـ Android و iOS)
// ----------------------------------------
let dictationRecognition = null; let isDictating = false; 
let currentStartBtn = null, currentStopBtn = null, currentStatus = null, currentInput = null;

window.startContinuousDictation = (inputId, langId, statusId, startBtnId, stopBtnId) => {
    // 1. التحقق من دعم المتصفح (مهم جداً للآيفون)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { 
        alert(currentLang === 'ar' ? 'متصفحك لا يدعم الإملاء الصوتي. جرب متصفح كروم أو سفاري حديث.' : 'Speech to text not supported on this browser.'); 
        return; 
    }
    
    if(isDictating) stopContinuousDictation(); 
    
    currentStartBtn = document.getElementById(startBtnId);
    currentStopBtn = document.getElementById(stopBtnId);
    currentStatus = document.getElementById(statusId);
    currentInput = document.getElementById(inputId);
    
    dictationRecognition = new SpeechRecognition(); 
    
    // 2. إعدادات الاستقرار القصوى للموبايل
    dictationRecognition.continuous = false; // نوقف الاستمرار الكاذب الذي يفصل في الآيفون
    dictationRecognition.interimResults = false; // نوقف التخمين الذي يسبب التكرار في أندرويد
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
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript + ' ';
            }
        }
        
        // الدمج الآمن مع النص القديم
        if (finalTranscript.trim().length > 0) {
            let currentText = currentInput.value;
            currentInput.value = currentText + (currentText.endsWith(' ') || currentText === '' ? '' : ' ') + finalTranscript.trim();
        }
    };

    dictationRecognition.onend = () => { 
        // 3. الخدعة العبقرية: إذا كان المستخدم لم يضغط "إيقاف"، نعيد فتح المايك فوراً (يهزم قيود آيفون)
        if(isDictating) { 
            try { dictationRecognition.start(); } catch(e) {} 
        } 
        else {
            currentStartBtn.style.display = 'inline-flex'; currentStopBtn.style.display = 'none';
            currentStatus.innerText = currentLang === 'ar' ? 'المحتوى' : 'Content'; 
            currentStatus.style.color = 'var(--text-main)'; 
        }
    };

    dictationRecognition.onerror = (event) => {
        // معالجة الأخطاء بصمت لعدم إزعاج المستخدم إذا لم يسمع الموبايل شيئاً
        if(event.error === 'no-speech') {
            // تجاهل الخطأ، وسيقوم onend بإعادة التشغيل
        } else {
            console.log("Mic Error: ", event.error);
        }
    };

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
    checkAndShowChangelog(); // التحقق من وجود تحديث جديد لعرض النافذة
    
// كود ضبط التاريخ التلقائي والمزامنة مع منتصف الليل محلياً
    const setTodayDateAuto = () => {
        const today = new Date();
        const localDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        
        const viewDailyDate = document.getElementById('viewDailyDate');
        if (viewDailyDate && viewDailyDate.value !== localDate) {
            viewDailyDate.value = localDate;
            if (typeof currentDailyDate !== 'undefined') {
                currentDailyDate = localDate;
            }
            if (typeof renderDaily === 'function') renderDaily();
        }
    };
    
    setTodayDateAuto(); 
    setInterval(setTodayDateAuto, 60000);
    
    // 1. تطبيق حجم الخط المحفوظ
    const savedFontSize = localStorage.getItem('plannerFontSize') || '16px';
    document.documentElement.style.fontSize = savedFontSize;
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    if (fontSizeSelect) fontSizeSelect.value = savedFontSize;

    // 2. تفعيل زر التثبيت
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') { deferredPrompt = null; installBtn.style.display = 'none'; }
            }
        });
    }

    // 3. تفعيل زر التحديث الإجباري والآمن (مُحسّن للأوفلاين)
    const reloadBtn = document.getElementById('reloadAppBtn');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', () => {
            document.getElementById('updateToast').style.display = 'none';
            if (newWorker) {
                // إرسال الأمر للسيرفس وركر ليتولى هو عملية إعادة التحميل بعد التفعيل لضمان جلب الكود الجديد
                newWorker.postMessage({ action: 'skipWaiting' });
            } else {
                window.location.reload(true);
            }
        });
    }
   
    // كود إظهار وإخفاء كلمة المرور
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
    if(viewDailyDate) { viewDailyDate.value = currentDailyDate; viewDailyDate.addEventListener('change', (e) => { currentDailyDate = e.target.value; renderDaily(); }); }
    
    const taskHour = document.getElementById('taskHour'); taskHour.innerHTML = ''; 
    for(let i = 6; i <= 23; i++) { let opt = document.createElement('option'); opt.value = i; if(i === 12) opt.textContent = '12 PM'; else if(i > 12) opt.textContent = `${i - 12} PM`; else opt.textContent = `${i} AM`; taskHour.appendChild(opt); }
    
    document.getElementById('prevMonthBtn').onclick = () => { currentMonthView--; if(currentMonthView < 0) { currentMonthView = 11; currentYearView--; } renderViews(); };
    document.getElementById('nextMonthBtn').onclick = () => { currentMonthView++; if(currentMonthView > 11) { currentMonthView = 0; currentYearView++; } renderViews(); };
    
    document.querySelectorAll('.nav-item').forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active')); e.currentTarget.classList.add('active'); let target = e.currentTarget.getAttribute('data-target'); document.getElementById(target).classList.add('active'); renderViews(); }); });
    initPomodoro(); renderViews();
});

function renderViews() { 
    renderDashboard(); renderMonthly(); renderDaily(); renderKanban(); renderHabits(); renderFinance(); renderLibrary(); renderNotes(); 
    if(typeof renderPomodoroLog === 'function') renderPomodoroLog();
    if(typeof renderChangelog === 'function') renderChangelog();
}

function renderDaily() { 
    const container = document.getElementById('plannerContainer'); container.innerHTML = ''; 
    const todayTasks = tasks.filter(t => t.date === currentDailyDate); 
    for(let hour = 6; hour <= 23; hour++) { 
        const hourTasks = todayTasks.filter(t => t.hour == hour); 
        let timeLabel = hour === 12 ? '12 PM' : (hour > 12 ? `${hour - 12} PM` : `${hour} AM`);
        let html = hourTasks.map(t => `
            <div class="daily-task-item ${t.completed ? 'completed' : ''}" onclick="editTask(${t.id})" style="display:flex; justify-content:space-between; padding:10px; border:1px solid var(--border-color); border-radius:8px; margin-bottom:5px; background:var(--card-bg); cursor:pointer;">
                <div style="flex:1;"><input type="checkbox" ${t.completed ? 'checked' : ''} onclick="event.stopPropagation()" onchange="toggleTask(${t.id})"> <span style="text-decoration:${t.completed?'line-through':'none'}">${t.title}</span></div>
                <button onclick="event.stopPropagation(); delTask(${t.id})" class="no-print icon-btn" style="color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
            </div>
        `).join(''); 
        container.innerHTML += `<div style="display:flex; margin-bottom:1rem; gap:1rem; align-items:flex-start;"><div style="width:60px; font-weight:bold; color:var(--primary); margin-top:10px;">${timeLabel}</div><div style="flex:1; min-height:45px;">${html||`<span style="color:var(--text-muted); font-size:0.8rem; display:block; padding:10px; opacity: 0.5;">...</span>`}</div></div>`; 
    } 
}

document.getElementById('saveTaskBtn').onclick = () => { const t = document.getElementById('taskTitle').value; if(!t) return; tasks.push({ id: Date.now(), title: t, date: document.getElementById('taskDate').value, hour: document.getElementById('taskHour').value, completed: false }); saveAll(); document.getElementById('taskModal').classList.remove('show'); renderDaily(); renderDashboard(); };
window.toggleTask = id => { tasks = tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t); saveAll(); renderDaily(); renderDashboard(); }
window.delTask = id => { tasks = tasks.filter(t => t.id !== id); saveAll(); renderDaily(); renderDashboard(); }

window.editTask = (id) => {
    let task = tasks.find(t => t.id === id); if(!task) return;
    document.getElementById('editTaskId').value = task.id; document.getElementById('editTaskTitle').value = task.title; document.getElementById('editTaskDate').value = task.date;
    let hourSelect = document.getElementById('editTaskHour'); hourSelect.innerHTML = '';
    for(let i = 6; i <= 23; i++) { let opt = document.createElement('option'); opt.value = i; opt.textContent = i === 12 ? '12 PM' : (i > 12 ? `${i - 12} PM` : `${i} AM`); if(i == task.hour) opt.selected = true; hourSelect.appendChild(opt); }
    document.getElementById('editTaskModal').classList.add('show');
};
// التعديل الشامل لزر تحديث المهمة (مع المزامنة العكسية)
document.getElementById('updateTaskBtn').onclick = () => {
    let id = parseInt(document.getElementById('editTaskId').value); 
    let title = document.getElementById('editTaskTitle').value; 
    let dateStr = document.getElementById('editTaskDate').value;
    let hour = document.getElementById('editTaskHour').value;
    
    if(!title) return; 
    let task = tasks.find(t => t.id === id);
    
    if(task) { 
        let oldDate = task.date;
        let oldTitle = task.title; // الاحتفاظ بالعنوان القديم للبحث عنه

        task.title = title; 
        task.date = dateStr; 
        task.hour = hour; 
        
        if(dateStr !== oldDate) { 
            if (task.isMonthly) {
                // 1. تنظيف النص من علامة الدبوس للبحث عنه
                let cleanOldText = oldTitle.replace('📌 خطة الشهر: ', '').replace('📌 Month Plan: ', '').trim();
                let cleanNewText = title.replace('📌 خطة الشهر: ', '').replace('📌 Month Plan: ', '').trim();

                // 2. مسح المهمة من التاريخ القديم في خطة الشهر
                let [oY, oM, oD] = oldDate.split('-');
                let oldKey = `PlannerMonthData_${parseInt(oY)}_${parseInt(oM)-1}_${parseInt(oD)}`;
                let oldMonthText = localStorage.getItem(oldKey) || "";
                if (cleanOldText && oldMonthText.includes(cleanOldText)) {
                    let newOldText = oldMonthText.replace(cleanOldText, '').trim();
                    // تنظيف الأسطر الفارغة الإضافية إن وجدت
                    newOldText = newOldText.replace(/^\s*[\r\n]/gm, '');
                    localStorage.setItem(oldKey, newOldText);
                }

                // 3. إضافة المهمة إلى التاريخ الجديد في خطة الشهر
                let [nY, nM, nD] = dateStr.split('-');
                let newKey = `PlannerMonthData_${parseInt(nY)}_${parseInt(nM)-1}_${parseInt(nD)}`;
                let newMonthText = localStorage.getItem(newKey) || "";
                if (!newMonthText.includes(cleanNewText)) {
                    localStorage.setItem(newKey, newMonthText ? newMonthText + '\n' + cleanNewText : cleanNewText);
                }
            } else {
                // الترحيل للمهام العادية التي يتم تغيير تاريخها
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
// برمجة الملاحظات والمراجع (مع التعديل)
// ----------------------------------------
function renderNotes() { 
    const container = document.getElementById('notesContainer');
    container.innerHTML = notes.length === 0 ? `<p style="text-align:center; color:var(--text-muted); grid-column: 1/-1;">${currentLang==='ar'?'لا توجد ملاحظات.':'No notes.'}</p>` : '';
    notes.forEach(note => { 
        let contactHTML = note.phone ? `<div style="display:flex; gap:10px; margin-bottom:10px;"><a href="tel:${note.phone}" class="icon-btn" style="color:var(--primary);"><i class="fa-solid fa-phone"></i></a><a href="https://wa.me/${note.phone.replace(/\+/g,'')}" target="_blank" class="icon-btn" style="color:#25D366;"><i class="fa-brands fa-whatsapp"></i></a></div>` : '';
        container.innerHTML += `<div class="note-card" onclick="editNote(${note.id})"><button class="delete-note no-print" onclick="event.stopPropagation(); deleteNote(${note.id})"><i class="fa-solid fa-trash"></i></button><span class="note-date"><i class="fa-solid fa-calendar"></i> ${note.date}</span><h3 style="margin-bottom: 0.5rem;">${note.title}</h3>${contactHTML}<div class="render-area" style="background:none; border:none; padding:0;">${linkify(note.content)}</div></div>`; 
    });
}
document.getElementById('saveNoteBtn').onclick = () => { 
    const t = document.getElementById('noteTitle').value, c = document.getElementById('noteContent').value, d = document.getElementById('noteDate').value, p = document.getElementById('notePhone').value; 
    if(!t && !c) return;
    notes.push({ id: Date.now(), title: t || (currentLang==='ar'?'ملاحظة جديدة':'New Note'), content: c, date: d, phone: p }); 
    saveAll(); document.getElementById('noteModal').classList.remove('show'); stopContinuousDictation(); renderNotes(); 
};
window.deleteNote = id => { notes = notes.filter(n => n.id !== id); saveAll(); renderNotes(); }

window.editNote = (id) => {
    let n = notes.find(x => x.id === id); if(!n) return;
    document.getElementById('editNoteId').value = n.id; document.getElementById('editNoteTitle').value = n.title; document.getElementById('editNoteDate').value = n.date; document.getElementById('editNoteContent').value = n.content; document.getElementById('editNotePhone').value = n.phone || '';
    document.getElementById('editNoteModal').classList.add('show');
};
document.getElementById('updateNoteBtn').onclick = () => {
    let id = parseInt(document.getElementById('editNoteId').value); let n = notes.find(x => x.id === id);
    if(n) { n.title = document.getElementById('editNoteTitle').value; n.date = document.getElementById('editNoteDate').value; n.content = document.getElementById('editNoteContent').value; n.phone = document.getElementById('editNotePhone').value; saveAll(); renderNotes(); document.getElementById('editNoteModal').classList.remove('show'); stopContinuousDictation(); }
};

function renderLibrary() { 
    const container = document.getElementById('libraryContainer');
    container.innerHTML = library.map(l => {
        let contactHTML = l.phone ? `<a href="tel:${l.phone}" style="margin-left:10px; color:var(--primary);"><i class="fa-solid fa-phone"></i></a><a href="https://wa.me/${l.phone.replace(/\+/g,'')}" target="_blank" style="margin-left:10px; color:#25D366;"><i class="fa-brands fa-whatsapp"></i></a>` : '';
        return `<div class="lib-card" onclick="editLib(${l.id})"><button class="icon-btn no-print" style="position:absolute; top:10px; left:10px; color:var(--danger);" onclick="event.stopPropagation(); delLib(${l.id})"><i class="fa-solid fa-trash"></i></button><span class="lib-cat">${l.category}</span><h3>${contactHTML}${l.title}</h3><div class="render-area">${linkify(l.content)}</div></div>`;
    }).join('') || `<p style="text-align:center; color:var(--text-muted); grid-column: 1/-1;">${currentLang==='ar'?'أضف مرجعك الأول.':'Add your first reference.'}</p>`;
}
document.getElementById('saveLibBtn').onclick = () => { 
    let t = document.getElementById('libTitle').value, c = document.getElementById('libCategory').value, text = document.getElementById('libContent').value, p = document.getElementById('libPhone').value; 
    if(!t) return;
    library.push({ id: Date.now(), title: t, category: c || 'عام', content: text, phone: p }); 
    saveAll(); document.getElementById('libraryModal').classList.remove('show'); stopContinuousDictation(); renderLibrary(); 
};
window.delLib = id => { library = library.filter(l => l.id !== id); saveAll(); renderLibrary(); }

window.editLib = (id) => {
    let l = library.find(x => x.id === id); if(!l) return;
    document.getElementById('editLibId').value = l.id; document.getElementById('editLibTitle').value = l.title; document.getElementById('editLibCategory').value = l.category; document.getElementById('editLibContent').value = l.content; document.getElementById('editLibPhone').value = l.phone || '';
    document.getElementById('editLibModal').classList.add('show');
};
document.getElementById('updateLibBtn').onclick = () => {
    let id = parseInt(document.getElementById('editLibId').value); let l = library.find(x => x.id === id);
    if(l) { l.title = document.getElementById('editLibTitle').value; l.category = document.getElementById('editLibCategory').value; l.content = document.getElementById('editLibContent').value; l.phone = document.getElementById('editLibPhone').value; saveAll(); renderLibrary(); document.getElementById('editLibModal').classList.remove('show'); stopContinuousDictation(); }
};

// ==========================================
// برمجة خطة الشهر (المطورة: المزامنة + دعم الاتصال والواتساب)
// ==========================================
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

        // نظام أيقونات الاتصال والواتساب
        let contactIcons = savedPhone ? `
            <div style="display:inline-flex; gap:10px; margin-right:10px;">
                <a href="tel:${savedPhone}" class="no-print" style="color:var(--primary); font-size:1.1rem;"><i class="fa-solid fa-phone"></i></a>
                <a href="https://wa.me/${savedPhone.replace(/\+/g,'')}" target="_blank" class="no-print" style="color:#25D366; font-size:1.1rem;"><i class="fa-brands fa-whatsapp"></i></a>
            </div>` : '';

        dayDiv.innerHTML = `
            <div class="month-day-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>${dayText} ${i} ${mNames[currentMonthView]} <b style="color:var(--primary);">${isTodayText}</b></span>
                ${contactIcons}
            </div>
            <textarea class="multi-line-input no-print" rows="3" data-key="${storageKey}" data-day="${i}" placeholder="${placeholderText}">${savedText}</textarea>
            <input type="tel" class="no-print" value="${savedPhone}" data-phone-key="${phoneKey}" placeholder="${phonePlaceholder}" 
                style="width:100%; margin-top:5px; padding:8px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:0.85rem;">
            <div class="render-area">${linkify(savedText)}</div>`; 
            
        container.appendChild(dayDiv); 
    } 
    
    // ربط أحداث الكتابة في الخطة
    document.querySelectorAll('.multi-line-input').forEach(ta => { 
        ta.oninput = e => { 
            // التعديل هنا للوصول لمنطقة العرض بشكل صحيح بعد إضافة خانة الهاتف
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
            if (typeof currentDailyDate !== 'undefined' && currentDailyDate === targetDateStr && typeof renderDaily === 'function') renderDaily();
        }; 
    }); 

    // ربط أحداث إدخال الهاتف
    document.querySelectorAll('input[data-phone-key]').forEach(inp => {
        inp.onchange = e => {
            localStorage.setItem(e.target.dataset.phoneKey, e.target.value);
            renderMonthly(); // تحديث فوري لإظهار الأيقونات
        };
    });

    if (isCurrentMonth) {
        setTimeout(() => {
            let todayCard = document.getElementById('todayMonthCard');
            if (todayCard) todayCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }
}


// ==========================================
// برمجة مؤقت التركيز (مع فك حظر الصوت الشامل لجميع الأجهزة)
// ==========================================
let pomTimer, targetTime = 0, pomTimeLeft = 25 * 60, isPomRunning = false, pomMode = 'work', workDuration = 25;

function initPomodoro() { 
    const d = document.getElementById('timerDisplay'); 
    const wd = document.getElementById('pomWorkDuration'); 
    const alarm = document.getElementById('pomAlarmSound'); 
    const stopBtn = document.getElementById('stopAlarmBtn'); 
    const startBtn = document.getElementById('pomStart'); 
    const pauseBtn = document.getElementById('pomPause');

    // --- بداية كود فك حظر الصوت الشامل (للموبايل والماك) ---
    const unlockAudio = () => {
        if(alarm) {
            alarm.load(); // إجبار المتصفح على سحب ملف الصوت
            alarm.volume = 1.0;
            alarm.play().then(() => {
                alarm.pause();
                alarm.currentTime = 0;
            }).catch(e => { /* تجاهل الخطأ الصامت */ });
        }
        // إزالة مستمع الحدث بعد أول لمسة لعدم إرهاق التطبيق
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
    };
    // ربط فك الحظر بأول لمسة أو نقرة في أي مكان بالتطبيق
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });
    // --- نهاية كود فك الحظر ---

    const updateTimeDisplay = () => { d.innerText = `${Math.floor(pomTimeLeft/60).toString().padStart(2,'0')}:${(pomTimeLeft%60).toString().padStart(2,'0')}`; }; 
    document.getElementById('pomMinus').onclick = () => { if(!isPomRunning && workDuration > 15) { workDuration -= 5; if(pomMode==='work'){ pomTimeLeft = workDuration*60; updateTimeDisplay();} wd.innerText = workDuration; } }; 
    document.getElementById('pomPlus').onclick = () => { if(!isPomRunning && workDuration < 60) { workDuration += 5; if(pomMode==='work'){ pomTimeLeft = workDuration*60; updateTimeDisplay();} wd.innerText = workDuration; } }; 
    
    const setMode = (m, mins) => { 
        clearInterval(pomTimer); isPomRunning=false; pomMode=m; pomTimeLeft=mins*60; updateTimeDisplay(); 
        document.getElementById('pomWork').classList.toggle('active', m==='work'); 
        document.getElementById('pomBreak').classList.toggle('active', m==='break'); 
        startBtn.style.display = 'inline-flex'; pauseBtn.style.display = 'inline-flex'; stopBtn.style.display = 'none'; 
        if(alarm) { alarm.pause(); alarm.currentTime = 0; }
    }; 
    
    document.getElementById('pomWork').onclick = () => setMode('work', workDuration); 
    document.getElementById('pomBreak').onclick = () => setMode('break', 5); 
    
    startBtn.onclick = () => { 
        if(isPomRunning) return;
        const tomato = document.getElementById('tomatoIcon'); if(tomato) tomato.classList.add('running'); 
        
        // محاولة إضافية لفك الحظر عند الضغط على "ابدأ" كإجراء احتياطي
        if(alarm) { alarm.play().then(()=>alarm.pause()).catch(e=>{}); }
        
        isPomRunning = true; 
        targetTime = Date.now() + (pomTimeLeft * 1000); 
        pomTimer = setInterval(() => { 
            let remaining = Math.round((targetTime - Date.now()) / 1000); 
            if(remaining <= 0) { 
                clearInterval(pomTimer); 
                isPomRunning=false; 
                pomTimeLeft=0; 
               updateTimeDisplay(); 
                const tomato = document.getElementById('tomatoIcon'); if(tomato) tomato.classList.remove('running');
                
                // تسجيل الجلسة المكتملة برمجياً
                if(window.logPomodoroSession) window.logPomodoroSession(pomMode, pomMode === 'work' ? workDuration : 5);
                
                // تشغيل الصوت بقوة عند انتهاء الوقت
                if(alarm) { alarm.currentTime = 0; alarm.play().catch(e=>console.log("Audio Play Blocked:", e)); }
                
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
    stopBtn.onclick = () => { if(alarm){ alarm.pause(); alarm.currentTime = 0;
} const tomato = document.getElementById('tomatoIcon'); if(tomato) tomato.classList.remove('running'); setMode(pomMode === 'work' ? 'break' : 'work', pomMode === 'work' ? 5 : workDuration); };
    
    updateTimeDisplay(); 
}

// ==========================================
// برمجة المشاريع Kanban (مع الأقسام الفرعية، التعديل، والحذف)
// ==========================================
function renderKanban() {
    ['todo', 'inprogress', 'done'].forEach(col => {
        const container = document.querySelector(`.kanban-items[data-status="${col}"]`);
        if(!container) return;
        
        container.innerHTML = kanbanTasks[col].map(i => {
            let subs = i.subtasks || [];
            
            // رسم الأقسام الفرعية مع أزرار التعديل والحذف الجديدة
            let subsHTML = subs.map((sub, idx) => `
                <div style="display:flex; align-items:center; gap:8px; margin-top:8px; padding: 5px; background: var(--bg-main); border-radius: 4px; border: 1px solid var(--border-color);">
                    <input type="checkbox" ${sub.done ? 'checked' : ''} onchange="toggleSubtask(${i.id}, '${col}', ${idx})" style="cursor:pointer; width: 15px; height: 15px;">
                    <span style="flex:1; text-decoration: ${sub.done ? 'line-through' : 'none'}; color: ${sub.done ? 'var(--text-muted)' : 'var(--text-main)'}; font-size: 0.9rem; white-space: pre-wrap; word-break: break-word;">${sub.text}</span>
                    <button onclick="editSubtask(${i.id}, '${col}', ${idx})" class="icon-btn no-print" style="font-size:0.8rem; color:var(--text-muted);" title="تعديل الفرعي"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="delSubtask(${i.id}, '${col}', ${idx})" class="icon-btn no-print" style="font-size:0.8rem; color:var(--danger);" title="حذف الفرعي"><i class="fa-solid fa-trash"></i></button>
                </div>
            `).join('');

            return `<div class="kb-card" draggable="true" ondragstart="drag(event, ${i.id}, '${col}')" style="cursor:grab; border-right: 4px solid var(--primary);">
                <div style="display:flex; justify-content:space-between; align-items: flex-start; margin-bottom:5px;">
                    <strong style="font-size: 1rem; flex:1;">${i.text}</strong>
                    <div style="display:flex; gap:8px; align-items: center;">
                        ${i.phone ? `<a href="https://wa.me/${i.phone.replace(/\+/g,'')}" target="_blank" class="no-print" style="color:#25D366; font-size:1.2rem;"><i class="fa-brands fa-whatsapp"></i></a>` : ''}
                        <button onclick="moveKb(${i.id}, '${col}', -1)" class="icon-btn no-print" style="color:var(--text-main);" title="نقل للسابق"><i class="fa-solid fa-arrow-right"></i></button>
                        <button onclick="addSubtask(${i.id}, '${col}')" class="icon-btn no-print" style="color:var(--primary);" title="إضافة قسم فرعي"><i class="fa-solid fa-plus"></i></button>
                        <button onclick="editKb(${i.id}, '${col}')" class="icon-btn no-print" style="color:var(--text-muted);" title="تعديل المشروع"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="delKb(${i.id}, '${col}')" class="icon-btn no-print" style="color:var(--danger);" title="حذف المشروع"><i class="fa-solid fa-trash"></i></button>
                        <button onclick="moveKb(${i.id}, '${col}', 1)" class="icon-btn no-print" style="color:var(--text-main);" title="نقل للتالي"><i class="fa-solid fa-arrow-left"></i></button>
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    ${subsHTML}
                </div>
            </div>`;
        }).join('');
    });
}

// 1. إضافة، حذف، ونقل المشاريع الرئيسية
window.addKanbanItem = () => { 
    const inp = document.getElementById('newKbItem'); 
    if(inp && inp.value.trim()) { 
        kanbanTasks.todo.push({id: Date.now(), text: inp.value.trim(), subtasks: []}); 
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

// 2. كود السحب والإفلات (Drag & Drop)
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

// 3. تعديل المشروع الرئيسي
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
    if(k) { k.text = document.getElementById('editKbText').value; saveAll(); renderKanban(); document.getElementById('editKbModal').classList.remove('show'); } 
};

// 4. العمليات على الأقسام الفرعية (إضافة، تحديد، تعديل، حذف)
window.addSubtask = (id, col) => {
    let text = prompt(currentLang === 'ar' ? 'أدخل اسم القسم/المهمة الفرعية:' : 'Enter subtask name:');
    if(text && text.trim()) {
        let task = kanbanTasks[col].find(t => t.id === id);
        if(!task.subtasks) task.subtasks = [];
        task.subtasks.push({text: text.trim(), done: false});
        saveAll(); renderKanban();
    }
};
window.toggleSubtask = (id, col, subIdx) => {
    let task = kanbanTasks[col].find(t => t.id === id);
    task.subtasks[subIdx].done = !task.subtasks[subIdx].done;
    saveAll(); renderKanban();
};
window.editSubtask = (id, col, subIdx) => {
    let task = kanbanTasks[col].find(t => t.id === id);
    let oldText = task.subtasks[subIdx].text;
    let newText = prompt(currentLang === 'ar' ? 'تعديل القسم الفرعي:' : 'Edit subtask:', oldText);
    if(newText && newText.trim()) {
        task.subtasks[subIdx].text = newText.trim();
        saveAll(); renderKanban();
    }
};
window.delSubtask = (id, col, subIdx) => {
    if(confirm(currentLang === 'ar' ? 'هل أنت متأكد من حذف هذا القسم الفرعي؟' : 'Are you sure you want to delete this subtask?')) {
        let task = kanbanTasks[col].find(t => t.id === id);
        task.subtasks.splice(subIdx, 1);
        saveAll(); renderKanban();
    }
};

function renderDashboard() { 
    let dashClearedStr = localStorage.getItem('fp_dash_cleared');
    let activeTasks = (dashClearedStr === currentTodayStr) ? [] : tasks.filter(t => t.date === currentTodayStr); 
    let completed = activeTasks.filter(t => t.completed).length;
    let dtEl = document.getElementById('dashTasks');
    if(dtEl) dtEl.innerText = `${completed} / ${activeTasks.length}`;
    
    // أنيميشن دائرة المهام
    let tPercent = activeTasks.length > 0 ? (completed / activeTasks.length) * 100 : 0;
    let fillT = document.getElementById('fillTasks');
    if(fillT) fillT.setAttribute('stroke-dasharray', `${tPercent}, 100`);
    
    let todayWorkBlocks = 0;
    if(typeof pomodoroLog !== 'undefined') { todayWorkBlocks = pomodoroLog.filter(log => log.date === currentTodayStr && log.type === 'work').length; }
    const dashPomEl = document.getElementById('dashPomodoro');
    if(dashPomEl) dashPomEl.innerText = todayWorkBlocks; 

    // أنيميشن دائرة البومودورو (نفترض أن الهدف اليومي 8 جلسات)
    let pPercent = todayWorkBlocks >= 8 ? 100 : (todayWorkBlocks / 8) * 100;
    let fillP = document.getElementById('fillPomodoro');
    if(fillP) fillP.setAttribute('stroke-dasharray', `${pPercent}, 100`);

    let tHC = 0; let dHC = 0;
    if(typeof habits !== 'undefined') { habits.forEach(h => { for(let i=1; i<=30; i++) { tHC++; if(h.days[`${currentYearView}-${currentMonthView}-${i}`]) dHC++; } }); }
    let dhEl = document.getElementById('dashHabits');
    let habitPercentValue = tHC === 0 ? 0 : Math.round((dHC/tHC)*100);
    if(dhEl) dhEl.innerText = `${habitPercentValue}%`;
    
    // أنيميشن دائرة العادات
    let fillH = document.getElementById('fillHabits');
    if(fillH) fillH.setAttribute('stroke-dasharray', `${habitPercentValue}, 100`);

    let balance = 0; let totalIncome = 0;
    if(typeof finances !== 'undefined') { 
        finances.forEach(curr => {
            let amt = Number(curr.amount);
            if(curr.type === 'income') { balance += amt; totalIncome += amt; } 
            else { balance -= amt; }
        });
    }
    let dbEl = document.getElementById('dashBalance');
    if(dbEl) dbEl.innerText = `${balance}`; 

    // أنيميشن دائرة الرصيد (تقيس الرصيد المتبقي مقارنة بإجمالي الدخل)
    let bPercent = totalIncome > 0 ? Math.max(0, (balance / totalIncome) * 100) : (balance > 0 ? 100 : 0);
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
function renderFinance() { 
    const container = document.getElementById('financeContainer'); 
    let inc = 0, exp = 0;
    
    let html = finances.sort((a,b) => new Date(b.date) - new Date(a.date)).map(f => { 
        if(f.type === 'income') inc += Number(f.amount); 
        else exp += Number(f.amount); 
        
        let icon = f.type === 'income' ? '<i class="fa-solid fa-arrow-trend-up"></i>' : '<i class="fa-solid fa-arrow-trend-down"></i>'; 
        let bgStyle = f.type === 'income' ? 'border: 1px solid var(--success); background-color: rgba(16, 185, 129, 0.05);' : 'border: 1px solid var(--danger); background-color: rgba(239, 68, 68, 0.05);'; 
        // زر التصنيف (Category Badge) الأنيق
        let catBadge = f.category ? `<span style="background:var(--bg-color); padding:3px 8px; border-radius:6px; font-size:0.75rem; margin-right:8px; border:1px solid var(--border-color);">${f.category}</span>` : '';
        
        return `<div class="fin-item" style="cursor:pointer; transition: all 0.3s ease; ${bgStyle}" onclick="editFin(${f.id})">
            <div>
                <small>${f.date}</small><br>
                <b>${f.desc}</b> ${catBadge}
            </div>
            <div style="display:flex; align-items:center; gap:15px;">
                <span class="fin-amt ${f.type === 'income' ? 'inc' : 'exp'}">${icon} ${f.amount}</span>
                <button class="icon-btn no-print" onclick="event.stopPropagation(); delFin(${f.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`; 
    }).join('');
    
    document.getElementById('totalIncome').innerText = inc; 
    document.getElementById('totalExpense').innerText = exp; 
    document.getElementById('netBalance').innerText = inc - exp; 
    container.innerHTML = html || `<p style="text-align:center; color:var(--text-muted);">${currentLang==='ar'?'لا توجد معاملات.':'No transactions yet.'}</p>`; 
}

document.getElementById('saveFinBtn').onclick = () => { 
    let desc = document.getElementById('finDesc').value; 
    let amt = document.getElementById('finAmount').value;
    let catEl = document.getElementById('finCategory');
    let cat = catEl ? catEl.value : 'أخرى';

    if(!desc || !amt) return; 
    finances.push({ 
        id: Date.now(), 
        desc: desc, 
        amount: amt, 
        type: document.getElementById('finType').value, 
        category: cat,
        date: document.getElementById('finDate').value 
    }); 
    saveAll(); 
    document.getElementById('financeModal').classList.remove('show'); 
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
    let catEl = document.getElementById('editFinCategory');
    if(catEl) catEl.value = f.category || 'أخرى';
    document.getElementById('editFinDate').value = f.date; 
    document.getElementById('editFinModal').classList.add('show');
    setTimeout(() => { if(window.updateFinColor) updateFinColor('editFinType', 'editFinAmount'); }, 50); 
};

document.getElementById('updateFinBtn').onclick = () => { 
    let id = parseInt(document.getElementById('editFinId').value);
    let desc = document.getElementById('editFinDesc').value; 
    let amt = document.getElementById('editFinAmount').value; 
    if(!desc || !amt) return; 
    
    let f = finances.find(x => x.id === id);
    if(f) { 
        f.desc = desc; 
        f.amount = amt; 
        f.type = document.getElementById('editFinType').value; 
        let catEl = document.getElementById('editFinCategory');
        if(catEl) f.category = catEl.value;
        f.date = document.getElementById('editFinDate').value; 
        saveAll(); 
        renderFinance(); 
        renderDashboard(); 
        document.getElementById('editFinModal').classList.remove('show'); 
    } 
};

window.delFin = id => { 
    finances = finances.filter(f => f.id !== id); 
    saveAll(); 
    renderFinance(); 
    renderDashboard();
};
function renderHabits() { let dim = new Date(currentYearView, currentMonthView + 1, 0).getDate(); let habitText = currentLang === 'ar' ? 'العادة' : 'Habit'; let html = `<table class="habit-table"><thead><tr><th>${habitText}</th>`; for(let i=1; i<=dim; i++) html += `<th>${i}</th>`; html += `</tr></thead><tbody>`; habits.forEach(h => { html += `<tr><td class="habit-name"><button class="icon-btn no-print" style="color:red;" onclick="delHabit(${h.id})">x</button> ${h.name}</td>`; for(let i=1; i<=dim; i++) { let k = `${currentYearView}-${currentMonthView}-${i}`; html += `<td><div class="habit-check ${h.days[k]?'done':''}" onclick="toggleHabit(${h.id}, '${k}')">✓</div></td>`; } html += `</tr>`; }); document.getElementById('habitsContainer').innerHTML = html + `</tbody></table>`; }
window.addNewHabit = () => { const inp = document.getElementById('newHabitInput'); if(inp.value.trim()){ habits.push({id:Date.now(), name:inp.value, days:{}}); saveAll(); inp.value=''; renderHabits(); renderDashboard(); } }
window.toggleHabit = (id, k) => { let h = habits.find(x=>x.id===id); h.days[k] = !h.days[k]; saveAll(); renderHabits(); renderDashboard(); }
window.delHabit = id => { habits = habits.filter(h=>h.id!==id); saveAll(); renderHabits(); renderDashboard(); }
function initProfile() { document.getElementById('profileName').value = profile.name; document.getElementById('saveProfileBtn').onclick = () => { profile.name = document.getElementById('profileName').value; saveAll(); alert(currentLang === 'ar' ? "تم الحفظ!" : "Saved!"); }; }
function initBackup() { document.getElementById('backupBtn').onclick = () => { let d = {}; for(let i=0;i<localStorage.length;i++) d[localStorage.key(i)] = localStorage.getItem(localStorage.key(i)); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], {type:"application/json"})); a.download = `Backup.json`; a.click(); }; document.getElementById('restoreFile').onchange = e => { const r = new FileReader(); r.onload = ev => { const d = JSON.parse(ev.target.result); for(let k in d) localStorage.setItem(k, d[k]); location.reload(); }; r.readAsText(e.target.files[0]); }; }
function initModals() { document.querySelectorAll('.close-modal').forEach(b => b.onclick = () => { document.querySelectorAll('.modal').forEach(m => m.classList.remove('show')); stopContinuousDictation(); }); }
function initTheme() { if(localStorage.getItem('dark_mode')==='true') document.body.classList.add('dark-mode'); document.getElementById('themeToggle').onclick = () => { document.body.classList.toggle('dark-mode'); localStorage.setItem('dark_mode', document.body.classList.contains('dark-mode')); }; }

window.changeFontSize = (size) => {
    document.documentElement.style.fontSize = size;
    localStorage.setItem('plannerFontSize', size);
};

// ==========================================
// برمجة سجل التحديثات والبحث اليدوي
// ==========================================
window.renderChangelog = () => {
    const container = document.getElementById('changelogContainer');
    if(!container) return;
    const notesTitle = currentLang === 'ar' ? '<strong style="color:var(--primary);">ميزات الإصدار الأخير:</strong><br>' : '<strong style="color:var(--primary);">Latest Version Features:</strong><br>';
    const notesList = latestReleaseNotes[currentLang].map(note => `- ${note}`).join('<br>');
    container.innerHTML = notesTitle + notesList;
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
                            // إذا كان هناك تحديث تم تأجيله، قم بتفعيله الآن
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
    if(typeEl && amtEl) {
        if(typeEl.value === 'income') {
            typeEl.style.color = 'var(--success)'; typeEl.style.borderColor = 'var(--success)'; typeEl.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
            amtEl.style.color = 'var(--success)'; amtEl.style.borderColor = 'var(--success)'; amtEl.style.backgroundColor = 'rgba(16, 185, 129, 0.05)';
        } else {
            typeEl.style.color = 'var(--danger)'; typeEl.style.borderColor = 'var(--danger)'; typeEl.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
            amtEl.style.color = 'var(--danger)'; amtEl.style.borderColor = 'var(--danger)'; amtEl.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
        }
    }
};

// ==========================================
// تصدير التقارير الاحترافية ثنائية اللغة (Excel & PDF) مع المجاميع
// ==========================================
window.exportFinanceExcel = () => {
    if(finances.length === 0) return alert(currentLang === 'ar' ? 'لا توجد بيانات لتصديرها' : 'No data to export');
    
    let inc = 0, exp = 0;
    const sortedFinances = [...finances].sort((a,b) => new Date(b.date) - new Date(a.date));
    
    // قاموس الترجمة الديناميكي لملف الإكسيل حسب لغة التطبيق
    const labels = {
        ar: { date: 'التاريخ', desc: 'الوصف', type: 'النوع', amt: 'المبلغ', inc: 'إيراد (+)', exp: 'مصروف (-)', totalInc: 'إجمالي الدخل الشامل', totalExp: 'إجمالي المصروفات الشاملة', balance: 'الرصيد المتبقي المتاح' },
        en: { date: 'Date', desc: 'Description', type: 'Type', amt: 'Amount', inc: 'Income (+)', exp: 'Expense (-)', totalInc: 'Total Aggregated Income', totalExp: 'Total Aggregated Expenses', balance: 'Remaining Net Balance' }
    }[currentLang];

    // 1. بناء صفوف المعاملات المالية
    const rows = sortedFinances.map(f => {
        const amtNum = Number(f.amount);
        if(f.type === 'income') inc += amtNum; else exp += exp + amtNum; // حساب تجميعي حقيقي للتحقق
        return {
            [labels.date]: f.date,
            [labels.desc]: f.desc,
            [labels.type]: f.type === 'income' ? labels.inc : labels.exp,
            [labels.amt]: amtNum
        };
    });

    // إعادة حساب دقيقة للمجاميع الكلية لضمان عدم حدوث خطأ تكراري
    let finalInc = finances.reduce((acc, c) => c.type === 'income' ? acc + Number(c.amount) : acc, 0);
    let finalExp = finances.reduce((acc, c) => c.type === 'expense' ? acc + Number(c.amount) : acc, 0);

    // 2. إضافة صف فارغ كفاصل بصري احترافي
    rows.push({ [labels.date]: '', [labels.desc]: '', [labels.type]: '', [labels.amt]: '' });

    // 3. حقن بنود المجاميع المجمعة والرصيد المتبقي في نهاية الجدول المالي
    rows.push({ [labels.date]: labels.totalInc, [labels.desc]: '', [labels.type]: '', [labels.amt]: finalInc });
    rows.push({ [labels.date]: labels.totalExp, [labels.desc]: '', [labels.type]: '', [labels.amt]: finalExp });
    rows.push({ [labels.date]: labels.balance, [labels.desc]: '', [labels.type]: '', [labels.amt]: finalInc - finalExp });

    // تحويل البيانات لملف الشيت وتصديره
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentLang === 'ar' ? "التقرير المالي الكلي" : "Comprehensive Finance Report");
    XLSX.writeFile(wb, currentLang === 'ar' ? "تقرير_المتتبع_المالي_الشامل.xlsx" : "Planner_Comprehensive_Finance_Report.xlsx");
};

window.exportFinancePDF = () => {
    if(finances.length === 0) return alert(currentLang === 'ar' ? 'لا توجد بيانات لتصديرها' : 'No data to export');
    
    const element = document.createElement('div');
    element.style.padding = '30px';
    element.style.direction = currentLang === 'ar' ? 'rtl' : 'ltr';
    element.style.fontFamily = 'Inter, sans-serif';
    
    // قاموس ترجمة الهيدر والعناوين للـ PDF
    const labels = {
        ar: { title: 'تقرير الإدارة المالية الشامل', inc: 'إجمالي الدخل الشامل', exp: 'إجمالي المصروفات الشاملة', bal: 'صافي الرصيد المتبقي', date: 'التاريخ', desc: 'البيان / الوصف', amt: 'القيمة المادية' },
        en: { title: 'Comprehensive Financial Management Report', inc: 'Total Gross Income', exp: 'Total Gross Expenses', bal: 'Net Remaining Balance', date: 'Date', desc: 'Description / Item', amt: 'Financial Value' }
    }[currentLang];

    let inc = finances.reduce((acc, c) => c.type === 'income' ? acc + Number(c.amount) : acc, 0);
    let exp = finances.reduce((acc, c) => c.type === 'expense' ? acc + Number(c.amount) : acc, 0);
    
    let rows = [...finances].sort((a,b) => new Date(b.date) - new Date(a.date)).map(f => {
        let color = f.type === 'income' ? '#10b981' : '#ef4444';
        let sign = f.type === 'income' ? '+' : '-';
        return `<tr style="border-bottom:1px solid #e5e7eb; transition: 0.2s;">
            <td style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'right' : 'left'}; color:#4b5563;">${f.date}</td>
            <td style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'right' : 'left'}; font-weight:500;">${f.desc}</td>
            <td style="padding:12px 10px; color:${color}; font-weight:700; text-align:${currentLang === 'ar' ? 'left' : 'right'};" dir="ltr">${f.amount} ${sign}</td>
        </tr>`;
    }).join('');

    element.innerHTML = `
        <div style="text-align:center; margin-bottom:30px; border-bottom: 3px solid #25D366; padding-bottom: 15px;">
            <h1 style="color:#111827; margin:0; font-size: 24px; font-weight:700;">Planner Pro Max</h1>
            <h3 style="color:#6b7280; margin-top:5px; font-size: 14px; letter-spacing: 0.5px;">${labels.title}</h3>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:30px; background:#f9fafb; padding:20px; border-radius:12px; border:1px solid #e5e7eb; gap: 15px;">
            <div style="text-align:center; flex:1;">
                <strong style="color:#4b5563; font-size:12px; display:block; margin-bottom:5px;">${labels.inc}</strong>
                <span style="color:#10b981; font-size:1.4rem; font-weight:700;">${inc}</span>
            </div>
            <div style="text-align:center; flex:1; border-right:1px solid #e5e7eb; border-left:1px solid #e5e7eb;">
                <strong style="color:#4b5563; font-size:12px; display:block; margin-bottom:5px;">${labels.exp}</strong>
                <span style="color:#ef4444; font-size:1.4rem; font-weight:700;">${exp}</span>
            </div>
            <div style="text-align:center; flex:1;">
                <strong style="color:#4b5563; font-size:12px; display:block; margin-bottom:5px;">${labels.bal}</strong>
                <span style="color:#25D366; font-size:1.4rem; font-weight:800;">${inc - exp}</span>
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
        filename: currentLang === 'ar' ? 'تقرير_المتتبع_المالي_الشامل.pdf' : 'Comprehensive_Finance_Report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2.5, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
};

// ==========================================================================
// برمجيات سجل البومودورو المطور والتصدير الديناميكي ثنائي اللغة (Excel & PDF)
// ==========================================================================

// دالة ذكية تقوم بتحويل وتنسيق الوقت المخزن ديناميكياً ليدعم اللغتين (AM/PM أو ص/م) بكفاءة
window.getFormattedTime = (logTime, lang) => {
    if (!logTime) return '';
    let hours = 0, minutes = 0;
    
    // التحقق إذا كان الوقت مخزناً بصيغة 24 ساعة الموحدة الجديدة
    const match24 = logTime.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
        hours = parseInt(match24[1], 10);
        minutes = parseInt(match24[2], 10);
    } else {
        // معالجة البيانات القديمة المخزنة مسبقاً (عربي أو إنجليزي) وتحويل أرقامها هندسياً
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
            return logTime; // العودة للنص الأصلي كخطة بديلة لحماية البيانات
        }
    }
    
    const dateObj = new Date();
    dateObj.setHours(hours);
    dateObj.setMinutes(minutes);
    return dateObj.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
};

window.logPomodoroSession = (type, duration) => {
    const now = new Date();
    // حفظ الوقت الجديد بصيغة 24 ساعة القياسية لسهولة ترجمتها بأي لغة لاحقاً
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
                        <small style="color:var(--text-muted); font-size:0.75rem;"><i class="fa-regular fa-calendar"></i> ${log.date} | <i class="fa-regular fa-clock"></i> ${displayTime}</small>
                    </div>
                </div>
                <span style="background:${badgeColor}; color:${textColor}; padding:4px 8px; border-radius:6px; font-weight:700; font-size:0.8rem;">${log.duration} ${minText}</span>
            </div>
        `;
    }).join('');
};

window.clearPomodoroLog = () => {
    if(confirm(currentLang === 'ar' ? 'هل تريد مسح سجل جلسات التركيز بالكامل؟' : 'Are you sure you want to completely clear the focus log?')) {
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
            <td style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'right' : 'left'}; color:#4b5563;">${log.date}</td>
            <td style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'right' : 'left'}; color:#4b5563;">${displayTime}</td>
            <td style="padding:12px 10px; text-align:${currentLang === 'ar' ? 'right' : 'left'}; font-weight:600; color:${color};">${textStr}</td>
            <td style="padding:12px 10px; font-weight:700; text-align:${currentLang === 'ar' ? 'left' : 'right'}; color:#111827;">${log.duration} ${minText}</td>
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

// ==========================================================================
// برمجيات زر تفريغ الدماغ السريع (Quick Brain Dump) ⚡
// ==========================================================================
window.openQuickDump = () => {
    document.getElementById('qdTitle').value = '';
    document.getElementById('qdContent').value = '';
    document.getElementById('quickDumpModal').classList.add('show');
    // تركيز تلقائي على مربع العنوان لسرعة الكتابة
    setTimeout(() => { document.getElementById('qdTitle').focus(); }, 300);
};

document.getElementById('saveQdToKanban').onclick = () => {
    let title = document.getElementById('qdTitle').value.trim();
    let content = document.getElementById('qdContent').value.trim();
    if(!title && !content) return;
    
    // إنشاء عنوان وتاريخ تلقائي إذا لم يكتب المستخدم عنواناً
    let finalTitle = title || (currentLang === 'ar' ? `فكرة سريعة (${getTodayStr()})` : `Quick Idea (${getTodayStr()})`);
    let fullText = content ? `📌 ${finalTitle}\n\n${content}` : `📌 ${finalTitle}`;
    
    // حفظ في قسم الأفكار والمشاريع
    kanbanTasks.todo.unshift({id: Date.now(), text: fullText, subtasks: []});
    saveAll();
    renderKanban();
    
    document.getElementById('quickDumpModal').classList.remove('show');
    stopContinuousDictation();
    // توجيه المستخدم لصفحة المشاريع ليرى فكرته
    document.querySelector('.nav-item[data-target="kanbanView"]').click();
};

document.getElementById('saveQdToNotes').onclick = () => {
    let title = document.getElementById('qdTitle').value.trim();
    let content = document.getElementById('qdContent').value.trim();
    if(!title && !content) return;
    
    let finalTitle = title || (currentLang === 'ar' ? `فكرة سريعة (${getTodayStr()})` : `Quick Idea (${getTodayStr()})`);
    
    // حفظ في قسم الملاحظات
    notes.unshift({ id: Date.now(), title: finalTitle, content: content, date: getTodayStr(), phone: '' });
    saveAll();
    renderNotes();
    
    document.getElementById('quickDumpModal').classList.remove('show');
    stopContinuousDictation();
    // توجيه المستخدم لصفحة الملاحظات ليرى فكرته
    document.querySelector('.nav-item[data-target="notesView"]').click();
};