// --- GLOBAL PERSISTENT STATE MANAGEMENT (LOCAL STORAGE) ---
let sb_votes = {};
let sb_comments = {};
let sb_social_posts = [];
let sb_social_follows = {};
let sb_leaderboard_xp = {};

// Default initial records if empty
const defaultPosts = [
    {
        id: "post_1",
        author: "أحمد دويدار (عميل معتمد)",
        text: "لقد أنهينا للتو مشروع تطبيق العيادات الطبية بالتعاون مع فريق من 3 طلاب من هندسة عين شمس، تفاجأت بمدى نظافة الكود البرمجي وسرعة التنسيق والالتزام بالمواعيد! المنصة تضمن الجودة بشكل مذهل عبر كويزاتها.",
        likes: 24,
        hasLiked: false,
        timestamp: "منذ ساعة",
        avatar: "أ د"
    },
    {
        id: "post_2",
        author: "سارة شريف (طالبة برمجيات)",
        text: "تمت ترقية مستواي في React إلى خبير بعد حل الكويز الأخير بالمنصة. التقييم الحواري التفاعلي بالـ AI ممتاز جداً ورشح لي ثغرات حقيقية لم أكن منتبهة لها في أكوادي السابقة!",
        likes: 12,
        hasLiked: false,
        timestamp: "منذ 4 ساعات",
        avatar: "س ش"
    }
];

const defaultLeaderboard = [
    { id: "student_1", name: "عمر محمود", university: "جامعة عين شمس", skill: "Backend Developer", xp: 1250, badge: "خبير كود نظيف 🛡️" },
    { id: "student_2", name: "سارة شريف", university: "جامعة القاهرة", skill: "React Specialist", xp: 1100, badge: "بطل السرعة ⚡" },
    { id: "student_3", name: "ماجد يوسف", university: "جامعة الإسكندرية", skill: "UI/UX Designer", xp: 950, badge: "منقذ السيرفر 🖥️" }
];

// Load saved data from localStorage on initialization
function loadPersistentState() {
    try {
        const votesData = localStorage.getItem('skillbridge_votes');
        if (votesData) sb_votes = JSON.parse(votesData);

        const commentsData = localStorage.getItem('skillbridge_comments');
        if (commentsData) sb_comments = JSON.parse(commentsData);

        const postsData = localStorage.getItem('skillbridge_posts');
        if (postsData) {
            sb_social_posts = JSON.parse(postsData);
        } else {
            sb_social_posts = defaultPosts;
        }

        const followsData = localStorage.getItem('skillbridge_follows');
        if (followsData) sb_social_follows = JSON.parse(followsData);

        const xpData = localStorage.getItem('skillbridge_xp');
        if (xpData) {
            sb_leaderboard_xp = JSON.parse(xpData);
        } else {
            defaultLeaderboard.forEach(st => {
                sb_leaderboard_xp[st.id] = st.xp;
            });
            sb_leaderboard_xp = sb_leaderboard_xp;
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
        localStorage.setItem('skillbridge_posts', JSON.stringify(sb_social_posts));
        localStorage.setItem('skillbridge_follows', JSON.stringify(sb_social_follows));
        localStorage.setItem('skillbridge_xp', JSON.stringify(sb_leaderboard_xp));
        calculateGlobalApproval();
    } catch (e) {
        console.error("Could not save to localStorage: ", e);
    }
}

// Clear all local database records
function clearAllData() {
    if (confirm("هل أنت متأكد من رغبتك في حذف جميع التعليقات والتصويتات والتفاعلات وإعادة تهيئة الصفحة؟")) {
        localStorage.clear();
        alert("تمت إعادة تهيئة البيانات بنجاح!");
        window.location.reload();
    }
}


// --- REAL-TIME NOTIFICATIONS POPUP BELL ---
function toggleNotifications() {
    const notifDropdown = document.getElementById('notif-dropdown');
    if (notifDropdown) {
        notifDropdown.classList.toggle('active');
    }
}

function markAllNotificationsRead() {
    const badge = document.getElementById('notif-badge');
    if (badge) {
        badge.style.display = 'none';
    }
    const notifList = document.getElementById('notif-list');
    if (notifList) {
        notifList.innerHTML = `<p class="text-slate-500 italic text-center py-4">لا توجد تنبيهات جديدة غير مقروءة...</p>`;
    }
}


// --- DYNAMIC AI COLLABORATION COMPONENT ---
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


// --- FULLY INTERACTIVE SOCIAL FEED HUB (GIGS & SOCIAL TAB) ---
function renderSocialFeed() {
    const container = document.getElementById('social-feed-container');
    if (!container) return;

    container.innerHTML = sb_social_posts.map(post => {
        const isFollowed = sb_social_follows[post.author] || false;
        const followText = isFollowed ? "إلغاء المتابعة" : "متابعة";
        const followClass = isFollowed ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        const likeClass = post.hasLiked ? "text-emerald-400 font-extrabold" : "text-slate-500";

        return `
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 text-xs leading-relaxed animate-fade-in shadow-md">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-bold text-indigo-400 shrink-0">
                            ${escapeHTML(post.avatar || "ط")}
                        </div>
                        <div>
                            <span class="font-bold text-white">${escapeHTML(post.author)}</span>
                            <span class="text-[9px] text-slate-500 block">${post.timestamp}</span>
                        </div>
                    </div>
                    <!-- Interactive Follow / Unfollow Badge -->
                    <button onclick="toggleFollowAuthor('${escapeHTML(post.author)}')" class="px-2.5 py-1 rounded border text-[10px] font-bold transition duration-200 cursor-pointer ${followClass}">
                        <i class="fa-solid ${isFollowed ? 'fa-user-minus' : 'fa-user-plus'} ml-1"></i> ${followText}
                    </button>
                </div>
                <p class="text-slate-300">${escapeHTML(post.text)}</p>
                <div class="flex items-center gap-4 text-[11px] font-bold pt-2 border-t border-slate-900/60">
                    <!-- Interactive Like Toggle -->
                    <button onclick="toggleLikePost('${post.id}')" class="cursor-pointer transition duration-200 flex items-center gap-1 ${likeClass}">
                        <i class="fa-solid fa-thumbs-up"></i> <span>${post.likes} إعجاب</span>
                    </button>
                    <span class="text-slate-500 cursor-pointer hover:text-slate-400"><i class="fa-solid fa-comment"></i> تعليق</span>
                </div>
            </div>
        `;
    }).join('');
}

// Post a status dynamically
function submitNewPost() {
    const textEl = document.getElementById('comment-text-post_status'); // Input inside social feed
    const authorEl = document.getElementById('comment-author-post_status');
    const inputVal = textEl ? textEl.value.trim() : '';
    const authorVal = (authorEl ? authorEl.value.trim() : '') || "أحمد فرهات (أنت)";

    if (!textEl || !textEl.value.trim()) {
        const genericInput = document.getElementById('social-input');
        if (genericInput && genericInput.value.trim()) {
            submitNewPostGeneric(genericInput.value.trim());
            genericInput.value = "";
        } else {
            alert("يرجى كتابة منشورك أولاً!");
        }
        return;
    }

    const newPost = {
        id: 'post_' + Date.now(),
        author: author,
        text: text,
        timestamp: "منذ ثوانٍ",
        likes: 0,
        liked: false
    };

    sb_social_posts.unshift(newPost);
    savePersistentState();
    renderSocialFeed();
}

// Fast status submit from box
function submitSocialPost() {
    const authorEl = document.getElementById('social-post-author');
    const textEl = document.getElementById('social-post-text');
    if (!textEl || !textEl.value.trim()) {
        alert("يرجى كتابة نص المنشور!");
        return;
    }

    const author = (authorEl ? authorEl.value.trim() : "") || "أحمد فرهات (أنت)";
    const text = textEl.value.trim();
    const initials = author.split(' ').map(n => n[0]).slice(0, 2).join('');

    const newPost = {
        id: 'post_' + Date.now(),
        author: author,
        text: text,
        timestamp: "منذ ثوانٍ",
        likes: 0,
        hasLiked: false,
        avatar: initials || "أ"
    };

    sb_social_posts.unshift(newPost);
    localStorage.setItem('skillbridge_posts', JSON.stringify(sb_social_posts));
    renderSocialFeed();

    textEl.value = "";
}

// Toggle Like
function toggleLikePost(postId) {
    const post = sb_social_posts.find(p => p.id === postId);
    if (!post) return;

    if (post.hasLiked) {
        post.likes--;
        post.hasLiked = false;
    } else {
        post.likes++;
        post.hasLiked = true;
    }

    localStorage.setItem('skillbridge_posts', JSON.stringify(sb_social_posts));
    renderSocialFeed();
}

// Toggle Follow/Unfollow
function toggleFollowAuthor(authorName) {
    sb_social_follows[authorName] = !sb_social_follows[authorName];
    localStorage.setItem('skillbridge_follows', JSON.stringify(sb_social_follows));
    renderSocialFeed();

    // Add real-time notification
    if (sb_social_follows[authorName]) {
        addLiveNotification(`📈 قمت الآن بمتابعة حساب العضو <strong>${authorName}</strong> بنجاح.`);
    }
}

// Add system notifications dynamically
function addLiveNotification(text) {
    const notifDropdown = document.getElementById('notif-list');
    const badge = document.getElementById('notif-badge');
    if (!notifDropdown) return;

    if (badge) {
        badge.style.display = 'flex';
        let count = parseInt(badge.innerText) || 0;
        badge.innerText = count + 1;
    }

    const html = `
        <div class="p-2 bg-slate-950 rounded-lg border border-slate-850 flex gap-2.5 items-start animate-fade-in">
            <span class="text-indigo-400 mt-0.5"><i class="fa-solid fa-plus-circle"></i></span>
            <p class="text-slate-300 leading-relaxed">${text}</p>
        </div>
    `;
    notifDropdown.insertAdjacentHTML('afterbegin', html);
}


// --- INTERACTIVE GAMIFIED LEADERBOARD (PROACTIVE TAB) ---
function renderLeaderboard() {
    const container = document.getElementById('leaderboard-container');
    if (!container) return;

    container.innerHTML = defaultLeaderboard.map(student => {
        const currentXp = sb_leaderboard_xp[student.id] || student.xp;
        const percent = Math.min(100, Math.round((currentXp / 1500) * 100));

        return `
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3 shadow-md animate-fade-in">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold text-white text-xs">${student.name}</h4>
                        <p class="text-[10px] text-slate-400 mt-0.5">${student.university} | ${student.skill}</p>
                    </div>
                    <span class="bg-indigo-500/10 text-indigo-400 font-bold px-1.5 py-0.5 rounded text-[9px] border border-indigo-500/20">${student.badge}</span>
                </div>

                <div class="space-y-1">
                    <div class="flex justify-between text-[10px]">
                        <span class="text-slate-500 font-bold">مستوى الخبرة:</span>
                        <span class="text-indigo-400 font-bold font-mono">${currentXp} XP</span>
                    </div>
                    <div class="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                        <div class="h-full bg-indigo-500 rounded-full" style="width: ${percent}%"></div>
                    </div>
                </div>

                <!-- Endorse button -->
                <button onclick="endorseStudent('${student.id}')" class="bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition duration-200 cursor-pointer">
                    <i class="fa-solid fa-medal ml-1"></i> توصية المهارة (+50 XP)
                </button>
            </div>
        `;
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
    if (student) {
        addLiveNotification(`🎖️ قمت بالتصديق وتوصية مهارات <strong>${student.name}</strong>. تم إضافة +50 XP لملفه الشخصي.`);
    }
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

    const nameVal = nameInput.value.trim() || "اسم الطالب";
    nameDisp.innerText = nameVal;
    univDisp.innerText = univInput.value.trim() || "جامعة عين شمس";

    const initials = nameVal.split(' ').map(n => n[0]).slice(0, 2).join('');
    avatar.innerText = initials || "ط";

    const nodeVal = skillNodeInput.value;
    nodeNum.innerText = nodeVal + "%";
    nodeBar.style.width = nodeVal + "%";

    const reactVal = skillReactInput.value;
    reactNum.innerText = reactVal + "%";
    reactBar.style.width = reactVal + "%";

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

    chatBox.insertAdjacentHTML('beforeend', `
        <div class="flex gap-3 max-w-[85%] mr-auto flex-row-reverse animate-fade-in">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 text-xs font-bold">أنت</div>
            <div class="bg-indigo-600/15 border border-indigo-500/20 p-3 rounded-2xl rounded-tl-none text-xs leading-relaxed text-slate-200">
                ${userText}
            </div>
        </div>
    `);
    chatBox.scrollTop = chatBox.scrollHeight;

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

    setTimeout(() => {
        logContainer.innerHTML = `
            <div class="p-2.5 bg-slate-900 rounded border border-slate-850 flex justify-between items-center text-rose-400 animate-fade-in">
                <span>المرشح الأول: هادي سليمان (UI/UX - 94%)</span>
                <span><i class="fa-solid fa-circle-xmark"></i> رفض العقد (مشغول)</span>
            </div>
        `;
    }, 800);

    setTimeout(() => {
        logContainer.insertAdjacentHTML('beforeend', `
            <div class="p-2.5 bg-slate-900 rounded border border-slate-850 flex justify-between items-center text-emerald-400 animate-fade-in">
                <span>البديل التلقائي: سارة شريف (UI/UX - 89%)</span>
                <span><i class="fa-solid fa-circle-check"></i> قبلت الدعوة وانضمت!</span>
            </div>
        `);
    }, 1800);

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
                    <span>يمنى يحيى (جودة)</span>
                    <span class="text-emerald-400 font-mono">${Math.round(budget * 0.15)} جنيه</span>
                </p>
            `;
        }

        teamContainer.innerHTML = `
            <div class="bg-slate-900 p-3.5 rounded-xl border border-emerald-500/20 text-xs space-y-3 animate-fade-in">
                <p class="font-bold text-emerald-400 flex items-center gap-1"><i class="fa-solid fa-users"></i> تم تشكيل الفريق التلقائي بنجاح!</p>
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
    renderSocialFeed();
    renderLeaderboard();
};
