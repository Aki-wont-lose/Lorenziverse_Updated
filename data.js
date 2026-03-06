// ══ PERSISTENCE LAYER ════════════════════════════════════
const LS = {
    grades:     'lv_officialGrades',
    attendance: 'lv_attendanceRecords',
    activities: 'lv_activities',
    nextActId:  'lv_nextActivityId',
    session:    'lv_session',
};

// ── ACCOUNTS ──────────────────────────────────────────────
const ACCOUNTS = {
    students: [
        {lrn:"418638150071",password:"student123",studentId:1},
        {lrn:"418641150015",password:"student123",studentId:2},
        {lrn:"136508130027",password:"student123",studentId:3},
        {lrn:"104955130027",password:"student123",studentId:4},
        {lrn:"104912130082",password:"student123",studentId:5},
        {lrn:"104955130056",password:"student123",studentId:6},
        {lrn:"104952130540",password:"student123",studentId:7},
        {lrn:"418569150088",password:"student123",studentId:8},
        {lrn:"418542150070",password:"student123",studentId:9},
        {lrn:"104955130068",password:"student123",studentId:10},
        {lrn:"104952130560",password:"student123",studentId:11},
        {lrn:"136524120518",password:"student123",studentId:12},
    ],
    teachers: [
        {employeeId:"TEACHER01",password:"teacher123",name:"Teacher",subject:"Media Information Literacy"},
        {employeeId:"TEACHER02",password:"teacher123",name:"Teacher",subject:"Personal Development"},
        {employeeId:"TEACHER03",password:"teacher123",name:"Teacher",subject:"Physical Education and Health"},
        {employeeId:"TEACHER04",password:"teacher123",name:"Teacher",subject:"Empowerment Technologies"},
        {employeeId:"TEACHER05",password:"teacher123",name:"Teacher",subject:"Inquiries, Investigation and Immersion"},
        {employeeId:"TEACHER06",password:"teacher123",name:"Teacher",subject:"General Physics"},
        {employeeId:"TEACHER07",password:"teacher123",name:"Teacher",subject:"General Chemistry 2"},
        {employeeId:"Rhea Fabian",password:"admin123",name:"Rhea Jade M. Fabian",subject:"Capstone Project"},
    ]
};

// ── STUDENTS ──────────────────────────────────────────────
const students = [
    {id:1,  lrn:"418638150071", name:"Ani, Eldrich Andrei",              initials:"EA"},
    {id:2,  lrn:"418641150015", name:"Baliwag, Johan Ayesha",            initials:"JB"},
    {id:3,  lrn:"136508130027", name:"Cajayon, Natanielle Marcus",       initials:"NC"},
    {id:4,  lrn:"104955130027", name:"Celestino, James Vincent",         initials:"JC"},
    {id:5,  lrn:"104912130082", name:"Dela Torre, Stanley James",        initials:"SD"},
    {id:6,  lrn:"104955130056", name:"Hermogenes, Maria Leila",          initials:"MH"},
    {id:7,  lrn:"104952130540", name:"Maningas, Ygie Bonn",              initials:"YM"},
    {id:8,  lrn:"418569150088", name:"Mejia, Jazmine Gale",              initials:"JM"},
    {id:9,  lrn:"418542150070", name:"Mudlong, Ma. Jhoanna Franchezka",  initials:"JF"},
    {id:10, lrn:"104955130068", name:"Rabacal, Mariane",                 initials:"MR"},
    {id:11, lrn:"104952130560", name:"Rayo, John Carl",                  initials:"JR"},
    {id:12, lrn:"136524120518", name:"Terenueva, Cresha",                initials:"CT"},
];

// ── SUBJECTS ──────────────────────────────────────────────
const subjects = [
    "Media Information Literacy",
    "Personal Development",
    "Physical Education and Health",
    "Empowerment Technologies",
    "Inquiries, Investigation and Immersion",
    "General Physics",
    "General Chemistry 2",
    "Capstone Project"
];

// ── SEED BUILDERS (deterministic, no Math.random) ─────────
function buildSeedGrades() {
    const g = {};
    const seedBase = {1:88,2:92,3:85,4:91,5:78,6:95,7:89,8:94,9:82,10:90,11:87,12:76};
    students.forEach(st => {
        g[st.id] = {};
        const b = seedBase[st.id];
        subjects.forEach((sub,si) => {
            const off = ((st.id*3 + si*7) % 8) - 4;
            const r   = ((st.id*31 + si*17) % 5);
            g[st.id][sub] = {
                q1: Math.min(100, Math.max(74, b+off)),
                q2: Math.min(100, Math.max(74, b+off+r-1)),
                q3: null,
                q4: null
            };
        });
    });
    return g;
}

function buildSeedAttendance() {
    const a = {};
    students.forEach(st => { a[st.id] = {}; });
    const janDays = [
        "2026-01-05","2026-01-06","2026-01-07","2026-01-08","2026-01-09",
        "2026-01-12","2026-01-13","2026-01-14","2026-01-15","2026-01-16",
        "2026-01-19","2026-01-20","2026-01-21","2026-01-22","2026-01-23",
        "2026-01-26","2026-01-27","2026-01-28","2026-01-29","2026-01-30",
    ];
    students.forEach((st,si) => {
        janDays.forEach((d,di) => {
            const r = (si*17 + di*13) % 20;
            a[st.id][d] = r < 15 ? 'present' : r < 18 ? 'late' : 'absent';
        });
    });
    return a;
}

function buildSeedActivities() {
    return [
        {
            id:1, subject:"General Physics", title:"Laboratory Report #4",
            type:"Lab Report", due:"2026-01-15", totalScore:100,
            instructions:"Document your observations from the thermodynamics experiment.",
            submissions: students.map((st,i) => ({
                studentId:st.id, status:i<8?"submitted":"pending",
                submittedOn:i<8?"2026-01-14":null,
                score:i<5?(82+st.id%14):null, teacherChecked:i<5,
                remarks:i<5?"Good work! Review your conclusion.":""
            }))
        },
        {
            id:2, subject:"General Physics", title:"Problem Set: Thermodynamics",
            type:"Problem Set", due:"2026-01-18", totalScore:50,
            instructions:"Answer all problems in Chapter 8. Show complete solutions.",
            submissions: students.map((st,i) => ({
                studentId:st.id, status:i<10?"submitted":"pending",
                submittedOn:i<10?"2026-01-17":null,
                score:i<7?(38+st.id%12):null, teacherChecked:i<7,
                remarks:i<7?(st.id%2===0?"Excellent!":"Minor errors in #3."):""
            }))
        },
        {
            id:3, subject:"Media Information Literacy", title:"Video Essay Draft",
            type:"Essay", due:"2026-01-16", totalScore:100,
            instructions:"Submit a 3–5 minute video essay on any current media issue.",
            submissions: students.map((st,i) => ({
                studentId:st.id, status:i<6?"submitted":"pending",
                submittedOn:i<6?"2026-01-15":null,
                score:i<4?(85+st.id%12):null, teacherChecked:i<4,
                remarks:i<4?"Creative approach! Work on transitions.":""
            }))
        },
        {
            id:4, subject:"Capstone Project", title:"Chapter 1–3 Submission",
            type:"Project", due:"2026-01-20", totalScore:100,
            instructions:"Submit the first three chapters in PDF. Follow APA 7th edition.",
            submissions: students.map((st,i) => ({
                studentId:st.id, status:i<9?"submitted":"pending",
                submittedOn:i<9?"2026-01-19":null,
                score:i<6?(88+st.id%10):null, teacherChecked:i<6,
                remarks:i<6?(st.id%2===0?"Well-written introduction.":"Revise your problem statement."):""
            }))
        },
        {
            id:5, subject:"Personal Development", title:"Reflective Journal",
            type:"Seatwork", due:"2026-01-10", totalScore:50,
            instructions:"Write a one-page reflection on your personal growth this semester.",
            submissions: students.map(st => ({
                studentId:st.id, status:"submitted", submittedOn:"2026-01-09",
                score:40+st.id%10, teacherChecked:true,
                remarks:st.id%3===0?"Excellent reflection!":"Good work, be more specific next time."
            }))
        },
        {
            id:6, subject:"Empowerment Technologies", title:"Web Page Project",
            type:"Project", due:"2026-01-22", totalScore:100,
            instructions:"Create a personal portfolio webpage using HTML, CSS, and JavaScript.",
            submissions: students.map((st,i) => ({
                studentId:st.id, status:i<5?"submitted":"pending",
                submittedOn:i<5?"2026-01-21":null,
                score:null, teacherChecked:false, remarks:""
            }))
        },
    ];
}

// ── LOAD OR INIT FROM localStorage ─────────────────────────
function loadOrInit(key, buildFn) {
    try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw);
    } catch(e) {}
    const fresh = buildFn();
    try { localStorage.setItem(key, JSON.stringify(fresh)); } catch(e) {}
    return fresh;
}

let officialGrades    = loadOrInit(LS.grades,    buildSeedGrades);
let attendanceRecords = loadOrInit(LS.attendance, buildSeedAttendance);
let activities        = loadOrInit(LS.activities, buildSeedActivities);
let nextActivityId    = parseInt(localStorage.getItem(LS.nextActId) || '') || (activities.length + 1);

// ── SAVE HELPERS ───────────────────────────────────────────
function persistGrades()     { try { localStorage.setItem(LS.grades,    JSON.stringify(officialGrades));    } catch(e){} }
function persistAttendance() { try { localStorage.setItem(LS.attendance, JSON.stringify(attendanceRecords)); } catch(e){} }
function persistActivities() {
    try {
        localStorage.setItem(LS.activities, JSON.stringify(activities));
        localStorage.setItem(LS.nextActId,  String(nextActivityId));
    } catch(e){}
}

// ── RUNTIME STATE ──────────────────────────────────────────
let currentRole       = "student";
let currentStudentId  = null;
let currentTeacher    = null;
let currentScoreActId = null;

// ── BROADCAST CHANNEL ──────────────────────────────────────
// Teacher tab broadcasts after saves → student tabs re-render instantly
const syncChannel = new BroadcastChannel('lv_sync');
