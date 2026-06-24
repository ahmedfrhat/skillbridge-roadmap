// --- GLOBAL PERSISTENT STATE MANAGEMENT (LOCAL STORAGE) ---
let sb_votes = {};
let sb_comments = {};
let sb_leaderboard_xp = {};

const defaultLeaderboard = [
    { id: "student_1", name: "عمر محمود", university: "جامعة عين شمس", skill: "Backend Developer", xp: 1250, badge: "خبير كود نظيف 🛡️" },
    { id: "student_2", name: "سارة شريف", university: "جامعة القاهرة", skill: "React Specialist", xp: 1100, badge: "بطل السرعة ⚡" },
    { id: "student_3", name: "ماجد يوسف", university: "جامعة الإسكندرية", skill: "UI/UX Designer", xp: 950, badge: "منقذ السيرفر 🖥️" }
];

function loadPersistentState() {
    try {
        const votesData = localStorage.getItem('skillbridge_votes');
        if (votesData) sb_votes = JSON.parse(votesData);

        const commentsData = localStorage.getItem('skillbridge_comments');
        if (commentsData) sb_comments = JSON.parse(commentsData);

        const xpData = localStorage.getItem('skillbridge_xp');
        if (xpData) {
            sb_leaderboard_xp = JSON.parse(xpData);
        } else {
            defaultLeaderboard.forEach(st => { sb_leaderboard_xp[st.id] = st.xp; });
        }
    } catch (e) {
        console.error("Could not load from localStorage: ", e);
    }
}

function savePersistentState() {
    try {
        localStorage.setItem('skillbridge_votes', JSON.stringify(sb_votes));
        localStorage.setItem('skillbridge_comments', JSON.stringify(sb_comments));
        localStorage.setItem('skillbridge_xp', JSON.stringify(sb_leaderboard_xp));
        calculateGlobalApproval();
    } catch (e) {
        console.error("Could not save to localStorage: ", e);
    }
}

function clearAllData() {
    if (confirm("هل أنت متأكد من رغبتك في حذف جميع التعليقات والتصويتات وإعادة تهيئة الصفحة؟")) {
        localStorage.clear();
        alert("تمت إعادة تهيئة البيانات بنجاح!");
        window.location.reload();
    }
}

// --- REAL-TIME NOTIFICATIONS POPUP BELL ---
function toggleNotifications() {
    const notifDropdown = document.getElementById('notif-dropdown');
    if (notifDropdown) notifDropdown.classList.toggle('active');
}

function markAllNotificationsRead() {
    const badge = document.getElementById('notif-badge');
    if (badge) badge.style.display = 'none';
    const notifList = document.getElementById('notif-list');
    if (notifList) notifList.innerHTML = `<p class="text-slate-500 italic text-center py-4">لا توجد تنبيهات جديدة غير مقروءة...</p>`;
}

function addLiveNotification(text) {
    const notifDropdown = document.getElementById('notif-list');
    const badge = document.getElementById('notif-badge');
    if (!notifDropdown) return;
    if (badge) {
        badge.style.display = 'flex';
        let count = parseInt(badge.innerText) || 0;
        badge.innerText = count + 1;
    }
    notifDropdown.insertAdjacentHTML('afterbegin', `
        <div class="p-2 bg-slate-950 rounded-lg border border-slate-850 flex gap-2.5 items-start animate-fade-in">
            <span class="text-indigo-400 mt-0.5"><i class="fa-solid fa-plus-circle"></i></span>
            <p class="text-slate-300 leading-relaxed">${text}</p>
        </div>
    `);
}

// --- DYNAMIC COLLABORATION COMPONENT (VOTES + COMMENTS) ---
function renderAllCollaborationWidgets() {
    const containers = document.querySelectorAll('.collaboration-box');
    containers.forEach(el => {
        const sectionId = el.getAttribute('data-section');
        if (!sectionId) return;

        if (!sb_votes[sectionId]) sb_votes[sectionId] = { yes: 0, no: 0, userVote: null };
        if (!sb_comments[sectionId]) sb_comments[sectionId] = [];

        const votes = sb_votes[sectionId];
        const comments = sb_comments[sectionId];

        const yesActiveStyle = votes.userVote === 'yes' ? 'vote-btn-active font-extrabold text-emerald-400' : 'text-emerald-400';
        const noActiveStyle = votes.userVote === 'no' ? 'vote-btn-disactive font-extrabold text-rose-400' : 'text-rose-400';

        el.innerHTML = `
            <div class="bg-slate-950/80 p-4 sm:p-5 rounded-xl border border-slate-800/80 space-y-4 mt-3 animate-fade-in text-xs">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-900 pb-3">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                        <h4 class="font-bold text-slate-300">مراجعة ونقاش أعضاء الفريق حول هذه النقطة</h4>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-slate-500 font-semibold">هل هذه الفكرة معتمدة؟</span>
                        <button onclick="castVote('${sectionId}', 'yes')" class="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-emerald-500/10 transition ${yesActiveStyle}">
                            <i class="fa-regular fa-circle-check"></i> <span>صح (${votes.yes})</span>
                        </button>
                        <button onclick="castVote('${sectionId}', 'no')" class="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-rose-500/10 transition ${noActiveStyle}">
                            <i class="fa-regular fa-circle-xmark"></i> <span>غلط (${votes.no})</span>
                        </button>
                    </div>
                </div>
                <div class="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    ${comments.length === 0 ? '<p class="text-slate-600 italic py-2 text-center">لا توجد اقتراحات أو تعديلات مكتوبة لهذه النقطة حتى الآن...</p>' : ''}
                    ${comments.map(c => `
                        <div class="bg-slate-900/40 p-2.5 rounded-lg border border-slate-850 space-y-1 animate-fade-in">
                            <div class="flex justify-between items-center text-[10px] text-slate-500">
                                <span class="font-bold text-slate-300"><i class="fa-regular fa-user ml-1"></i> ${escapeHTML(c.author)}</span>
                                <span>${c.timestamp}</span>
                            </div>
                            <p class="text-slate-300 leading-relaxed text-[11px]">${escapeHTML(c.text)}</p>
                        </div>
                    `).join('')}
                </div>
                <div class="flex flex-col sm:flex-row gap-2 pt-1 border-t border-slate-900">
                    <input type="text" id="comment-author-${sectionId}" placeholder="الاسم..." class="w-full sm:w-28 bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500">
                    <input type="text" id="comment-text-${sectionId}" placeholder="اكتب تعديلك أو فكرتك الإضافية لهذه النقطة..." class="flex-1 bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500">
                    <button onclick="submitComment('${sectionId}')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg transition shrink-0">إرسال التعليق</button>
                </div>
            </div>
        `;
    });
}

function escapeHTML(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function castVote(sectionId, voteType) {
    const votes = sb_votes[sectionId];
    if (!votes) return;
    if (votes.userVote === voteType) {
        votes[voteType]--;
        votes.userVote = null;
    } else {
        if (votes.userVote) votes[votes.userVote]--;
        votes[voteType]++;
        votes.userVote = voteType;
    }
    savePersistentState();
    renderAllCollaborationWidgets();
}

function submitComment(sectionId) {
    const authorEl = document.getElementById(`comment-author-${sectionId}`);
    const textEl = document.getElementById(`comment-text-${sectionId}`);
    if (!authorEl || !textEl) return;
    const author = authorEl.value.trim() || "عضو مجهول";
    const text = textEl.value.trim();
    if (!text) { alert("يرجى كتابة نص الاقتراح أولاً!"); return; }
    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + " | " + new Date().toLocaleDateString('ar-EG');
    sb_comments[sectionId].push({ author, text, timestamp });
    savePersistentState();
    renderAllCollaborationWidgets();
    textEl.value = "";
}

function calculateGlobalApproval() {
    let totalYes = 0, totalNo = 0;
    Object.keys(sb_votes).forEach(k => { totalYes += sb_votes[k].yes; totalNo += sb_votes[k].no; });
    const totalVotes = totalYes + totalNo;
    const rateEl = document.getElementById('global-approval-rate');
    const barEl = document.getElementById('global-approval-bar');
    if (!rateEl || !barEl) return;
    if (totalVotes === 0) { rateEl.innerText = "100%"; barEl.style.height = "100%"; return; }
    const approvalPercent = Math.round((totalYes / totalVotes) * 100);
    rateEl.innerText = `${approvalPercent}%`;
    barEl.style.height = `${approvalPercent}%`;
}

// --- TAB NAVIGATION ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => { el.classList.add('hidden'); el.classList.remove('block'); });
    const activeContent = document.getElementById(tabId);
    if (activeContent) { activeContent.classList.remove('hidden'); activeContent.classList.add('block'); }
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    const activeBtn = document.getElementById('btn-' + tabId);
    if (activeBtn) activeBtn.classList.add('active');
}

// --- DIAGNOSTICS TERMINAL (BUGS TAB) ---
function runDiagnostics() {
    const consoleEl = document.getElementById('terminal-output');
    if (!consoleEl) return;
    consoleEl.innerHTML = `<p class="text-slate-400 font-bold animate-pulse">[+] البدء في اختبار وفحص الأكواد البرمجية...</p>`;
    const steps = [
        { text: "[1/4] جاري فحص ملفات الإرسال والشبكة في http.ts...", delay: 800 },
        { text: "[INFO] تم كشف إسقاط الكوكيز HttpOnly عابر النطاق (CORS Limits)!", delay: 1500, color: 'text-amber-400' },
        { text: "[SUCCESS] تم تطبيق علاج Bearer JWT Fallback وحفظ الـ Token في localStorage. (موافق 401)", delay: 2400, color: 'text-emerald-400' },
        { text: "[2/4] فحص تهيئة عنوان الاستدعاء NEXT_PUBLIC_API_URL...", delay: 3200 },
        { text: "[SUCCESS] تمت معالجة الـ /api البادئة تلقائياً لمنع أخطاء الـ 404. (موافق 404)", delay: 4000, color: 'text-emerald-400' },
        { text: "[3/4] فحص تعارض قاعدة بيانات SQL Server للترقيات (Migrations)...", delay: 4800 },
        { text: "[SUCCESS] تم تشغيل precheck_reviews.sql وتصفية البيانات المكررة. (موافق SQL Index)", delay: 5600, color: 'text-emerald-400' },
        { text: "[4/4] إنهاء الفحص البرمجي المتكامل...", delay: 6400 },
        { text: "=== [النتيجة] جميع المشاكل الـ 3 تم علاجها 100% والأكواد جاهزة للرفع سحابياً ===", delay: 7200, color: 'text-emerald-400 font-extrabold border-t border-slate-900 pt-1.5' }
    ];
    steps.forEach(s => setTimeout(() => {
        consoleEl.insertAdjacentHTML('beforeend', `<p class="${s.color || 'text-slate-300'}">> ${s.text}</p>`);
        consoleEl.scrollTop = consoleEl.scrollHeight;
    }, s.delay));
}

// --- LIVE STUDENT PROFILE GENERATOR (PROFILE TAB) ---
function updateProfileLive() {
    const nameInput = document.getElementById('prof-name');
    const univInput = document.getElementById('prof-univ');
    const skillNodeInput = document.getElementById('prof-skill-node');
    const skillReactInput = document.getElementById('prof-skill-react');
    const gradeSelect = document.getElementById('prof-grade');
    const nameDisp = document.getElementById('live-name-display');
    const univDisp = document.getElementById('live-univ-display');
    const gradeDisp = document.getElementById('live-grade-display');
    const nodeNum = document.getElementById('live-node-num');
    const nodeBar = document.getElementById('live-node-bar');
    const reactNum = document.getElementById('live-react-num');
    const reactBar = document.getElementById('live-react-bar');
    const avatar = document.getElementById('live-avatar');
    if (!nameInput || !univInput) return;

    const nameVal = nameInput.value.trim() || "اسم الطالب";
    if (nameDisp) nameDisp.innerText = nameVal;
    if (univDisp) univDisp.innerText = univInput.value.trim() || "جامعة عين شمس";
    if (avatar) { const initials = nameVal.split(' ').map(n => n[0]).slice(0, 2).join(''); avatar.innerText = initials || "ط"; }
    if (skillNodeInput && nodeNum && nodeBar) { nodeNum.innerText = skillNodeInput.value + "%"; nodeBar.style.width = skillNodeInput.value + "%"; }
    if (skillReactInput && reactNum && reactBar) { reactNum.innerText = skillReactInput.value + "%"; reactBar.style.width = skillReactInput.value + "%"; }
    if (gradeSelect && gradeDisp) gradeDisp.innerText = "المعدل: " + gradeSelect.value;
}

// --- AI CHAT ASSESSMENT (JOURNEY TAB) ---
let assessmentMsgIndex = 0;
function sendInteractiveMessage() {
    const input = document.getElementById('chat-input');
    const container = document.getElementById('chat-container');
    if (!input || !container || !input.value.trim()) return;
    const userText = input.value.trim();
    input.value = "";
    container.insertAdjacentHTML('beforeend', `
        <div class="flex gap-3 max-w-[85%] mr-auto flex-row-reverse animate-fade-in">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 text-xs font-bold">أنت</div>
            <div class="bg-indigo-600/15 border border-indigo-500/20 p-3 rounded-2xl rounded-tl-none text-xs leading-relaxed text-slate-200">${escapeHTML(userText)}</div>
        </div>
    `);
    container.scrollTop = container.scrollHeight;
    setTimeout(() => {
        let aiText = "";
        if (assessmentMsgIndex === 0) {
            aiText = "إجابة موفقة جداً تدل على فهم أمني رائع! بالنسبة لـ <strong>React.js</strong>: كيف تتلافى تكرار طلبات الاتصال بالخادم عند كل إعادة رندر باستخدام useEffect؟";
            assessmentMsgIndex++;
        } else {
            aiText = "أحسنت! اجتزت المقابلة واكتشفنا فجوات الـ SQL بنجاح. ملفك أصبح موثقاً بمعدل كفاءة <strong>94%</strong> ومدرجاً على خوادم تصفح العملاء!";
        }
        container.insertAdjacentHTML('beforeend', `
            <div class="flex gap-3 max-w-[85%] animate-fade-in">
                <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold shrink-0 text-xs">AI</div>
                <div class="bg-slate-900 p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed text-slate-300">${aiText}</div>
            </div>
        `);
        container.scrollTop = container.scrollHeight;
    }, 1100);
}

// --- AI SQUADS MATCHMAKER SIMULATOR (SQUADS TAB) ---
function runAdvancedSquadSimulation() {
    const budgetSelect = document.getElementById('squad-budget');
    const sizeSelect = document.getElementById('squad-size');
    const logContainer = document.getElementById('squad-invitation-log');
    const teamContainer = document.getElementById('squad-final-team');
    const escrowAlert = document.getElementById('squad-escrow-alert');
    if (!budgetSelect || !sizeSelect || !logContainer || !teamContainer) return;

    const budget = parseInt(budgetSelect.value);
    const size = parseInt(sizeSelect.value);
    logContainer.innerHTML = `<p class="text-slate-400 font-bold animate-pulse">[+] تفكيك متطلبات المشروع بالذكاء الاصطناعي وفرز المرشحين...</p>`;
    teamContainer.innerHTML = `<p class="text-slate-500 text-center py-6">جاري تشكيل فريق سحابي...</p>`;
    escrowAlert.style.display = 'none';

    setTimeout(() => { logContainer.innerHTML = `
        <div class="p-2.5 bg-slate-900 rounded border border-slate-850 flex justify-between items-center text-rose-400 animate-fade-in">
            <span>المرشح الأول: هادي سليمان (UI/UX - 94%)</span><span><i class="fa-solid fa-circle-xmark"></i> رفض العقد</span></div>`; }, 800);
    setTimeout(() => { logContainer.insertAdjacentHTML('beforeend', `
        <div class="p-2.5 bg-slate-900 rounded border border-slate-850 flex justify-between items-center text-emerald-400 animate-fade-in">
            <span>البديل التلقائي: سارة شريف (UI/UX - 89%)</span><span><i class="fa-solid fa-circle-check"></i> قبلت!</span></div>`); }, 1800);
    setTimeout(() => { logContainer.insertAdjacentHTML('beforeend', `
        <div class="p-2.5 bg-slate-900 rounded border border-slate-850 flex justify-between items-center text-emerald-400 animate-fade-in">
            <span>مطور باكيند: عمر محمود (Backend - 92%)</span><span><i class="fa-solid fa-circle-check"></i> قبل!</span></div>`); }, 2800);
    setTimeout(() => { logContainer.insertAdjacentHTML('beforeend', `
        <div class="p-2.5 bg-slate-900 rounded border border-slate-850 flex justify-between items-center text-emerald-400 animate-fade-in">
            <span>مطور فرونت: ماجد أحمد (Frontend - 86%)</span><span><i class="fa-solid fa-circle-check"></i> قبل!</span></div>`); }, 3600);
    if (size === 4) {
        setTimeout(() => { logContainer.insertAdjacentHTML('beforeend', `
            <div class="p-2.5 bg-slate-900 rounded border border-slate-850 flex justify-between items-center text-emerald-400 animate-fade-in">
                <span>مهندس جودة: يمنى يحيى (QA - 90%)</span><span><i class="fa-solid fa-circle-check"></i> قبلت!</span></div>`); }, 4400);
    }

    const finalDelay = size === 4 ? 5200 : 4200;
    setTimeout(() => {
        let breakdown = "";
        if (size === 3) {
            breakdown = `
                <p class="flex justify-between border-b border-slate-800 pb-1 text-slate-300"><span>سارة شريف (مصمم)</span><span class="text-emerald-400 font-bold font-mono">${Math.round(budget*0.3)} جنيه</span></p>
                <p class="flex justify-between border-b border-slate-800 pb-1 text-slate-300"><span>عمر محمود (باكيند)</span><span class="text-emerald-400 font-bold font-mono">${Math.round(budget*0.35)} جنيه</span></p>
                <p class="flex justify-between text-slate-300"><span>ماجد أحمد (فرونت)</span><span class="text-emerald-400 font-bold font-mono">${Math.round(budget*0.35)} جنيه</span></p>`;
        } else {
            breakdown = `
                <p class="flex justify-between border-b border-slate-800 pb-1 text-slate-300"><span>سارة شريف (مصمم)</span><span class="text-emerald-400 font-bold font-mono">${Math.round(budget*0.25)} جنيه</span></p>
                <p class="flex justify-between border-b border-slate-800 pb-1 text-slate-300"><span>عمر محمود (باكيند)</span><span class="text-emerald-400 font-bold font-mono">${Math.round(budget*0.30)} جنيه</span></p>
                <p class="flex justify-between border-b border-slate-800 pb-1 text-slate-300"><span>ماجد أحمد (فرونت)</span><span class="text-emerald-400 font-bold font-mono">${Math.round(budget*0.30)} جنيه</span></p>
                <p class="flex justify-between text-slate-300"><span>يمنى يحيى (جودة)</span><span class="text-emerald-400 font-bold font-mono">${Math.round(budget*0.15)} جنيه</span></p>`;
        }
        teamContainer.innerHTML = `
            <div class="bg-slate-900 p-3.5 rounded-xl border border-emerald-500/20 text-xs space-y-3 animate-fade-in">
                <p class="font-bold text-emerald-400 flex items-center gap-1"><i class="fa-solid fa-users"></i> تم تشكيل الفريق التلقائي بنجاح!</p>
                <div class="space-y-2">${breakdown}</div>
            </div>`;
        escrowAlert.style.display = 'block';
    }, finalDelay);
}

// --- GAMIFIED LEADERBOARD (PROACTIVE TAB) ---
function renderLeaderboard() {
    const container = document.getElementById('leaderboard-container');
    if (!container) return;
    container.innerHTML = defaultLeaderboard.map(student => {
        const currentXp = sb_leaderboard_xp[student.id] || student.xp;
        const percent = Math.min(100, Math.round((currentXp / 1500) * 100));
        return `
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3 shadow-md animate-fade-in">
                <div class="flex justify-between items-start">
                    <div><h4 class="font-bold text-white text-xs">${student.name}</h4><p class="text-[10px] text-slate-400 mt-0.5">${student.university} | ${student.skill}</p></div>
                    <span class="bg-indigo-500/10 text-indigo-400 font-bold px-1.5 py-0.5 rounded text-[9px] border border-indigo-500/20">${student.badge}</span>
                </div>
                <div class="space-y-1">
                    <div class="flex justify-between text-[10px]"><span class="text-slate-500 font-bold">مستوى الخبرة:</span><span class="text-indigo-400 font-bold font-mono">${currentXp} XP</span></div>
                    <div class="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-850"><div class="h-full bg-indigo-500 rounded-full" style="width: ${percent}%"></div></div>
                </div>
                <button onclick="endorseStudent('${student.id}')" class="bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition duration-200 cursor-pointer">
                    <i class="fa-solid fa-medal ml-1"></i> توصية المهارة (+50 XP)
                </button>
            </div>`;
    }).join('');
}

function endorseStudent(studentId) {
    if (!sb_leaderboard_xp[studentId]) {
        const st = defaultLeaderboard.find(s => s.id === studentId);
        sb_leaderboard_xp[studentId] = st ? st.xp : 1000;
    }
    sb_leaderboard_xp[studentId] += 50;
    localStorage.setItem('skillbridge_xp', JSON.stringify(sb_leaderboard_xp));
    renderLeaderboard();
    const student = defaultLeaderboard.find(s => s.id === studentId);
    if (student) addLiveNotification(`🎖️ قمت بتوصية مهارات <strong>${student.name}</strong>. تم إضافة +50 XP لملفه.`);
}

// --- INITIALIZATION ---
window.onload = function() {
    loadPersistentState();
    renderAllCollaborationWidgets();
    calculateGlobalApproval();
    updateProfileLive();
    renderLeaderboard();
};
