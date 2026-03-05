// ══ BOOT ══════════════════════════════════════════════════
lucide.createIcons();
const todayLabel = new Date().toLocaleDateString('en-PH',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
document.getElementById('sDate').textContent = todayLabel;
document.getElementById('tDate').textContent = todayLabel;
document.getElementById('tAttDate').valueAsDate = new Date();

// ══ REAL-TIME SYNC (BroadcastChannel) ════════════════════
// When any tab saves data, it broadcasts the event type.
// Other tabs listen and re-render the affected sections.
syncChannel.onmessage = (e) => {
    const { type } = e.data;
    if (!type) return;

    // Reload fresh data from localStorage
    if (type === 'grades' || type === 'activities' || type === 'attendance') {
        try {
            if (type === 'grades')     officialGrades    = JSON.parse(localStorage.getItem(LS.grades));
            if (type === 'attendance') attendanceRecords = JSON.parse(localStorage.getItem(LS.attendance));
            if (type === 'activities') {
                activities     = JSON.parse(localStorage.getItem(LS.activities));
                nextActivityId = parseInt(localStorage.getItem(LS.nextActId)) || activities.length + 1;
            }
        } catch(e) {}
    }

    // If student is logged in, update their view
    if (currentStudentId) {
        if (type === 'grades')     { renderSGrades(); renderSDash(); showSyncBadge('📊 Grades updated!'); }
        if (type === 'attendance') { renderSAtt(currentSAttMonth); renderSDash(); showSyncBadge('📋 Attendance updated!'); }
        if (type === 'activities') { renderSTasks(currentTaskFilter); renderSDash(); showSyncBadge('📝 New activity available!'); }
    }
    // If teacher is logged in, update their view
    if (currentTeacher) {
        if (type === 'grades')     { renderTGrades(); renderTDash(); }
        if (type === 'attendance') { renderTAtt(); }
        if (type === 'activities') { renderTActs(); renderTDash(); renderTStudents(); }
    }
};

// Floating sync notification for students
function showSyncBadge(msg) {
    const existing = document.getElementById('syncBadge');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = 'syncBadge';
    el.style.cssText = 'position:fixed;top:18px;right:18px;background:#1e40af;color:white;padding:9px 16px;border-radius:10px;font-size:12px;font-weight:700;z-index:9999;display:flex;align-items:center;gap:7px;box-shadow:0 8px 24px rgba(0,0,0,.3);animation:ti .25s ease;';
    el.innerHTML = `<span style="font-size:14px;">🔄</span> ${msg}`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

// ══ SESSION PERSISTENCE ═══════════════════════════════════
// Save session so page reload restores the user's portal & tab
function saveSession(data) {
    try { localStorage.setItem(LS.session, JSON.stringify(data)); } catch(e) {}
}
function clearSession() {
    try { localStorage.removeItem(LS.session); } catch(e) {}
}
function restoreSession() {
    try {
        const raw = localStorage.getItem(LS.session);
        if (!raw) return false;
        const s = JSON.parse(raw);
        if (s.role === 'student' && s.studentId) {
            const acc = ACCOUNTS.students.find(a => a.studentId === s.studentId);
            if (!acc) return false;
            currentStudentId = s.studentId;
            mountStudentPortal(s.activeTab || 'sDash');
            return true;
        }
        if (s.role === 'teacher' && s.employeeId) {
            const acc = ACCOUNTS.teachers.find(a => a.employeeId === s.employeeId);
            if (!acc) return false;
            currentTeacher = acc;
            mountTeacherPortal(s.activeTab || 'tDash');
            return true;
        }
    } catch(e) {}
    return false;
}

// Track the current active tab (for session restore)
let currentSTab     = 'sDash';
let currentTTab     = 'tDash';
let currentSAttMonth = '2026-01';
let currentTaskFilter = 'all';

// ══ ROLE SWITCHER ════════════════════════════════════════
function switchRole(role, btn) {
    currentRole = role;
    document.querySelectorAll('.rbtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('sFields').style.display = role==='student' ? 'block' : 'none';
    document.getElementById('tFields').style.display = role==='teacher' ? 'block' : 'none';
}

// ══ LOGIN ════════════════════════════════════════════════
function doLogin() {
    const err = document.getElementById('loginErr');
    err.textContent = '';
    if (currentRole === 'student') {
        const lrn = document.getElementById('sLrn').value.trim();
        const pw  = document.getElementById('sPass').value.trim();
        const acc = ACCOUNTS.students.find(a => a.lrn===lrn && a.password===pw);
        if (!acc) { err.textContent = 'Wrong LRN or password.'; return; }
        currentStudentId = acc.studentId;
        saveSession({ role:'student', studentId: acc.studentId, activeTab:'sDash' });
        mountStudentPortal('sDash');
    } else {
        const eid = document.getElementById('tId').value.trim();
        const pw  = document.getElementById('tPass').value.trim();
        const acc = ACCOUNTS.teachers.find(a => a.employeeId===eid && a.password===pw);
        if (!acc) { err.textContent = 'Wrong Employee ID or password.'; return; }
        currentTeacher = acc;
        saveSession({ role:'teacher', employeeId: acc.employeeId, activeTab:'tDash' });
        mountTeacherPortal('tDash');
    }
}

// ── Mount helpers (called on login AND session restore) ───
function mountStudentPortal(activeTab) {
    const sid = currentStudentId;
    const st  = students.find(s => s.id === sid);
    document.getElementById('sAv').textContent          = st.initials;
    document.getElementById('sName').textContent        = st.name;
    document.getElementById('sTag').textContent         = 'Grade 12 · STEM-A';
    document.getElementById('sProfileAv').textContent   = st.initials;
    document.getElementById('sProfileName').textContent = st.name;
    document.getElementById('sProfileSub').textContent  = 'Grade 12 · STEM-A · S.Y. 2025–2026';
    document.getElementById('pName').value = st.name;
    document.getElementById('pLrn').value  = st.lrn;
    const fn = st.name.includes(',') ? st.name.split(',')[1].trim().split(' ')[0] : st.name.split(' ')[0];
    document.getElementById('sGreet').textContent = `Welcome, ${fn}! 👋`;
    document.getElementById('loginPage').style.display    = 'none';
    document.getElementById('studentPortal').style.display = 'grid';
    initStudent();
    // Restore the active tab
    if (activeTab && activeTab !== 'sDash') {
        const tabEl = document.getElementById(activeTab);
        if (tabEl) {
            document.querySelectorAll('#studentPortal .tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('#studentPortal .ni').forEach(n => n.classList.remove('active'));
            tabEl.classList.add('active');
            // Highlight matching nav item
            document.querySelectorAll('#studentPortal .ni').forEach(n => {
                if (n.getAttribute('onclick') && n.getAttribute('onclick').includes(`'${activeTab}'`)) n.classList.add('active');
            });
        }
    }
    currentSTab = activeTab || 'sDash';
}

function mountTeacherPortal(activeTab) {
    const acc = currentTeacher;
    document.getElementById('tName').textContent    = acc.name;
    document.getElementById('tSubTag').textContent  = acc.subject;
    document.getElementById('tWelcome').textContent = 'Teacher Overview';
    document.getElementById('tSubSub').textContent  = `Subject: ${acc.subject}`;
    document.getElementById('loginPage').style.display    = 'none';
    document.getElementById('teacherPortal').style.display = 'grid';
    initTeacher();
    if (activeTab && activeTab !== 'tDash') {
        const tabEl = document.getElementById(activeTab);
        if (tabEl) {
            document.querySelectorAll('#teacherPortal .tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('#teacherPortal .ni').forEach(n => n.classList.remove('active'));
            tabEl.classList.add('active');
            document.querySelectorAll('#teacherPortal .ni').forEach(n => {
                if (n.getAttribute('onclick') && n.getAttribute('onclick').includes(`'${activeTab}'`)) n.classList.add('active');
            });
        }
    }
    currentTTab = activeTab || 'tDash';
}

// ══ TAB SWITCHERS ════════════════════════════════════════
function sTab(id, el) {
    document.querySelectorAll('#studentPortal .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#studentPortal .ni').forEach(n => n.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    el.classList.add('active');
    currentSTab = id;
    // Save active tab to session
    try {
        const s = JSON.parse(localStorage.getItem(LS.session) || '{}');
        s.activeTab = id;
        localStorage.setItem(LS.session, JSON.stringify(s));
    } catch(e) {}
    lucide.createIcons();
}
function tTab(id, el) {
    document.querySelectorAll('#teacherPortal .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#teacherPortal .ni').forEach(n => n.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    el.classList.add('active');
    currentTTab = id;
    try {
        const s = JSON.parse(localStorage.getItem(LS.session) || '{}');
        s.activeTab = id;
        localStorage.setItem(LS.session, JSON.stringify(s));
    } catch(e) {}
    lucide.createIcons();
}

// ══ LOGOUT ═══════════════════════════════════════════════
function doLogout() {
    clearSession();
    location.reload();
}

// ══ HELPERS ══════════════════════════════════════════════
function gc(g) {
    if (g===null||g===undefined) return '#94a3b8';
    if (g>=90) return '#10b981'; if (g>=80) return '#3b82f6';
    if (g>=75) return '#f59e0b'; return '#ef4444';
}
function fd(d) {
    if (!d) return '—';
    return new Date(d+'T00:00:00').toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
}
function gwa(sid) {
    let total=0,count=0;
    subjects.forEach(sub => {
        const g=officialGrades[sid][sub];
        const vals=[g.q1,g.q2,g.q3,g.q4].filter(v=>v!==null);
        if(vals.length){total+=vals.reduce((a,b)=>a+b,0)/vals.length;count++;}
    });
    return count ? total/count : null;
}
function subAvg(sid,sub) {
    const g=officialGrades[sid][sub];
    const vals=[g.q1,g.q2,g.q3,g.q4].filter(v=>v!==null);
    return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
}
function attStats(sid) {
    const recs=Object.values(attendanceRecords[sid]||{});
    const p=recs.filter(r=>r==='present').length;
    const l=recs.filter(r=>r==='late').length;
    const a=recs.filter(r=>r==='absent').length;
    const t=recs.length;
    return {p,l,a,t,rate:t?Math.round((p+l)/t*100):0};
}
function taskStatus(act,sid) {
    const s=act.submissions.find(s=>s.studentId===sid);
    if(!s||s.status==='pending') return 'pending';
    if(s.teacherChecked) return 'checked';
    return 'submitted';
}
function toast(msg) {
    document.querySelectorAll('.toast').forEach(t=>t.remove());
    const t=document.createElement('div');
    t.className='toast'; t.innerHTML=msg;
    document.body.appendChild(t);
    setTimeout(()=>t.remove(),3000);
}

// ══ STUDENT INIT ═════════════════════════════════════════
function initStudent() {
    renderSDash(); renderSGrades(); renderSCalc();
    renderSTasks('all'); renderSAtt('2026-01'); renderMini();
    lucide.createIcons();
}

// ── Student Dashboard ─────────────────────────────────
function renderSDash() {
    const sid=currentStudentId;
    const all=activities.map(a=>({...a,ms:a.submissions.find(s=>s.studentId===sid)}));
    const pend=all.filter(a=>taskStatus(a,sid)==='pending').length;
    const chk=all.filter(a=>taskStatus(a,sid)==='checked').length;
    document.getElementById('dPend').textContent=pend;
    document.getElementById('dChecked').textContent=chk;
    const att=attStats(sid);
    document.getElementById('dAtt').textContent=att.t?att.rate+'%':'—';
    const g=gwa(sid);
    document.getElementById('dGWA').textContent=g?g.toFixed(2)+'%':'—';

    const pending=all.filter(a=>taskStatus(a,sid)==='pending').slice(0,4);
    document.getElementById('dTaskList').innerHTML=pending.length
        ?pending.map(a=>`
        <div class="wi" style="padding:11px;">
            <div style="flex:1">
                <div class="wt">${a.title}</div>
                <div class="wm">
                    <span><i data-lucide="book-open" size="10"></i>${a.subject}</span>
                    <span><i data-lucide="calendar" size="10"></i>Due: ${fd(a.due)}</span>
                    <span><i data-lucide="hash" size="10"></i>${a.totalScore} pts</span>
                </div>
            </div>
            <span class="badge bp">Pending</span>
        </div>`).join('')
        :'<div style="text-align:center;padding:20px;color:var(--tm);font-size:13px;">🎉 All caught up!</div>';

    document.getElementById('dGradeBar').innerHTML=subjects.map(sub=>{
        const avg=subAvg(sid,sub);
        if(avg===null) return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><div style="flex:1;font-size:11px;font-weight:600;color:var(--tm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${sub}</div><div style="font-size:11px;color:#94a3b8;">No grade</div></div>`;
        return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="flex:1;font-size:11px;font-weight:600;color:var(--tm);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${sub}">${sub}</div>
            <div class="gbar-w"><div class="gbar" style="width:${Math.min(100,avg)}%;background:${gc(avg)};"></div></div>
            <div style="font-size:12px;font-weight:800;color:${gc(avg)};min-width:32px;text-align:right;">${avg.toFixed(1)}</div>
        </div>`;
    }).join('');
    lucide.createIcons();
}

// ── Student Grades (READ ONLY) ───────────────────────
function renderSGrades() {
    const sid=currentStudentId;
    document.getElementById('sGradeBody').innerHTML=subjects.map(sub=>{
        const g=officialGrades[sid][sub];
        const qs=['q1','q2','q3','q4'].map(q=>g[q]);
        const vals=qs.filter(v=>v!==null);
        const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
        const passed=avg!==null&&avg>=75;
        return `<tr>
            <td><strong>${sub}</strong></td>
            ${qs.map(v=>`<td style="text-align:center;font-weight:700;color:${v!==null?gc(v):'#94a3b8'};">${v!==null?v:'—'}</td>`).join('')}
            <td style="text-align:center;font-weight:800;color:${avg!==null?gc(avg):'#94a3b8'};">${avg!==null?avg.toFixed(1):'—'}</td>
            <td>${vals.length?`<span class="badge ${passed?'bc':'bf'}">${passed?'Passed':'Failed'}</span>`:'<span class="badge bi">No grade</span>'}</td>
        </tr>`;
    }).join('');
    const g=gwa(sid);
    document.getElementById('sGwaVal').textContent=g?g.toFixed(2)+'%':'—';
    document.getElementById('dGWA').textContent=g?g.toFixed(2)+'%':'—';
}

// ── Student GWA Calculator ─────────────────────────────
function renderSCalc() {
    document.getElementById('sCalcBody').innerHTML=subjects.map((s,i)=>`
        <tr>
            <td style="font-size:13px;">${s}</td>
            <td style="text-align:center;"><input type="number" class="gi" value="90" min="60" max="100" oninput="calcGwa()"></td>
            <td style="text-align:center;"><span id="cr${i}" style="font-weight:700;color:${gc(90)};">90%</span></td>
        </tr>`).join('');
    calcGwa();
}
function calcGwa() {
    const rows=document.querySelectorAll('#sCalcBody tr');
    let total=0,count=0;
    rows.forEach((row,i)=>{
        const v=parseFloat(row.querySelector('input').value)||0;
        const sp=document.getElementById('cr'+i);
        if(sp){sp.textContent=v+'%';sp.style.color=gc(v);}
        total+=v;count++;
    });
    const avg=count?total/count:0;
    const el=document.getElementById('sCalcGwa');
    if(el){el.textContent=avg.toFixed(2)+'%';el.style.color=gc(avg);}
}

// ── Student Tasks ─────────────────────────────────────
function renderSTasks(filter) {
    currentTaskFilter = filter;
    const sid=currentStudentId;
    const filtered=activities.filter(a=>{
        if(filter==='all') return true;
        return taskStatus(a,sid)===filter;
    });
    const grouped={};
    filtered.forEach(a=>{if(!grouped[a.subject])grouped[a.subject]=[];grouped[a.subject].push(a);});
    const container=document.getElementById('sWorkList');
    if(!Object.keys(grouped).length){
        container.innerHTML='<div class="card" style="text-align:center;padding:36px;color:var(--tm);">No tasks for this filter.</div>';
        return;
    }
    container.innerHTML=Object.keys(grouped).map(subName=>`
        <div class="sgroup">
            <div class="stitle"><i data-lucide="book-open" size="13"></i>${subName}</div>
            ${grouped[subName].map(a=>buildTaskCard(a,sid)).join('')}
        </div>`).join('');
    lucide.createIcons();
}
function buildTaskCard(a,sid) {
    const sub=a.ms||a.submissions.find(s=>s.studentId===sid)||null;
    const sk=taskStatus(a,sid);
    const late=sub?.submittedOn&&sub.submittedOn>a.due;
    const bm={pending:'bp',submitted:'bs',checked:'bc'};
    const lm={pending:'Pending',submitted:'Submitted',checked:'Checked ✓'};
    return `<div class="wi">
        <div style="flex:1;">
            <div class="wt">${a.title}</div>
            <div class="wm">
                <span><i data-lucide="tag" size="10"></i>${a.type}</span>
                <span><i data-lucide="calendar" size="10"></i>Due: ${fd(a.due)}</span>
                <span><i data-lucide="hash" size="10"></i>${a.totalScore} pts</span>
                ${sub?.submittedOn?`<span><i data-lucide="send" size="10"></i>Submitted: ${fd(sub.submittedOn)} ${late?'<span class="badge bl" style="font-size:9px;padding:1px 5px;">LATE</span>':''}</span>`:''}
                ${sub?.score!==null&&sub?.score!==undefined?`<span><i data-lucide="star" size="10"></i>Score: <strong style="color:${gc(sub.score/a.totalScore*100)};">${sub.score}/${a.totalScore}</strong></span>`:''}
                ${sub?.teacherChecked?`<span style="color:#10b981;"><i data-lucide="check-circle" size="10"></i>Checked by teacher</span>`:''}
            </div>
            ${a.instructions?`<div style="margin-top:6px;font-size:11px;color:var(--tm);padding:6px 8px;background:#f8fafc;border-radius:7px;">${a.instructions}</div>`:''}
            ${sub?.remarks?`<div class="tnote"><strong>Teacher's note:</strong> ${sub.remarks}</div>`:''}
        </div>
        <span class="badge ${bm[sk]}">${lm[sk]}</span>
    </div>`;
}
function filterTasks(f,btn) {
    document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderSTasks(f);
}

// ── Student Attendance ───────────────────────────────
function renderSAtt(mk) {
    currentSAttMonth = mk;
    const sid=currentStudentId;
    const [yr,mo]=mk.split('-').map(Number);
    const days=new Date(yr,mo,0).getDate();
    const fd1=new Date(yr,mo-1,1).getDay();
    const hdrs=['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const cal=document.getElementById('sAttCal');
    cal.innerHTML=hdrs.map(h=>`<div class="cal-header">${h}</div>`).join('');
    for(let e=0;e<fd1;e++) cal.innerHTML+='<div></div>';
    let p=0,l=0,a=0,sd=0;
    for(let i=1;i<=days;i++){
        const dow=(i+fd1-1)%7; const wk=dow===0||dow===6;
        const dk=`${mk}-${String(i).padStart(2,'0')}`;
        const st=attendanceRecords[sid]?.[dk]||null;
        if(!wk){sd++;if(st==='present')p++;else if(st==='late')l++;else if(st==='absent')a++;}
        cal.innerHTML+=`<div class="day ${wk?'weekend':(st||'')}" style="height:48px;display:flex;flex-direction:column;justify-content:space-between;padding:5px;">
            <span style="font-size:12px;font-weight:700;">${i}</span>
            <span style="font-size:9px;font-weight:800;text-transform:uppercase;">${wk?'':(st||'')}</span>
        </div>`;
    }
    document.getElementById('sAttStats').innerHTML=`
        <div class="att-s"><div class="an" style="color:#10b981;">${p}</div><small>Present</small></div>
        <div class="att-s"><div class="an" style="color:#f59e0b;">${l}</div><small>Late</small></div>
        <div class="att-s"><div class="an" style="color:#ef4444;">${a}</div><small>Absent</small></div>
        <div class="att-s"><div class="an" style="color:var(--primary);">${sd?Math.round((p+l)/sd*100):0}%</div><small>Rate</small></div>`;
}
function switchMonth(mk,label,btn) {
    document.querySelectorAll('.mbtn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderSAtt(mk);
}
function renderMini() {
    const mini=document.getElementById('miniCal');
    mini.innerHTML=['S','M','T','W','T','F','S'].map(h=>`<div class="cal-header">${h}</div>`).join('');
    const today=new Date().getDate();
    for(let e=0;e<4;e++) mini.innerHTML+='<div></div>';
    for(let i=1;i<=31;i++)
        mini.innerHTML+=`<div class="day" style="font-size:10px;${i===today?'background:var(--primary);color:white;border-color:var(--primary);':''}\">${i}</div>`;
}

// ── Flashcards ───────────────────────────────────────
function addFlashCard() {
    const q=document.getElementById('fQ').value.trim();
    const corr=document.getElementById('fCorr').value.trim().toUpperCase();
    const opts=['fA','fB','fC','fD'].map(id=>document.getElementById(id).value.trim());
    if(!q||!opts[0]||!corr){toast('⚠️ Enter question, option A, and correct answer.');return;}
    const card=document.createElement('div');
    card.className='flash-card';
    card.innerHTML=`<p>${q}</p>`;
    ['A','B','C','D'].forEach((l,i)=>{
        if(!opts[i])return;
        const btn=document.createElement('button');
        btn.className='flash-btn'; btn.textContent=`${l}: ${opts[i]}`;
        btn.onclick=()=>{
            card.querySelectorAll('.flash-btn').forEach(b=>{
                b.disabled=true;
                if(b.textContent.startsWith(corr))b.classList.add('correct');
                else if(b===btn&&l!==corr)b.classList.add('wrong');
            });
        };
        card.appendChild(btn);
    });
    document.getElementById('flashDeck').prepend(card);
    ['fQ','fA','fB','fC','fD','fCorr'].forEach(id=>{document.getElementById(id).value='';});
}

// ══ TEACHER INIT ═════════════════════════════════════════
function initTeacher() {
    renderTDash(); renderTGrades(); renderTAtt();
    renderTActs(); renderTStudents();
    lucide.createIcons();
}

// ── Teacher Dashboard ────────────────────────────────
function renderTDash() {
    const sub=currentTeacher.subject;
    const myActs=activities.filter(a=>a.subject===sub);
    const unrev=myActs.flatMap(a=>a.submissions).filter(s=>s.status==='submitted'&&!s.teacherChecked).length;
    document.getElementById('tToReview').textContent=unrev;
    document.getElementById('tActCount').textContent=myActs.length;
    const avgs=students.map(st=>subAvg(st.id,sub)).filter(v=>v!==null);
    document.getElementById('tAvg').textContent=avgs.length?(avgs.reduce((a,b)=>a+b,0)/avgs.length).toFixed(1)+'%':'—';

    const toRev=myActs.flatMap(a=>
        a.submissions.filter(s=>s.status==='submitted'&&!s.teacherChecked)
            .map(s=>({...s,actTitle:a.title,actId:a.id,totalScore:a.totalScore}))
    );
    const el=document.getElementById('tReviewList');
    el.innerHTML=toRev.length
        ?toRev.map(s=>{
            const st=students.find(x=>x.id===s.studentId);
            return `<div class="wi">
                <div style="flex:1;">
                    <div class="wt">${s.actTitle}</div>
                    <div class="wm">
                        <span><i data-lucide="user" size="10"></i>${st?.name||'?'}</span>
                        <span><i data-lucide="send" size="10"></i>Submitted: ${fd(s.submittedOn)}</span>
                        <span><i data-lucide="hash" size="10"></i>${s.totalScore} pts</span>
                    </div>
                </div>
                <button class="btnp" style="font-size:11px;padding:6px 10px;" onclick="openScoreModal(${s.actId})"><i data-lucide="star" size="11"></i> Review</button>
            </div>`;
        }).join('')
        :'<div style="text-align:center;padding:24px;color:var(--tm);font-size:13px;">✅ All submissions reviewed!</div>';
    lucide.createIcons();
}

// ── Teacher Grades ────────────────────────────────────
function renderTGrades() {
    const sub=currentTeacher.subject;
    const q=document.getElementById('tQtr').value;
    document.getElementById('tGradeBody').innerHTML=students.map((st,i)=>{
        const v=officialGrades[st.id][sub][q];
        return `<tr>
            <td style="font-size:12px;color:var(--tm);font-weight:700;">${i+1}</td>
            <td><strong>${st.name}</strong></td>
            <td style="font-size:12px;color:var(--tm);">${st.lrn}</td>
            <td style="text-align:center;">
                <input type="number" class="gi" min="0" max="100"
                    value="${v!==null?v:''}" placeholder="—"
                    data-sid="${st.id}" data-q="${q}"
                    oninput="liveGrade(this)" id="tgi-${st.id}">
            </td>
            <td style="text-align:center;">
                <span id="tgr-${st.id}" class="badge ${v!==null?(v>=75?'bc':'bf'):'bi'}">
                    ${v!==null?(v>=75?'Passed':'Failed'):'No grade'}
                </span>
            </td>
        </tr>`;
    }).join('');
}
function liveGrade(inp) {
    const sid=parseInt(inp.dataset.sid);
    const q=inp.dataset.q;
    const v=inp.value===''?null:parseFloat(inp.value);
    officialGrades[sid][currentTeacher.subject][q]=v;
    const b=document.getElementById('tgr-'+sid);
    if(b){b.className=`badge ${v!==null?(v>=75?'bc':'bf'):'bi'}`;b.textContent=v!==null?(v>=75?'Passed':'Failed'):'No grade';}
}
function saveAllGrades() {
    let saved=0;
    students.forEach(st=>{
        const inp=document.getElementById('tgi-'+st.id);
        if(inp&&inp.value!==''){saved++;}
    });
    // Persist to localStorage and broadcast to other tabs
    persistGrades();
    syncChannel.postMessage({ type: 'grades' });
    renderTDash();
    toast(`✅ Grades saved for ${saved} students. Students can now see their updated grades.`);
}

// ── Teacher Attendance ────────────────────────────────
function renderTAtt() {
    document.getElementById('tAttBody').innerHTML=students.map((st,i)=>`
        <tr>
            <td style="font-size:12px;color:var(--tm);font-weight:700;">${i+1}</td>
            <td><strong>${st.name}</strong></td>
            ${['p','l','a'].map(t=>`
            <td style="text-align:center;">
                <div class="ao ${t}">
                    <input type="radio" name="ta-${st.id}" id="ta${t}${i}" value="${t}">
                    <label for="ta${t}${i}"></label>
                </div>
            </td>`).join('')}
            <td><input type="text" class="fi" id="tar-${st.id}" placeholder="Optional..." style="padding:5px 9px;font-size:11px;"></td>
        </tr>`).join('');
}
function markAllPresent() {
    students.forEach((_,i)=>{const r=document.getElementById('tap'+i);if(r)r.checked=true;});
}
function loadExistingAtt() {
    const date=document.getElementById('tAttDate').value;
    if(!date){toast('⚠️ Pick a date first.');return;}
    const m={present:'p',late:'l',absent:'a'};
    students.forEach((st,i)=>{
        const state=attendanceRecords[st.id]?.[date];
        if(state){const r=document.getElementById(`ta${m[state]}${i}`);if(r)r.checked=true;}
    });
    toast('📋 Loaded existing attendance.');
}
function saveAtt() {
    const date=document.getElementById('tAttDate').value;
    if(!date){toast('⚠️ Select a date first.');return;}
    const m={p:'present',l:'late',a:'absent'};
    let saved=0;
    students.forEach((st,i)=>{
        const sel=document.querySelector(`input[name="ta-${st.id}"]:checked`);
        if(sel){
            attendanceRecords[st.id][date]=m[sel.value];
            saved++;
        }
    });
    // Persist and broadcast
    persistAttendance();
    syncChannel.postMessage({ type: 'attendance' });
    toast(`✅ Attendance for ${fd(date)} saved (${saved} students). Visible to students now.`);
}

// ── Activities ────────────────────────────────────────
function renderTActs() {
    const sub=currentTeacher.subject;
    const myActs=activities.filter(a=>a.subject===sub);
    document.getElementById('tActCount').textContent=myActs.length;
    const el=document.getElementById('tActList');
    if(!myActs.length){el.innerHTML='<div class="card" style="text-align:center;padding:36px;color:var(--tm);">No activities yet. Create one above.</div>';return;}
    el.innerHTML=myActs.map(a=>{
        const subm=a.submissions.filter(s=>s.status!=='pending').length;
        const chk=a.submissions.filter(s=>s.teacherChecked).length;
        const scoredSubs=a.submissions.filter(s=>s.score!==null);
        const avgScore=scoredSubs.length?(scoredSubs.reduce((acc,s)=>acc+s.score,0)/scoredSubs.length).toFixed(1):null;
        return `<div class="act-card">
            <div style="flex:1;">
                <div class="wt">${a.title}</div>
                <div class="wm">
                    <span><i data-lucide="tag" size="10"></i>${a.type}</span>
                    <span><i data-lucide="calendar" size="10"></i>Due: ${fd(a.due)}</span>
                    <span><i data-lucide="hash" size="10"></i>${a.totalScore} pts</span>
                    <span><i data-lucide="send" size="10"></i>${subm}/${students.length} submitted</span>
                    <span><i data-lucide="check-circle" size="10"></i>${chk} checked</span>
                    ${avgScore?`<span><i data-lucide="bar-chart-2" size="10"></i>Avg: ${avgScore}</span>`:''}
                </div>
                ${a.instructions?`<div style="font-size:11px;color:var(--tm);margin-top:6px;padding:6px 8px;background:#f8fafc;border-radius:7px;">${a.instructions}</div>`:''}
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;flex-shrink:0;">
                <span class="badge ${subm>=students.length?'bc':'bp'}">${subm}/${students.length}</span>
                <button class="btnp" style="font-size:11px;padding:6px 10px;" onclick="openScoreModal(${a.id})"><i data-lucide="star" size="11"></i> Scores</button>
                <button class="btno" style="font-size:11px;padding:5px 9px;" onclick="delAct(${a.id})"><i data-lucide="trash-2" size="11"></i></button>
            </div>
        </div>`;
    }).join('');
    lucide.createIcons();
}
function openActModal(){document.getElementById('actModal').classList.add('open');lucide.createIcons();}
function closeActModal(){document.getElementById('actModal').classList.remove('open');['actTitle','actDue','actTotal','actInst'].forEach(id=>{document.getElementById(id).value='';});}
function saveActivity() {
    const title=document.getElementById('actTitle').value.trim();
    const type=document.getElementById('actType').value;
    const due=document.getElementById('actDue').value;
    const total=parseInt(document.getElementById('actTotal').value)||100;
    const inst=document.getElementById('actInst').value.trim();
    if(!title||!due){toast('⚠️ Enter title and due date.');return;}
    activities.push({
        id:nextActivityId++, subject:currentTeacher.subject,
        title,type,due,totalScore:total,instructions:inst,
        submissions:students.map(st=>({studentId:st.id,status:'pending',submittedOn:null,score:null,teacherChecked:false,remarks:''}))
    });
    // Persist and broadcast
    persistActivities();
    syncChannel.postMessage({ type: 'activities' });
    closeActModal(); renderTActs(); renderTDash();
    toast(`✅ Activity created! Visible to all 12 students now.`);
}
function delAct(id) {
    if(!confirm('Delete this activity?'))return;
    const idx=activities.findIndex(a=>a.id===id);
    if(idx>-1)activities.splice(idx,1);
    persistActivities();
    syncChannel.postMessage({ type: 'activities' });
    renderTActs(); renderTDash();
    toast('🗑️ Activity deleted.');
}

// ── Score Modal ───────────────────────────────────────
function openScoreModal(actId) {
    currentScoreActId=actId;
    const act=activities.find(a=>a.id===actId);
    if(!act)return;
    document.getElementById('scoreMTitle').textContent=`${act.title} — Scores (out of ${act.totalScore})`;
    document.getElementById('scoreBody').innerHTML=students.map((st,i)=>{
        const sub=act.submissions.find(s=>s.studentId===st.id)||{status:'pending',submittedOn:null,score:null,teacherChecked:false,remarks:''};
        return `<tr>
            <td style="font-size:12px;color:var(--tm);font-weight:700;">${i+1}</td>
            <td><strong>${st.name}</strong></td>
            <td style="text-align:center;"><input type="number" class="gi" min="0" max="${act.totalScore}" value="${sub.score!==null&&sub.score!==undefined?sub.score:''}" placeholder="—" id="sc-${st.id}"></td>
            <td style="font-size:12px;color:var(--tm);">${sub.submittedOn?fd(sub.submittedOn):'—'}</td>
            <td><span class="badge ${sub.teacherChecked?'bc':sub.status==='submitted'?'bs':'bp'}">${sub.teacherChecked?'Checked':sub.status==='submitted'?'Submitted':'Pending'}</span></td>
            <td><input type="text" class="fi" id="sr-${st.id}" value="${sub.remarks||''}" placeholder="Add remarks..." style="padding:5px 9px;font-size:11px;min-width:150px;"></td>
        </tr>`;
    }).join('');
    document.getElementById('scoreModal').classList.add('open');
    lucide.createIcons();
    updateScoreAvg(act);
}
function updateScoreAvg(act) {
    const scores=students.map(st=>{const i=document.getElementById('sc-'+st.id);return i&&i.value!==''?parseFloat(i.value):null;}).filter(v=>v!==null);
    document.getElementById('scoreAvg').textContent=scores.length?`Class avg: ${(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1)}/${act.totalScore}`:'';
}
function closeScoreModal(){document.getElementById('scoreModal').classList.remove('open');currentScoreActId=null;}
function saveScores() {
    const act=activities.find(a=>a.id===currentScoreActId);
    if(!act)return;
    let saved=0;
    students.forEach(st=>{
        const si=document.getElementById('sc-'+st.id);
        const ri=document.getElementById('sr-'+st.id);
        let sub=act.submissions.find(s=>s.studentId===st.id);
        if(!sub){sub={studentId:st.id,status:'pending',submittedOn:null,score:null,teacherChecked:false,remarks:''};act.submissions.push(sub);}
        if(si&&si.value!==''){
            sub.score=parseFloat(si.value);
            sub.status='submitted';
            sub.teacherChecked=true;
            sub.submittedOn=sub.submittedOn||new Date().toISOString().split('T')[0];
            saved++;
        }
        if(ri)sub.remarks=ri.value.trim();
    });
    // Persist and broadcast
    persistActivities();
    syncChannel.postMessage({ type: 'activities' });
    closeScoreModal();
    renderTActs(); renderTDash(); renderTStudents();
    toast(`✅ Scores saved for ${saved} students. Students see changes immediately.`);
}

// ── Student List (teacher) ────────────────────────────
function renderTStudents() {
    const sub=currentTeacher.subject;
    document.getElementById('tStudentBody').innerHTML=students.map((st,i)=>{
        const avg=subAvg(st.id,sub);
        const att=attStats(st.id);
        const pend=activities.filter(a=>a.subject===sub&&taskStatus(a,st.id)==='pending').length;
        return `<tr>
            <td style="font-size:12px;color:var(--tm);font-weight:700;">${i+1}</td>
            <td><strong>${st.name}</strong></td>
            <td style="font-size:12px;color:var(--tm);">${st.lrn}</td>
            <td style="text-align:center;font-weight:800;color:${avg!==null?gc(avg):'#94a3b8'};">${avg!==null?avg.toFixed(1)+'%':'—'}</td>
            <td style="text-align:center;font-weight:700;color:${att.rate>=90?'#10b981':att.rate>=75?'#f59e0b':'#ef4444'};">${att.t?att.rate+'%':'—'}</td>
            <td style="text-align:center;"><span class="badge ${pend?'bp':'bc'}">${pend}</span></td>
            <td><button class="btno" style="font-size:11px;padding:5px 9px;" onclick="openDetail(${st.id})"><i data-lucide="eye" size="11"></i> View</button></td>
        </tr>`;
    }).join('');
    lucide.createIcons();
}

// ── Student Detail Modal ──────────────────────────────
function openDetail(sid) {
    const st=students.find(s=>s.id===sid);
    const sub=currentTeacher.subject;
    document.getElementById('detailName').textContent=st.name;
    const att=attStats(sid);
    const g=officialGrades[sid][sub];
    const myActs=activities.filter(a=>a.subject===sub);
    document.getElementById('detailBody').innerHTML=`
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
            <div class="att-s"><div class="an" style="color:var(--primary);">${att.rate}%</div><small>Rate</small></div>
            <div class="att-s"><div class="an" style="color:#10b981;">${att.p}</div><small>Present</small></div>
            <div class="att-s"><div class="an" style="color:#f59e0b;">${att.l}</div><small>Late</small></div>
            <div class="att-s"><div class="an" style="color:#ef4444;">${att.a}</div><small>Absent</small></div>
        </div>
        <h4 style="margin-bottom:10px;font-size:13px;font-weight:800;">Grades — ${sub}</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;">
            ${['q1','q2','q3','q4'].map(q=>`<div class="att-s"><div class="an" style="color:${g[q]!==null?gc(g[q]):'#94a3b8'};font-size:20px;">${g[q]!==null?g[q]:'—'}</div><small>${q.toUpperCase()}</small></div>`).join('')}
        </div>
        <h4 style="margin-bottom:10px;font-size:13px;font-weight:800;">Activity Submissions</h4>
        ${myActs.map(a=>{
            const sub2=a.submissions.find(s=>s.studentId===sid);
            const sk=taskStatus(a,sid);
            return `<div class="wi" style="padding:10px;">
                <div style="flex:1;">
                    <div class="wt" style="font-size:13px;">${a.title}</div>
                    <div class="wm">Due: ${fd(a.due)} · ${a.totalScore} pts${sub2?.score!==null&&sub2?.score!==undefined?` · Score: <strong style="color:${gc(sub2.score/a.totalScore*100)};">${sub2.score}/${a.totalScore}</strong>`:''}</div>
                    ${sub2?.remarks?`<div style="font-size:11px;color:#15803d;margin-top:3px;">"${sub2.remarks}"</div>`:''}
                </div>
                <span class="badge ${{pending:'bp',submitted:'bs',checked:'bc'}[sk]}">${sk}</span>
            </div>`;
        }).join('')}`;
    document.getElementById('detailModal').classList.add('open');
    lucide.createIcons();
}
function closeDetail(){document.getElementById('detailModal').classList.remove('open');}

// ══ BOOT: RESTORE SESSION ════════════════════════════════
// On page load, try to restore the last logged-in session
restoreSession();
