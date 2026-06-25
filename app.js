// ════════════════════════════════════════════════════════════
//   SkillBridge 2.0 – app.js
//   Real-time team collaboration via Firebase Realtime Database
//   All votes & comments are synced live across all team members
// ════════════════════════════════════════════════════════════

// ─── FIREBASE CONFIG ────────────────────────────────────────
// ⚠️  أنشئ مشروع Firebase مجاني على https://firebase.google.com
//     ثم استبدل هذه القيم بالـ config الخاص بمشروعك
//     في Firebase Console: Project Settings → Your apps → Web app
// ───────────────────────────────────────────────────────────
const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyDemo_SkillBridge_Replace_Me",
    authDomain:        "skillbridge-team.firebaseapp.com",
    databaseURL:       "https://skillbridge-team-default-rtdb.firebaseio.com",
    projectId:         "skillbridge-team",
    storageBucket:     "skillbridge-team.appspot.com",
    messagingSenderId: "000000000000",
    appId:             "1:000000000000:web:0000000000000000"
};

// ─── STATE ──────────────────────────────────────────────────
let db = null;
let isFirebaseConnected = false;

// Local cache (fallback when Firebase is not configured/available)
let sb_votes    = {};
let sb_comments = {};
let sb_leaderboard_xp = {};

const defaultLeaderboard = [
    { id: "student_1", name: "عمر محمود",   university: "جامعة عين شمس",    skill: "Backend Developer",  xp: 1250, badge: "خبير كود نظيف 🛡️" },
    { id: "student_2", name: "سارة شريف",   university: "جامعة القاهرة",     skill: "React Specialist",   xp: 1100, badge: "بطل السرعة ⚡"     },
    { id: "student_3", name: "ماجد يوسف",   university: "جامعة الإسكندرية",  skill: "UI/UX Designer",     xp: 950,  badge: "منقذ السيرفر 🖥️"  }
];

// Social feature data for the gigs tab
const SOCIAL_FEATURES = [
    { id: "social_posts",    icon: "fa-pen-to-square",  color: "fuchsia", label: "نقطة نقاش #1", title: "نظام نشر المنشورات (Posts Publishing)",
      what: "يسمح للطلاب والعملاء بنشر منشورات نصية وصور ومقتطفات أكواد على الـ Feed العام للمنصة.",
      why:  "يحوّل المنصة من موقع عمل جامد إلى مجتمع حي يجذب الزيارات اليومية ويعرض إنجازات الطلاب.",
      how:  "جدول Posts (id, author_id, content, media_url, created_at) + Endpoint POST /api/posts مع تحقق صلاحيات." },
    { id: "social_likes",    icon: "fa-heart",          color: "rose",    label: "نقطة نقاش #2", title: "نظام الإعجاب (Likes / Reactions)",
      what: "زر إعجاب على كل منشور وتعليق مع عدّاد حي يوضح مدى تفاعل المجتمع مع المحتوى.",
      why:  "مؤشر تفاعل اجتماعي يرفع ترتيب المحتوى الجيد ويحفّز الطلاب على المشاركة المفيدة.",
      how:  "جدول Likes (user_id, post_id) بقيد فريد لمنع التكرار + Endpoint toggle POST /api/posts/:id/like." },
    { id: "social_comments", icon: "fa-comments",       color: "amber",   label: "نقطة نقاش #3", title: "نظام التعليقات (Comments)",
      what: "إمكانية التعليق على المنشورات والرد على التعليقات لإثراء النقاش حول المشاريع والأكواد.",
      why:  "يبني حوارات تقنية بين الطلاب والعملاء ويزيد وقت بقاء المستخدم داخل المنصة.",
      how:  "جدول Comments (id, post_id, author_id, content, parent_id) + Endpoint POST /api/posts/:id/comments." },
    { id: "social_shares",   icon: "fa-share-nodes",    color: "cyan",    label: "نقطة نقاش #4", title: "نظام المشاركة (Share / Repost)",
      what: "مشاركة منشور أو مشروع طالب داخل المنصة أو نسخ رابط خارجي لمشاركته على منصات أخرى.",
      why:  "ينشر المحتوى الجيد ويجلب مستخدمين جدد ويعزز ظهور الطلاب الموهوبين.",
      how:  "جدول Shares (user_id, post_id) + توليد رابط عام للمنشور + عدّاد مشاركات على البطاقة." },
    { id: "social_follow",   icon: "fa-user-plus",      color: "emerald", label: "نقطة نقاش #5", title: "المتابعة وإلغاء المتابعة (Follow / Unfollow)",
      what: "متابعة الطلاب أو العملاء لمشاهدة منشوراتهم وتحديثاتهم أولاً بأول في الـ Feed.",
      why:  "يتيح للعملاء متابعة الطلاب المميزين وتوظيفهم لاحقاً، ويبني شبكة علاقات مهنية.",
      how:  "جدول Followers (follower_id, following_id) + بناء Feed مخصص بناءً على المتابَعين." },
    { id: "social_report",   icon: "fa-flag",           color: "orange",  label: "نقطة نقاش #6", title: "نظام الإبلاغ (Report)",
      what: "الإبلاغ عن أي منشور أو تعليق مسيء أو محتوى احتيالي ليصل للمراجعة من الـ Admin.",
      why:  "يحافظ على بيئة جامعية نظيفة وآمنة ويحمي المنصة من المحتوى الضار أو المخالف.",
      how:  "جدول Reports (reporter_id, target_type, target_id, reason, status) + لوحة مراجعة للـ Admin." },
    { id: "social_block",    icon: "fa-ban",            color: "red",     label: "نقطة نقاش #7", title: "نظام الحظر (Block)",
      what: "حظر أي مستخدم لمنع ظهور محتواه ومنعه من التواصل أو التعليق على ملفك.",
      why:  "يمنح المستخدم تحكماً كاملاً في تجربته ويحميه من المضايقات أو السبام.",
      how:  "جدول Blocks (blocker_id, blocked_id) + فلترة المحتوى والرسائل في طبقة الاستعلام." },
    { id: "social_dm",       icon: "fa-paper-plane",    color: "indigo",  label: "نقطة نقاش #8", title: "الرسائل المباشرة (Direct Messages)",
      what: "محادثات خاصة فورية بين الطالب والعميل للاتفاق على تفاصيل المشروع دون أدوات خارجية.",
      why:  "يبقي كل التواصل داخل المنصة (موثّق وآمن) ويسهّل بدء التعاون فوراً.",
      how:  "جدول Messages (sender_id, receiver_id, content) + WebSocket / Socket.io للتسليم الفوري." }
];

// ─── FIREBASE INITIALIZATION ─────────────────────────────────
function initFirebase() {
    try {
        // Check if config is still placeholder
        if (FIREBASE_CONFIG.apiKey.includes("Demo")) {
            console.warn("[SkillBridge] Firebase config is placeholder – using localStorage fallback.");
            initLocalFallback();
            setConnectionStatus(false, "وضع محلي فقط – أضف Firebase للمزامنة");
            return;
        }

        firebase.initializeApp(FIREBASE_CONFIG);
        db = firebase.database();

        // Monitor connection state
        const connRef = db.ref(".info/connected");
        connRef.on("value", snap => {
            isFirebaseConnected = snap.val() === true;
            setConnectionStatus(isFirebaseConnected, isFirebaseConnected ? "مزامنة لحظية نشطة" : "جاري إعادة الاتصال...");
        });

        // Listen to all votes in real-time
        db.ref("votes").on("value", snap => {
            const data = snap.val();
            if (data) sb_votes = data;
            renderAllCollaborationWidgets();
            calculateGlobalApproval();
        });

        // Listen to all comments in real-time
        db.ref("comments").on("value", snap => {
            const data = snap.val();
            if (data) {
                // Firebase stores arrays as objects; convert back
                for (const key in data) {
                    if (typeof data[key] === "object" && !Array.isArray(data[key])) {
                        data[key] = Object.values(data[key]);
                    }
                }
                sb_comments = data;
            }
            renderAllCollaborationWidgets();
        });

        // Listen to leaderboard XP in real-time
        db.ref("leaderboard_xp").on("value", snap => {
            const data = snap.val();
            if (data) sb_leaderboard_xp = data;
            renderLeaderboard();
        });

    } catch (err) {
        console.error("[SkillBridge] Firebase init error:", err);
        initLocalFallback();
        setConnectionStatus(false, "خطأ في Firebase – وضع محلي");
    }
}

function initLocalFallback() {
    try {
        const v = localStorage.getItem("skillbridge_votes");
        if (v) sb_votes = JSON.parse(v);
        const c = localStorage.getItem("skillbridge_comments");
        if (c) sb_comments = JSON.parse(c);
        const x = localStorage.getItem("skillbridge_xp");
        if (x) { sb_leaderboard_xp = JSON.parse(x); }
        else    { defaultLeaderboard.forEach(s => { sb_leaderboard_xp[s.id] = s.xp; }); }
    } catch(e) { console.error("localStorage error:", e); }
}

function setConnectionStatus(connected, label) {
    const dots = [document.getElementById("sync-indicator"), document.getElementById("sync-indicator-2")];
    const text  = document.getElementById("sync-status-text");
    dots.forEach(d => { if(d) { d.classList.toggle("offline", !connected); } });
    if (text) text.textContent = label;
}

// ─── PERSISTENCE ─────────────────────────────────────────────
function saveVote(sectionId) {
    if (db && isFirebaseConnected) {
        db.ref("votes/" + sectionId).set(sb_votes[sectionId]);
    } else {
        localStorage.setItem("skillbridge_votes", JSON.stringify(sb_votes));
    }
    calculateGlobalApproval();
}

function saveComment(sectionId) {
    if (db && isFirebaseConnected) {
        db.ref("comments/" + sectionId).set(sb_comments[sectionId]);
    } else {
        localStorage.setItem("skillbridge_comments", JSON.stringify(sb_comments));
    }
}

function saveXP() {
    if (db && isFirebaseConnected) {
        db.ref("leaderboard_xp").set(sb_leaderboard_xp);
    } else {
        localStorage.setItem("skillbridge_xp", JSON.stringify(sb_leaderboard_xp));
    }
}

function clearAllData() {
    if (!confirm("هل أنت متأكد من رغبتك في حذف جميع التعليقات والتصويتات وإعادة تهيئة الصفحة؟")) return;

    sb_votes = {}; sb_comments = {}; sb_leaderboard_xp = {};

    if (db && isFirebaseConnected) {
        db.ref("votes").remove();
        db.ref("comments").remove();
        db.ref("leaderboard_xp").remove();
        alert("تمت إعادة تهيئة البيانات على السيرفر بنجاح!");
    } else {
        localStorage.clear();
        alert("تمت إعادة تهيئة البيانات المحلية بنجاح!");
    }
    window.location.reload();
}

// ─── NOTIFICATIONS ───────────────────────────────────────────
function toggleNotifications() {
    const dd = document.getElementById("notif-dropdown");
    const btn = document.getElementById("notif-btn");
    if (dd) dd.classList.toggle("active");
    document.addEventListener("click", function closeHandler(e) {
        if (dd && !dd.contains(e.target) && !btn.contains(e.target)) {
            dd.classList.remove("active");
            document.removeEventListener("click", closeHandler);
        }
    });
}

function markAllNotificationsRead() {
    const badge = document.getElementById("notif-badge");
    if (badge) badge.style.display = "none";
    const list = document.getElementById("notif-list");
    if (list) list.innerHTML = `<p class="text-slate-600 italic text-center py-4 text-xs">لا توجد تنبيهات جديدة غير مقروءة...</p>`;
}

function addLiveNotification(text) {
    const list  = document.getElementById("notif-list");
    const badge = document.getElementById("notif-badge");
    if (!list) return;
    if (badge) { badge.style.display = "flex"; badge.innerText = (parseInt(badge.innerText) || 0) + 1; }
    list.insertAdjacentHTML("afterbegin", `
        <div class="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex gap-2.5 items-start animate-fade-in">
            <span class="text-indigo-400 mt-0.5 text-sm"><i class="fa-solid fa-plus-circle"></i></span>
            <p class="text-slate-300 leading-relaxed text-[11px]">${text}</p>
        </div>
    `);
}

// ─── SIDEBAR (MOBILE) ─────────────────────────────────────────
function toggleSidebar() {
    const sidebar  = document.getElementById("sidebar");
    const overlay  = document.getElementById("sidebar-overlay");
    const isOpen   = sidebar.classList.contains("translate-x-0");
    sidebar.classList.toggle("translate-x-0", !isOpen);
    sidebar.classList.toggle("-translate-x-full", isOpen);
    overlay.classList.toggle("active", !isOpen);
}

// ─── TAB NAVIGATION ──────────────────────────────────────────
function switchTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(el => { el.classList.add("hidden"); el.classList.remove("block"); });
    const active = document.getElementById(tabId);
    if (active) { active.classList.remove("hidden"); active.classList.add("block"); }
    document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("active"));
    const btn = document.getElementById("btn-" + tabId);
    if (btn) btn.classList.add("active");
    // Close sidebar on mobile after tab switch
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    if (window.innerWidth < 1024) {
        sidebar.classList.remove("translate-x-0");
        sidebar.classList.add("-translate-x-full");
        overlay.classList.remove("active");
    }
    // Render leaderboard when proactive tab is opened
    if (tabId === "tab-proactive") renderLeaderboard();
}

// ─── COLLABORATION WIDGETS ────────────────────────────────────
function renderAllCollaborationWidgets() {
    document.querySelectorAll(".collaboration-box").forEach(el => {
        const sid = el.getAttribute("data-section");
        if (!sid) return;
        if (!sb_votes[sid])    sb_votes[sid]    = { yes: 0, no: 0 };
        if (!sb_comments[sid]) sb_comments[sid] = [];

        const v = sb_votes[sid];
        const comments = Array.isArray(sb_comments[sid]) ? sb_comments[sid] : Object.values(sb_comments[sid] || {});
        const totalVotes = (v.yes || 0) + (v.no || 0);

        el.innerHTML = `
            <div class="bg-[#060d1b]/80 border border-slate-800/60 rounded-xl p-4 space-y-4 mt-2 animate-fade-in text-xs">

                <!-- Header: Vote -->
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/60 pb-3">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
                        <h4 class="font-bold text-slate-300 text-[11px]">رأي الفريق في هذه النقطة</h4>
                        ${totalVotes > 0 ? `<span class="text-[9px] text-slate-600">(${totalVotes} تصويت)</span>` : ""}
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-slate-600 font-semibold text-[10px]">هل هذه الفكرة معتمدة؟</span>
                        <button onclick="castVote('${sid}', 'yes')" class="vote-yes-btn-${sid} flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition font-bold text-[11px] ${v.yes > v.no && totalVotes > 0 ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400'}">
                            <i class="fa-solid fa-thumbs-up text-[10px]"></i>
                            <span>نعم (${v.yes || 0})</span>
                        </button>
                        <button onclick="castVote('${sid}', 'no')" class="vote-no-btn-${sid} flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition font-bold text-[11px] ${v.no > v.yes && totalVotes > 0 ? 'bg-rose-500/15 border-rose-500/40 text-rose-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-rose-500/40 hover:text-rose-400'}">
                            <i class="fa-solid fa-thumbs-down text-[10px]"></i>
                            <span>لا (${v.no || 0})</span>
                        </button>
                    </div>
                </div>

                <!-- Comments List -->
                <div class="space-y-2 max-h-40 overflow-y-auto">
                    ${comments.length === 0
                        ? `<p class="text-slate-700 italic py-3 text-center text-[10px]">لا توجد تعليقات بعد — كن أول من يعلّق!</p>`
                        : comments.map(c => `
                            <div class="bg-slate-900/60 border border-slate-800/50 p-2.5 rounded-lg space-y-1 animate-fade-in">
                                <div class="flex justify-between items-center">
                                    <span class="font-bold text-slate-200 text-[10px] flex items-center gap-1">
                                        <i class="fa-regular fa-user text-slate-500 text-[9px]"></i>
                                        ${escapeHTML(c.author)}
                                    </span>
                                    <span class="text-[9px] text-slate-600">${c.timestamp}</span>
                                </div>
                                <p class="text-slate-400 leading-relaxed text-[11px]">${escapeHTML(c.text)}</p>
                            </div>
                        `).join("")}
                </div>

                <!-- Comment Input -->
                <div class="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800/40">
                    <input type="text" id="author-${sid}" placeholder="اسمك..." maxlength="30"
                        class="w-full sm:w-28 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-[11px] placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition">
                    <input type="text" id="text-${sid}" placeholder="اكتب تعليقك أو فكرتك على هذه النقطة..."
                        class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-[11px] placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                        onkeydown="if(event.key==='Enter') submitComment('${sid}')">
                    <button onclick="submitComment('${sid}')" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-lg text-[11px] transition shrink-0">
                        <i class="fa-solid fa-paper-plane ml-1 text-[9px]"></i>إرسال
                    </button>
                </div>
            </div>
        `;
    });
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function castVote(sectionId, voteType) {
    if (!sb_votes[sectionId]) sb_votes[sectionId] = { yes: 0, no: 0 };
    const v = sb_votes[sectionId];
    v[voteType] = (v[voteType] || 0) + 1;
    saveVote(sectionId);
    if (!isFirebaseConnected) renderAllCollaborationWidgets();
}

function submitComment(sectionId) {
    const authorEl = document.getElementById(`author-${sectionId}`);
    const textEl   = document.getElementById(`text-${sectionId}`);
    if (!authorEl || !textEl) return;
    const author = authorEl.value.trim() || "عضو مجهول";
    const text   = textEl.value.trim();
    if (!text) { textEl.focus(); return; }
    const timestamp = new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }) + " | " + new Date().toLocaleDateString("ar-EG");
    if (!sb_comments[sectionId]) sb_comments[sectionId] = [];
    sb_comments[sectionId].push({ author, text, timestamp });
    saveComment(sectionId);
    textEl.value = "";
    if (!isFirebaseConnected) renderAllCollaborationWidgets();
}

function calculateGlobalApproval() {
    let yes = 0, no = 0;
    Object.values(sb_votes).forEach(v => { yes += (v.yes || 0); no += (v.no || 0); });
    const total = yes + no;
    const rateEl = document.getElementById("global-approval-rate");
    const barEl  = document.getElementById("global-approval-bar");
    if (!rateEl || !barEl) return;
    if (total === 0) { rateEl.innerText = "100%"; barEl.style.height = "100%"; return; }
    const pct = Math.round((yes / total) * 100);
    rateEl.innerText = pct + "%";
    barEl.style.height = pct + "%";
    rateEl.className = pct >= 70 ? "font-black text-emerald-400 text-sm leading-none"
                     : pct >= 40 ? "font-black text-yellow-400 text-sm leading-none"
                     :             "font-black text-rose-400 text-sm leading-none";
}

// ─── DIAGNOSTICS TERMINAL ─────────────────────────────────────
function runDiagnostics() {
    const el = document.getElementById("terminal-output");
    if (!el) return;
    el.innerHTML = `<p class="text-slate-500 animate-pulse">[+] جاري تشغيل الفحص الشامل للمنصة...</p>`;
    const steps = [
        { text: "[1/4] فحص ملفات الشبكة http.ts...", delay: 600 },
        { text: "[INFO] كُشف حظر كوكيز HttpOnly عابر النطاق (CORS)!", delay: 1300, cls: "text-amber-400" },
        { text: "[✓ FIX] تطبيق Bearer JWT Fallback – Token محفوظ في localStorage", delay: 2100, cls: "text-emerald-400" },
        { text: "[2/4] فحص تهيئة NEXT_PUBLIC_API_URL...", delay: 2900 },
        { text: "[✓ FIX] تصحيح لاحقة /api تلقائياً – أخطاء 404 محلولة", delay: 3700, cls: "text-emerald-400" },
        { text: "[3/4] فحص قاعدة بيانات SQL Migrations...", delay: 4400 },
        { text: "[✓ FIX] تشغيل precheck_reviews.sql – تكرارات محذوفة", delay: 5200, cls: "text-emerald-400" },
        { text: "[4/4] إنهاء الفحص الشامل...", delay: 5900 },
        { text: "══ [DONE] جميع المشاكل الـ 3 معالجة ✓ المنصة جاهزة للنشر السحابي ══", delay: 6700, cls: "text-emerald-400 font-extrabold border-t border-slate-800 pt-2" }
    ];
    steps.forEach(s => setTimeout(() => {
        el.insertAdjacentHTML("beforeend", `<p class="${s.cls || "text-slate-400"}">> ${s.text}</p>`);
        el.scrollTop = el.scrollHeight;
    }, s.delay));
}

// ─── PROFILE LIVE EDITOR ──────────────────────────────────────
function updateProfileLive() {
    const name  = document.getElementById("prof-name")?.value.trim() || "اسم الطالب";
    const univ  = document.getElementById("prof-univ")?.value.trim() || "الجامعة";
    const node  = document.getElementById("prof-skill-node")?.value || "92";
    const grade = document.getElementById("prof-grade")?.value || "A+";

    const nameDisp  = document.getElementById("live-name-display");
    const univDisp  = document.getElementById("live-univ-display");
    const gradeDisp = document.getElementById("live-grade-display");
    const nodeNum   = document.getElementById("live-node-num");
    const nodeBar   = document.getElementById("live-node-bar");
    const avatar    = document.getElementById("live-avatar");

    if (nameDisp)  nameDisp.innerText  = name;
    if (univDisp)  univDisp.innerText  = univ;
    if (gradeDisp) gradeDisp.innerText = grade;
    if (nodeNum)   nodeNum.innerText   = node + "%";
    if (nodeBar)   nodeBar.style.width = node + "%";
    if (avatar) {
        const initials = name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("");
        avatar.innerText = initials || "ط";
    }
}

// ─── AI CHAT ASSESSMENT ───────────────────────────────────────
let assessmentIdx = 0;
function sendInteractiveMessage() {
    const input     = document.getElementById("chat-input");
    const container = document.getElementById("chat-container");
    if (!input || !container || !input.value.trim()) return;
    const text = input.value.trim();
    input.value = "";

    container.insertAdjacentHTML("beforeend", `
        <div class="flex gap-3 max-w-[88%] mr-auto flex-row-reverse animate-fade-in">
            <div class="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 text-[10px] font-bold">أنت</div>
            <div class="bg-indigo-600/15 border border-indigo-500/20 px-4 py-2.5 rounded-2xl rounded-tl-none text-xs text-slate-200 leading-relaxed">${escapeHTML(text)}</div>
        </div>
    `);
    container.scrollTop = container.scrollHeight;

    const typing = `
        <div class="flex gap-3 max-w-[88%] animate-fade-in" id="typing-indicator">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 text-[10px] font-bold">AI</div>
            <div class="bg-slate-800/80 border border-slate-700/50 px-4 py-3 rounded-2xl rounded-tr-none text-xs text-slate-500 flex gap-1 items-center">
                <span class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style="animation-delay:0ms"></span>
                <span class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style="animation-delay:150ms"></span>
                <span class="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style="animation-delay:300ms"></span>
            </div>
        </div>`;
    container.insertAdjacentHTML("beforeend", typing);
    container.scrollTop = container.scrollHeight;

    const replies = [
        "إجابة موفقة جداً تدل على فهم أمني رائع! بالنسبة لـ <strong class='text-white'>React.js</strong>: كيف تتلافى تكرار طلبات الاتصال بالخادم عند كل إعادة رندر باستخدام <code class='text-sky-400 bg-sky-500/10 px-1 rounded'>useEffect</code>؟",
        "أحسنت! اجتزت المقابلة بنجاح. تم اكتشاف نقاط قوتك وسد الفجوات المحتملة. ملفك أصبح موثقاً بمعدل كفاءة <strong class='text-emerald-400'>94%</strong> ومدرجاً على خوادم تصفح العملاء! 🎉"
    ];

    setTimeout(() => {
        const indicator = document.getElementById("typing-indicator");
        if (indicator) indicator.remove();
        const aiText = replies[Math.min(assessmentIdx, replies.length - 1)];
        assessmentIdx++;
        container.insertAdjacentHTML("beforeend", `
            <div class="flex gap-3 max-w-[88%] animate-fade-in">
                <div class="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 text-[10px] font-bold">AI</div>
                <div class="bg-slate-800/80 border border-slate-700/50 px-4 py-2.5 rounded-2xl rounded-tr-none text-xs text-slate-300 leading-relaxed">${aiText}</div>
            </div>
        `);
        container.scrollTop = container.scrollHeight;
    }, 1400);
}

// ─── SQUADS SIMULATOR ─────────────────────────────────────────
function runAdvancedSquadSimulation() {
    const budget = parseInt(document.getElementById("squad-budget")?.value || 15000);
    const size   = parseInt(document.getElementById("squad-size")?.value || 3);
    const log    = document.getElementById("squad-invitation-log");
    const team   = document.getElementById("squad-final-team");
    const escrow = document.getElementById("squad-escrow-alert");
    if (!log || !team) return;

    log.innerHTML   = `<p class="text-slate-500 animate-pulse text-[10px]">[+] تحليل متطلبات المشروع بالـ AI...</p>`;
    team.innerHTML  = `<p class="text-slate-600 text-center py-4 text-[10px]">جاري تشكيل الفريق...</p>`;
    if (escrow) escrow.style.display = "none";

    const logItem = (cls, name, role, accepted) => `
        <div class="p-2.5 bg-slate-900/60 border ${accepted ? "border-emerald-500/20" : "border-rose-500/20"} rounded-lg flex justify-between items-center text-[10px] font-semibold animate-fade-in">
            <span class="${accepted ? "text-slate-300" : "text-slate-500 line-through"}">${name} (${role})</span>
            <span class="${accepted ? "text-emerald-400" : "text-rose-400"}">
                <i class="fa-solid ${accepted ? "fa-circle-check" : "fa-circle-xmark"}"></i>
                ${accepted ? "قبل!" : "رفض"}
            </span>
        </div>`;

    setTimeout(() => { log.innerHTML = logItem("rose",    "هادي سليمان",  "UI/UX - 94%",   false); }, 700);
    setTimeout(() => { log.insertAdjacentHTML("beforeend", logItem("emerald", "سارة شريف", "UI/UX - 89%",   true)); }, 1600);
    setTimeout(() => { log.insertAdjacentHTML("beforeend", logItem("emerald", "عمر محمود", "Backend - 92%", true)); }, 2500);
    setTimeout(() => { log.insertAdjacentHTML("beforeend", logItem("emerald", "ماجد أحمد", "Frontend - 86%",true)); }, 3400);
    if (size === 4) {
        setTimeout(() => { log.insertAdjacentHTML("beforeend", logItem("emerald", "يمنى يحيى", "QA - 90%", true)); }, 4300);
    }

    const delay = size === 4 ? 5100 : 4100;
    setTimeout(() => {
        const parts = size === 3
            ? [["سارة شريف (مصمم)", 0.30], ["عمر محمود (باكيند)", 0.35], ["ماجد أحمد (فرونت)", 0.35]]
            : [["سارة شريف (مصمم)", 0.25], ["عمر محمود (باكيند)", 0.30], ["ماجد أحمد (فرونت)", 0.30], ["يمنى يحيى (جودة)", 0.15]];
        const rows = parts.map(([name, pct]) => `
            <div class="flex justify-between items-center border-b border-slate-800 pb-1.5 text-[10px]">
                <span class="text-slate-400">${name}</span>
                <span class="text-emerald-400 font-bold font-mono">${Math.round(budget * pct).toLocaleString("ar-EG")} جنيه</span>
            </div>`).join("");

        team.innerHTML = `
            <div class="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 space-y-2 animate-fade-in text-[10px]">
                <p class="font-bold text-emerald-400 flex items-center gap-1 mb-2"><i class="fa-solid fa-users"></i> تم تشكيل الفريق بنجاح!</p>
                <div class="space-y-1.5">${rows}</div>
            </div>`;
        if (escrow) escrow.style.display = "block";
    }, delay);
}

// ─── LEADERBOARD ──────────────────────────────────────────────
function renderLeaderboard() {
    const container = document.getElementById("leaderboard-container");
    if (!container) return;
    container.innerHTML = defaultLeaderboard.map((s, i) => {
        const xp  = sb_leaderboard_xp[s.id] || s.xp;
        const pct = Math.min(100, Math.round((xp / 1500) * 100));
        const rankColors = ["text-yellow-400", "text-slate-400", "text-amber-600"];
        const rankIcons  = ["fa-trophy", "fa-medal", "fa-award"];
        return `
            <div class="bg-[#060d1b] border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between animate-fade-in hover:border-slate-700 transition">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="flex items-center gap-1.5 mb-0.5">
                            <i class="fa-solid ${rankIcons[i] || "fa-star"} ${rankColors[i] || "text-slate-500"} text-sm"></i>
                            <h4 class="font-bold text-white text-xs">${s.name}</h4>
                        </div>
                        <p class="text-[10px] text-slate-600">${s.university}</p>
                        <p class="text-[10px] text-slate-500 mt-0.5">${s.skill}</p>
                    </div>
                    <span class="bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded text-[9px] border border-indigo-500/15">${s.badge}</span>
                </div>
                <div class="space-y-1.5">
                    <div class="flex justify-between text-[10px]">
                        <span class="text-slate-600 font-bold">مستوى الخبرة:</span>
                        <span class="text-indigo-400 font-bold font-mono">${xp} XP</span>
                    </div>
                    <div class="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-l from-indigo-500 to-indigo-400 rounded-full transition-all duration-700" style="width:${pct}%"></div>
                    </div>
                </div>
                <button onclick="endorseStudent('${s.id}')" class="w-full bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 px-3 py-2 rounded-lg text-[10px] font-bold transition duration-200">
                    <i class="fa-solid fa-medal ml-1"></i> توصية المهارة (+50 XP)
                </button>
            </div>`;
    }).join("");
}

function endorseStudent(id) {
    if (!sb_leaderboard_xp[id]) {
        const s = defaultLeaderboard.find(x => x.id === id);
        sb_leaderboard_xp[id] = s ? s.xp : 1000;
    }
    sb_leaderboard_xp[id] += 50;
    saveXP();
    if (!isFirebaseConnected) renderLeaderboard();
    const s = defaultLeaderboard.find(x => x.id === id);
    if (s) addLiveNotification(`🎖️ قمت بتوصية مهارات <strong>${s.name}</strong>. تم إضافة +50 XP لملفه.`);
}

// ─── SOCIAL FEATURES RENDERER (Gigs Tab) ─────────────────────
function renderSocialFeatures() {
    const container = document.getElementById("social-features-container");
    if (!container) return;

    const colorMap = {
        fuchsia: { bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/15", text: "text-fuchsia-400", hover: "hover:border-fuchsia-500/30" },
        rose:    { bg: "bg-rose-500/10",    border: "border-rose-500/15",    text: "text-rose-400",    hover: "hover:border-rose-500/30"    },
        amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/15",   text: "text-amber-400",   hover: "hover:border-amber-500/30"   },
        cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-500/15",    text: "text-cyan-400",    hover: "hover:border-cyan-500/30"    },
        emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/15", text: "text-emerald-400", hover: "hover:border-emerald-500/30" },
        orange:  { bg: "bg-orange-500/10",  border: "border-orange-500/15",  text: "text-orange-400",  hover: "hover:border-orange-500/30"  },
        red:     { bg: "bg-red-500/10",     border: "border-red-500/15",     text: "text-red-400",     hover: "hover:border-red-500/30"     },
        indigo:  { bg: "bg-indigo-500/10",  border: "border-indigo-500/15",  text: "text-indigo-400",  hover: "hover:border-indigo-500/30"  },
    };

    container.innerHTML = SOCIAL_FEATURES.map(f => {
        const c = colorMap[f.color] || colorMap.indigo;
        return `
            <div class="bg-slate-900/50 border border-slate-800/60 ${c.hover} rounded-xl p-5 space-y-4 transition-all duration-300">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center ${c.text} text-base shrink-0">
                        <i class="fa-solid ${f.icon}"></i>
                    </div>
                    <div>
                        <span class="text-[9px] font-bold text-slate-600 uppercase tracking-wider">${f.label}</span>
                        <h3 class="font-bold text-white text-sm">${f.title}</h3>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
                    <div class="bg-[#060d1b] border border-slate-800 rounded-xl p-3 space-y-1">
                        <p class="font-bold ${c.text} flex items-center gap-1"><i class="fa-solid fa-circle-info text-[9px]"></i> ماذا تفعل؟</p>
                        <p class="text-slate-500 leading-relaxed">${f.what}</p>
                    </div>
                    <div class="bg-[#060d1b] border border-slate-800 rounded-xl p-3 space-y-1">
                        <p class="font-bold text-emerald-400 flex items-center gap-1"><i class="fa-solid fa-bullseye text-[9px]"></i> لماذا مهمة؟</p>
                        <p class="text-slate-500 leading-relaxed">${f.why}</p>
                    </div>
                    <div class="bg-[#060d1b] border border-slate-800 rounded-xl p-3 space-y-1">
                        <p class="font-bold text-sky-400 flex items-center gap-1"><i class="fa-solid fa-screwdriver-wrench text-[9px]"></i> كيف ننفذها؟</p>
                        <p class="text-slate-500 leading-relaxed">${f.how}</p>
                    </div>
                </div>
                <div class="collaboration-box border-t border-slate-800/50 pt-3" data-section="${f.id}"></div>
            </div>
        `;
    }).join("");

    // Render collaboration widgets inside newly created social cards
    renderAllCollaborationWidgets();
}

// ─── INIT ─────────────────────────────────────────────────────
window.onload = function() {
    renderSocialFeatures();   // must be before renderAllCollaborationWidgets
    initFirebase();

    // If Firebase is not used, render immediately from local cache
    setTimeout(() => {
        if (!isFirebaseConnected) {
            renderAllCollaborationWidgets();
            calculateGlobalApproval();
        }
        updateProfileLive();
        renderLeaderboard();
    }, 800);
};
