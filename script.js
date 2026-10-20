// 1. سجل التحديثات
const latestReleaseNotes = {
    ar: [
        "📥 قسم جديد «الإشعارات»: يعرض الإشعارات الفائتة والقادمة خلال 24 ساعة (مهام، اشتراكات، عادات، مؤقت التركيز)، وعند مرور وقت القادم يتحول تلقائياً إلى فائت بلون مختلف.",
        "👁️ إمكانية تحديد الإشعار كمقروء أو غير مقروء، وحذفه، أو تحديد/حذف الكل، مع عدّاد للإشعارات غير المقروءة في القائمة.",
        "🖼️ شعار التطبيق صار يظهر كأيقونة للموقع في التبويب والمفضلة وعند التثبيت على الشاشة الرئيسية."
    ],
    en: [
        "📥 New «Notifications» section: shows missed and upcoming alerts within 24 hours (tasks, subscriptions, habits, focus timer). When an upcoming alert's time passes it automatically becomes missed, in a different color.",
        "👁️ Mark alerts as read or unread, delete them, or mark/delete all, with an unread counter in the menu.",
        "🖼️ The app logo now shows as the site icon in the browser tab, bookmarks and when installed on the home screen."
    ]
};

const APP_VERSION = 'v42';
function checkAndShowChangelog() {
    const savedVersion = localStorage.getItem('fp_version');
    if(savedVersion !== APP_VERSION) {
        setTimeout(() => {
            const content = document.getElementById('changelogContent');
            if(content) {
                content.innerHTML = latestReleaseNotes[currentLang].map(n => `✅ ${escapeHtml(n)}`).join('<br><br>');
                document.getElementById('changelogModal').classList.add('show');
            }
            // تنظيف تكرار قديم: v34 وv36 وv37 كانوا بيعرضوا نفس البنود دي مقسّمة/مكررة، فبنشيلهم من السجل عشان مايتلخبطش المستخدم
            updateLog = updateLog.filter(u => u.version !== 'v34' && u.version !== 'v36' && u.version !== 'v37');
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

// تحديث نص حالة المزامنة عند تغيير اللغة (بدون إعادة تحميل)
window.refreshCloudStatus = () => {
    const cloudStatus = document.getElementById('cloudStatus');
    if (!cloudStatus || !useCloud) return;
    if (currentUser) {
        cloudStatus.innerHTML = `<span style="color:var(--success); font-weight:bold;"><i class="fa-solid fa-cloud-check"></i> ${currentLang === 'ar' ? 'متصل كـ:' : 'Connected as:'} ${escapeHtml(currentUser.email)}</span> <button onclick="logoutCloud()" class="btn btn-secondary" style="padding:5px 10px; font-size:0.8rem; color: var(--danger);">${currentLang === 'ar' ? 'خروج آمن' : 'Logout'}</button>`;
    } else {
        cloudStatus.innerHTML = `<span style="color:var(--text-muted);"><i class="fa-solid fa-cloud-arrow-up"></i> ${currentLang === 'ar' ? 'غير متصل' : 'Offline'}</span> <button onclick="document.getElementById('authModal').classList.add('show')" class="btn btn-primary" style="padding:5px 10px; font-size:0.85rem;">${currentLang === 'ar' ? 'دخول للمزامنة' : 'Login to Sync'}</button>`;
    }
};

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
        q_urgent: "عاجل", q_important: "مهم", q_delegate: "مفوّض", q_cancelled: "ملغي", q_all: "الكل", q_filter: "تصفية حسب التصنيف", q_add_ph: "أضف مهمة سريعة لهذا اليوم...", q_none: "بدون تصنيف",
cat_subscriptions: "📱 اشتراكات", nav_subs: "الاشتراكات", title_subs: "الاشتراكات 📱", sub_active: "نشطة", sub_archive: "المحفوظات", sub_add: "إضافة اشتراك", sub_name: "اسم الاشتراك", sub_freq: "الدورية", sub_daily: "يومي", sub_weekly: "أسبوعي", sub_monthly: "شهري", sub_yearly: "سنوي", sub_count: "عدد الدورات", sub_total: "المبلغ الكلي", sub_per_cycle: "المبلغ لكل دورة", sub_start: "تاريخ البداية", sub_end: "تاريخ النهاية", sub_next: "الدفعة القادمة", sub_notes: "ملاحظات", sub_save: "حفظ", sub_confirm_pay: "تأكيد الدفع", sub_paid: "مدفوع", sub_edit: "تعديل", sub_delete: "حذف", sub_empty: "لا توجد اشتراكات نشطة.", sub_archive_empty: "لا توجد اشتراكات في المحفوظات.", sub_export_pdf: "تصدير PDF", sub_export_excel: "تصدير Excel", sub_cycles_paid: "دورات مدفوعة",
        nav_updates: "التحديثات", title_updates: "سجل تحديثات التطبيق 🔄",
pareto_title: "قاعدة 80/20 📌", pareto_cumulative: "التراكمي %", pareto_stuck_title: "📌 قاعدة 80/20: مشاريع شايلة وقتك", pareto_stuck_none: "مفيش مشاريع قديمة عالقة، تمام كده!",
notif_enable: "تفعيل الإشعارات", notif_enabled_msg: "الإشعارات شغالة ✅", notif_denied_msg: "تم رفض صلاحية الإشعارات من المتصفح", notif_urgent_title: "⏰ مهمة عاجلة", notif_sub_title: "📱 اشتراك مستحق الدفع", notif_habit_title: "✅ متتبع العادات", notif_habit_body: "لسه عندك عادات النهاردة متسجلتش", notif_pomodoro_title: "⏱️ خلصت الجلسة", notif_missed_urgent_title: "⏰ مهمة عاجلة فائتة", notif_missed_sub_title: "📱 اشتراك متأخر الدفع", notif_missed_summary_title: "🔔 تنبيهات فائتة", notif_important_title: "⭐ مهمة مهمة", notif_delegate_title: "👥 مهمة مفوّضة", notif_cancelled_title: "🚫 مهمة ملغية", notif_missed_important_title: "⭐ مهمة مهمة فائتة", notif_missed_delegate_title: "👥 مهمة مفوّضة فائتة", notif_missed_cancelled_title: "🚫 مهمة ملغية فائتة", nav_notifs: "الإشعارات", title_notifs: "مركز الإشعارات 🔔", notif_c_desc: "الإشعارات الفائتة والقادمة خلال 24 ساعة (قبل وبعد الآن).", notif_c_all: "الكل", notif_c_missed: "فائتة", notif_c_upcoming: "قادمة", notif_c_mark_all: "تحديد الكل كمقروء", notif_c_delete_all: "حذف الكل", notif_c_confirm_delete: "حذف كل الإشعارات المعروضة؟ (المهام نفسها لن تتأثر)", notif_c_empty: "لا توجد إشعارات فائتة أو قادمة خلال 24 ساعة 🎉", notif_c_mark_read: "تحديد كمقروء", notif_c_mark_unread: "تحديد كغير مقروء", notif_c_delete: "حذف الإشعار", notif_c_sub_due: "اشتراك", notif_c_today: "اليوم", notif_c_tomorrow: "غداً", notif_c_yesterday: "أمس", notif_c_pom_running: "جلسة التركيز شغالة", notif_c_pom_ends: "تنتهي الساعة", notif_c_pom_ended: "انتهت جلسة التركيز", notif_c_sub_body: "موعد الدفع", notif_c_in: "بعد", notif_c_ago: "منذ", notif_c_h: "س", notif_c_m: "د", wr_text_tool: "كتابة نص بالكيبورد (اضغط على الورقة، واسحب المربع لنقله)", wr_mic: "إملاء صوتي (تحويل الكلام إلى نص)", wr_done: "تم", wr_text_ph: "اكتب هنا... (الروابط تصبح قابلة للضغط تلقائياً)", wr_dict_lang: "لغة الإملاء الصوتي", wr_link: "إضافة رابط", wr_link_title: "إضافة رابط", wr_link_text_ph: "نص الرابط (اختياري)", wr_link_add: "إضافة", wr_cancel: "إلغاء", wr_link_invalid: "اكتب رابطاً صحيحاً يبدأ بـ http أو https", wr_mic_unsupported: "الإملاء الصوتي غير مدعوم في هذا المتصفح (جرّب Chrome)", wr_mic_denied: "اسمح للمتصفح باستخدام الميكروفون لتفعيل الإملاء", wr_mic_network: "تعذّر الاتصال بخدمة التعرف على الكلام", wr_listening: "🎙️ جارٍ الاستماع...", wr_nav: "لوحة الكتابة", wr_title_h: "لوحة الكتابة ✍️", wr_desc: "اكتب بالقلم أو بإصبعك على ورقة مسطّرة بلا نهاية. تُحفظ لوحاتك على هذا الجهاز.", wr_new: "لوحة جديدة", wr_untitled: "لوحة بدون عنوان", wr_empty: "لا توجد لوحات بعد. اضغط «لوحة جديدة» وابدأ الكتابة.", wr_delete: "حذف اللوحة", wr_confirm_delete: "حذف هذه اللوحة نهائياً؟", wr_back: "رجوع (حفظ تلقائي)", wr_title_ph: "عنوان اللوحة...", wr_undo: "تراجع", wr_redo: "إعادة", wr_pen: "قلم", wr_eraser: "ممحاة (تمسح الخط كله)", wr_color: "لون القلم", wr_thin: "رفيع", wr_med: "وسط", wr_thick: "سميك", wr_mode_write: "الإصبع يكتب", wr_mode_scroll: "الإصبع يمرّر", wr_mode_hint: "بدّل بين الكتابة بالإصبع وتمرير الورقة بالإصبع (إصبعان يمرّران دائماً)", wr_down: "انزل للأسفل", wr_saving: "جارٍ الحفظ...", wr_saved: "تم الحفظ ✓", wr_unavailable: "تعذّر حفظ اللوحات على هذا المتصفح (التخزين المحلي غير متاح).", notif_test_btn: "إرسال إشعار تجريبي", notif_test_title: "🔔 إشعار تجريبي", notif_test_body: "لو شايف الرسالة دي، الإشعارات شغالة على جهازك.",
        nav_health: "الوزن والسعرات", title_health: "الوزن والسعرات ⚖️", w_title: "متابعة الوزن", w_kg: "الوزن (كجم)", w_add: "إضافة وزن", w_goal_title: "🎯 الهدف", w_target: "الوزن المستهدف (كجم)", w_target_date: "تاريخ الوصول للهدف", w_save_goal: "حفظ الهدف", c_title: "🔥 السعرات الحرارية", c_goal: "الهدف اليومي (سعر)", c_desc: "اسم الوجبة / التمرين", c_cal: "السعرات", c_in: "تناولت", c_out: "حرقت", c_add: "إضافة",
        q_time: "التوقيت", fs_label: "حجم الخط داخل التطبيق:", fs_small: "صغير", fs_medium: "متوسط (الافتراضي)", fs_large: "كبير", fs_xlarge: "كبير جداً", dict_ar: "عربي",
        ph_title: "العنوان...", ph_title_plain: "العنوان", ph_phone_opt: "رقم الهاتف (اختياري)...", ph_desc: "الوصف", ph_amount: "المبلغ", ph_category: "التصنيف", ph_email: "البريد الإلكتروني", ph_password: "كلمة المرور (6 حروف على الأقل)", ph_qd_title: "عنوان الفكرة (اختياري)...",
        tt_dic_start: "بدء التسجيل", tt_dic_stop: "إيقاف التسجيل", tt_copy_link: "نسخ الرابط", tt_fab_dump: "تفريغ الدماغ ⚡", tt_daily_goal: "الهدف اليومي",
        auth_forgot: "هل نسيت كلمة المرور؟", auth_login: "دخول", auth_signup: "حساب جديد", changelog_ok: "رائع، شكراً!", share_desc: "شارك التطبيق مع أصدقائك لزيادة إنتاجيتهم!", update_title: "تحديث جديد متاح! ✨"
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
        q_urgent: "Urgent", q_important: "Important", q_delegate: "Delegate", q_cancelled: "Cancelled", q_all: "All", q_filter: "Filter by tag", q_add_ph: "Quick-add a tagged task for this day...", q_none: "No tag",
cat_subscriptions: "📱 Subscriptions", nav_subs: "Subscriptions", title_subs: "Subscriptions 📱", sub_active: "Active", sub_archive: "Archive", sub_add: "Add subscription", sub_name: "Subscription name", sub_freq: "Frequency", sub_daily: "Daily", sub_weekly: "Weekly", sub_monthly: "Monthly", sub_yearly: "Yearly", sub_count: "Number of cycles", sub_total: "Total amount", sub_per_cycle: "Amount per cycle", sub_start: "Start date", sub_end: "End date", sub_next: "Next payment", sub_notes: "Notes", sub_save: "Save", sub_confirm_pay: "Confirm payment", sub_paid: "Paid", sub_edit: "Edit", sub_delete: "Delete", sub_empty: "No active subscriptions.", sub_archive_empty: "No archived subscriptions.", sub_export_pdf: "Export PDF", sub_export_excel: "Export Excel", sub_cycles_paid: "cycles paid",
        nav_updates: "Updates", title_updates: "App Update Log 🔄",
pareto_title: "The 80/20 Rule 📌", pareto_cumulative: "Cumulative %", pareto_stuck_title: "📌 80/20: Projects eating your time", pareto_stuck_none: "No old stuck projects, nice!",
notif_enable: "Enable notifications", notif_enabled_msg: "Notifications are on ✅", notif_denied_msg: "Notification permission was denied", notif_urgent_title: "⏰ Urgent task", notif_sub_title: "📱 Subscription payment due", notif_habit_title: "✅ Habit tracker", notif_habit_body: "You still have unchecked habits today", notif_pomodoro_title: "⏱️ Session finished", notif_missed_urgent_title: "⏰ Missed urgent task", notif_missed_sub_title: "📱 Overdue subscription payment", notif_missed_summary_title: "🔔 Missed alerts", notif_important_title: "⭐ Important task", notif_delegate_title: "👥 Delegated task", notif_cancelled_title: "🚫 Cancelled task", notif_missed_important_title: "⭐ Missed important task", notif_missed_delegate_title: "👥 Missed delegated task", notif_missed_cancelled_title: "🚫 Missed cancelled task", nav_notifs: "Notifications", title_notifs: "Notification Center 🔔", notif_c_desc: "Missed and upcoming alerts within 24 hours (before and after now).", notif_c_all: "All", notif_c_missed: "Missed", notif_c_upcoming: "Upcoming", notif_c_mark_all: "Mark all as read", notif_c_delete_all: "Delete all", notif_c_confirm_delete: "Delete all shown notifications? (the tasks themselves are not affected)", notif_c_empty: "No missed or upcoming notifications within 24 hours 🎉", notif_c_mark_read: "Mark as read", notif_c_mark_unread: "Mark as unread", notif_c_delete: "Delete notification", notif_c_sub_due: "Subscription", notif_c_today: "Today", notif_c_tomorrow: "Tomorrow", notif_c_yesterday: "Yesterday", notif_c_pom_running: "Focus session running", notif_c_pom_ends: "Ends at", notif_c_pom_ended: "Focus session finished", notif_c_sub_body: "Payment due", notif_c_in: "in", notif_c_ago: "ago", notif_c_h: "h", notif_c_m: "min", wr_text_tool: "Type text (tap the paper; drag a box to move it)", wr_mic: "Voice dictation (speech to text)", wr_done: "Done", wr_text_ph: "Type here... (links become clickable automatically)", wr_dict_lang: "Dictation language", wr_link: "Add link", wr_link_title: "Add link", wr_link_text_ph: "Link text (optional)", wr_link_add: "Add", wr_cancel: "Cancel", wr_link_invalid: "Enter a valid link starting with http or https", wr_mic_unsupported: "Voice dictation is not supported in this browser (try Chrome)", wr_mic_denied: "Allow microphone access to use dictation", wr_mic_network: "Couldn't reach the speech recognition service", wr_listening: "🎙️ Listening...", wr_nav: "Writing Board", wr_title_h: "Writing Board ✍️", wr_desc: "Write with a pen or your finger on an endless ruled sheet. Your sheets are saved on this device.", wr_new: "New sheet", wr_untitled: "Untitled sheet", wr_empty: "No sheets yet. Tap “New sheet” and start writing.", wr_delete: "Delete sheet", wr_confirm_delete: "Delete this sheet permanently?", wr_back: "Back (auto-saved)", wr_title_ph: "Sheet title...", wr_undo: "Undo", wr_redo: "Redo", wr_pen: "Pen", wr_eraser: "Eraser (removes the whole stroke)", wr_color: "Pen color", wr_thin: "Thin", wr_med: "Medium", wr_thick: "Thick", wr_mode_write: "Finger writes", wr_mode_scroll: "Finger scrolls", wr_mode_hint: "Switch between writing with one finger and scrolling with one finger (two fingers always scroll)", wr_down: "Scroll down", wr_saving: "Saving...", wr_saved: "Saved ✓", wr_unavailable: "Sheets can't be saved in this browser (local storage unavailable).", notif_test_btn: "Send test notification", notif_test_title: "🔔 Test notification", notif_test_body: "If you can see this, notifications work on your device.",
        nav_health: "Weight & Calories", title_health: "Weight & Calories ⚖️", w_title: "Weight Tracker", w_kg: "Weight (kg)", w_add: "Add weight", w_goal_title: "🎯 Goal", w_target: "Target weight (kg)", w_target_date: "Goal date", w_save_goal: "Save goal", c_title: "🔥 Calories", c_goal: "Daily goal (kcal)", c_desc: "Meal / workout name", c_cal: "Calories", c_in: "Ate", c_out: "Burned", c_add: "Add",
        q_time: "Time", fs_label: "In-app font size:", fs_small: "Small", fs_medium: "Medium (default)", fs_large: "Large", fs_xlarge: "Extra large", dict_ar: "Arabic",
        ph_title: "Title...", ph_title_plain: "Title", ph_phone_opt: "Phone (optional)...", ph_desc: "Description", ph_amount: "Amount", ph_category: "Category", ph_email: "Email", ph_password: "Password (at least 6 characters)", ph_qd_title: "Idea title (optional)...",
        tt_dic_start: "Start recording", tt_dic_stop: "Stop recording", tt_copy_link: "Copy link", tt_fab_dump: "Quick Brain Dump ⚡", tt_daily_goal: "Daily goal",
        auth_forgot: "Forgot your password?", auth_login: "Log in", auth_signup: "Sign up", changelog_ok: "Great, thanks!", share_desc: "Share the app with your friends to boost their productivity!", update_title: "New update available! ✨"
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
        cats = [ {v:'other', l:i18n[currentLang].cat_other}, {v:'food', l:i18n[currentLang].cat_food}, {v:'transport', l:i18n[currentLang].cat_trans}, {v:'shopping', l:i18n[currentLang].cat_shop}, {v:'bills', l:i18n[currentLang].cat_bills}, {v:'work', l:i18n[currentLang].cat_work}, {v:'fun', l:i18n[currentLang].cat_fun}, {v:'subscriptions', l:i18n[currentLang].cat_subscriptions} ];
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
    document.querySelectorAll('[data-i18n-title]').forEach(el => { const key = el.getAttribute('data-i18n-title'); if(i18n[lang][key]) el.title = i18n[lang][key]; });
    // لغة حقول التاريخ: المتصفح بيبني شكل الحقل (الأرقام والترتيب) مرة واحدة حسب lang، فلازم نحدد lang لكل حقل ونعيد بناءه عند تغيير اللغة
    try {
        const dateLoc = lang === 'ar' ? 'ar' : 'en-GB';
        document.querySelectorAll('input[type="date"]').forEach(el => {
            if (el.lang === dateLoc) return;
            const v = el.value;
            el.lang = dateLoc;
            el.type = 'text';
            el.type = 'date';
            el.value = v;
        });
    } catch(e) { console.warn('Date locale refresh failed:', e); }
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
let weightLog = [], weightGoal = { target: '', date: '' }, calorieLog = [], calorieGoal = 2000, weightChartInstance = null;
let subscriptions = [], draggedSubId = null, subViewMode = 'active';

try { updateLog = JSON.parse(localStorage.getItem('fp_update_log')) || []; } catch(e) { updateLog = []; }
try { weightLog = JSON.parse(localStorage.getItem('fp_weight')) || []; } catch(e) { weightLog = []; }
try { weightGoal = JSON.parse(localStorage.getItem('fp_weight_goal')) || { target: '', date: '' }; } catch(e) { weightGoal = { target: '', date: '' }; }
try { calorieLog = JSON.parse(localStorage.getItem('fp_calories')) || []; } catch(e) { calorieLog = []; }
calorieGoal = parseInt(localStorage.getItem('fp_calorie_goal')) || 2000;
try { subscriptions = JSON.parse(localStorage.getItem('fp_subscriptions')) || []; } catch(e) { subscriptions = []; }
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
        localStorage.setItem('fp_weight', JSON.stringify(weightLog));
        localStorage.setItem('fp_weight_goal', JSON.stringify(weightGoal));
        localStorage.setItem('fp_calories', JSON.stringify(calorieLog));
        localStorage.setItem('fp_calorie_goal', String(calorieGoal));
        localStorage.setItem('fp_subscriptions', JSON.stringify(subscriptions));
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
                tasks, notes, kanbanTasks, habits, finances, library, profile, lastModified, updateLog, weightLog, weightGoal, calorieLog, calorieGoal, subscriptions,
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
        if(Array.isArray(data.weightLog)) weightLog = data.weightLog;
        if(data.weightGoal && typeof data.weightGoal === 'object') weightGoal = data.weightGoal;
        if(Array.isArray(data.calorieLog)) calorieLog = data.calorieLog;
        if(typeof data.calorieGoal === 'number') calorieGoal = data.calorieGoal;
        if(Array.isArray(data.subscriptions)) subscriptions = data.subscriptions;
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
    dictationRecognition.continuous = true; 
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

    dictationRecognition.onerror = (e) => {
        // لو المستخدم رفض صلاحية الميكروفون، نوقف إعادة التشغيل التلقائي عشان منعملش حلقة لا نهائية
        if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed')) { isDictating = false; }
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
    checkAndShowChangelog();
    setTimeout(checkNotificationTriggers, 3000);
    setInterval(checkNotificationTriggers, 60000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { checkNotificationTriggers(); renderNotifCenter(); } });
    setInterval(renderNotifCenter, 30000); // تحديث مركز الإشعارات (القادم بيتحول لفائت لما وقته يعدي)
    setTimeout(() => {
        const statusEl = document.getElementById('notifStatusText');
        if (statusEl && typeof Notification !== 'undefined') {
            if (notifEnabled()) statusEl.innerText = i18n[currentLang].notif_enabled_msg;
            else if (Notification.permission === 'denied') statusEl.innerText = i18n[currentLang].notif_denied_msg;
        }
    }, 500);
    
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
    
    document.getElementById('langToggleBtn').onclick = () => { setLanguage(currentLang === 'ar' ? 'en' : 'ar'); renderViews(); if (typeof window.refreshCloudStatus === 'function') window.refreshCloudStatus(); if (typeof window.refreshNotifStatus === 'function') window.refreshNotifStatus(); };
    
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
    renderDashboard(); renderMonthly(); renderDaily(); renderKanban(); renderHabits(); renderFinance(); renderHealth(); renderSubscriptions(); renderLibrary(); renderNotes(); 
    if(typeof renderPomodoroLog === 'function') renderPomodoroLog();
    if(typeof renderUpdatesLog === 'function') renderUpdatesLog();
    if(typeof renderNotifCenter === 'function') renderNotifCenter();
    try { if(typeof renderWritingList === 'function') renderWritingList(); } catch(e) {}
}

// ----------------------------------------
// جدول اليوم
// ----------------------------------------
function renderDaily() { 
    const container = document.getElementById('plannerContainer'); 
    const filterEl = document.getElementById('dailyQFilter');
    if(!container) return;
    container.innerHTML = ''; 
    const qColors = {urgent:'#ef4444',important:'#f59e0b',delegate:'#3b82f6',cancelled:'#6b7280'};
    const qLabels = { urgent: i18n[currentLang].q_urgent, important: i18n[currentLang].q_important, delegate: i18n[currentLang].q_delegate, cancelled: i18n[currentLang].q_cancelled };
    const activeFilter = filterEl ? filterEl.value : 'all';
    let todayTasks = tasks.filter(t => t.date === currentDailyDate); 
    if (activeFilter !== 'all') todayTasks = todayTasks.filter(t => t.quadrant === activeFilter);
    for(let hour = 6; hour <= 23; hour++) { 
        const hourTasks = todayTasks.filter(t => t.hour == hour); 
        let timeLabel = hour === 12 ? '12 PM' : (hour > 12 ? `${hour - 12} PM` : `${hour} AM`);
        let html = hourTasks.map(t => `
            <div class="daily-task-item ${t.completed ? 'completed' : ''}" onclick="editTask(${t.id})" style="display:flex; justify-content:space-between; padding:10px; border:1px solid var(--border-color); border-radius:8px; margin-bottom:5px; background:var(--card-bg); cursor:pointer;">
                <div style="flex:1;"><input type="checkbox" ${t.completed ? 'checked' : ''} onclick="event.stopPropagation()" onchange="toggleTask(${t.id})"> <span style="text-decoration:${t.completed?'line-through':'none'}">${escapeHtml(t.title)}</span> ${t.quadrant ? `<span style="font-size:0.7rem; color:${qColors[t.quadrant]||'#888'}; border:1px solid ${qColors[t.quadrant]||'#888'}; border-radius:8px; padding:1px 6px; margin-${currentLang==='ar'?'right':'left'}:6px;">${escapeHtml(qLabels[t.quadrant]||'')}</span>` : ''}</div>
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
// التصنيف الافتراضي المخزن 'عام' يُعرض بالإنجليزية عند استخدام اللغة الإنجليزية (القيمة المخزنة لا تتغير)
const libCatLabel = c => (c === 'عام' && currentLang !== 'ar') ? 'General' : c;

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
        catFilterEl.innerHTML = `<option value="all">${i18n[currentLang].lib_cat_all}</option>` + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(libCatLabel(c))}</option>`).join('');
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
        return `<div class="lib-card" onclick="editLib(${l.id})"><button class="icon-btn no-print" style="position:absolute; top:10px; left:10px; color:var(--danger);" onclick="event.stopPropagation(); delLib(${l.id})"><i class="fa-solid fa-trash"></i></button><span class="lib-cat">${escapeHtml(libCatLabel(l.category))}</span><h3>${contactHTML}${escapeHtml(l.title)}</h3><div class="render-area card-content-collapsed" id="content-lib-${l.id}">${linkify(l.content)}</div><button class="read-more-btn no-print" id="btn-lib-${l.id}" onclick="event.stopPropagation(); toggleCardExpand('lib-${l.id}')">${currentLang==='ar'?'اقرأ المزيد <i class="fa-solid fa-chevron-down"></i>':'Read more <i class="fa-solid fa-chevron-down"></i>'}</button></div>`;
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
            return `<div style="grid-column: 1/-1; font-weight:bold; color:var(--primary); margin:10px 0 5px; padding-bottom:5px; border-bottom:2px solid var(--border-color);">${escapeHtml(libCatLabel(cat))}</div>` +
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

    // خيارات التوقيت (نفس ساعات جدول اليوم 6 AM - 11 PM) والافتراضي 9 AM
    const fmtHourLabel = h => { h = parseInt(h); if (isNaN(h)) return ''; return h === 12 ? '12 PM' : (h > 12 ? `${h - 12} PM` : `${h} AM`); };
    let hourOptionsHTML = '';
    for (let h = 6; h <= 23; h++) hourOptionsHTML += `<option value="${h}"${h === 9 ? ' selected' : ''}>${fmtHourLabel(h)}</option>`;

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
        let dStrPad = String(i).padStart(2, '0');
        let mStrPad = String(currentMonthView + 1).padStart(2, '0');
        let dayDateStr = `${currentYearView}-${mStrPad}-${dStrPad}`;
        let qColors = {urgent:'#ef4444',important:'#f59e0b',delegate:'#3b82f6',cancelled:'#6b7280'};
        let qLabels = { urgent: i18n[currentLang].q_urgent, important: i18n[currentLang].q_important, delegate: i18n[currentLang].q_delegate, cancelled: i18n[currentLang].q_cancelled };
        let dayQItems = tasks.filter(t => t.date === dayDateStr && t.quadrantItem);
        let qItemsHTML = dayQItems.map(t => `<div style="display:flex; align-items:center; gap:6px; margin-top:4px; padding:4px 8px; background:var(--bg-color); border-radius:6px; border-right:3px solid ${qColors[t.quadrant] || '#888'};"><input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTask(${t.id})" style="cursor:pointer;"><span style="flex:1; font-size:0.85rem; text-decoration:${t.completed?'line-through':'none'};">${escapeHtml(t.title)}</span><span style="font-size:0.7rem; color:var(--text-muted);">${fmtHourLabel(t.hour)}</span><span style="font-size:0.7rem; color:${qColors[t.quadrant] || '#888'};">${escapeHtml(qLabels[t.quadrant] || '')}</span><button class="icon-btn no-print" style="color:var(--danger); font-size:0.8rem;" onclick="delTask(${t.id})"><i class="fa-solid fa-trash"></i></button></div>`).join('');

        dayDiv.innerHTML = `
            <div class="month-day-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>${dayText} ${i} ${mNames[currentMonthView]} <b style="color:var(--primary);">${isTodayText}</b></span>
                ${contactIcons}
            </div>
            <textarea class="multi-line-input no-print" rows="3" data-key="${storageKey}" data-day="${i}" placeholder="${placeholderText}"></textarea>
            <input type="tel" class="no-print" data-phone-key="${phoneKey}" placeholder="${phonePlaceholder}" 
                style="width:100%; margin-top:5px; padding:8px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:0.85rem;">
            <div class="render-area">${linkify(savedText)}</div>
            <div class="no-print q-quick-row" style="display:flex; gap:6px; margin-top:8px;">
                <input type="text" class="q-quick-input" data-qdate="${dayDateStr}" placeholder="${i18n[currentLang].q_add_ph}" style="flex:2; min-width:0; padding:6px 8px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:0.8rem;">
                <select class="q-quick-hour" title="${i18n[currentLang].q_time}" style="flex:1; min-width:0; padding:6px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:0.8rem;">${hourOptionsHTML}</select>
                <select class="q-quick-select" style="flex:1; padding:6px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:0.8rem;">
                    <option value="urgent">${i18n[currentLang].q_urgent}</option>
                    <option value="important">${i18n[currentLang].q_important}</option>
                    <option value="delegate">${i18n[currentLang].q_delegate}</option>
                    <option value="cancelled">${i18n[currentLang].q_cancelled}</option>
                </select>
                <button class="btn btn-secondary q-quick-add" style="padding:6px 10px;"><i class="fa-solid fa-plus"></i></button>
            </div>
            <div class="q-items-list">${qItemsHTML}</div>`; 
            
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

    document.querySelectorAll('.q-quick-add').forEach(btn => {
        btn.onclick = e => {
            const row = e.target.closest('div').parentElement.querySelector('.q-quick-input') ? e.target.closest('.month-day-card') : null;
            const card = e.target.closest('.month-day-card');
            if (!card) return;
            const inp = card.querySelector('.q-quick-input');
            const sel = card.querySelector('.q-quick-select');
            if (!inp.value.trim()) return;
            const hourSel = card.querySelector('.q-quick-hour');
            let qHour = hourSel ? parseInt(hourSel.value) : 9;
            if (isNaN(qHour)) qHour = 9;
            tasks.push({ id: Date.now(), title: inp.value.trim(), date: inp.dataset.qdate, hour: qHour, completed: false, quadrantItem: true, quadrant: sel.value });
            inp.value = '';
            saveAll();
            renderMonthly();
            if (currentDailyDate === card.querySelector('.q-quick-input').dataset.qdate) renderDaily();
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
                if(window.showAppNotification) window.showAppNotification(i18n[currentLang].notif_pomodoro_title, pomMode === 'work' ? (currentLang==='ar'?'وقت الاستراحة!':'Break time!') : (currentLang==='ar'?'ارجع للتركيز!':'Back to focus!'));
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
                    <button onclick="editSubtask(${i.id}, '${col}', ${idx})" class="icon-btn no-print" style="font-size:0.8rem; color:var(--text-muted);" title="${i18n[currentLang].sub_edit}"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="delSubtask(${i.id}, '${col}', ${idx})" class="icon-btn no-print" style="font-size:0.8rem; color:var(--danger);" title="${i18n[currentLang].sub_delete}"><i class="fa-solid fa-trash"></i></button>
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

    renderKanbanPareto();
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

    renderFinancePareto(filteredFinances);

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


// ----------------------------------------
// قسم الوزن والسعرات
// ----------------------------------------
const healthNum = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };
window.addWeight = () => {
    const w = healthNum(document.getElementById('weightInput').value);
    const d = document.getElementById('weightDate').value || getTodayStr();
    if (w === null || w <= 0) return;
    weightLog.push({ id: Date.now(), date: d, weight: w });
    document.getElementById('weightInput').value = '';
    saveAll(); renderHealth();
};
window.delWeight = id => { weightLog = weightLog.filter(x => x.id !== id); saveAll(); renderHealth(); };
window.saveWeightGoal = () => {
    weightGoal = { target: document.getElementById('goalWeight').value, date: document.getElementById('goalDate').value };
    saveAll(); renderHealth();
};
window.addCalorie = () => {
    const desc = document.getElementById('calDesc').value.trim();
    const cal = healthNum(document.getElementById('calValue').value);
    const type = document.getElementById('calType').value;
    const d = document.getElementById('calDate').value || getTodayStr();
    if (!desc || cal === null || cal <= 0) return;
    calorieLog.push({ id: Date.now(), date: d, desc, calories: cal, type });
    document.getElementById('calDesc').value = ''; document.getElementById('calValue').value = '';
    saveAll(); renderHealth();
};
window.delCalorie = id => { calorieLog = calorieLog.filter(x => x.id !== id); saveAll(); renderHealth(); };
window.saveCalorieGoal = () => {
    const g = parseInt(document.getElementById('calGoal').value);
    if (g > 0) { calorieGoal = g; saveAll(); renderHealth(); }
};

function renderHealth() {
    const wrap = document.getElementById('healthView');
    if (!wrap) return;
    const ar = currentLang === 'ar';
    const today = getTodayStr();
    const wDate = document.getElementById('weightDate'); if (wDate && !wDate.value) wDate.value = today;
    const cDate = document.getElementById('calDate'); if (cDate && !cDate.value) cDate.value = today;
    const gw = document.getElementById('goalWeight'), gd = document.getElementById('goalDate'), cg = document.getElementById('calGoal');
    if (gw && document.activeElement !== gw) gw.value = weightGoal.target || '';
    if (gd && document.activeElement !== gd) gd.value = weightGoal.date || '';
    if (cg && document.activeElement !== cg) cg.value = calorieGoal;

    // ---- الوزن ----
    const sorted = weightLog.slice().sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
    const target = healthNum(weightGoal.target);
    const summary = document.getElementById('weightSummary');
    if (summary) {
        if (sorted.length === 0) {
            summary.innerHTML = `<p style="color:var(--text-muted);">${ar ? 'سجّل أول وزن لك للبدء.' : 'Log your first weight to get started.'}</p>`;
        } else {
            const start = sorted[0].weight, cur = sorted[sorted.length - 1].weight;
            let html = `<div style="display:flex; gap:20px; flex-wrap:wrap; margin-bottom:10px;">
                <div><small>${ar ? 'البداية' : 'Start'}</small><div style="font-size:1.3rem; font-weight:bold;">${start} kg</div></div>
                <div><small>${ar ? 'الحالي' : 'Current'}</small><div style="font-size:1.3rem; font-weight:bold; color:var(--primary);">${cur} kg</div></div>
                ${target !== null ? `<div><small>${ar ? 'الهدف' : 'Target'}</small><div style="font-size:1.3rem; font-weight:bold;">${target} kg</div></div>` : ''}
            </div>`;
            if (target !== null) {
                const total = start - target, done = start - cur;
                const pct = total === 0 ? 100 : Math.max(0, Math.min(100, (done / total) * 100));
                const reached = total > 0 ? cur <= target : cur >= target;
                let daysTxt = '';
                if (weightGoal.date) {
                    const left = Math.ceil((new Date(weightGoal.date) - new Date(today)) / 86400000);
                    daysTxt = left >= 0 ? (ar ? `متبقي ${left} يوم` : `${left} days left`) : (ar ? 'انتهت المدة' : 'Deadline passed');
                }
                html += `<div style="background:var(--border-color); border-radius:10px; height:14px; overflow:hidden;"><div style="width:${pct}%; height:100%; background:var(--primary);"></div></div>
                    <div style="margin-top:6px; font-size:0.9rem;">${reached ? '🎉 ' + (ar ? 'وصلت للهدف!' : 'Goal reached!') : (ar ? `باقي ${Math.abs(cur - target).toFixed(1)} كجم` : `${Math.abs(cur - target).toFixed(1)} kg to go`)} ${daysTxt ? ' · ' + daysTxt : ''} · ${pct.toFixed(0)}%</div>`;
            }
            summary.innerHTML = html;
        }
    }
    const wList = document.getElementById('weightList');
    if (wList) {
        wList.innerHTML = sorted.slice().reverse().slice(0, 15).map(x => `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border-color);"><span>${escapeHtml(x.date)}</span><strong>${x.weight} kg</strong><button class="icon-btn no-print" style="color:var(--danger);" onclick="delWeight(${x.id})"><i class="fa-solid fa-trash"></i></button></div>`).join('');
    }
    const canvas = document.getElementById('weightChart');
    if (canvas && typeof Chart !== 'undefined') {
        if (weightChartInstance) { weightChartInstance.destroy(); weightChartInstance = null; }
        if (sorted.length > 0) {
            const datasets = [{ label: ar ? 'الوزن' : 'Weight', data: sorted.map(x => x.weight), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)', fill: true, tension: 0.3 }];
            if (target !== null) datasets.push({ label: ar ? 'الهدف' : 'Target', data: sorted.map(() => target), borderColor: '#f59e0b', borderDash: [6, 6], pointRadius: 0, fill: false });
            weightChartInstance = new Chart(canvas.getContext('2d'), { type: 'line', data: { labels: sorted.map(x => x.date), datasets }, options: { responsive: true, plugins: { legend: { display: true } } } });
        }
    }

    // ---- السعرات ----
    const selDate = (cDate && cDate.value) || today;
    const dayEntries = calorieLog.filter(x => x.date === selDate).sort((a, b) => b.id - a.id);
    const sum = t => dayEntries.filter(x => x.type === t).reduce((a, b) => a + b.calories, 0);
    const eaten = sum('in'), burned = sum('out'), net = eaten - burned, remaining = calorieGoal - net;
    const cs = document.getElementById('calSummary');
    if (cs) {
        const pct = Math.max(0, Math.min(100, (net / calorieGoal) * 100));
        cs.innerHTML = `<div style="display:flex; gap:20px; flex-wrap:wrap; margin-bottom:10px;">
            <div><small>${ar ? 'تناولت' : 'Ate'}</small><div style="font-size:1.2rem; font-weight:bold;">${eaten}</div></div>
            <div><small>${ar ? 'حرقت' : 'Burned'}</small><div style="font-size:1.2rem; font-weight:bold;">${burned}</div></div>
            <div><small>${ar ? 'الصافي' : 'Net'}</small><div style="font-size:1.2rem; font-weight:bold; color:${net > calorieGoal ? 'var(--danger)' : 'var(--primary)'};">${net}</div></div>
            <div><small>${ar ? 'المتبقي' : 'Remaining'}</small><div style="font-size:1.2rem; font-weight:bold;">${remaining}</div></div>
        </div>
        <div style="background:var(--border-color); border-radius:10px; height:14px; overflow:hidden;"><div style="width:${pct}%; height:100%; background:${net > calorieGoal ? 'var(--danger)' : 'var(--primary)'};"></div></div>`;
    }
    const cl = document.getElementById('calList');
    if (cl) {
        cl.innerHTML = dayEntries.map(x => `<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border-color);"><span>${x.type === 'in' ? '🍽️' : '🏃'} ${escapeHtml(x.desc)}</span><strong>${x.type === 'in' ? '+' : '-'}${x.calories}</strong><button class="icon-btn no-print" style="color:var(--danger);" onclick="delCalorie(${x.id})"><i class="fa-solid fa-trash"></i></button></div>`).join('') || `<p style="color:var(--text-muted);">${ar ? 'لا توجد إدخالات لهذا اليوم.' : 'No entries for this day.'}</p>`;
    }
    const histTitle = document.getElementById('calHistTitle'); if (histTitle) histTitle.textContent = ar ? 'آخر 7 أيام (الصافي)' : 'Last 7 days (net)';
    const hist = document.getElementById('calHistory');
    if (hist) {
        const rows = [];
        for (let i = 0; i < 7; i++) {
            const dt = new Date(); dt.setDate(dt.getDate() - i);
            const ds = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
            const list = calorieLog.filter(x => x.date === ds);
            const n = list.reduce((a, b) => a + (b.type === 'in' ? b.calories : -b.calories), 0);
            rows.push(`<div style="display:flex; justify-content:space-between; padding:4px 0;"><span>${ds}</span><strong style="color:${n > calorieGoal ? 'var(--danger)' : 'inherit'};">${n}</strong></div>`);
        }
        hist.innerHTML = rows.join('');
    }
}


// ----------------------------------------
// قسم الاشتراكات
// ----------------------------------------
function addInterval(dateStr, freq, n) {
    const d = new Date(dateStr + 'T00:00:00');
    if (freq === 'daily') d.setDate(d.getDate() + n);
    else if (freq === 'weekly') d.setDate(d.getDate() + 7 * n);
    else if (freq === 'monthly') d.setMonth(d.getMonth() + n);
    else if (freq === 'yearly') d.setFullYear(d.getFullYear() + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function subCyclesBetween(start, end, freq) {
    const s = new Date(start + 'T00:00:00'), e = new Date(end + 'T00:00:00');
    const diffDays = Math.round((e - s) / 86400000);
    if (freq === 'daily') return diffDays;
    if (freq === 'weekly') return Math.round(diffDays / 7);
    if (freq === 'monthly') return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    if (freq === 'yearly') return e.getFullYear() - s.getFullYear();
    return diffDays;
}
function subFreqLabel(freq) {
    return { daily: i18n[currentLang].sub_daily, weekly: i18n[currentLang].sub_weekly, monthly: i18n[currentLang].sub_monthly, yearly: i18n[currentLang].sub_yearly }[freq] || freq;
}
function checkSubsArchive() {
    const today = getTodayStr();
    let changed = false;
    subscriptions.forEach(s => {
        if (s.archived) return;
        const cyclesDone = s.frequency === 'yearly' ? (s.paid ? 1 : 0) : (s.paymentsCount || 0);
        const cyclesTarget = s.frequency === 'yearly' ? 1 : s.durationCount;
        if ((s.endDate && s.endDate < today) || cyclesDone >= cyclesTarget) { s.archived = true; changed = true; }
    });
    if (changed) saveAll();
}
window.openSubModal = (id) => {
    const editing = !!id;
    document.getElementById('subModalTitle').innerText = editing ? i18n[currentLang].sub_edit : i18n[currentLang].sub_add;
    document.getElementById('subEditId').value = id || '';
    const s = editing ? subscriptions.find(x => x.id === id) : null;
    document.getElementById('subName').value = s ? s.name : '';
    document.getElementById('subFreq').value = s ? s.frequency : 'monthly';
    document.getElementById('subCount').value = s ? s.durationCount : 1;
    document.getElementById('subTotal').value = s ? s.totalAmount : '';
    document.getElementById('subPerCycle').value = s ? s.amountPerCycle : '';
    document.getElementById('subStart').value = s ? s.startDate : getTodayStr();
    document.getElementById('subEnd').value = s ? s.endDate : '';
    document.getElementById('subNotes').value = s ? (s.notes || '') : '';
    document.getElementById('subModal').classList.add('show');
};
window.subAutoEnd = () => {
    const start = document.getElementById('subStart').value;
    const freq = document.getElementById('subFreq').value;
    const count = parseInt(document.getElementById('subCount').value) || 1;
    if (start) document.getElementById('subEnd').value = addInterval(start, freq, count);
    window.subCalcFromTotal();
};
window.subAutoCount = () => {
    const start = document.getElementById('subStart').value;
    const end = document.getElementById('subEnd').value;
    const freq = document.getElementById('subFreq').value;
    if (!start || !end) return;
    const count = subCyclesBetween(start, end, freq);
    if (count > 0) { document.getElementById('subCount').value = count; window.subCalcFromTotal(); }
};
window.subCalcFromTotal = () => {
    const total = parseFloat(document.getElementById('subTotal').value);
    const count = parseInt(document.getElementById('subCount').value) || 1;
    if (!isNaN(total) && count > 0) document.getElementById('subPerCycle').value = (total / count).toFixed(2);
};
window.subCalcFromPerCycle = () => {
    const per = parseFloat(document.getElementById('subPerCycle').value);
    const count = parseInt(document.getElementById('subCount').value) || 1;
    if (!isNaN(per)) document.getElementById('subTotal').value = (per * count).toFixed(2);
};
window.saveSubscription = () => {
    const id = document.getElementById('subEditId').value;
    const name = document.getElementById('subName').value.trim();
    const frequency = document.getElementById('subFreq').value;
    const durationCount = parseInt(document.getElementById('subCount').value) || 1;
    const totalAmount = parseFloat(document.getElementById('subTotal').value) || 0;
    const amountPerCycle = parseFloat(document.getElementById('subPerCycle').value) || 0;
    const startDate = document.getElementById('subStart').value;
    let endDate = document.getElementById('subEnd').value;
    const notes = document.getElementById('subNotes').value.trim();
    if (!name || !startDate) return;
    if (!endDate) endDate = addInterval(startDate, frequency, durationCount);

    if (id) {
        const s = subscriptions.find(x => x.id === parseInt(id));
        if (s) Object.assign(s, { name, frequency, durationCount, totalAmount, amountPerCycle, startDate, endDate, notes });
    } else {
        subscriptions.push({ id: Date.now(), name, frequency, durationCount, totalAmount, amountPerCycle, startDate, endDate, notes, nextPaymentDate: startDate, paid: false, paymentsCount: 0, pinned: false, archived: false });
    }
    document.getElementById('subModal').classList.remove('show');
    saveAll(); renderSubscriptions();
};
window.deleteSubscription = id => { subscriptions = subscriptions.filter(x => x.id !== id); saveAll(); renderSubscriptions(); };
window.toggleSubPin = id => { const s = subscriptions.find(x => x.id === id); if (s) { s.pinned = !s.pinned; saveAll(); renderSubscriptions(); } };
window.moveSubPosition = (id, dir) => {
    const idx = subscriptions.findIndex(x => x.id === id);
    if (idx === -1) return;
    const n = idx + dir;
    if (n < 0 || n >= subscriptions.length) return;
    [subscriptions[idx], subscriptions[n]] = [subscriptions[n], subscriptions[idx]];
    saveAll(); renderSubscriptions();
};
window.subDragStart = e => { draggedSubId = parseInt(e.currentTarget.dataset.subId); e.currentTarget.style.opacity = '0.4'; };
window.subDragOver = e => e.preventDefault();
window.subDrop = e => {
    e.preventDefault();
    const targetId = parseInt(e.currentTarget.dataset.subId);
    if (draggedSubId === null || draggedSubId === targetId) return;
    const fromIdx = subscriptions.findIndex(x => x.id === draggedSubId);
    const toIdx = subscriptions.findIndex(x => x.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = subscriptions.splice(fromIdx, 1);
    subscriptions.splice(toIdx, 0, moved);
    saveAll(); renderSubscriptions();
};
window.subDragEnd = e => { e.currentTarget.style.opacity = '1'; draggedSubId = null; };
window.confirmSubPayment = id => {
    const s = subscriptions.find(x => x.id === id);
    if (!s || s.archived) return;
    if (s.frequency === 'yearly') {
        if (s.paid) return;
        s.paid = true;
    } else {
        if ((s.paymentsCount || 0) >= s.durationCount) return;
        s.paymentsCount = (s.paymentsCount || 0) + 1;
        s.nextPaymentDate = addInterval(s.nextPaymentDate || s.startDate, s.frequency, 1);
    }
    finances.push({ id: Date.now(), type: 'expense', date: getTodayStr(), amount: String(s.amountPerCycle), category: 'subscriptions', desc: s.name });
    saveAll(); renderSubscriptions(); renderFinance();
};
window.setSubView = mode => { subViewMode = mode; renderSubscriptions(); };

function renderSubscriptions() {
    const container = document.getElementById('subsContainer');
    if (!container) return;
    checkSubsArchive();
    const ar = currentLang === 'ar';
    const activeBtn = document.getElementById('subTabActive'), archBtn = document.getElementById('subTabArchive');
    if (activeBtn && archBtn) {
        activeBtn.classList.toggle('btn-primary', subViewMode === 'active');
        activeBtn.classList.toggle('btn-secondary', subViewMode !== 'active');
        archBtn.classList.toggle('btn-primary', subViewMode === 'archive');
        archBtn.classList.toggle('btn-secondary', subViewMode !== 'archive');
    }
    let list = subscriptions.filter(s => subViewMode === 'archive' ? s.archived : !s.archived);
    list = list.slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    if (list.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-muted);">${subViewMode === 'archive' ? i18n[currentLang].sub_archive_empty : i18n[currentLang].sub_empty}</p>`;
        return;
    }
    container.innerHTML = list.map(s => {
        const cyclesDone = s.frequency === 'yearly' ? (s.paid ? 1 : 0) : (s.paymentsCount || 0);
        const cyclesTarget = s.frequency === 'yearly' ? 1 : s.durationCount;
        const isExhausted = cyclesDone >= cyclesTarget;
        const isDue = !s.archived && !isExhausted && s.frequency !== 'yearly' && s.nextPaymentDate <= getTodayStr();
        return `<div class="lib-card" draggable="${subViewMode==='active'}" data-sub-id="${s.id}" ondragstart="subDragStart(event)" ondragover="subDragOver(event)" ondrop="subDrop(event)" ondragend="subDragEnd(event)" style="position:relative;">
            ${s.pinned ? `<i class="fa-solid fa-thumbtack" style="position:absolute; top:10px; ${ar?'left':'right'}:10px; color:var(--primary);"></i>` : ''}
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; flex-wrap:wrap;">
                <h3 style="margin:0;">${escapeHtml(s.name)}</h3>
                <div class="no-print" style="display:flex; gap:6px;">
                    <button class="icon-btn" style="color:${s.pinned?'var(--primary)':'var(--text-muted)'};" onclick="toggleSubPin(${s.id})"><i class="fa-solid fa-thumbtack"></i></button>
                    ${subViewMode==='active' ? `<button class="icon-btn" onclick="moveSubPosition(${s.id}, -1)"><i class="fa-solid fa-chevron-up"></i></button><button class="icon-btn" onclick="moveSubPosition(${s.id}, 1)"><i class="fa-solid fa-chevron-down"></i></button>` : ''}
                    <button class="icon-btn" onclick="openSubModal(${s.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn" style="color:var(--danger);" onclick="deleteSubscription(${s.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <div style="font-size:0.9rem; color:var(--text-muted); margin-top:6px; display:grid; grid-template-columns:1fr 1fr; gap:4px;">
                <span>${subFreqLabel(s.frequency)} × ${s.durationCount}</span>
                <span>${i18n[currentLang].sub_total}: ${s.totalAmount}</span>
                <span>${i18n[currentLang].sub_per_cycle}: ${s.amountPerCycle}</span>
                <span>${i18n[currentLang].sub_start}: ${escapeHtml(s.startDate)}</span>
                <span>${i18n[currentLang].sub_end}: ${escapeHtml(s.endDate)}</span>
                ${s.frequency !== 'yearly' ? `<span>${i18n[currentLang].sub_next}: ${escapeHtml(s.nextPaymentDate)}</span>` : ''}
            </div>
            ${s.notes ? `<div class="render-area" style="margin-top:8px;">${linkify(s.notes)}</div>` : ''}
            <div style="margin-top:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <span style="font-size:0.8rem; color:var(--text-muted);">${s.frequency === 'yearly' ? '' : `${s.paymentsCount || 0} ${i18n[currentLang].sub_cycles_paid}`}</span>
                ${subViewMode === 'active' ? (isExhausted ? `<span style="color:var(--success); font-weight:bold;"><i class="fa-solid fa-circle-check"></i> ${i18n[currentLang].sub_paid}</span>` : `<button class="btn btn-primary no-print" onclick="confirmSubPayment(${s.id})" style="${isDue ? '' : 'opacity:0.7;'}"><i class="fa-solid fa-check"></i> ${i18n[currentLang].sub_confirm_pay}</button>`) : ''}
            </div>
        </div>`;
    }).join('');
}

window.exportSubscriptionsPDF = () => {
    if (subscriptions.length === 0) return alert(currentLang === 'ar' ? 'لا توجد بيانات لتصديرها' : 'No data to export');
    const ar = currentLang === 'ar';
    const th = `padding:8px; border:1px solid #d1d5db; color:#111827;`;
    const td = `padding:8px; border:1px solid #e5e7eb; color:#374151;`;
    const rowsFor = list => list.map(s => `<tr>
        <td style="${td}">${escapeHtml(s.name)}</td>
        <td style="${td}">${subFreqLabel(s.frequency)} × ${s.durationCount}</td>
        <td style="${td}">${s.totalAmount}</td>
        <td style="${td}">${s.amountPerCycle}</td>
        <td style="${td}">${escapeHtml(s.startDate)}</td>
        <td style="${td}">${escapeHtml(s.endDate)}</td>
    </tr>`).join('');
    const tableFor = (title, list) => list.length === 0 ? '' : `
        <h3 style="color:#111827; margin-top:20px;">${title}</h3>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead><tr style="background:#f3f4f6;">
                <th style="${th}">${i18n[currentLang].sub_name}</th>
                <th style="${th}">${i18n[currentLang].sub_freq}</th>
                <th style="${th}">${i18n[currentLang].sub_total}</th>
                <th style="${th}">${i18n[currentLang].sub_per_cycle}</th>
                <th style="${th}">${i18n[currentLang].sub_start}</th>
                <th style="${th}">${i18n[currentLang].sub_end}</th>
            </tr></thead><tbody>${rowsFor(list)}</tbody></table>`;
    const active = subscriptions.filter(s => !s.archived), archived = subscriptions.filter(s => s.archived);
    const element = document.createElement('div');
    element.style.padding = '20px'; element.style.direction = ar ? 'rtl' : 'ltr'; element.style.fontFamily = 'Inter, sans-serif'; element.style.background = '#ffffff';
    element.innerHTML = `<h2 style="text-align:center; color:#111827;">${i18n[currentLang].title_subs}</h2>
        ${tableFor(i18n[currentLang].sub_active, active)}
        ${tableFor(i18n[currentLang].sub_archive, archived)}`;
    html2pdf().set({ margin: [0.4, 0.4], filename: 'Subscriptions.pdf', image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' } }).from(element).save();
};
window.exportSubscriptionsExcel = () => {
    if (subscriptions.length === 0) return alert(currentLang === 'ar' ? 'لا توجد بيانات لتصديرها' : 'No data to export');
    const ar = currentLang === 'ar';
    const rowOf = s => ({
        [i18n[currentLang].sub_name]: s.name,
        [i18n[currentLang].sub_freq]: subFreqLabel(s.frequency),
        [i18n[currentLang].sub_count]: s.durationCount,
        [i18n[currentLang].sub_total]: s.totalAmount,
        [i18n[currentLang].sub_per_cycle]: s.amountPerCycle,
        [i18n[currentLang].sub_start]: s.startDate,
        [i18n[currentLang].sub_end]: s.endDate,
        [i18n[currentLang].sub_notes]: s.notes || ''
    });
    const wb = XLSX.utils.book_new();
    const active = subscriptions.filter(s => !s.archived), archived = subscriptions.filter(s => s.archived);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(active.map(rowOf)), i18n[currentLang].sub_active);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(archived.map(rowOf)), i18n[currentLang].sub_archive);
    XLSX.writeFile(wb, 'Subscriptions.xlsx');
};


// ----------------------------------------
// قاعدة 80/20 (Pareto)
// ----------------------------------------
let paretoChartInstance = null;
function renderFinancePareto(list) {
    const canvas = document.getElementById('financeParetoChart');
    const insight = document.getElementById('financeParetoInsight');
    if (!canvas || !window.Chart) return;
    const catLabels = { food: i18n[currentLang].cat_food, transport: i18n[currentLang].cat_trans, shopping: i18n[currentLang].cat_shop, bills: i18n[currentLang].cat_bills, work: i18n[currentLang].cat_work, fun: i18n[currentLang].cat_fun, subscriptions: i18n[currentLang].cat_subscriptions, other: i18n[currentLang].cat_other };
    const byCat = {};
    list.filter(f => f.type === 'expense').forEach(f => {
        const c = f.category || 'other';
        byCat[c] = (byCat[c] || 0) + (Number(f.amount) || 0);
    });
    const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
    if (paretoChartInstance) { paretoChartInstance.destroy(); paretoChartInstance = null; }
    if (entries.length === 0) { if (insight) insight.innerHTML = ''; return; }
    const total = entries.reduce((a, [, v]) => a + v, 0);
    let cum = 0;
    const cumPercents = entries.map(([, v]) => { cum += v; return +(cum / total * 100).toFixed(1); });
    const labels = entries.map(([c]) => catLabels[c] || c);
    let vitalCount = cumPercents.findIndex(p => p >= 80) + 1;
    if (vitalCount <= 0) vitalCount = entries.length;
    paretoChartInstance = new Chart(canvas.getContext('2d'), {
        data: {
            labels,
            datasets: [
                { type: 'bar', label: currentLang === 'ar' ? 'المصروفات' : 'Expenses', data: entries.map(([, v]) => v), backgroundColor: '#ef4444', order: 2, yAxisID: 'y' },
                { type: 'line', label: i18n[currentLang].pareto_cumulative, data: cumPercents, borderColor: '#f59e0b', backgroundColor: '#f59e0b', yAxisID: 'y1', order: 1, tension: 0.25 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true }, y1: { position: currentLang === 'ar' ? 'left' : 'right', beginAtZero: true, max: 100, grid: { drawOnChartArea: false } } },
            plugins: { legend: { position: 'bottom', labels: { color: '#6b7280' } } }
        }
    });
    if (insight) {
        const vitalCats = labels.slice(0, vitalCount).join(currentLang === 'ar' ? '، ' : ', ');
        insight.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${currentLang === 'ar' ? `أكتر ${vitalCount} تصنيف (${vitalCats}) بياخدوا حوالي 80% من مصروفاتك.` : `Top ${vitalCount} categories (${vitalCats}) make up about 80% of your spending.`}`;
    }
}

function renderKanbanPareto() {
    const box = document.getElementById('kanbanParetoInsight');
    if (!box) return;
    const openItems = [...kanbanTasks.todo, ...kanbanTasks.inprogress].map(i => ({ ...i, ageDays: Math.floor((Date.now() - i.id) / 86400000) }));
    const stuck = openItems.filter(i => i.ageDays >= 7).sort((a, b) => b.ageDays - a.ageDays);
    if (stuck.length === 0) { box.style.display = 'none'; return; }
    box.style.display = 'block';
    const count = Math.max(1, Math.ceil(stuck.length * 0.2));
    const top = stuck.slice(0, count);
    box.innerHTML = `<strong>${i18n[currentLang].pareto_stuck_title}</strong><div style="margin-top:6px;">${top.map(i => `<div style="display:flex; justify-content:space-between; padding:3px 0;"><span>${escapeHtml(i.text)}</span><span style="color:var(--danger);">${i.ageDays} ${currentLang === 'ar' ? 'يوم' : 'd'}</span></div>`).join('')}</div>`;
}

// ----------------------------------------
// الإشعارات (مجانية، تعمل طول ما التطبيق مفتوح)
// ----------------------------------------
let notifiedLog = { date: '', sent: [] };
try { notifiedLog = JSON.parse(localStorage.getItem('fp_notified_log')) || { date: '', sent: [] }; } catch (e) {}
function alreadyNotified(key) {
    if (notifiedLog.date !== getTodayStr()) notifiedLog = { date: getTodayStr(), sent: [] };
    return notifiedLog.sent.includes(key);
}
function markNotified(key) {
    if (notifiedLog.date !== getTodayStr()) notifiedLog = { date: getTodayStr(), sent: [] };
    notifiedLog.sent.push(key);
    localStorage.setItem('fp_notified_log', JSON.stringify(notifiedLog));
}
window.showAppNotification = (title, body) => {
    const done = (ok, err) => { window.__lastNotifResult = ok ? 'ok' : ('failed' + (err ? ': ' + err : '')); return ok; };
    const direct = () => { try { new Notification(title, { body, icon: './icon.png' }); return true; } catch (e) { return false; } };
    try {
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return Promise.resolve(done(false, 'no-permission'));
        if (!('serviceWorker' in navigator)) return Promise.resolve(done(direct(), 'no-sw'));
        // لو الـ Service Worker مش جاهز في ثانيتين ونص نستخدم الطريقة المباشرة بدل ما الإشعار يضيع في صمت
        const swReg = Promise.race([
            navigator.serviceWorker.getRegistration().then(r => r || navigator.serviceWorker.ready),
            new Promise((_, rej) => setTimeout(() => rej(new Error('sw-timeout')), 2500))
        ]);
        return swReg
            .then(reg => reg.showNotification(title, { body, icon: './icon.png', badge: './icon.png' }))
            .then(() => done(true))
            .catch(e => done(direct(), e && e.message));
    } catch (e) { console.warn('Notification failed:', e); return Promise.resolve(done(false, e && e.message)); }
};
// زر الفحص في الإعدادات: بيبعت إشعار تجريبي ويعرض حالة كل حاجة بتأثر على الإشعارات
window.testAppNotification = async () => {
    const out = document.getElementById('notifDiag');
    if (!out) return;
    const ar = currentLang === 'ar';
    const lines = [];
    const perm = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
    lines.push((ar ? 'صلاحية المتصفح: ' : 'Browser permission: ') + perm);
    lines.push((ar ? 'مفتاح التطبيق: ' : 'In-app switch: ') + (localStorage.getItem('fp_notifications_enabled') || (ar ? 'غير محدد' : 'not set')));
    let sw = ar ? 'غير مدعوم' : 'unsupported';
    try { if ('serviceWorker' in navigator) { const r = await navigator.serviceWorker.getRegistration(); sw = r ? (r.active ? 'active' : 'installing') : (ar ? 'غير مسجّل' : 'not registered'); } } catch (e) {}
    lines.push('Service Worker: ' + sw);
    try { const keys = await caches.keys(); lines.push((ar ? 'إصدار الكاش: ' : 'Cache version: ') + (keys.join(', ') || '-')); } catch (e) {}
    try { const h = loadHandledLog(); lines.push((ar ? 'سجل الفائت: ' : 'Missed log: ') + h.tasks.length + (ar ? ' مهام، ' : ' tasks, ') + h.subs.length + (ar ? ' اشتراكات' : ' subs')); } catch (e) {}
    if (perm !== 'granted') {
        lines.push(ar ? '⚠️ اضغط "تفعيل الإشعارات" واسمح للمتصفح أولاً' : '⚠️ Press "Enable notifications" and allow it in the browser first');
        out.innerText = lines.join('\n');
        return;
    }
    const ok = await window.showAppNotification(i18n[currentLang].notif_test_title, i18n[currentLang].notif_test_body);
    if (ok) lines.push(ar ? '✅ اتبعت الإشعار للنظام. لو ما ظهرش، افحص إعدادات الجهاز (عدم الإزعاج / وضع التركيز / إذن المتصفح من النظام).' : '✅ Sent to the system. If you do not see it, check device settings (Do Not Disturb / Focus mode / browser permission in the OS).');
    else lines.push((ar ? '❌ فشل الإرسال: ' : '❌ Failed: ') + (window.__lastNotifResult || ''));
    out.innerText = lines.join('\n');
};
window.enableAppNotifications = () => {
    if (typeof Notification === 'undefined') { alert(currentLang === 'ar' ? 'المتصفح ده مش بيدعم الإشعارات' : 'This browser does not support notifications'); return; }
    Notification.requestPermission().then(perm => {
        const statusEl = document.getElementById('notifStatusText');
        if (perm === 'granted') {
            localStorage.setItem('fp_notifications_enabled', 'true');
            if (statusEl) statusEl.innerText = i18n[currentLang].notif_enabled_msg;
        } else {
            localStorage.setItem('fp_notifications_enabled', 'false');
            if (statusEl) statusEl.innerText = i18n[currentLang].notif_denied_msg;
        }
    });
};
// ----------------------------------------
// مركز الإشعارات (v41.2): الفائتة والقادمة خلال 24 ساعة، مع تحديد كمقروء وحذف
// ----------------------------------------
const NOTIF_CENTER_HOURS = 24;     // المدى الزمني (قبل وبعد الوقت الحالي)
const NOTIF_CENTER_KEEP_DAYS = 8;  // مدة الاحتفاظ بحالة (مقروء/محذوف) قبل التنظيف
let notifCenterFilter = 'all';
let notifCenterState = null;
let notifCenterSig = '';

function loadNotifCenterState() {
    if (notifCenterState) return notifCenterState;
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem('fp_notif_center')); } catch (e) {}
    const st = { read: {}, deleted: {} };
    const cutoff = Date.now() - NOTIF_CENTER_KEEP_DAYS * 86400000;
    if (raw && typeof raw === 'object') ['read', 'deleted'].forEach(k => { Object.keys(raw[k] || {}).forEach(key => { if (raw[k][key] > cutoff) st[k][key] = raw[k][key]; }); });
    notifCenterState = st;
    return st;
}
function saveNotifCenterState() { try { localStorage.setItem('fp_notif_center', JSON.stringify(notifCenterState)); } catch (e) {} }
const notifLocalStr = d => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
function notifHourLabel(h) { h = parseInt(h) || 0; return h === 0 ? '12 AM' : h === 12 ? '12 PM' : (h > 12 ? `${h - 12} PM` : `${h} AM`); }
function notifClock(ms) { return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
function notifDayWord(dateStr) {
    const L = i18n[currentLang];
    const now = new Date(); const tm = new Date(now); tm.setDate(tm.getDate() + 1); const ym = new Date(now); ym.setDate(ym.getDate() - 1);
    if (dateStr === notifLocalStr(now)) return L.notif_c_today;
    if (dateStr === notifLocalStr(tm)) return L.notif_c_tomorrow;
    if (dateStr === notifLocalStr(ym)) return L.notif_c_yesterday;
    return dateStr;
}
function notifRelative(diffMs) { // الموجب = في المستقبل
    const L = i18n[currentLang];
    const mins = Math.max(1, Math.round(Math.abs(diffMs) / 60000));
    const h = Math.floor(mins / 60), m = mins % 60;
    const txt = h > 0 ? `${h} ${L.notif_c_h}${m ? ' ' + m + ' ' + L.notif_c_m : ''}` : `${m} ${L.notif_c_m}`;
    return currentLang === 'ar' ? `${diffMs > 0 ? L.notif_c_in : L.notif_c_ago} ${txt}` : (diffMs > 0 ? `${L.notif_c_in} ${txt}` : `${txt} ${L.notif_c_ago}`);
}
const notifStripEmoji = s => String(s || '').replace(/^[^\p{L}\p{N}]+/u, '');

function buildNotifCenterItems() {
    const st = loadNotifCenterState();
    const L = i18n[currentLang];
    const now = Date.now(), span = NOTIF_CENTER_HOURS * 3600000;
    const items = [];
    const add = it => {
        const diff = it.at - now;
        if (diff > span || -diff > span) return;
        if (st.deleted[it.key]) return;
        it.status = diff > 0 ? 'upcoming' : 'missed';
        it.diff = diff;
        it.read = !!st.read[it.key + '|' + it.status]; // لما القادم يبقى فائت بيرجع غير مقروء لأنه خبر جديد
        items.push(it);
    };
    const qEmoji = { urgent: '⏰', important: '⭐', delegate: '👥', cancelled: '🚫' };
    tasks.forEach(t => {
        if (!NOTIF_QUADRANTS.includes(t.quadrant) || t.completed || !t.date) return;
        const p = String(t.date).split('-').map(Number);
        const hr = parseInt(t.hour) || 0;
        add({ key: 't-' + t.id + '-' + t.date + '-' + hr, kind: 'task', icon: qEmoji[t.quadrant], title: t.title, tag: L['q_' + t.quadrant], when: `${notifDayWord(t.date)} ${notifHourLabel(hr)}`, at: new Date(p[0], p[1] - 1, p[2], hr, 0, 0).getTime(), date: t.date });
    });
    subscriptions.forEach(s => {
        const due = pendingSubDue(s);
        if (!due) return;
        const p = String(due).split('-').map(Number);
        add({ key: 's-' + s.id + '-' + due, kind: 'sub', icon: '📱', title: s.name, sub: L.notif_c_sub_body, tag: L.notif_c_sub_due, when: notifDayWord(due), at: new Date(p[0], p[1] - 1, p[2], 23, 59, 0).getTime() });
    });
    if (habits.length > 0) {
        const n = new Date();
        const todayKey = `${n.getFullYear()}-${n.getMonth()}-${n.getDate()}`;
        if (habits.some(h => !(h.days && h.days[todayKey]))) {
            add({ key: 'h-' + notifLocalStr(n), kind: 'habit', icon: '✅', title: notifStripEmoji(L.notif_habit_title), sub: L.notif_habit_body, tag: '', when: `${L.notif_c_today} ${notifHourLabel(20)}`, at: new Date(n.getFullYear(), n.getMonth(), n.getDate(), 20, 0, 0).getTime() });
        }
    }
    if (targetTime > 0 && (isPomRunning || pomTimeLeft === 0)) {
        add({ key: 'p-' + targetTime, kind: 'pom', icon: '⏱️', title: isPomRunning ? L.notif_c_pom_running : L.notif_c_pom_ended, sub: `${L.notif_c_pom_ends} ${notifClock(targetTime)}`, tag: notifStripEmoji(L.nav_pomodoro), when: notifClock(targetTime), at: targetTime });
    }
    return items;
}
function getNotifCenterShown() {
    const items = buildNotifCenterItems();
    const missed = items.filter(i => i.status === 'missed').sort((a, b) => b.at - a.at);
    const upcoming = items.filter(i => i.status === 'upcoming').sort((a, b) => a.at - b.at);
    const shown = notifCenterFilter === 'missed' ? missed : notifCenterFilter === 'upcoming' ? upcoming : missed.concat(upcoming);
    return { items, missed, upcoming, shown };
}
function renderNotifCenter() {
    const { items, missed, upcoming, shown } = getNotifCenterShown();
    const L = i18n[currentLang];
    const unread = items.filter(i => !i.read).length;
    const badge = document.getElementById('notifBadge');
    if (badge) { badge.textContent = unread > 99 ? '99+' : String(unread); badge.style.display = unread ? 'inline-flex' : 'none'; }
    const view = document.getElementById('notifCenterView');
    const box = document.getElementById('notifCenterContainer');
    if (!view || !box || !view.classList.contains('active')) return;
    const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setTxt('notifCntAll', items.length); setTxt('notifCntMissed', missed.length); setTxt('notifCntUpcoming', upcoming.length);
    document.querySelectorAll('#notifTabs .notif-tab').forEach(b => b.classList.toggle('active', b.getAttribute('data-filter') === notifCenterFilter));
    const html = shown.length === 0 ? `<div class="notif-empty">${escapeHtml(L.notif_c_empty)}</div>` : shown.map(i => {
        const tagTxt = i.status === 'missed' ? L.notif_c_missed : L.notif_c_upcoming;
        return `<div class="notif-item ${i.status}${i.read ? ' read' : ''}" data-key="${escapeHtml(i.key)}" data-status="${i.status}" data-kind="${i.kind}" data-date="${escapeHtml(i.date || '')}">
            <div class="notif-icon" aria-hidden="true">${i.icon}</div>
            <div class="notif-body">
                <div class="notif-title">${i.read ? '' : '<span class="notif-dot"></span>'}${escapeHtml(i.title)}</div>
                ${i.sub ? `<div class="notif-sub">${escapeHtml(i.sub)}</div>` : ''}
                <div class="notif-meta"><span class="notif-tag">${escapeHtml(tagTxt)}</span>${i.tag ? `<span>${escapeHtml(i.tag)}</span>` : ''}<span>${escapeHtml(i.when)}</span><span>${escapeHtml(notifRelative(i.diff))}</span></div>
            </div>
            <div class="notif-actions no-print">
                <button type="button" class="icon-btn" data-act="read" title="${escapeHtml(i.read ? L.notif_c_mark_unread : L.notif_c_mark_read)}" aria-label="${escapeHtml(i.read ? L.notif_c_mark_unread : L.notif_c_mark_read)}"><i class="fa-solid ${i.read ? 'fa-envelope' : 'fa-envelope-open'}"></i></button>
                <button type="button" class="icon-btn" data-act="delete" title="${escapeHtml(L.notif_c_delete)}" aria-label="${escapeHtml(L.notif_c_delete)}" style="color:var(--danger);"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
    const sig = currentLang + '|' + notifCenterFilter + '|' + html;
    if (sig === notifCenterSig) return;
    notifCenterSig = sig;
    box.innerHTML = html;
    if (!box.__bound) {
        box.__bound = true;
        box.addEventListener('click', e => {
            const card = e.target.closest('.notif-item'); if (!card) return;
            const key = card.getAttribute('data-key'), status = card.getAttribute('data-status');
            const act = e.target.closest('[data-act]');
            const st = loadNotifCenterState();
            if (act && act.getAttribute('data-act') === 'delete') { st.deleted[key] = Date.now(); }
            else if (act && act.getAttribute('data-act') === 'read') { const rk = key + '|' + status; if (st.read[rk]) delete st.read[rk]; else st.read[rk] = Date.now(); }
            else { st.read[key + '|' + status] = Date.now(); saveNotifCenterState(); openNotifSource(card.getAttribute('data-kind'), card.getAttribute('data-date')); return; }
            saveNotifCenterState(); renderNotifCenter();
        });
        const tabs = document.getElementById('notifTabs');
        if (tabs) tabs.addEventListener('click', e => { const b = e.target.closest('.notif-tab'); if (!b) return; notifCenterFilter = b.getAttribute('data-filter'); renderNotifCenter(); });
    }
}
function openNotifSource(kind, date) {
    const go = target => { const nav = document.querySelector(`.nav-item[data-target="${target}"]`); if (nav) nav.click(); };
    if (kind === 'task') { if (date) { currentDailyDate = date; const vd = document.getElementById('viewDailyDate'); if (vd) vd.value = date; } go('dailyView'); }
    else if (kind === 'sub') go('subsView');
    else if (kind === 'habit') go('habitsView');
    else if (kind === 'pom') go('pomodoroView');
}
window.markAllNotifRead = () => {
    const st = loadNotifCenterState();
    getNotifCenterShown().shown.forEach(i => { st.read[i.key + '|' + i.status] = Date.now(); });
    saveNotifCenterState(); renderNotifCenter();
};
window.deleteAllNotifs = () => {
    const { shown } = getNotifCenterShown();
    if (shown.length === 0) return;
    if (!confirm(i18n[currentLang].notif_c_confirm_delete)) return;
    const st = loadNotifCenterState();
    shown.forEach(i => { st.deleted[i.key] = Date.now(); });
    saveNotifCenterState(); renderNotifCenter();
};

// تحديث نص حالة الإشعارات عند تغيير اللغة (بدون إعادة تحميل)
window.refreshNotifStatus = () => {
    const statusEl = document.getElementById('notifStatusText');
    if (!statusEl || !statusEl.innerText.trim() || typeof Notification === 'undefined') return;
    if (notifEnabled()) statusEl.innerText = i18n[currentLang].notif_enabled_msg;
    else if (Notification.permission === 'denied') statusEl.innerText = i18n[currentLang].notif_denied_msg;
};
// ----------------------------------------
// الإشعارات الفائتة (v40.1): لو التطبيق كان مقفول وقت الإشعار، بتظهر أول ما يتفتح تاني
// ----------------------------------------
const MISSED_LOOKBACK_DAYS = 3; // أقصى عدد أيام بنرجع لها لمراجعة المهام الفائتة
const NOTIF_QUADRANTS = ['urgent', 'important', 'delegate', 'cancelled']; // كل التصنيفات اللي بتطلع لها إشعارات
const HANDLED_LOG_VERSION = 2;
// نهاية نافذة إشعار المهمة (ساعة بعد موعدها) بالملي ثانية
function taskWindowEnd(t) {
    const parts = String(t.date).split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], parseInt(t.hour) || 0, 0, 0).getTime() + 60 * 60000;
}
let handledLog = null; // سجل دائم (مش بيتصفر كل يوم) للمهام والاشتراكات اللي اتعامل معاها
function pendingSubDue(s) {
    if (s.archived) return null;
    const cyclesDone = s.frequency === 'yearly' ? (s.paid ? 1 : 0) : (s.paymentsCount || 0);
    const cyclesTarget = s.frequency === 'yearly' ? 1 : s.durationCount;
    if (cyclesDone >= cyclesTarget) return null;
    return s.frequency === 'yearly' ? s.endDate : s.nextPaymentDate;
}
function saveHandledLog() {
    if (!handledLog) return;
    try {
        // تنظيف السجل من المهام/الاشتراكات المحذوفة (بس لو البيانات اتحملت فعلاً)
        if (tasks.length > 0) { const ids = new Set(tasks.map(t => String(t.id))); handledLog.tasks = handledLog.tasks.filter(id => ids.has(String(id))); }
        if (subscriptions.length > 0) { const sids = new Set(subscriptions.map(s => String(s.id))); handledLog.subs = handledLog.subs.filter(k => sids.has(String(k).split('|')[0])); }
        localStorage.setItem('fp_notified_persist', JSON.stringify(handledLog));
    } catch (e) {}
}
function loadHandledLog() {
    if (handledLog) return handledLog;
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem('fp_notified_persist')); } catch (e) {}
    const hasLog = raw && Array.isArray(raw.tasks) && Array.isArray(raw.subs);
    if (hasLog && raw.v >= HANDLED_LOG_VERSION) { handledLog = raw; return handledLog; }
    // أول تشغيل (أو ترقية من نسخة أقدم): نعتبر المتأخر الحالي "اتعامل معاه" عشان ما يظهرش سيل إشعارات قديمة مرة واحدة
    const today = getTodayStr();
    const nowMs = Date.now();
    handledLog = hasLog ? raw : { tasks: [], subs: [] };
    handledLog.v = HANDLED_LOG_VERSION;
    tasks.forEach(t => {
        if (!NOTIF_QUADRANTS.includes(t.quadrant) || !t.date) return;
        if (handledLog.tasks.some(x => String(x) === String(t.id))) return;
        // الجديد في الترقية: التصنيفات غير العاجل اللي وقتها فات قبل كده ماكانش ليها إشعارات أصلاً
        if (t.date < today || (t.date === today && nowMs > taskWindowEnd(t))) handledLog.tasks.push(t.id);
    });
    if (!hasLog) subscriptions.forEach(s => { const due = pendingSubDue(s); if (due && due < today) handledLog.subs.push(s.id + '|' + due); });
    saveHandledLog();
    return handledLog;
}
function markTaskHandled(id) { const h = loadHandledLog(); if (!h.tasks.some(x => String(x) === String(id))) { h.tasks.push(id); saveHandledLog(); } }
function markSubHandled(key) { const h = loadHandledLog(); if (!h.subs.includes(key)) { h.subs.push(key); saveHandledLog(); } }
function showMissedNotifications(items) {
    if (!items.length) return;
    if (items.length <= 3) { items.forEach(it => window.showAppNotification(it.title, it.body)); return; }
    // لو الفائت كتير نجمعه في إشعار واحد بدل ما نزعج المستخدم بسيل إشعارات
    window.showAppNotification(`${i18n[currentLang].notif_missed_summary_title} (${items.length})`, items.slice(0, 3).map(it => it.body).join(' • ') + ' …');
}
function checkMissedNotifications() {
    const today = getTodayStr();
    const nowMs = Date.now();
    const items = [];
    const hourLabel = h => { h = parseInt(h) || 0; return h === 0 ? '12 AM' : h === 12 ? '12 PM' : (h > 12 ? `${h - 12} PM` : `${h} AM`); };
    const lb = new Date(); lb.setDate(lb.getDate() - MISSED_LOOKBACK_DAYS);
    const minStr = new Date(lb.getTime() - (lb.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const handled = loadHandledLog();

    // 1) المهام (عاجل/مهم/مفوّض/ملغي) اللي فات وقتها ولسه مش مكتملة
    tasks.filter(t => NOTIF_QUADRANTS.includes(t.quadrant) && !t.completed && t.date && t.date >= minStr && t.date <= today).forEach(t => {
        if (handled.tasks.some(x => String(x) === String(t.id)) || alreadyNotified('task-' + t.id)) return;
        const windowEnd = taskWindowEnd(t);
        if (nowMs <= windowEnd) return; // لسه وقتها ماخلصش، والإشعار العادي هو اللي بيتعامل معاها
        const created = Number(t.id);
        // لو المهمة اتضافت بعد ما وقتها كان فات، يبقى ماكانش في إشعار مستحق أصلاً
        if (created > 1e12 && created > windowEnd) { markTaskHandled(t.id); return; }
        items.push({ title: i18n[currentLang]['notif_missed_' + t.quadrant + '_title'], body: `${t.title} — ${t.date} ${hourLabel(t.hour)}` });
        markTaskHandled(t.id);
    });

    // 2) الاشتراكات اللي موعد دفعها عدّى ولسه ماتدفعتش
    subscriptions.forEach(s => {
        const due = pendingSubDue(s);
        if (!due || due >= today) return;
        const key = s.id + '|' + due;
        if (handled.subs.includes(key)) return;
        items.push({ title: i18n[currentLang].notif_missed_sub_title, body: `${s.name} — ${due}` });
        markSubHandled(key);
    });

    showMissedNotifications(items);
}

// الإشعارات شغالة طالما صلاحية المتصفح ممنوحة، إلا لو المستخدم قفلها صراحةً
function notifEnabled() {
    return typeof Notification !== 'undefined' && Notification.permission === 'granted' && localStorage.getItem('fp_notifications_enabled') !== 'false';
}
function checkNotificationTriggers() {
    if (!notifEnabled()) return;
    checkMissedNotifications();
    const today = getTodayStr();
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    tasks.filter(t => NOTIF_QUADRANTS.includes(t.quadrant) && t.date === today && !t.completed).forEach(t => {
        const key = 'task-' + t.id;
        if (alreadyNotified(key)) return;
        const taskMinutes = (parseInt(t.hour) || 0) * 60;
        if (nowMinutes >= taskMinutes - 15 && nowMinutes <= taskMinutes + 60) {
            window.showAppNotification(i18n[currentLang]['notif_' + t.quadrant + '_title'], t.title);
            markNotified(key);
            markTaskHandled(t.id);
        }
    });

    subscriptions.filter(s => !s.archived).forEach(s => {
        const cyclesDone = s.frequency === 'yearly' ? (s.paid ? 1 : 0) : (s.paymentsCount || 0);
        const cyclesTarget = s.frequency === 'yearly' ? 1 : s.durationCount;
        if (cyclesDone >= cyclesTarget) return;
        const due = s.frequency === 'yearly' ? s.endDate : s.nextPaymentDate;
        if (due === today) {
            const key = 'sub-' + s.id + '-' + today;
            if (!alreadyNotified(key)) { window.showAppNotification(i18n[currentLang].notif_sub_title, s.name); markNotified(key); markSubHandled(s.id + '|' + due); }
        }
    });

    if (now.getHours() >= 20 && habits.length > 0) { // من 8 مساءً وطالع: لو التطبيق اتفتح متأخر برضه يظهر التنبيه
        const key = 'habits-' + today;
        if (!alreadyNotified(key)) {
            const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
            const incomplete = habits.some(h => !(h.days && h.days[todayKey]));
            if (incomplete) { window.showAppNotification(i18n[currentLang].notif_habit_title, i18n[currentLang].notif_habit_body); }
            markNotified(key);
        }
    }
}

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

// ========================================
// لوحة الكتابة (v42.2): ورقة مسطّرة بلا نهاية بالقلم أو الإصبع + نص بالكيبورد + إملاء صوتي + روابط (IndexedDB)
// ========================================
const WR_LOGICAL_W = 600;      // عرض الورقة بوحدات منطقية ثابتة (عشان الخط يتطابق على كل الأجهزة)
const WR_MAX_DISPLAY_W = 760;  // أقصى عرض للورقة (px) على الشاشات الكبيرة
const WR_LINE_GAP = 44;        // المسافة بين السطور
const WR_TOP_MARGIN = 80;      // موضع أول سطر
const WR_EXTRA = 1500;         // مساحة إضافية تحت آخر كتابة (الورقة بتكبر لوحدها)
const WR_ERASER_R = 14;        // نصف قطر الممحاة
const WR_TEXT_SIZES = [20, 26, 36]; // أحجام النص (صغير/وسط/كبير)
const WR_DB_NAME = 'planner_writing';
// روابط: [نص](https://...) أو رابط مباشر http(s):// أو www.
const WR_LINK_RE = /\[([^\]\n]{1,200})\]\((https?:\/\/[^\s)]+)\)|((?:https?:\/\/|www\.)[^\s<>"'`]+)/gi;

const wr = {
    open: false, id: null, title: '', created: 0, persisted: false, strokes: [], texts: [], undo: [], redo: [],
    tool: 'pen', color: '#111827', size: 3, tsize: 26, fingerWrites: true, penSeen: false, dictLang: (currentLang === 'ar' ? 'ar-EG' : 'en-US'),
    cur: null, erasing: null, tap: null, edit: null, dict: null, dlgOpen: false, textNodes: new Map(), hDirty: false,
    activeId: null, touches: new Map(), panning: false, lastC: 0, lastT: 0, vel: 0, momentum: 0,
    scale: 1, offX: 0, cssW: 0, cssH: 0, dpr: 1, raf: 0, maxY: 0, eraserPos: null,
    dirty: false, saveTimer: 0, flashTimer: 0, bound: false, meta: [], metaLoaded: false, metaLoading: false
};
try { const p = JSON.parse(localStorage.getItem('fp_wr_prefs') || 'null'); if (p) { if (p.color) wr.color = p.color; if (p.size) wr.size = p.size; if (p.tool && p.tool !== 'text') wr.tool = p.tool; if (WR_TEXT_SIZES.includes(p.tsize)) wr.tsize = p.tsize; if (p.dictLang) wr.dictLang = p.dictLang; if (typeof p.fingerWrites === 'boolean') wr.fingerWrites = p.fingerWrites; } } catch (e) {}
function wrSavePrefs() { try { localStorage.setItem('fp_wr_prefs', JSON.stringify({ color: wr.color, size: wr.size, tool: wr.tool, tsize: wr.tsize, dictLang: wr.dictLang, fingerWrites: wr.fingerWrites })); } catch (e) {} }

// ---------- التخزين (IndexedDB) ----------
let wrDbPromise = null;
let wrStorageOk = true;
const wrMemory = { meta: {}, data: {} }; // احتياطي بسيط لو IndexedDB مش متاح (بدون حفظ دائم)
function wrOpenDb() {
    if (wrDbPromise) return wrDbPromise;
    wrDbPromise = new Promise((resolve, reject) => {
        try {
            if (!window.indexedDB) throw new Error('no-idb');
            const req = indexedDB.open(WR_DB_NAME, 1);
            req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'id' }); if (!db.objectStoreNames.contains('data')) db.createObjectStore('data', { keyPath: 'id' }); };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
            req.onblocked = () => reject(new Error('blocked'));
        } catch (e) { reject(e); }
    }).catch(e => { wrStorageOk = false; console.warn('Writing storage unavailable:', e); return null; });
    return wrDbPromise;
}
const wrReq = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function wrGetAllMeta() { const db = await wrOpenDb(); if (!db) return Object.values(wrMemory.meta); return wrReq(db.transaction('meta').objectStore('meta').getAll()); }
async function wrGetData(id) { const db = await wrOpenDb(); if (!db) return wrMemory.data[id] || null; return wrReq(db.transaction('data').objectStore('data').get(id)); }
async function wrPut(meta, data) {
    const db = await wrOpenDb();
    if (!db) { wrMemory.meta[meta.id] = meta; wrMemory.data[meta.id] = data; return; }
    await new Promise((res, rej) => { const tx = db.transaction(['meta', 'data'], 'readwrite'); tx.objectStore('meta').put(meta); tx.objectStore('data').put(data); tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
}
async function wrRemove(id) {
    const db = await wrOpenDb();
    if (!db) { delete wrMemory.meta[id]; delete wrMemory.data[id]; return; }
    await new Promise((res, rej) => { const tx = db.transaction(['meta', 'data'], 'readwrite'); tx.objectStore('meta').delete(id); tx.objectStore('data').delete(id); tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
}

// ---------- الخطوط (Strokes) ----------
function wrStrokeBBox(s) {
    const a = s.a; let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < a.length; i += 2) { const x = a[i] / 10, y = a[i + 1] / 10; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const pad = s.w / 2 + 1; s.bb = [x0 - pad, y0 - pad, x1 + pad, y1 + pad]; return s;
}
function wrPath(s) {
    if (s._p) return s._p;
    const a = s.a, n = a.length / 2, p = new Path2D();
    p.moveTo(a[0] / 10, a[1] / 10);
    if (n === 1) p.lineTo(a[0] / 10 + 0.01, a[1] / 10);
    else if (n === 2) p.lineTo(a[2] / 10, a[3] / 10);
    else {
        for (let i = 1; i < n - 1; i++) { const x = a[2 * i] / 10, y = a[2 * i + 1] / 10, nx = a[2 * i + 2] / 10, ny = a[2 * i + 3] / 10; p.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2); }
        p.lineTo(a[2 * (n - 1)] / 10, a[2 * (n - 1) + 1] / 10);
    }
    s._p = p; return p;
}

// ---------- النصوص والروابط ----------
function wrSafeUrl(u) {
    try { let x = String(u).trim(); if (/^www\./i.test(x)) x = 'https://' + x; const url = new URL(x); return (url.protocol === 'http:' || url.protocol === 'https:') ? url.href : null; } catch (e) { return null; }
}
function wrSegments(text) {
    const out = []; let last = 0, m; WR_LINK_RE.lastIndex = 0;
    while ((m = WR_LINK_RE.exec(text))) {
        if (m.index > last) out.push({ s: text.slice(last, m.index) });
        if (m[1]) out.push({ s: m[1], url: wrSafeUrl(m[2]) });
        else {
            let u = m[3], tail = ''; const tr = u.match(/[.,;:!?)\]،؛؟]+$/);
            if (tr) { tail = tr[0]; u = u.slice(0, -tail.length); }
            out.push({ s: u, url: wrSafeUrl(u) }); if (tail) out.push({ s: tail });
        }
        last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ s: text.slice(last) });
    return out;
}
const wrPlainText = t => wrSegments(t).map(g => g.s).join('');
const wrIsRtl = t => /[\u0590-\u08FF]/.test((t.match(/[A-Za-z\u0590-\u08FF]/) || [''])[0]);
const wrSnapTop = y => WR_TOP_MARGIN + Math.max(0, Math.floor((y - WR_TOP_MARGIN) / WR_LINE_GAP)) * WR_LINE_GAP + 6;
function wrEstimateH(t) { let n = 0; String(t.text).split('\n').forEach(l => { n += Math.max(1, Math.ceil(l.length * t.s * 0.55 / t.w)); }); return n * WR_LINE_GAP; }
function wrTextBox(t) { const h = t._h || wrEstimateH(t), x0 = t.x + (t._tx || 0), w = t._tw || t.w; return [x0, t.y, x0 + w, t.y + h]; }
function wrTextAt(px, py) {
    for (let i = wr.texts.length - 1; i >= 0; i--) { const b = wrTextBox(wr.texts[i]); if (px >= b[0] - 8 && px <= b[2] + 8 && py >= b[1] - 4 && py <= b[3] + 4) return wr.texts[i]; }
    return null;
}
function wrFillText(el, it) {
    el.textContent = '';
    wrSegments(it.text).forEach(sg => {
        if (sg.url) { const a = document.createElement('a'); a.className = 'wr-link'; a.href = sg.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = sg.s; el.appendChild(a); }
        else el.appendChild(document.createTextNode(sg.s));
    });
}
function wrLinkAt(cx, cy) {
    const layer = document.getElementById('wrTextLayer'); if (!layer) return null;
    for (const a of layer.querySelectorAll('a.wr-link')) { for (const r of a.getClientRects()) { if (cx >= r.left - 3 && cx <= r.right + 3 && cy >= r.top - 3 && cy <= r.bottom + 3) return a.href; } }
    return null;
}
function wrOpenLink(href) { try { window.open(href, '_blank', 'noopener,noreferrer'); } catch (e) {} }
function wrRecalcMaxY() {
    let m = 0;
    for (const s of wr.strokes) if (s.bb[3] > m) m = s.bb[3];
    for (const t of wr.texts) { const b = t.y + (t._h || wrEstimateH(t)); if (b > m) m = b; }
    wr.maxY = m;
}

// ---------- الرسم على الـ Canvas ----------
function wrLayout() {
    const sc = document.getElementById('wrScroll'), cv = document.getElementById('wrCanvas'), stage = document.getElementById('wrStage');
    if (!sc || !cv || !stage || !wr.open) return;
    const cssW = sc.clientWidth, cssH = sc.clientHeight;
    if (!cssW || !cssH) return;
    const oldScale = wr.scale, oldTop = sc.scrollTop;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const pageW = Math.min(cssW, WR_MAX_DISPLAY_W);
    wr.dpr = dpr; wr.cssW = cssW; wr.cssH = cssH; wr.scale = pageW / WR_LOGICAL_W; wr.offX = (cssW - pageW) / 2;
    const w = Math.round(cssW * dpr), h = Math.round(cssH * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px'; stage.style.height = cssH + 'px';
    wr.textNodes.forEach(el => { el._sig = ''; });
    wrUpdateSizer();
    if (oldScale && Math.abs(oldScale - wr.scale) > 1e-6) sc.scrollTop = (oldTop / oldScale) * wr.scale; // نفس الموضع المنطقي بعد تغيير الحجم/الاتجاه
    wrRender();
}
function wrUpdateSizer() {
    const sz = document.getElementById('wrSizer'); if (!sz) return;
    const units = Math.max(wr.maxY + WR_EXTRA, WR_TOP_MARGIN + WR_EXTRA);
    sz.style.height = Math.round(Math.max(units * wr.scale, wr.cssH + 300)) + 'px';
    sz.style.marginTop = (-wr.cssH) + 'px';
}
function wrRequestRender() { if (!wr.raf) wr.raf = requestAnimationFrame(wrRender); }
function wrDrawStroke(ctx, s) { ctx.strokeStyle = s.c; ctx.lineWidth = s.w; ctx.stroke(wrPath(s)); }
function wrRenderTexts(top, y0, y1) {
    const layer = document.getElementById('wrTextLayer'); if (!layer) return;
    const seen = new Set(), sc = wr.scale;
    for (const it of wr.texts) {
        if (wr.edit && wr.edit.item === it) continue; // وقت التعديل بيظهر مربع الكتابة بدله
        const h = it._h || wrEstimateH(it);
        if (it.y + h < y0 - 60 || it.y > y1 + 60) continue;
        let el = wr.textNodes.get(it.id);
        if (!el) { el = document.createElement('div'); el.className = 'wr-text'; el.setAttribute('dir', 'auto'); layer.appendChild(el); wr.textNodes.set(it.id, el); el._txt = null; el._sig = ''; }
        if (el._txt !== it.text) { wrFillText(el, it); el._txt = it.text; el._sig = ''; }
        const sig = it.s + '|' + it.w + '|' + sc;
        el.style.width = (it.w * sc) + 'px'; el.style.fontSize = (it.s * sc) + 'px'; el.style.lineHeight = (WR_LINE_GAP * sc) + 'px'; el.style.color = it.c;
        el.style.transform = `translate(${wr.offX + it.x * sc}px, ${it.y * sc - top}px)`;
        if (el._sig !== sig) { // قياس الحجم الفعلي مرة واحدة لما يتغير النص أو الحجم
            el._sig = sig;
            const hh = el.offsetHeight / sc; if (hh) it._h = hh;
            try { const rg = document.createRange(); rg.selectNodeContents(el); const rr = rg.getBoundingClientRect(), er = el.getBoundingClientRect(); if (rr.width) { it._tx = (rr.left - er.left) / sc; it._tw = rr.width / sc; } } catch (e) {}
            wr.hDirty = true;
        }
        seen.add(it.id);
    }
    wr.textNodes.forEach((el, id) => { if (!seen.has(id)) { el.remove(); wr.textNodes.delete(id); } });
    if (wr.hDirty) { wr.hDirty = false; wrRecalcMaxY(); wrUpdateSizer(); }
}
function wrPlaceTa(top) {
    const ed = wr.edit; if (!ed) return; const it = ed.item, ta = ed.ta, sc = wr.scale;
    ta.style.width = (it.w * sc) + 'px'; ta.style.fontSize = (it.s * sc) + 'px'; ta.style.lineHeight = (WR_LINE_GAP * sc) + 'px'; ta.style.color = it.c;
    ta.style.transform = `translate(${wr.offX + it.x * sc}px, ${it.y * sc - top}px)`;
}
function wrRender() {
    wr.raf = 0;
    const cv = document.getElementById('wrCanvas'), sc = document.getElementById('wrScroll');
    if (!cv || !sc || !wr.open || !wr.cssW) return;
    const ctx = cv.getContext('2d'), d = wr.dpr, s = wr.scale, top = sc.scrollTop;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#d1d5db'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(wr.offX, 0, WR_LOGICAL_W * s, wr.cssH);
    ctx.setTransform(d * s, 0, 0, d * s, d * wr.offX, -d * top);
    const y0 = top / s, y1 = (top + wr.cssH) / s;
    ctx.strokeStyle = '#c7d9ee'; ctx.lineWidth = 1 / s; ctx.beginPath();
    for (let y = WR_TOP_MARGIN + Math.max(0, Math.floor((y0 - WR_TOP_MARGIN) / WR_LINE_GAP)) * WR_LINE_GAP; y <= y1; y += WR_LINE_GAP) { ctx.moveTo(0, y); ctx.lineTo(WR_LOGICAL_W, y); }
    ctx.stroke();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const st of wr.strokes) { const b = st.bb; if (b[3] < y0 || b[1] > y1) continue; wrDrawStroke(ctx, st); }
    if (wr.cur) { wr.cur._p = null; wrDrawStroke(ctx, wr.cur); }
    if (wr.tool === 'eraser' && wr.eraserPos) { ctx.strokeStyle = 'rgba(100,100,100,0.8)'; ctx.lineWidth = 1 / s; ctx.beginPath(); ctx.arc(wr.eraserPos[0], wr.eraserPos[1], WR_ERASER_R, 0, Math.PI * 2); ctx.stroke(); }
    wrRenderTexts(top, y0, y1);
    wrPlaceTa(top);
}

// ---------- المدخلات (قلم / إصبع / ماوس) ----------
function wrPoint(e) {
    const cv = document.getElementById('wrCanvas'), sc = document.getElementById('wrScroll'), r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left - wr.offX) / wr.scale, y = (e.clientY - r.top + sc.scrollTop) / wr.scale;
    return [Math.max(0, Math.min(WR_LOGICAL_W, x)), Math.max(0, y)];
}
function wrCentroidY() { let s = 0; wr.touches.forEach(t => { s += t.y; }); return wr.touches.size ? s / wr.touches.size : 0; }
function wrStopMomentum() { if (wr.momentum) { cancelAnimationFrame(wr.momentum); wr.momentum = 0; } }
function wrPanReset() { wr.lastC = wrCentroidY(); wr.lastT = performance.now(); }
function wrPanMove() {
    const sc = document.getElementById('wrScroll'), c = wrCentroidY(), t = performance.now(), dy = c - wr.lastC;
    sc.scrollTop -= dy;
    wr.vel = 0.6 * (dy / Math.max(1, t - wr.lastT)) + 0.4 * wr.vel;
    wr.lastC = c; wr.lastT = t;
}
function wrPanEndMomentum() {
    const sc = document.getElementById('wrScroll'); let v = wr.vel * 16; wr.vel = 0;
    if (Math.abs(v) < 1) return;
    const step = () => { sc.scrollTop -= v; v *= 0.95; if (Math.abs(v) > 0.3) wr.momentum = requestAnimationFrame(step); else wr.momentum = 0; };
    wr.momentum = requestAnimationFrame(step);
}
function wrCancelStroke() { wr.cur = null; wr.erasing = null; wr.tap = null; wr.activeId = null; wrRequestRender(); }
function wrAddPoint(e) {
    const p = wrPoint(e);
    if (wr.erasing) { wrEraseTo(p); return; }
    const c = wr.cur; if (!c) return;
    const x = Math.round(p[0] * 10), y = Math.round(p[1] * 10), n = c.a.length;
    if (n >= 2 && Math.abs(c.a[n - 2] - x) + Math.abs(c.a[n - 1] - y) < 6) return; // نتجاهل النقاط القريبة جداً
    c.a.push(x, y);
    if (e.pointerType === 'pen' && e.pressure > 0 && c.pr.length < 6) { c.pr.push(e.pressure); const avg = c.pr.reduce((s, v) => s + v, 0) / c.pr.length; c.w = Math.round(wr.size * (0.6 + 0.8 * avg) * 10) / 10; }
}
function wrDown(e) {
    if (!wr.open) return;
    if (e.pointerType === 'pen') wr.penSeen = true;
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 5) return;
    const cv = e.currentTarget;
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
    wrStopMomentum();
    if (wr.edit) wrCommitText(); // أي لمسة على الورقة بتنهي تعديل النص الحالي
    if (e.pointerType === 'touch') {
        wr.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (wr.touches.size >= 2) { if (wr.activeId !== null) wrCancelStroke(); wr.panning = true; wrPanReset(); return; } // إصبعين = تمرير دايماً
        if (!wr.fingerWrites || wr.penSeen) { wr.panning = true; wrPanReset(); return; }   // الإصبع بيمرّر لو في قلم أو وضع التمرير
    }
    const erasing = wr.tool === 'eraser' || e.button === 5 || (e.buttons & 32);
    wr.activeId = e.pointerId;
    const p = wrPoint(e);
    if (erasing) { wr.erasing = { removed: [], last: null }; wrEraseTo(p); }
    else if (wr.tool === 'text') { const it = wrTextAt(p[0], p[1]); wr.tap = { px: e.clientX, py: e.clientY, p, item: it, moved: false, ox: it ? it.x : 0, oy: it ? it.y : 0 }; }
    else { wr.cur = { c: wr.color, w: wr.size, a: [Math.round(p[0] * 10), Math.round(p[1] * 10)], pr: [], t0: performance.now() }; if (e.pointerType === 'pen' && e.pressure > 0) { wr.cur.pr.push(e.pressure); wr.cur.w = Math.round(wr.size * (0.6 + 0.8 * e.pressure) * 10) / 10; } }
    wrRequestRender();
}
function wrMove(e) {
    if (!wr.open) return;
    if (e.pointerType === 'touch' && wr.touches.has(e.pointerId)) {
        wr.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (wr.panning) { e.preventDefault(); wrPanMove(); return; }
    }
    if (wr.activeId !== e.pointerId) {
        if (wr.tool === 'eraser' && e.pointerType === 'mouse') { wr.eraserPos = wrPoint(e); wrRequestRender(); }
        return;
    }
    e.preventDefault();
    if (wr.tap) { // أداة النص: لمسة = تعديل/إنشاء، سحب = نقل المربع
        const t = wr.tap, dx = e.clientX - t.px, dy = e.clientY - t.py;
        if (!t.moved && Math.hypot(dx, dy) > 8) t.moved = true;
        if (t.moved && t.item) { t.item.x = Math.max(0, Math.min(WR_LOGICAL_W - 100, t.ox + dx / wr.scale)); t.item.y = Math.max(0, t.oy + dy / wr.scale); wrRequestRender(); }
        return;
    }
    const evs = (e.getCoalescedEvents && e.getCoalescedEvents().length) ? e.getCoalescedEvents() : [e];
    for (const ev of evs) wrAddPoint(ev);
    if (wr.erasing) wr.eraserPos = wrPoint(e);
    wrRequestRender();
}
function wrUp(e) {
    if (!wr.open) return;
    if (e.pointerType === 'touch') {
        wr.touches.delete(e.pointerId);
        if (wr.panning) {
            if (wr.touches.size === 0) { wr.panning = false; wrPanEndMomentum(); } else wrPanReset();
        }
    }
    if (wr.activeId !== e.pointerId) return;
    wr.activeId = null;
    if (wr.erasing) {
        const er = wr.erasing; wr.erasing = null; wr.eraserPos = null;
        if (er.removed.length) { wr.undo.push({ t: 'erase', items: er.removed }); wr.redo = []; wrRecalcMaxY(); wrUpdateSizer(); wrChanged(); }
    } else if (wr.tap) {
        const t = wr.tap; wr.tap = null;
        if (e.type === 'pointercancel') { if (t.item) { t.item.x = t.ox; t.item.y = t.oy; } }
        else if (!t.moved) {
            const href = wrLinkAt(e.clientX, e.clientY);
            if (href) wrOpenLink(href);
            else if (t.item) wrStartTextEdit(t.item);
            else wrStartTextEdit(null, { x: t.p[0], y: t.p[1] });
        } else if (t.item) {
            const ny = wrSnapTop(t.item.y + WR_LINE_GAP / 2 - 6), nx = Math.round(t.item.x);
            t.item.x = nx; t.item.y = ny;
            if (nx !== t.ox || ny !== t.oy) { wr.undo.push({ t: 'tmove', it: t.item, before: { x: t.ox, y: t.oy }, after: { x: nx, y: ny } }); wr.redo = []; wrRecalcMaxY(); wrUpdateSizer(); wrChanged(); }
        }
    } else if (wr.cur) {
        const c = wr.cur; wr.cur = null;
        if (c.a.length <= 4 && performance.now() - c.t0 < 600) { const href = wrLinkAt(e.clientX, e.clientY); if (href) { wrOpenLink(href); wrRequestRender(); return; } } // لمسة سريعة على رابط = فتحه
        const s = wrStrokeBBox({ c: c.c, w: c.w, a: Int32Array.from(c.a) });
        wr.strokes.push(s); wr.undo.push({ t: 'add', s }); wr.redo = [];
        if (s.bb[3] > wr.maxY) { wr.maxY = s.bb[3]; wrUpdateSizer(); }
        wrChanged();
    }
    wrRequestRender();
}
// الممحاة: بتمسح الخط أو مربع النص اللي بتلمسه
function wrSegDist2(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = Math.max(0, Math.min(1, t));
    const qx = ax + t * dx - px, qy = ay + t * dy - py; return qx * qx + qy * qy;
}
function wrEraseAt(px, py) {
    const r = WR_ERASER_R;
    for (let i = wr.strokes.length - 1; i >= 0; i--) {
        const s = wr.strokes[i], b = s.bb;
        if (px < b[0] - r || px > b[2] + r || py < b[1] - r || py > b[3] + r) continue;
        const lim = (r + s.w / 2) * (r + s.w / 2), a = s.a; let hit = false;
        if (a.length === 2) hit = wrSegDist2(px, py, a[0] / 10, a[1] / 10, a[0] / 10, a[1] / 10) <= lim;
        else for (let k = 0; k < a.length - 2; k += 2) { if (wrSegDist2(px, py, a[k] / 10, a[k + 1] / 10, a[k + 2] / 10, a[k + 3] / 10) <= lim) { hit = true; break; } }
        if (hit) { wr.erasing.removed.push({ k: 's', i, s }); wr.strokes.splice(i, 1); }
    }
    for (let i = wr.texts.length - 1; i >= 0; i--) {
        const t = wr.texts[i], b = wrTextBox(t);
        if (px >= b[0] - r && px <= b[2] + r && py >= b[1] - r && py <= b[3] + r) { wr.erasing.removed.push({ k: 't', i, it: t }); wr.texts.splice(i, 1); }
    }
}
function wrEraseTo(p) {
    const er = wr.erasing; if (!er) return;
    const l = er.last;
    if (l) { const dx = p[0] - l[0], dy = p[1] - l[1], steps = Math.ceil(Math.hypot(dx, dy) / (WR_ERASER_R / 2)); for (let k = 1; k <= steps; k++) wrEraseAt(l[0] + dx * k / steps, l[1] + dy * k / steps); }
    else wrEraseAt(p[0], p[1]);
    er.last = p; wr.eraserPos = p;
}

// ---------- تراجع / إعادة ----------
function wrApply(a, undoing) {
    if (a.t === 'add') { if (undoing) { const i = wr.strokes.lastIndexOf(a.s); if (i >= 0) wr.strokes.splice(i, 1); } else wr.strokes.push(a.s); }
    else if (a.t === 'erase') {
        if (undoing) { for (let k = a.items.length - 1; k >= 0; k--) { const it = a.items[k]; if (it.k === 't') wr.texts.splice(Math.min(it.i, wr.texts.length), 0, it.it); else wr.strokes.splice(Math.min(it.i, wr.strokes.length), 0, it.s); } }
        else a.items.forEach(it => { if (it.k === 't') { const i = wr.texts.indexOf(it.it); if (i >= 0) wr.texts.splice(i, 1); } else { const i = wr.strokes.indexOf(it.s); if (i >= 0) wr.strokes.splice(i, 1); } });
    }
    else if (a.t === 'tadd') { if (undoing) { const i = wr.texts.indexOf(a.it); if (i >= 0) wr.texts.splice(i, 1); } else wr.texts.push(a.it); }
    else if (a.t === 'tdel') { if (undoing) wr.texts.splice(Math.min(a.i, wr.texts.length), 0, a.it); else { const i = wr.texts.indexOf(a.it); if (i >= 0) wr.texts.splice(i, 1); } }
    else if (a.t === 'tedit') { const v = undoing ? a.before : a.after; a.it.text = v.text; a.it.c = v.c; a.it.s = v.s; a.it._h = 0; a.it._tw = 0; }
    else if (a.t === 'tmove') { const v = undoing ? a.before : a.after; a.it.x = v.x; a.it.y = v.y; }
}
function wrUndoAction() {
    if (wr.edit) wrCommitText();
    const a = wr.undo.pop(); if (!a) return;
    wrApply(a, true); wr.redo.push(a); wrRecalcMaxY(); wrUpdateSizer(); wrChanged(); wrRequestRender();
}
function wrRedoAction() {
    if (wr.edit) wrCommitText();
    const a = wr.redo.pop(); if (!a) return;
    wrApply(a, false); wr.undo.push(a); wrRecalcMaxY(); wrUpdateSizer(); wrChanged(); wrRequestRender();
}

// ---------- تحرير النص (كيبورد) ----------
function wrAutosizeTa() { const ta = wr.edit && wr.edit.ta; if (!ta) return; ta.style.height = 'auto'; ta.style.height = Math.max(ta.scrollHeight, WR_LINE_GAP * wr.scale) + 'px'; }
function wrEnsureVisible() {
    const ed = wr.edit, sc = document.getElementById('wrScroll'); if (!ed || !sc) return;
    const top = ed.item.y * wr.scale - sc.scrollTop, bottom = top + ed.ta.offsetHeight;
    if (bottom > wr.cssH - 20) sc.scrollTop += bottom - wr.cssH + 28; else if (top < 8) sc.scrollTop += top - 20;
}
function wrStartTextEdit(it, pos) {
    wrCommitText();
    const layer = document.getElementById('wrTextLayer'); if (!layer) return;
    const isNew = !it;
    if (isNew) { const x = Math.max(12, Math.min(pos.x, WR_LOGICAL_W - 312)); it = { id: wrNewId(), x: Math.round(x), y: wrSnapTop(pos.y - WR_LINE_GAP / 2), w: WR_LOGICAL_W - 12 - Math.round(x), text: '', c: wr.color, s: wr.tsize }; }
    const ta = document.createElement('textarea');
    ta.className = 'wr-textedit'; ta.setAttribute('dir', 'auto'); ta.rows = 1; ta.value = it.text; ta.placeholder = i18n[currentLang].wr_text_ph; ta.setAttribute('autocapitalize', 'sentences');
    ta.addEventListener('input', () => { wrAutosizeTa(); wrEnsureVisible(); });
    ta.addEventListener('blur', () => { if (!wr.dlgOpen) setTimeout(() => { if (wr.edit && wr.edit.ta === ta && !wr.dlgOpen && document.activeElement !== ta) wrCommitText(); }, 120); });
    ta.addEventListener('keydown', ev => { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); wrCommitText(); } else if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); wrCommitText(); } });
    wr.edit = { item: it, isNew, ta, before: isNew ? null : { text: it.text, c: it.c, s: it.s } };
    layer.appendChild(ta); wrPlaceTa(document.getElementById('wrScroll').scrollTop); wrAutosizeTa();
    ta.focus({ preventScroll: true }); try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {}
    wrEnsureVisible(); wrSyncToolbar(); wrRequestRender();
}
function wrCommitText() {
    const ed = wr.edit; if (!ed) return;
    wr.edit = null; wrDictStop();
    const text = ed.ta.value.replace(/\s+$/g, ''); ed.ta.remove();
    const it = ed.item;
    if (ed.isNew) { if (text.trim()) { it.text = text; wr.texts.push(it); wr.undo.push({ t: 'tadd', it }); wr.redo = []; wrChanged(); } }
    else {
        const idx = wr.texts.indexOf(it);
        if (!text.trim()) { if (idx >= 0) { wr.texts.splice(idx, 1); wr.undo.push({ t: 'tdel', it, i: idx }); wr.redo = []; wrChanged(); } }
        else if (text !== ed.before.text || it.c !== ed.before.c || it.s !== ed.before.s) { const after = { text, c: it.c, s: it.s }; it.text = text; wr.undo.push({ t: 'tedit', it, before: ed.before, after }); wr.redo = []; wrChanged(); }
    }
    it._h = 0; it._tw = 0; const n = wr.textNodes.get(it.id); if (n) { n._txt = null; n._sig = ''; }
    wrRecalcMaxY(); wrUpdateSizer(); wrSyncToolbar(); wrRequestRender();
}
// مربع نص جديد في أول سطر فاضي تحت كل المحتوى (للإملاء الصوتي وإضافة الروابط)
function wrStartEndItem() {
    const y = wrSnapTop(Math.max(WR_TOP_MARGIN + WR_LINE_GAP, wr.maxY + 8) + WR_LINE_GAP / 2);
    wrStartTextEdit(null, { x: 24, y: y + WR_LINE_GAP / 2 });
    const sc = document.getElementById('wrScroll'); if (sc) sc.scrollTop = Math.max(0, y * wr.scale - wr.cssH * 0.3);
}

// ---------- الإملاء الصوتي ----------
function wrFlash(msg) {
    const el = document.getElementById('wrSaveState'); if (!el) return;
    el.textContent = msg; el.className = 'wr-savestate'; clearTimeout(wr.flashTimer);
    wr.flashTimer = setTimeout(() => { if (el.textContent === msg) wrSetSaveState(wr.dirty ? 'saving' : ''); }, 3200);
}
function wrDictStop() {
    const d = wr.dict; if (!d) return;
    d.active = false; wr.dict = null;
    try { d.rec.onend = null; d.rec.onresult = null; d.rec.onerror = null; d.rec.stop(); } catch (e) {}
    wrSyncToolbar(); wrSetSaveState(wr.dirty ? 'saving' : '');
}
function wrDictStart() {
    const L = i18n[currentLang], SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { wrFlash(L.wr_mic_unsupported); return; }
    if (!wr.edit) wrStartEndItem();
    const ta = wr.edit && wr.edit.ta; if (!ta) return;
    const d = { rec: new SR(), active: true, base: ta.value };
    d.rec.lang = wr.dictLang; d.rec.continuous = true; d.rec.interimResults = true;
    const join = (base, add) => add ? ((base && !/\s$/.test(base) ? base + ' ' : base) + add) : base;
    d.rec.onresult = ev => {
        let fin = '', interim = '';
        for (let i = 0; i < ev.results.length; i++) { const r = ev.results[i]; if (r.isFinal) fin += r[0].transcript; else interim += r[0].transcript; }
        const all = (!interim ? fin : (!fin ? interim : ((/\s$/.test(fin) || /^\s/.test(interim)) ? fin + interim : fin + ' ' + interim))).trim();
        if (wr.edit && wr.edit.ta === ta) { ta.value = join(d.base, all); wrAutosizeTa(); wrEnsureVisible(); }
    };
    d.rec.onerror = ev => {
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { wrFlash(L.wr_mic_denied); wrDictStop(); }
        else if (ev.error === 'network') { wrFlash(L.wr_mic_network); wrDictStop(); }
    };
    d.rec.onend = () => { // المتصفح بيوقف التسجيل بعد فترة صمت، فبنعيد تشغيله طول ما المستخدم ما أوقفش الإملاء
        if (!d.active) return;
        if (wr.edit && wr.edit.ta === ta) d.base = ta.value;
        setTimeout(() => { if (d.active) { try { d.rec.start(); } catch (e) {} } }, 150);
    };
    wr.dict = d;
    try { d.rec.start(); } catch (e) { console.warn('Dictation start failed:', e); wr.dict = null; return; }
    wrSyncToolbar(); const el = document.getElementById('wrSaveState'); if (el) { el.textContent = L.wr_listening; el.className = 'wr-savestate'; }
}
function wrDictToggle() { if (wr.dict) wrDictStop(); else wrDictStart(); }

// ---------- إضافة رابط ----------
function wrLinkOpenDialog() {
    if (!wr.edit) wrStartEndItem();
    const ta = wr.edit && wr.edit.ta; if (!ta) return;
    wr.linkSel = [ta.selectionStart || 0, ta.selectionEnd || 0];
    wr.dlgOpen = true;
    const g = id => document.getElementById(id);
    g('wrLinkLabel').value = ta.value.slice(wr.linkSel[0], wr.linkSel[1]).trim(); g('wrLinkUrl').value = ''; g('wrLinkErr').textContent = '';
    g('wrLinkDlg').style.display = 'flex'; setTimeout(() => g('wrLinkUrl').focus(), 30);
}
function wrLinkCloseDialog() {
    wr.dlgOpen = false; document.getElementById('wrLinkDlg').style.display = 'none';
    const ta = wr.edit && wr.edit.ta; if (ta) ta.focus({ preventScroll: true });
}
function wrLinkConfirm() {
    const g = id => document.getElementById(id), L = i18n[currentLang];
    const url = wrSafeUrl(g('wrLinkUrl').value);
    if (!url) { g('wrLinkErr').textContent = L.wr_link_invalid; g('wrLinkUrl').focus(); return; }
    const label = g('wrLinkLabel').value.trim().replace(/[\[\]\n]/g, ' ');
    const ta = wr.edit && wr.edit.ta;
    if (ta) {
        const [a, b] = wr.linkSel || [ta.value.length, ta.value.length], ins = label ? `[${label}](${url})` : url;
        ta.value = ta.value.slice(0, a) + ins + ta.value.slice(b);
        const pos = a + ins.length; try { ta.setSelectionRange(pos, pos); } catch (e) {}
        wrAutosizeTa();
    }
    wrLinkCloseDialog();
}

// ---------- الحفظ التلقائي ----------
function wrSetSaveState(st) {
    const el = document.getElementById('wrSaveState'); if (!el) return;
    const L = i18n[currentLang];
    el.textContent = st === 'saving' ? L.wr_saving : st === 'saved' ? L.wr_saved : st === 'error' ? L.wr_unavailable : '';
    el.className = 'wr-savestate' + (st === 'error' ? ' err' : '');
}
function wrChanged() {
    if (wr.undo.length > 300) wr.undo.splice(0, wr.undo.length - 300);
    wr.dirty = true; wrSetSaveState('saving'); wrSyncToolbar();
    clearTimeout(wr.saveTimer); wr.saveTimer = setTimeout(wrFlush, 1200);
}
function wrThumb() {
    const W = 240, H = 320, k = W / WR_LOGICAL_W, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.setTransform(k, 0, 0, k, 0, 0);
    x.strokeStyle = '#d5e3f3'; x.lineWidth = 1 / k; x.beginPath();
    for (let y = WR_TOP_MARGIN; y < H / k; y += WR_LINE_GAP) { x.moveTo(0, y); x.lineTo(WR_LOGICAL_W, y); }
    x.stroke(); x.lineCap = 'round'; x.lineJoin = 'round';
    for (const s of wr.strokes) { if (s.bb[1] > H / k) continue; x.strokeStyle = s.c; x.lineWidth = Math.max(s.w, 2.2); x.stroke(wrPath(s)); }
    for (const t of wr.texts) { // رسم تقريبي للنص في الصورة المصغرة (تغليف بسيط للكلمات)
        if (t.y > H / k) continue;
        const rtl = wrIsRtl(t.text); x.font = `${t.s}px sans-serif`; x.fillStyle = t.c; x.direction = rtl ? 'rtl' : 'ltr'; x.textAlign = rtl ? 'right' : 'left';
        const ax = rtl ? t.x + t.w : t.x; let ly = t.y;
        wrPlainText(t.text).split('\n').forEach(par => {
            let line = '';
            par.split(' ').forEach(w => { const test = line ? line + ' ' + w : w; if (line && x.measureText(test).width > t.w) { x.fillText(line, ax, ly + 30); ly += WR_LINE_GAP; line = w; } else line = test; });
            x.fillText(line, ax, ly + 30); ly += WR_LINE_GAP;
        });
    }
    try { return c.toDataURL('image/jpeg', 0.72); } catch (e) { return ''; }
}
async function wrFlush() {
    clearTimeout(wr.saveTimer);
    if (!wr.dirty || !wr.id) return;
    wr.dirty = false;
    const sc = document.getElementById('wrScroll'), now = Date.now();
    if (!wr.created) wr.created = now;
    const meta = { id: wr.id, title: wr.title, created: wr.created, updated: now, thumb: wrThumb(), n: wr.strokes.length + wr.texts.length, sy: sc ? Math.round(sc.scrollTop / wr.scale) : 0 };
    const data = { id: wr.id, strokes: wr.strokes.map(s => ({ c: s.c, w: s.w, a: s.a })), texts: wr.texts.map(t => ({ id: t.id, x: t.x, y: t.y, w: t.w, text: t.text, c: t.c, s: t.s })) };
    try {
        await wrPut(meta, data); wr.persisted = true;
        wr.meta = wr.meta.filter(m => m.id !== meta.id); wr.meta.unshift(meta);
        wrSetSaveState(wrStorageOk ? 'saved' : 'error');
    } catch (e) { console.warn('Writing save failed:', e); wr.dirty = true; wrSetSaveState('error'); }
}

// ---------- فتح / إغلاق المحرر ----------
function wrNewId() { return 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
async function wrOpenEditor(id) {
    const ed = document.getElementById('writingEditor'); if (!ed) return;
    wrDictStop(); if (wr.edit) { wr.edit.ta.remove(); wr.edit = null; }
    wr.textNodes.forEach(el => el.remove()); wr.textNodes.clear();
    wr.id = id || wrNewId(); wr.title = ''; wr.created = 0; wr.persisted = false; wr.strokes = []; wr.texts = []; wr.undo = []; wr.redo = []; wr.cur = null; wr.erasing = null; wr.tap = null; wr.activeId = null; wr.touches.clear(); wr.panning = false; wr.maxY = 0; wr.dirty = false;
    if (wr.tool === 'text') wr.tool = 'pen';
    let sy = 0;
    if (id) {
        const m = wr.meta.find(x => x.id === id); if (m) { wr.title = m.title || ''; wr.created = m.created || 0; sy = m.sy || 0; wr.persisted = true; }
        try {
            const d = await wrGetData(id);
            if (d && Array.isArray(d.strokes)) wr.strokes = d.strokes.map(s => wrStrokeBBox({ c: s.c, w: s.w, a: s.a instanceof Int32Array ? s.a : Int32Array.from(s.a) }));
            if (d && Array.isArray(d.texts)) wr.texts = d.texts.map(t => ({ id: t.id || wrNewId(), x: t.x, y: t.y, w: t.w, text: String(t.text || ''), c: t.c || '#111827', s: WR_TEXT_SIZES.includes(t.s) ? t.s : 26 }));
        } catch (e) { console.warn('Writing load failed:', e); }
    }
    wrRecalcMaxY();
    document.getElementById('wrTitle').value = wr.title;
    wrSetSaveState('');
    ed.style.display = 'flex'; document.body.classList.add('wr-open'); wr.open = true;
    wrSyncToolbar();
    requestAnimationFrame(() => { wrLayout(); const sc = document.getElementById('wrScroll'); if (sc) sc.scrollTop = sy * wr.scale; wrRender(); });
}
async function wrCloseEditor() {
    if (!wr.open) return;
    wrStopMomentum();
    if (wr.dlgOpen) wrLinkCloseDialog();
    if (wr.edit) wrCommitText();
    if (wr.cur || wr.erasing) wrCancelStroke();
    await wrFlush();
    wr.open = false; document.body.classList.remove('wr-open');
    wr.textNodes.forEach(el => el.remove()); wr.textNodes.clear();
    const ed = document.getElementById('writingEditor'); if (ed) { ed.style.display = 'none'; ed.style.height = ''; ed.style.top = ''; }
    renderWritingList();
}

// ---------- الواجهة ----------
function wrSyncToolbar() {
    const g = id => document.getElementById(id); if (!g('writingEditor')) return;
    const textMode = wr.tool === 'text' || !!wr.edit;
    g('wrPen').classList.toggle('active', wr.tool === 'pen'); g('wrEraser').classList.toggle('active', wr.tool === 'eraser'); g('wrTextTool').classList.toggle('active', wr.tool === 'text');
    document.querySelectorAll('#writingEditor .wr-color').forEach(b => b.classList.toggle('active', b.getAttribute('data-color') === wr.color && (wr.tool === 'pen' || textMode)));
    document.querySelectorAll('#writingEditor .wr-size').forEach((b, i) => b.classList.toggle('active', textMode ? WR_TEXT_SIZES[i] === wr.tsize : parseFloat(b.getAttribute('data-size')) === wr.size));
    g('wrUndo').disabled = wr.undo.length === 0; g('wrRedo').disabled = wr.redo.length === 0;
    g('wrMic').classList.toggle('listening', !!wr.dict); g('wrDone').style.display = wr.edit ? 'inline-flex' : 'none';
    const sel = g('wrDictLang'); if (sel.value !== wr.dictLang) sel.value = wr.dictLang;
    const modeBtn = g('wrMode'), key = wr.fingerWrites ? 'wr_mode_write' : 'wr_mode_scroll', L = i18n[currentLang];
    modeBtn.querySelector('i').className = 'fa-solid ' + (wr.fingerWrites ? 'fa-pen-nib' : 'fa-hand');
    const lbl = modeBtn.querySelector('span'); lbl.setAttribute('data-i18n', key); lbl.textContent = L[key];
    modeBtn.classList.toggle('active', !wr.fingerWrites);
}
function wrFmtDate(ms) { return new Date(ms).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }); }
async function wrLoadMeta() {
    if (wr.metaLoading) return; wr.metaLoading = true;
    try { wr.meta = (await wrGetAllMeta()).sort((a, b) => b.updated - a.updated); } catch (e) { console.warn('Writing list failed:', e); wr.meta = []; }
    wr.metaLoaded = true; wr.metaLoading = false;
}
function renderWritingList() {
    const box = document.getElementById('writingList'), view = document.getElementById('writingView');
    if (!box || !view || !view.classList.contains('active')) return;
    if (!wr.metaLoaded) { wrLoadMeta().then(renderWritingList); return; }
    const L = i18n[currentLang];
    const warn = wrStorageOk ? '' : `<div class="notif-empty" style="margin-bottom:12px; color:var(--danger);">${escapeHtml(L.wr_unavailable)}</div>`;
    if (wr.meta.length === 0) { box.innerHTML = warn + `<div class="notif-empty">${escapeHtml(L.wr_empty)}</div>`; return; }
    box.innerHTML = warn + '<div class="wr-grid">' + wr.meta.map(m => {
        const thumb = (m.thumb && String(m.thumb).startsWith('data:image/')) ? `<img src="${m.thumb}" alt="">` : '';
        return `<div class="wr-card" data-id="${escapeHtml(m.id)}" tabindex="0" role="button">
            <div class="wr-thumb">${thumb}</div>
            <div class="wr-card-body"><div class="wr-card-title">${escapeHtml(m.title || L.wr_untitled)}</div><div class="wr-card-date">${escapeHtml(wrFmtDate(m.updated))}</div></div>
            <button type="button" class="icon-btn wr-del" data-act="del" title="${escapeHtml(L.wr_delete)}" aria-label="${escapeHtml(L.wr_delete)}"><i class="fa-solid fa-trash"></i></button>
        </div>`;
    }).join('') + '</div>';
}
function wrFitViewport() { // لما الكيبورد يظهر على الجوال، نخلي المحرر بحجم المساحة المرئية بس
    const ed = document.getElementById('writingEditor'), vv = window.visualViewport; if (!ed || !vv || !wr.open) return;
    if (window.innerHeight - vv.height > 80) { ed.style.height = vv.height + 'px'; ed.style.top = vv.offsetTop + 'px'; ed.style.bottom = 'auto'; }
    else { ed.style.height = ''; ed.style.top = ''; ed.style.bottom = ''; }
    if (wr.edit) setTimeout(wrEnsureVisible, 60);
}
function wrInit() {
    if (wr.bound) return; const ed = document.getElementById('writingEditor'); if (!ed) return; wr.bound = true;
    const g = id => document.getElementById(id), cv = g('wrCanvas'), sc = g('wrScroll');
    const keepFocus = el => el.addEventListener('pointerdown', e => { if (wr.edit) e.preventDefault(); }); // أزرار الأدوات ما تسحبش التركيز من مربع الكتابة
    g('wrNewBtn').addEventListener('click', () => wrOpenEditor(null));
    g('writingList').addEventListener('click', async e => {
        const card = e.target.closest('.wr-card'); if (!card) return; const id = card.getAttribute('data-id');
        if (e.target.closest('[data-act="del"]')) {
            if (!confirm(i18n[currentLang].wr_confirm_delete)) return;
            try { await wrRemove(id); } catch (err) { console.warn(err); }
            wr.meta = wr.meta.filter(m => m.id !== id); renderWritingList(); return;
        }
        wrOpenEditor(id);
    });
    g('writingList').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('wr-card')) { e.preventDefault(); wrOpenEditor(e.target.getAttribute('data-id')); } });
    g('wrBack').addEventListener('click', wrCloseEditor);
    g('wrUndo').addEventListener('click', wrUndoAction); g('wrRedo').addEventListener('click', wrRedoAction);
    g('wrPen').addEventListener('click', () => { wrCommitText(); wr.tool = 'pen'; wr.eraserPos = null; wrSavePrefs(); wrSyncToolbar(); wrRequestRender(); });
    g('wrEraser').addEventListener('click', () => { wrCommitText(); wr.tool = 'eraser'; wrSavePrefs(); wrSyncToolbar(); });
    g('wrTextTool').addEventListener('click', () => { wr.tool = 'text'; wr.eraserPos = null; wrSavePrefs(); wrSyncToolbar(); });
    ed.querySelectorAll('.wr-color').forEach(b => { keepFocus(b); b.addEventListener('click', () => { wr.color = b.getAttribute('data-color'); if (wr.tool === 'eraser') wr.tool = 'pen'; if (wr.edit) { wr.edit.item.c = wr.color; wrPlaceTa(g('wrScroll').scrollTop); } wrSavePrefs(); wrSyncToolbar(); }); });
    ed.querySelectorAll('.wr-size').forEach((b, i) => { keepFocus(b); b.addEventListener('click', () => { if (wr.tool === 'text' || wr.edit) { wr.tsize = WR_TEXT_SIZES[i]; if (wr.edit) { wr.edit.item.s = wr.tsize; wrPlaceTa(g('wrScroll').scrollTop); wrAutosizeTa(); } } else wr.size = parseFloat(b.getAttribute('data-size')); wrSavePrefs(); wrSyncToolbar(); }); });
    g('wrMode').addEventListener('click', () => { wr.fingerWrites = !wr.fingerWrites; wrSavePrefs(); wrSyncToolbar(); });
    g('wrDown').addEventListener('click', () => sc.scrollBy({ top: Math.round(sc.clientHeight * 0.8), behavior: 'smooth' }));
    g('wrTitle').addEventListener('input', e => { wr.title = e.target.value; wrChanged(); });
    keepFocus(g('wrMic')); g('wrMic').addEventListener('click', wrDictToggle);
    keepFocus(g('wrLink')); g('wrLink').addEventListener('click', wrLinkOpenDialog);
    keepFocus(g('wrDone')); g('wrDone').addEventListener('click', wrCommitText);
    g('wrDictLang').addEventListener('change', e => { wr.dictLang = e.target.value; wrSavePrefs(); if (wr.dict) { wrDictStop(); wrDictStart(); } });
    g('wrLinkOk').addEventListener('click', wrLinkConfirm); g('wrLinkCancel').addEventListener('click', wrLinkCloseDialog);
    g('wrLinkDlg').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); wrLinkConfirm(); } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); wrLinkCloseDialog(); } });
    cv.addEventListener('pointerdown', wrDown); cv.addEventListener('pointermove', wrMove);
    cv.addEventListener('pointerup', wrUp); cv.addEventListener('pointercancel', wrUp);
    cv.addEventListener('pointerleave', () => { if (wr.eraserPos && wr.activeId === null) { wr.eraserPos = null; wrRequestRender(); } });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    sc.addEventListener('scroll', wrRequestRender, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(() => { if (wr.open) wrLayout(); }).observe(sc);
    window.addEventListener('resize', () => { if (wr.open) wrLayout(); });
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', wrFitViewport); window.visualViewport.addEventListener('scroll', wrFitViewport); }
    document.addEventListener('keydown', e => {
        if (!wr.open) return;
        const tag = e.target && e.target.tagName, typing = tag === 'TEXTAREA' || tag === 'INPUT';
        if (e.key === 'Escape') { if (wr.dlgOpen) return; e.preventDefault(); if (typing) { if (wr.edit) wrCommitText(); else e.target.blur(); } else wrCloseEditor(); return; }
        if (typing) return;
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); wrUndoAction(); }
        else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); wrRedoAction(); }
    });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && wr.open) { wrDictStop(); wrFlush(); } });
    window.addEventListener('pagehide', () => { if (wr.open) wrFlush(); });
}
document.addEventListener('DOMContentLoaded', wrInit);
if (document.readyState !== 'loading') wrInit();
