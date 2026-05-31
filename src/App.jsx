import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qrezttloarvjflsbtnfm.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZXp0dGxvYXJ2amZsc2J0bmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNzM2MDgsImV4cCI6MjA5NTc0OTYwOH0.R_J4-RBTDuE1SgrEK567zD3fgh_AuUYI1Hw5ui8noLM";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const HOLLAND = {
  R: { name: "현실형", emoji: "🔧", color: "#E8A838", career: "과학자, 요리사, 엔지니어" },
  I: { name: "탐구형", emoji: "🔬", color: "#5B8EDB", career: "의사, 연구원, 발명가" },
  A: { name: "예술형", emoji: "🎨", color: "#C86DD7", career: "화가, 작가, 디자이너" },
  S: { name: "사회형", emoji: "🤝", color: "#4CAF87", career: "선생님, 상담사, 사회복지사" },
  E: { name: "기업형", emoji: "⭐", color: "#E86D3F", career: "사업가, 아나운서, 판사" },
  C: { name: "관습형", emoji: "📋", color: "#7B8FA8", career: "회계사, 공무원, 사서" },
};

const SYSTEM_PROMPT = `당신은 초등학교 3학년 학생들을 위한 수업 분석 전문가입니다.
교사가 입력한 수업 내용을 분석하여, 홀랜드 직업흥미 유형(R/I/A/S/E/C) 각각에 해당하는 질문을 1개씩 총 6개 만들어주세요.
각 질문은 초등 3학년이 이해할 수 있는 쉬운 말로, 수업에서 실제로 한 활동과 연결하여 작성해주세요.
반드시 아래 JSON 형식으로만 응답하세요:
{"questions":[{"type":"R","text":"질문"},{"type":"I","text":"질문"},{"type":"A","text":"질문"},{"type":"S","text":"질문"},{"type":"E","text":"질문"},{"type":"C","text":"질문"}]}`;

async function generateQuestions(lessonContent) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessonContent }),
  });
  return await response.json();
}

// ── 교사 화면 ──────────────────────────────────────────
function TeacherPage({ onDone }) {
  const [tab, setTab] = useState("create");
  const [title, setTitle] = useState("");
  const [lesson, setLesson] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [newStudent, setNewStudent] = useState("");

  useEffect(() => { loadStudents(); loadLessons(); }, []);

  async function loadStudents() {
    const { data } = await supabase.from("students").select("*").order("name");
    setStudents(data || []);
  }

  async function loadLessons() {
    const { data } = await supabase.from("lessons").select("*").order("created_at", { ascending: false });
    setLessons(data || []);
  }

  async function handleGenerate() {
    if (!title.trim() || !lesson.trim()) return;
    setLoading(true);
    try {
      const result = await generateQuestions(lesson);
      const { data } = await supabase.from("lessons").insert({
        title, content: lesson, questions: result.questions
      }).select().single();
      setDone(data);
    } catch (e) { alert("질문 생성 실패! 다시 시도해주세요."); }
    setLoading(false);
  }

  async function addStudent() {
    if (!newStudent.trim()) return;
    await supabase.from("students").insert({ name: newStudent.trim() });
    setNewStudent("");
    loadStudents();
  }

  async function deleteStudent(id) {
    await supabase.from("students").delete().eq("id", id);
    loadStudents();
  }

  const url = window.location.origin;

  return (
    <div style={s.root}>
      <div style={s.topBar}>
        <span style={s.logo}>🌱 나를 찾는 수업</span>
        <span style={s.teacherBadge}>👩‍🏫 교사 화면</span>
      </div>
      <div style={s.tabs}>
        {["create","students","lessons"].map(t => (
          <button key={t} style={{...s.tab, ...(tab===t?s.tabOn:{})}} onClick={()=>setTab(t)}>
            {t==="create"?"✏️ 수업 입력":t==="students"?"👦 학생 관리":"📚 수업 목록"}
          </button>
        ))}
      </div>

      {tab === "create" && (
        <div style={s.card}>
          <h2 style={s.h2}>오늘 수업을 입력하세요</h2>
          <input style={s.input} placeholder="수업 제목 (예: 봄 풍경 꾸미기)" value={title} onChange={e=>setTitle(e.target.value)} />
          <textarea style={s.textarea} placeholder="수업 내용을 자세히 적어주세요" value={lesson} onChange={e=>setLesson(e.target.value)} rows={5} />
          <button style={{...s.btn, opacity: loading||!title||!lesson?0.5:1}} onClick={handleGenerate} disabled={loading||!title||!lesson}>
            {loading ? "✨ 질문 만드는 중..." : "🤖 AI 질문 생성하기"}
          </button>
          {done && (
            <div style={s.successBox}>
              <p style={s.successTitle}>✅ 질문이 만들어졌어요!</p>
              <p style={s.successSub}>학생들에게 아래 링크를 나눠주세요:</p>
              {students.length === 0 && <p style={{color:"#e53935",fontSize:14}}>⚠️ 먼저 '학생 관리' 탭에서 학생을 추가해주세요!</p>}
              {students.map(st => (
                <div key={st.id} style={s.linkRow}>
                  <span style={s.linkName}>{st.name}</span>
                  <span style={s.linkUrl}>{url}/student/{st.id}/{done.id}</span>
                  <button style={s.copyBtn} onClick={()=>navigator.clipboard.writeText(`${url}/student/${st.id}/${done.id}`)}>복사</button>
                </div>
              ))}
              <button style={{...s.btn, background:"#5B8EDB", marginTop:12}} onClick={()=>window.location.href=`/result/${done.id}`}>
                📊 결과 보기
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "students" && (
        <div style={s.card}>
          <h2 style={s.h2}>학생 관리</h2>
          <div style={s.row}>
            <input style={{...s.input, margin:0, flex:1}} placeholder="학생 이름 입력" value={newStudent} onChange={e=>setNewStudent(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addStudent()} />
            <button style={{...s.btn, margin:0, width:"auto", padding:"12px 20px"}} onClick={addStudent}>추가</button>
          </div>
          <div style={{marginTop:16}}>
            {students.map(st => (
              <div key={st.id} style={s.studentRow}>
                <span>👦 {st.name}</span>
                <button style={s.delBtn} onClick={()=>deleteStudent(st.id)}>삭제</button>
              </div>
            ))}
            {students.length===0 && <p style={{color:"#999", textAlign:"center"}}>아직 학생이 없어요</p>}
          </div>
        </div>
      )}

      {tab === "lessons" && (
        <div style={s.card}>
          <h2 style={s.h2}>수업 목록</h2>
          {lessons.map(l => (
            <div key={l.id} style={s.lessonRow} onClick={()=>window.location.href=`/result/${l.id}`}>
              <div style={s.lessonTitle}>{l.title}</div>
              <div style={s.lessonDate}>{new Date(l.created_at).toLocaleDateString("ko-KR")} →</div>
            </div>
          ))}
          {lessons.length===0 && <p style={{color:"#999", textAlign:"center"}}>아직 수업이 없어요</p>}
        </div>
      )}
    </div>
  );
}

// ── 학생 화면 ──────────────────────────────────────────
function StudentPage({ studentId, lessonId }) {
  const [student, setStudent] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: st } = await supabase.from("students").select("*").eq("id", studentId).single();
      const { data: ls } = await supabase.from("lessons").select("*").eq("id", lessonId).single();
      const { data: res } = await supabase.from("responses").select("*").eq("student_id", studentId).eq("lesson_id", lessonId);
      setStudent(st);
      setLesson(ls);
      if (res && res.length > 0) setAlreadyDone(true);
    }
    load();
  }, [studentId, lessonId]);

  async function handleSubmit() {
    await supabase.from("responses").insert({ student_id: studentId, lesson_id: lessonId, answers });
    setSubmitted(true);
  }

  if (!student || !lesson) return <div style={s.center}>⏳ 불러오는 중...</div>;
  if (alreadyDone) return (
    <div style={s.center}>
      <div style={{fontSize:64}}>✅</div>
      <h2>이미 응답했어요!</h2>
      <p style={{color:"#666"}}>{student.name} 학생은 이미 이 수업에 응답했어요.</p>
    </div>
  );
  if (submitted) return (
    <div style={s.center}>
      <div style={{fontSize:64}}>🎉</div>
      <h2>제출 완료!</h2>
      <p style={{color:"#666"}}>{student.name}, 잘 했어요!</p>
    </div>
  );

  const allAnswered = lesson.questions.length === Object.keys(answers).length;

  return (
    <div style={s.root}>
      <div style={s.topBar}>
        <span style={s.logo}>🌱 나를 찾는 수업</span>
        <span style={{...s.teacherBadge, background:"#4CAF87"}}>🎒 {student.name}</span>
      </div>
      <div style={{maxWidth:600, margin:"0 auto", padding:"24px 16px"}}>
        <h2 style={s.h2}>📚 {lesson.title}</h2>
        <p style={{color:"#666", marginBottom:24}}>각 질문에 별점으로 대답해보세요!</p>
        {lesson.questions.map((q, i) => {
          const t = HOLLAND[q.type];
          return (
            <div key={i} style={{...s.qCard, borderLeft:`4px solid ${t.color}`}}>
              <span style={{...s.qBadge, background:t.color}}>{t.emoji} {t.name}</span>
              <p style={s.qText}>{q.text}</p>
              <div style={s.stars}>
                {[1,2,3,4,5].map(star => (
                  <button key={star} style={{...s.starBtn, color: answers[q.type]>=star ? t.color : "#ddd"}}
                    onClick={()=>setAnswers({...answers, [q.type]: star})}>★</button>
                ))}
                {answers[q.type] && <span style={{color:t.color, fontWeight:700, marginLeft:8}}>{answers[q.type]}점</span>}
              </div>
            </div>
          );
        })}
        <button style={{...s.btn, opacity: allAnswered?1:0.5, background:"#4CAF87"}} onClick={handleSubmit} disabled={!allAnswered}>
          ✅ 제출하기
        </button>
      </div>
    </div>
  );
}

// ── 결과 화면 ──────────────────────────────────────────
function ResultPage({ lessonId }) {
  const [lesson, setLesson] = useState(null);
  const [responses, setResponses] = useState([]);
  const [students, setStudents] = useState({});

  useEffect(() => {
    async function load() {
      const { data: ls } = await supabase.from("lessons").select("*").eq("id", lessonId).single();
      const { data: res } = await supabase.from("responses").select("*").eq("lesson_id", lessonId);
      const { data: sts } = await supabase.from("students").select("*");
      setLesson(ls);
      setResponses(res || []);
      const map = {};
      (sts||[]).forEach(s => { map[s.id] = s.name; });
      setStudents(map);
    }
    load();
  }, [lessonId]);

  if (!lesson) return <div style={s.center}>⏳ 불러오는 중...</div>;

  const agg = {};
  Object.keys(HOLLAND).forEach(t => { agg[t] = []; });
  responses.forEach(r => {
    Object.entries(r.answers).forEach(([type, score]) => { agg[type].push(score); });
  });
  const avg = arr => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : 0;
  const sorted = Object.keys(HOLLAND).sort((a,b) => avg(agg[b]) - avg(agg[a]));
  const top = sorted[0];

  return (
    <div style={s.root}>
      <div style={s.topBar}>
        <span style={s.logo}>🌱 나를 찾는 수업</span>
        <span style={{...s.teacherBadge, background:"#C86DD7"}}>📊 결과</span>
      </div>
      <div style={{maxWidth:600, margin:"0 auto", padding:"24px 16px"}}>
        <h2 style={s.h2}>📚 {lesson.title}</h2>
        <p style={{color:"#666", marginBottom:24}}>총 {responses.length}명 응답</p>

        <div style={s.card}>
          <h3 style={{fontWeight:700, marginBottom:16}}>🏆 유형별 평균 점수</h3>
          {sorted.map((type, rank) => {
            const t = HOLLAND[type];
            const score = avg(agg[type]);
            return (
              <div key={type} style={{display:"flex", alignItems:"center", gap:12, marginBottom:12}}>
                <span style={{width:24}}>{rank===0?"🥇":rank===1?"🥈":rank===2?"🥉":"  "}</span>
                <span style={{width:80, fontSize:14, fontWeight:600}}>{t.emoji} {t.name}</span>
                <div style={{flex:1, height:14, background:"#f0f0f0", borderRadius:8, overflow:"hidden"}}>
                  <div style={{width:`${(score/5)*100}%`, height:"100%", background:t.color, borderRadius:8}} />
                </div>
                <span style={{color:t.color, fontWeight:700, width:32}}>{score}</span>
              </div>
            );
          })}
        </div>

        <div style={{...s.card, borderTop:`4px solid ${HOLLAND[top].color}`, textAlign:"center"}}>
          <div style={{fontSize:56}}>{HOLLAND[top].emoji}</div>
          <h3 style={{color:HOLLAND[top].color, fontSize:22, fontWeight:800}}>우리 반은 {HOLLAND[top].name}!</h3>
          <p style={{color:"#555"}}>관련 직업: {HOLLAND[top].career}</p>
        </div>

        <h3 style={{fontWeight:700, margin:"24px 0 12px"}}>👦 학생별 결과</h3>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(130px,1fr))", gap:12}}>
          {responses.map((r, i) => {
            const best = Object.keys(r.answers).sort((a,b)=>r.answers[b]-r.answers[a])[0];
            const t = HOLLAND[best];
            return (
              <div key={i} style={{...s.card, borderTop:`4px solid ${t.color}`, textAlign:"center", padding:16}}>
                <div style={{fontWeight:700, marginBottom:8}}>{students[r.student_id] || "학생"}</div>
                <div style={{fontSize:28}}>{t.emoji}</div>
                <div style={{color:t.color, fontWeight:700, fontSize:14}}>{t.name}</div>
                <div style={{color:"#888", fontSize:13}}>{r.answers[best]}점</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── 라우터 ──────────────────────────────────────────
export default function App() {
  const path = window.location.pathname;
  const parts = path.split("/").filter(Boolean);

  if (parts[0] === "student" && parts[1] && parts[2]) {
    return <StudentPage studentId={parts[1]} lessonId={parts[2]} />;
  }
  if (parts[0] === "result" && parts[1]) {
    return <ResultPage lessonId={parts[1]} />;
  }
  return <TeacherPage />;
}

// ── 스타일 ──────────────────────────────────────────
const s = {
  root: { minHeight:"100vh", background:"#f5f7fa", fontFamily:"'Noto Sans KR', sans-serif" },
  topBar: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 24px", background:"#fff", boxShadow:"0 2px 12px rgba(0,0,0,0.08)", position:"sticky", top:0, zIndex:100 },
  logo: { fontSize:20, fontWeight:800, color:"#2d6a4f" },
  teacherBadge: { background:"#E8A838", color:"#fff", borderRadius:20, padding:"4px 16px", fontSize:13, fontWeight:700 },
  tabs: { display:"flex", gap:0, borderBottom:"2px solid #eee", background:"#fff" },
  tab: { flex:1, padding:"14px 0", border:"none", background:"transparent", cursor:"pointer", fontWeight:600, fontSize:14, color:"#888" },
  tabOn: { color:"#2d6a4f", borderBottom:"3px solid #2d6a4f" },
  card: { background:"#fff", borderRadius:16, padding:24, marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" },
  h2: { fontSize:22, fontWeight:800, color:"#1a1a2e", margin:"0 0 16px" },
  input: { width:"100%", padding:"12px 16px", borderRadius:12, border:"2px solid #e0e0e0", fontSize:15, fontFamily:"inherit", outline:"none", marginBottom:12, boxSizing:"border-box" },
  textarea: { width:"100%", padding:"12px 16px", borderRadius:12, border:"2px solid #e0e0e0", fontSize:15, fontFamily:"inherit", outline:"none", resize:"vertical", marginBottom:12, boxSizing:"border-box" },
  btn: { display:"block", width:"100%", padding:16, background:"#2d6a4f", color:"#fff", border:"none", borderRadius:12, fontSize:16, fontWeight:700, cursor:"pointer", marginTop:8 },
  successBox: { background:"#f0faf5", borderRadius:12, padding:20, marginTop:16 },
  successTitle: { fontWeight:800, color:"#2d6a4f", fontSize:17, margin:"0 0 4px" },
  successSub: { color:"#555", marginBottom:12, fontSize:14 },
  linkRow: { display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderBottom:"1px solid #e0e0e0", flexWrap:"wrap" },
  linkName: { fontWeight:700, minWidth:60 },
  linkUrl: { fontSize:11, color:"#555", flex:1, wordBreak:"break-all" },
  copyBtn: { padding:"4px 12px", borderRadius:8, border:"1px solid #2d6a4f", background:"#fff", color:"#2d6a4f", cursor:"pointer", fontWeight:600, fontSize:13 },
  row: { display:"flex", gap:12, alignItems:"center" },
  studentRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid #f0f0f0" },
  delBtn: { padding:"4px 12px", borderRadius:8, border:"1px solid #e53935", background:"#fff", color:"#e53935", cursor:"pointer", fontSize:13 },
  lessonRow: { padding:"14px 0", borderBottom:"1px solid #f0f0f0", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" },
  lessonTitle: { fontWeight:700, color:"#1a1a2e" },
  lessonDate: { color:"#888", fontSize:13 },
  qCard: { background:"#fff", borderRadius:16, padding:20, marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" },
  qBadge: { display:"inline-block", color:"#fff", borderRadius:20, padding:"3px 12px", fontSize:13, fontWeight:700, marginBottom:10 },
  qText: { fontSize:16, fontWeight:600, color:"#1a1a2e", margin:"0 0 12px" },
  stars: { display:"flex", alignItems:"center", gap:4 },
  starBtn: { background:"none", border:"none", fontSize:32, cursor:"pointer", padding:2 },
  center: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"80vh", textAlign:"center", padding:24 },
};
