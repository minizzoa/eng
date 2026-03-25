import React, { useState, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";

// ── [1] 환경 설정 및 테마 ──────────────────────────────────────────────────
const DAILY_COUNT = 20; 
const QUIZ_COUNT = 20;  
const EXCEL_FILE_PATH = "/영어단어장_템플릿.xlsx"; 

const C = {
  bg: "#0F0F14", surface: "#1A1A24", card: "#22222F", border: "#2E2E40",
  accent: "#7C6EF8", accentLight: "#A99BFF",
  green: "#3ECFA4", amber: "#F5A623", red: "#F05454",
  text: "#F0EFFF", muted: "#8A89A6", dim: "#4A4A65",
};

const SOUNDS = {
  correct: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
  wrong: "https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3"
};

// ── [2] 유틸리티 ──────────────────────────────────────────────────────────────
const getTodayKey = () => new Date().toISOString().slice(0, 10);
const seededShuffle = (arr, seed) => {
  const a = [...arr];
  let s = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ── [3] 공용 UI 컴포넌트 ─────────────────────────────────────────────────────

function Header({ screen }) {
  const titles = { home: "대시보드", vocab: "오늘의 단어장", quiz: "데일리 퀴즈", stats: "학습 리포트" };
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "85px", background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 1000, boxShadow: "0 4px 15px rgba(0,0,0,0.4)" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 900, color: "#fff", margin: 0 }}>영어 단어 마스터</h1>
      <span style={{ fontSize: "13px", color: C.accentLight, fontWeight: 600, marginTop: "4px" }}>{titles[screen]}</span>
    </div>
  );
}

function NavBar({ screen, setScreen }) {
  const items = [
    { id: "home", label: "홈", icon: "⚡" },
    { id: "vocab", label: "단어장", icon: "📚" },
    { id: "quiz", label: "퀴즈", icon: "🎯" },
    { id: "stats", label: "통계", icon: "📊" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)" }}>
      {items.map(item => (
        <button key={item.id} onClick={() => { setScreen(item.id); window.scrollTo(0,0); }} style={{ flex: 1, padding: "12px 0", background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span style={{ fontSize: 10, color: screen === item.id ? C.accentLight : C.muted, fontWeight: screen === item.id ? 700 : 400 }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── [4] 메인 화면별 컴포넌트 ───────────────────────────────────────────────────

// 1. 대시보드 (Home)
function HomeScreen({ cards, lastScore, streak, studySeconds }) {
  const learnedCount = cards.filter(c => c.repetitions > 0).length;
  const progressPercent = Math.round((learnedCount / cards.length) * 100) || 0;
  const formatTime = (s) => `${Math.floor(s / 60)}분 ${s % 60}초`;

  return (
    <div style={{ padding: "110px 16px 100px", animation: "fadeIn 0.4s" }}>
      <div style={{ background: `linear-gradient(135deg, ${C.accent} 0%, #5A4AD1 100%)`, borderRadius: 24, padding: "24px", marginBottom: 16, boxShadow: `0 8px 20px ${C.accent}33` }}>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", marginBottom: "4px" }}>오늘의 목표 달성</p>
        <h2 style={{ fontSize: "38px", fontWeight: 900, color: "#fff", margin: 0 }}>{progressPercent}%</h2>
        <div style={{ height: "8px", background: "rgba(255,255,255,0.2)", borderRadius: "4px", marginTop: "20px" }}>
          <div style={{ height: "100%", background: "#fff", borderRadius: "4px", width: `${progressPercent}%`, transition: "width 0.8s" }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{ background: C.card, padding: "16px", borderRadius: "20px", border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: "12px", color: C.muted, marginBottom: "4px" }}>🔥 연속 학습</p>
          <span style={{ fontSize: "18px", fontWeight: 800, color: C.amber }}>{streak}일째</span>
        </div>
        <div style={{ background: C.card, padding: "16px", borderRadius: "20px", border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: "12px", color: C.muted, marginBottom: "4px" }}>🎯 최근 점수</p>
          <span style={{ fontSize: "18px", fontWeight: 800, color: C.green }}>{lastScore !== null ? `${lastScore}/${QUIZ_COUNT}` : "-"}</span>
        </div>
        <div style={{ background: C.card, padding: "16px", borderRadius: "20px", border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: "12px", color: C.muted, marginBottom: "4px" }}>⏱️ 오늘 학습</p>
          <span style={{ fontSize: "18px", fontWeight: 800, color: C.accentLight }}>{formatTime(studySeconds)}</span>
        </div>
        <div style={{ background: C.card, padding: "16px", borderRadius: "20px", border: `1px solid ${C.border}` }}>
          <p style={{ fontSize: "12px", color: C.muted, marginBottom: "4px" }}>📖 남은 단어</p>
          <span style={{ fontSize: "18px", fontWeight: 800 }}>{cards.length - learnedCount}개</span>
        </div>
      </div>
    </div>
  );
}

// 2. 단어장 (Vocab) - 수정된 레이아웃
function VocabScreen({ cards, setCards }) {
  const [idx, setIdx] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const current = cards[idx];

  if (!current) return (
    <div style={{ padding: "150px 20px", textAlign: "center" }}>
      <h2 style={{ color: C.accentLight }}>학습을 완료했습니다!</h2>
      <button onClick={() => setIdx(0)} style={{ marginTop: 20, background: C.accent, border: "none", color: "#fff", padding: "14px 28px", borderRadius: 12, fontWeight: 700 }}>다시 보기</button>
    </div>
  );

  return (
    <div style={{ padding: "100px 16px 100px", animation: "fadeIn 0.4s" }}>
      {/* 단어 카드 컨테이너 */}
      <div 
        onClick={() => setShowMeaning(!showMeaning)}
        style={{ 
          position: "relative", // 내부 숫자 표시를 위해 relative 설정
          background: C.card, 
          borderRadius: 28, 
          padding: "50px 20px 40px", // 상단 여백을 조금 더 주어 숫자 자리 확보
          border: `1px solid ${C.border}`, 
          textAlign: "center", 
          marginBottom: 20, 
          minHeight: "300px", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center", 
          cursor: "pointer",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
        }}
      >
        {/* 컨테이너 내부 우측 상단 숫자 표시 */}
        <div style={{ 
          position: "absolute", 
          top: "20px", 
          right: "24px", 
          fontSize: "13px", 
          fontWeight: 700, 
          color: C.dim,
          background: "rgba(255,255,255,0.05)",
          padding: "4px 10px",
          borderRadius: "8px"
        }}>
          {idx + 1} / {cards.length}
        </div>

        <h2 style={{ fontSize: "44px", fontWeight: 900, margin: 0, color: "#fff" }}>{current.word}</h2>
        <p style={{ color: C.accentLight, fontSize: "18px", marginTop: 8, opacity: 0.8 }}>[{current.pronunciation}]</p>
        
        <div style={{ height: "130px", marginTop: "30px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {showMeaning ? (
              <div style={{ animation: "fadeIn 0.3s" }}>
                <p style={{ fontSize: "28px", fontWeight: 700, color: C.green, marginBottom: "12px" }}>{current.meaning}</p>
                <p style={{ fontSize: "15px", color: C.muted, lineHeight: 1.6, padding: "0 10px" }}>{current.example}</p>
              </div>
            ) : (
              <div style={{ 
                padding: "8px 16px", 
                borderRadius: "12px", 
                border: `1px dashed ${C.dim}`,
                color: C.dim, 
                fontSize: "14px", 
                fontWeight: 600 
              }}>
                탭하여 뜻 확인
              </div>
            )}
        </div>
      </div>

      <button 
        onClick={() => { 
          setCards(prev => prev.map((c, i) => i === idx ? { ...c, repetitions: 1 } : c)); 
          setIdx(idx + 1); 
          setShowMeaning(false); 
        }} 
        style={{ 
          width: "100%", 
          padding: "20px", 
          borderRadius: 20, 
          border: "none", 
          background: C.accent, 
          color: "#fff", 
          fontWeight: 800, 
          fontSize: "18px", 
          boxShadow: `0 4px 15px ${C.accent}44`,
          transition: "0.2s"
        }}
      >
        다음 단어로 넘어기기 →
      </button>
    </div>
  );
}

// 3. 퀴즈 (Quiz)
function QuizScreen({ cards, setLastScore }) {
  const TOTAL = Math.min(QUIZ_COUNT, cards.length);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [quizData, setQuizData] = useState([]);

  const playSound = (type) => {
    const audio = new Audio(SOUNDS[type]);
    audio.volume = 0.4;
    audio.play().catch(() => {});
  };

  const initQuiz = useCallback(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5).slice(0, TOTAL).map(w => {
      const others = cards.filter(x => x.id !== w.id).sort(() => Math.random() - 0.5).slice(0, 3);
      const choices = [...others.map(o => o.meaning), w.meaning].sort(() => Math.random() - 0.5);
      return { word: w.word, answer: w.meaning, choices };
    });
    setQuizData(shuffled); setQIdx(0); setSelected(null); setScore(0); setDone(false);
  }, [cards, TOTAL]);

  useEffect(() => { initQuiz(); }, [initQuiz]);

  const pick = (choice) => {
    if (selected !== null) return;
    const isCorrect = choice === quizData[qIdx].answer;
    setSelected(choice);
    playSound(isCorrect ? "correct" : "wrong");

    const nextScore = isCorrect ? score + 1 : score;
    if (isCorrect) setScore(nextScore);
    
    setTimeout(() => { 
      if (qIdx + 1 >= TOTAL) {
        setDone(true);
        setLastScore(nextScore);
      } else { setQIdx(i => i + 1); setSelected(null); } 
    }, 1200);
  };

  if (done) return (
    <div style={{ padding: "150px 20px", textAlign: "center" }}>
      <h2 style={{ fontSize: "24px", color: C.muted }}>퀴즈 결과</h2>
      <p style={{ fontSize: "60px", fontWeight: 900, color: C.green, margin: "20px 0" }}>{score}/{TOTAL}</p>
      <button onClick={initQuiz} style={{ background: C.accent, border: "none", color: "#fff", padding: "16px 40px", borderRadius: 16, fontWeight: 700 }}>다시 도전하기</button>
    </div>
  );

  const q = quizData[qIdx];
  if (!q) return null;

  return (
    <div style={{ padding: "100px 16px 100px", animation: "fadeIn 0.4s" }}>
      <div style={{ background: C.card, borderRadius: 24, padding: "32px 16px", marginBottom: 24, textAlign: "center", border: `1px solid ${C.border}` }}>
        <h2 style={{ fontSize: "38px", fontWeight: 800, margin: 0 }}>{q.word}</h2>
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        {q.choices.map(c => {
          const isCorrect = c === q.answer;
          const isSelected = c === selected;
          let bColor = C.card, brColor = C.border, tColor = C.text;

          if (selected !== null) {
            if (isCorrect) { bColor = C.green + "22"; brColor = C.green; tColor = C.green; }
            else if (isSelected) { bColor = C.red + "22"; brColor = C.red; tColor = C.red; }
            else { tColor = C.dim; }
          }
          return (
            <button key={c} onClick={() => pick(c)} disabled={selected !== null}
              style={{ background: bColor, border: `1px solid ${brColor}`, borderRadius: 16, padding: "20px", color: tColor, textAlign: "left", fontSize: "16px", fontWeight: isSelected ? 700 : 400, transition: "0.2s" }}>{c}</button>
          );
        })}
      </div>
    </div>
  );
}

// 4. 통계 (Stats)
function StatsScreen({ cards }) {
  return (
    <div style={{ padding: "100px 16px 100px", animation: "fadeIn 0.4s" }}>
      <div style={{ background: C.card, borderRadius: 24, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {cards.map((c, i) => (
          <div key={c.id} style={{ padding: "18px 20px", borderBottom: i === cards.length - 1 ? "none" : `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontWeight: 800, fontSize: "17px", color: c.repetitions > 0 ? C.text : C.dim }}>{c.word}</span>
              <p style={{ fontSize: "12px", color: C.dim, marginTop: 4 }}>{c.pronunciation}</p>
            </div>
            <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "15px", color: c.repetitions > 0 ? C.green : C.dim, fontWeight: 600 }}>{c.meaning}</span>
                {c.repetitions > 0 && <p style={{ fontSize: "10px", color: C.green, marginTop: 4, fontWeight: 800 }}>LEARNED</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── [5] 메인 앱 컴포넌트 (App) ────────────────────────────────────────────────
export default function App() {
  const [cards, setCards] = useState([]);
  const [screen, setScreen] = useState("home");
  const [loading, setLoading] = useState(true);
  const [lastScore, setLastScore] = useState(null);
  const [studySeconds, setStudySeconds] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStudySeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedStreak = localStorage.getItem("word_master_streak") || "0";
    const lastDate = localStorage.getItem("last_study_date");
    const today = getTodayKey();

    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      let newStreak = parseInt(savedStreak);
      if (lastDate === yesterdayStr) newStreak += 1; else newStreak = 1;
      setStreak(newStreak);
      localStorage.setItem("word_master_streak", newStreak.toString());
      localStorage.setItem("last_study_date", today);
    } else {
      setStreak(parseInt(savedStreak));
    }
  }, []);

  useEffect(() => {
    const loadExcel = async () => {
      try {
        const response = await fetch(EXCEL_FILE_PATH);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        if (json.length > 0) {
          const shuffled = seededShuffle(json, getTodayKey()).slice(0, DAILY_COUNT);
          setCards(shuffled.map(w => ({ ...w, id: Math.random().toString(36).substr(2, 9), repetitions: 0 })));
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    loadExcel();
  }, []);

  if (loading) return <div style={{ background: C.bg, color: C.text, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>WORD MASTER...</div>;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "-apple-system, sans-serif" }}>
      <Header screen={screen} />
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        {screen === "home" && <HomeScreen cards={cards} lastScore={lastScore} streak={streak} studySeconds={studySeconds} />}
        {screen === "vocab" && <VocabScreen cards={cards} setCards={setCards} />}
        {screen === "quiz" && <QuizScreen cards={cards} setLastScore={setLastScore} />}
        {screen === "stats" && <StatsScreen cards={cards} />}
        <NavBar screen={screen} setScreen={setScreen} />
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        button:active { transform: scale(0.97); }
      `}</style>
    </div>
  );
}