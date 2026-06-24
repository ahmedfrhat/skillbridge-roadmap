// --- GLOBAL PERSISTENT STATE MANAGEMENT (LOCAL STORAGE) ---
let sb_votes = {};
let sb_comments = {};

// Load saved data from localStorage on initialization
function loadPersistentState() {
    try {
        const votesData = localStorage.getItem('skillbridge_votes');
        if (votesData) {
            sb_votes = JSON.parse(votesData);
        }

        const commentsData = localStorage.getItem('skillbridge_comments');
        if (commentsData) {
            sb_comments = JSON.parse(commentsData);
        }
    } catch (e) {
        console.error("Could not load from localStorage: ", e);
    }
}

// Save active state to localStorage
function savePersistentState() {
    try {
        localStorage.setItem('skillbridge_votes', JSON.stringify(sb_votes));
        localStorage.setItem('skillbridge_comments', JSON.stringify(sb_comments));
        calculateGlobalApproval();
    } catch (e) {
        console.error("Could not save to localStorage: ", e);
    }
}

// Clear all local database records
function clearAllData() {
    if (confirm("هل أنت متأكد من رغبتك في حذف جميع التعليقات والتصويتات وإعادة تهيئة الصفحة؟")) {
        localStorage.removeItem('skillbridge_votes');
        localStorage.removeItem('skillbridge_comments');
        sb_votes = {};
        sb_comments = {};
        loadPersistentState();
        renderAllCollaborationWidgets();
        calculateGlobalApproval();
        alert("تمت إعادة تهيئة البيانات بنجاح!");
        window.location.reload();
    }
}

// Generate the collaborative voting and comment HTML component dynamically
function renderAllCollaborationWidgets() {
    const containers = document.querySelectorAll('.collaboration-box');
    containers.forEach(el => {
        const sectionId = el.getAttribute('data-section');
        if (!sectionId) return;

        // Initialize state for section if missing
        if (!sb_votes[sectionId]) {
            sb_votes[sectionId] = { yes: 0, no: 0, userVote: null };
        }
        if (!sb_comments[sectionId]) {
            sb_comments[sectionId] = [];
        }

        const votes = sb_votes[sectionId];
        const comments = sb_comments[sectionId];

        // Style flags for active vote button click
        const yesActiveStyle = votes.userVote === 'yes' ? 'vote-btn-active font-extrabold text-emerald-400' : 'text-emerald-400';
        const noActiveStyle = votes.userVote === 'no' ? 'vote-btn-disactive font-extrabold text-rose-400' : 'text-rose-400';

        // Render HTML structure
        el.innerHTML = `
            <div class="bg-slate-950/80 p-4 sm:p-5 rounded-xl border border-slate-800/80 space-y-4 mt-3 animate-fade-in text-xs">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-900 pb-3">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                        <h4 class="font-bold text-slate-300">مراجعة ونقاش أعضاء الفريق حول هذه النقطة</h4>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-slate-500 font-semibold">هل هذه الفكرة معتمدة للمشروع؟</span>
                        <button onclick="castVote('${sectionId}', 'yes')" class="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-emerald-500/10 transition ${yesActiveStyle}">
                            <i class="fa-regular fa-circle-check"></i> <span>صح (${votes.yes})</span>
                        </button>
                        <button onclick="castVote('${sectionId}', 'no')" class="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-rose-500/10 transition ${noActiveStyle}">
                            <i class="fa-regular fa-circle-xmark"></i> <span>غلط (${votes.no})</span>
                        </button>
                    </div>
                </div>

                <!-- Comments List Container -->
                <div class="space-y-2 max-h-[160px] overflow-y-auto pr-1" id="comments-box-${sectionId}">
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

                <!-- Input box -->
                <div class="flex flex-col sm:flex-row gap-2 pt-1 border-t border-slate-900">
                    <input type="text" id="comment-author-${sectionId}" placeholder="الاسم البرمجي..." class="w-full sm:w-28 bg-slate-900 border border-slate-850 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500">
                    <input type="text" id="comment-text-${sectionId}" placeholder="اكتب تعديلك أو فكرتك الإضافية لهذه النقطة..." class="flex-1 bg-slate-900 border border-slate-850 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500">
                    <button onclick="submitComment('${sectionId}')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg transition shrink-0">إرسال التعليق</button>
                </div>
            </div>
        `;
    });
}

// Escape HTML utility
function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Cast a persistent vote
function castVote(sectionId, voteType) {
    const votes = sb_votes[sectionId];
    if (!votes) return;

    if (votes.userVote === voteType) {
        // Toggle off
        votes[voteType]--;
        votes.userVote = null;
    } else {
        // Deduct previous if voted differently
        if (votes.userVote) {
            votes[votes.userVote]--;
        }
        votes[voteType]++;
        votes.userVote = voteType;
    }

    savePersistentState();
    renderAllCollaborationWidgets();
}

// Submit comment
function submitComment(sectionId) {
    const authorEl = document.getElementById(`comment-author-${sectionId}`);
    const textEl = document.getElementById(`comment-text-${sectionId}`);
    if (!authorEl || !textEl) return;

    const author = authorEl.value.trim() || "عضو مجهول";
    const text = textEl.value.trim();

    if (!text) {
        alert("يرجى كتابة نص الاقتراح أولاً!");
        return;
    }

    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + " | " + new Date().toLocaleDateString('ar-EG');
    sb_comments[sectionId].push({ author, text, timestamp });

    savePersistentState();
    renderAllCollaborationWidgets();

    // Reset input text only
    textEl.value = "";
}

// Calculate the global approval based on votes
function calculateGlobalApproval() {
    let totalYes = 0;
    let totalNo = 0;
    Object.keys(sb_votes).forEach(k => {
        totalYes += sb_votes[k].yes;
        totalNo += sb_votes[k].no;
    });

    const totalVotes = totalYes + totalNo;
    const rateEl = document.getElementById('global-approval-rate');
    const barEl = document.getElementById('global-approval-bar');

    if (!rateEl || !barEl) return;

    if (totalVotes === 0) {
        rateEl.innerText = "100%";
        barEl.style.height = "100%";
        return;
    }

    const approvalPercent = Math.round((totalYes / totalVotes) * 100);
    rateEl.innerText = `${approvalPercent}%`;
    barEl.style.height = `${approvalPercent}%`;
}


// --- TAB NAVIGATION SWITCHING ---
function switchTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('block');
    });

    const activeContent = document.getElementById(tabId);
    if (activeContent) {
        activeContent.classList.remove('hidden');
        activeContent.classList.add('block');
    }

    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(el => {
        el.classList.remove('active');
    });

    const activeBtn = document.getElementById('btn-' + tabId);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}


// --- INTERACTIVE DIAGNOSTIC TERMINAL UI (BUGS TAB) ---
function runDiagnostics() {
    const consoleEl = document.getElementById('terminal-output');
    if (!consoleEl) return;

    consoleEl.innerHTML = `<p class="text-slate-400 font-bold animate-pulse">[+] البدء في اختبار وفحص الأكواد البرمجية والمشاكل البرمجية...</p>`;

    const steps = [
        { text: "[1/4] جاري فحص ملفات الإرسال والشبكة في http.ts...", delay: 800 },
        { text: "[INFO] تم كشف إسقاط الكوكيز HttpOnly عابر النطاق (CORS Limits)!", delay: 1500, color: 'text-amber-400' },
        { text: "[SUCCESS] تم تطبيق علاج Bearer JWT Fallback بنجاح وحفظ الـ Token في الـ localStorage. (موافق 401)", delay: 2400, color: 'text-emerald-400' },
        { text: "[2/4] فحص تهيئة عنوان الاستدعاء NEXT_PUBLIC_API_URL...", delay: 3200 },
        { text: "[SUCCESS] تم استيراد الرابط ومعالجة الـ /api البادئة تلقائياً لمنع أخطاء الـ 404. (موافق 404)", delay: 4000, color: 'text-emerald-400' },
        { text: "[3/4] فحص تعارض قاعدة بيانات SQL Server لرفع التحديثات (Migrations)...", delay: 4800 },
        { text: "[SUCCESS] تم تشغيل سكريبت precheck_reviews.sql وتصفية البيانات المكررة بنجاح. (موافق SQL Index)", delay: 5600, color: 'text-emerald-400' },
        { text: "[4/4] إنهاء الفحص البرمجي المتكامل...", delay: 6400 },
        { text: "=== [النتيجة] جميع المشاكل التقنية الـ 3 المكتشفة تم علاجها بنسبة 100% والأكواد جاهزة للرفع سحابياً ===", delay: 7200, color: 'text-emerald-400 font-extrabold border-t border-slate-900 pt-1.5' }
    ];

    steps.forEach(s => {
        setTimeout(() => {
            const cssClass = s.color || 'text-slate-300';
            consoleEl.insertAdjacentHTML('beforeend', `<p class="${cssClass}">> ${s.text}</p>`);
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }, s.delay);
    });
}


// --- DYNAMIC LIVE STUDENT PROFILE GENERATOR (PROFILE TAB) ---
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

    if (!nameInput || !univInput || !skillNodeInput || !skillReactInput || !gradeSelect) return;

    // Display Name and University
    const nameVal = nameInput.value.trim() || "اسم الطالب";
    nameDisp.innerText = nameVal;
    univDisp.innerText = univInput.value.trim() || "جامعة عين شمس";

    // Set Avatar initials
    const initials = nameVal.split(' ').map(n => n[0]).slice(0, 2).join('');
    avatar.innerText = initials || "ط";

    // Update Sliders and progress bars
    const nodeVal = skillNodeInput.value;
    nodeNum.innerText = nodeVal + "%";
    nodeBar.style.width = nodeVal + "%";

    const reactVal = skillReactInput.value;
    reactNum.innerText = reactVal + "%";
    reactBar.style.width = reactVal + "%";

    // Update Select Grades
    gradeDisp.innerText = "المعدل: " + gradeSelect.value;
}


// --- INTERACTIVE AI CHAT ASSESSMENT (JOURNEY TAB) ---
let assessmentMsgIndex = 0;
function sendAssessmentMessage() {
    const input = document.getElementById('assessment-input');
    const chatBox = document.getElementById('assessment-chat-box');
    if (!input || !input.value.trim()) return;

    const userText = input.value.trim();
    input.value = "";

    // Render User Message
    chatBox.insertAdjacentHTML('beforeend', `
        <div class="flex gap-3 max-w-[85%] mr-auto flex-row-reverse animate-fade-in">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 text-xs font-bold">أنت</div>
            <div class="bg-indigo-600/15 border border-indigo-500/20 p-3 rounded-2xl rounded-tl-none text-xs leading-relaxed text-slate-200">
                ${userText}
            </div>
        </div>
    `);
    chatBox.scrollTop = chatBox.scrollHeight;

    // AI Simulated logic-driven replies
    setTimeout(() => {
        let aiText = "";
        if (assessmentMsgIndex === 0) {
            aiText = `
                إجابة موفقة جداً! لقد تفهمت مهارتك العميقة في إدارة قاعدة البيانات والـ indexing. 
                الآن لتوثيق مهارة الـ **React.js**: كيف تقوم بوقف حدوث تكرار إعادة التحميل (infinite loops) عند الاتصال بـ API خارجي باستخدام الـ useEffect؟
            `;
            assessmentMsgIndex++;
        } else {
            aiText = `
                أحسنت! إجابة ممتازة تدل على التزامك بأفضل الممارسات البرمجية. 
                لقد قمت باجتياز المقابلة واكتشاف فجوات الـ SQL بنجاح. ملفك الشخصي أصبح الآن موثقاً بـ **معدل كفاءة 94%** ومدرجاً على خوادم تصفح العملاء بنجاح!
            `;
        }

        chatBox.insertAdjacentHTML('beforeend', `
            <div class="flex gap-3 max-w-[85%] animate-fade-in">
                <div class="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 font-bold shrink-0 text-xs">AI</div>
                <div class="bg-slate-900 p-3 rounded-2xl rounded-tr-none text-xs leading-relaxed text-slate-300">
                    ${aiText}
                </div>
            </div>
        `);
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1200);
}


// --- INTERACTIVE AI SQUADS MATCHMAKER SIMULATOR (SQUADS TAB) ---
function runAdvancedSquadSimulation() {
    const budgetSelect = document.getElementById('squad-budget');
    const sizeSelect = document.getElementById('squad-size');
    const logContainer = document.getElementById('squad-invitation-log');
    const teamContainer = document.getElementById('squad-final-team');
    const escrowAlert = document.getElementById('squad-escrow-alert');

    if (!budgetSelect || !sizeSelect || !logContainer || !teamContainer) return;

    const budget = parseInt(budgetSelect.value);
    const size = parseInt(sizeSelect.value);

    logContainer.innerHTML = `<p class="text-slate-400 font-bold animate-pulse">[+] تفكيك متطلبات المشروع الكبيرة بالذكاء الاصطناعي وجاري فرز المرشحين الأوائل...</p>`;
    teamContainer.innerHTML = `<p class="text-slate-500 text-center py-6">جاري تشكيل فريق سحابي...</p>`;
    escrowAlert.style.display = 'none';

    // Step 1: Designer Invitation rejected
    setTimeout(() => {
        logContainer.innerHTML = `
            <div class="p-2.5 bg-slate-900 rounded border border-slate-850 flex justify-between items-center text-rose-400 animate-fade-in">
                <span>المرشح الأول: هادي سليمان (UI/UX - 94%)</span>
                <span><i class="fa-solid fa-circle-xmark"></i> رفض العقد (مشغول)</span>
            </div>
        `;
    }, 800);

    // Step 2: Auto-substitute alternate
    setTimeout(() => {
        logContainer.insertAdjacentHTML('beforeend', `
            <div class="p-2.5 bg-slate-900 rounded border border-slate-850 flex justify-between items-center text-emerald-400 animate-fade-in">
                <span>البديل التلقائي: سارة شريف (UI/UX - 89%)</span>
                <span><i class="fa-solid fa-circle-check"></i> قبلت الدعوة وانضمت!</span>
            </div>
        `);
    }, 1800);

    // Step 3: Developer Acceptances
    setTimeout(() => {
        logContainer.insertAdjacentHTML('beforeend', `
            <div class="p-2.5 bg-slate-900 rounded border border-slate-850 flex justify-between items-center text-emerald-400 animate-fade-in">
                <span>مطور باكيند: عمر محمود (Backend - 92%)</span>
                <span><i class="fa-solid fa-circle-check"></i> قبل الدعوة وانضم!</span>
            </div>
        `);
    }, 2800);

    setTimeout(() => {
        logContainer.insertAdjacentHTML('beforeend', `
            <div class="p-2.5 bg-slate-900 rounded border border-slate-850 flex justify-between items-center text-emerald-400 animate-fade-in">
                <span>مطور فرونت: ماجد أحمد (Frontend - 86%)</span>
                <span><i class="fa-solid fa-circle-check"></i> قبل الدعوة وانضم!</span>
            </div>
        `);
    }, 3600);

    // If team size is 4, include QA engineer
    if (size === 4) {
        setTimeout(() => {
            logContainer.insertAdjacentHTML('beforeend', `
                <div class="p-2.5 bg-slate-900 rounded border border-slate-850 flex justify-between items-center text-emerald-400 animate-fade-in">
                    <span>مهندس جودة: يمنى يحيى (QA - 90%)</span>
                    <span><i class="fa-solid fa-circle-check"></i> قبلت الدعوة وانضمت!</span>
                </div>
            `);
        }, 4400);
    }

    // Compile Team and Lock Escrow
    const finalDelay = size === 4 ? 5200 : 4200;
    setTimeout(() => {
        let budgetBreakdown = "";
        if (size === 3) {
            budgetBreakdown = `
                <p class="flex justify-between border-b border-slate-800 pb-1 text-slate-300">
                    <span>سارة شريف (مصمم)</span>
                    <span class="text-emerald-400 font-bold font-mono">${Math.round(budget * 0.3)} جنيه</span>
                </p>
                <p class="flex justify-between border-b border-slate-800 pb-1 text-slate-300">
                    <span>عمر محمود (باكيند)</span>
                    <span class="text-emerald-400 font-bold font-mono">${Math.round(budget * 0.35)} جنيه</span>
                </p>
                <p class="flex justify-between text-slate-300">
                    <span>ماجد أحمد (فرونت إند)</span>
                    <span class="text-emerald-400 font-bold font-mono">${Math.round(budget * 0.35)} جنيه</span>
                </p>
            `;
        } else {
            budgetBreakdown = `
                <p class="flex justify-between border-b border-slate-800 pb-1 text-slate-300">
                    <span>سارة شريف (مصمم)</span>
                    <span class="text-emerald-400 font-bold font-mono">${Math.round(budget * 0.25)} جنيه</span>
                </p>
                <p class="flex justify-between border-b border-slate-800 pb-1 text-slate-300">
                    <span>عمر محمود (باكيند)</span>
                    <span class="text-emerald-400 font-bold font-mono">${Math.round(budget * 0.30)} جنيه</span>
                </p>
                <p class="flex justify-between border-b border-slate-800 pb-1 text-slate-300">
                    <span>ماجد أحمد (فرونت إند)</span>
                    <span class="text-emerald-400 font-bold font-mono">${Math.round(budget * 0.30)} جنيه</span>
                </p>
                <p class="flex justify-between text-slate-300">
                    <span>يمنى يحيى (فحص جودة QA)</span>
                    <span class="text-emerald-400 font-bold font-mono">${Math.round(budget * 0.15)} جنيه</span>
                </p>
            `;
        }

        teamContainer.innerHTML = `
            <div class="bg-slate-900/80 p-4 rounded-xl border border-emerald-500/25 space-y-3 animate-fade-in text-xs">
                <p class="font-bold text-emerald-400 flex items-center gap-1"><i class="fa-solid fa-users"></i> تم اعتماد وتشكيل الفريق السحابي!</p>
                <div class="space-y-2">
                    ${budgetBreakdown}
                </div>
            </div>
        `;
        escrowAlert.style.display = 'block';
    }, finalDelay);
}


// --- INITIALIZATION ---
window.onload = function() {
    loadPersistentState();
    renderAllCollaborationWidgets();
    calculateGlobalApproval();
    updateProfileLive();
};
