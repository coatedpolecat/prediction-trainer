import { useEffect, useMemo, useState } from "react";
import "./App.css";

const SHAPES = ["■", "●", "▲", "★"];
const COLORS = [
  { name: "Black", value: "#111111" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#facc15" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "White", value: "#f8fafc" },
];

const STORAGE_KEY = "decision-lab-history-v1";

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function nextPromptGap() {
  return 3 + Math.floor(Math.random() * 3); // 3, 4, or 5
}

export default function App() {
  const [mode, setMode] = useState("shapes");
  const [participant, setParticipant] = useState("");
  const [history, setHistory] = useState([]);
  const [target, setTarget] = useState(randomItem(SHAPES));
  const [selected, setSelected] = useState(null);
  const [trialStart, setTrialStart] = useState(Date.now());
  const [showReflection, setShowReflection] = useState(false);
  const [result, setResult] = useState(null);
  const [nextReflectionAt, setNextReflectionAt] = useState(3);

  const [reflection, setReflection] = useState({
    source: "",
    bodyCue: "",
    conflict: "",
    changedMind: "",
    clarity: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    resetTrial(mode);
  }, [mode]);

  const options = mode === "shapes" ? SHAPES : COLORS;

  function resetTrial(newMode = mode) {
    const newOptions = newMode === "shapes" ? SHAPES : COLORS;
    setTarget(randomItem(newOptions));
    setSelected(null);
    setResult(null);
    setShowReflection(false);
    setReflection({
      source: "",
      bodyCue: "",
      conflict: "",
      changedMind: "",
      clarity: "",
    });
    setTrialStart(Date.now());
  }

  function handleSelect(choice) {
    const responseTime = Date.now() - trialStart;
    setSelected({ choice, responseTime });

    const attemptNumber = history.length + 1;

    if (attemptNumber >= nextReflectionAt) {
      setShowReflection(true);
    } else {
      saveTrial(choice, responseTime, null);
    }
  }

  function saveTrial(choice, responseTime, reflectionData) {
    const correct =
      mode === "shapes"
        ? choice === target
        : choice.name === target.name;

    const entry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      participant: participant.trim() || "Unnamed",
      mode,
      target: mode === "shapes" ? target : target.name,
      selected: mode === "shapes" ? choice : choice.name,
      correct,
      responseTime,
      reflection: reflectionData,
    };

    setHistory((prev) => [...prev, entry]);
    setResult(entry);

    if (reflectionData) {
      setNextReflectionAt(history.length + 1 + nextPromptGap());
    }
  }

  function submitReflection() {
    saveTrial(selected.choice, selected.responseTime, reflection);
    setShowReflection(false);
  }

  const stats = useMemo(() => {
    const filtered = history.filter((h) => h.mode === mode);
    const correct = filtered.filter((h) => h.correct).length;
    const accuracy = filtered.length ? ((correct / filtered.length) * 100).toFixed(1) : 0;

    const bySource = {};
    filtered.forEach((h) => {
      const key = h.reflection?.source || "No reflection";
      if (!bySource[key]) bySource[key] = { total: 0, correct: 0 };
      bySource[key].total++;
      if (h.correct) bySource[key].correct++;
    });

    return { total: filtered.length, correct, accuracy, bySource };
  }, [history, mode]);

  function clearHistory() {
    if (confirm("Clear all saved history?")) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
      setNextReflectionAt(3);
      resetTrial();
    }
  }

  return (
    <main className="app">
      <section className="card hero">
        <h1>Decision Lab</h1>
        <p>Map the gap between knowing, guessing, and actual results.</p>

        <input
          className="nameInput"
          placeholder="Participant name"
          value={participant}
          onChange={(e) => setParticipant(e.target.value)}
        />

        <div className="tabs">
          <button className={mode === "shapes" ? "active" : ""} onClick={() => setMode("shapes")}>
            Shapes
          </button>
          <button className={mode === "colors" ? "active" : ""} onClick={() => setMode("colors")}>
            Colors
          </button>
        </div>
      </section>

      <section className="card">
        {!result && !showReflection && (
          <>
            <h2>Choose what feels like the target</h2>
            <p className="muted">
              Baseline chance: {mode === "shapes" ? "1 in 4 / 25%" : "1 in 8 / 12.5%"}
            </p>

            <div className={mode === "shapes" ? "shapeGrid" : "colorGrid"}>
              {options.map((option) => (
                <button
                  key={mode === "shapes" ? option : option.name}
                  className={mode === "shapes" ? "shapeButton" : "colorButton"}
                  onClick={() => handleSelect(option)}
                >
                  {mode === "shapes" ? (
                    <span>{option}</span>
                  ) : (
                    <>
                      <span
                        className="swatch"
                        style={{ background: option.value }}
                      />
                      {option.name}
                    </>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {showReflection && (
          <div className="reflection">
            <h2>Before the result… how did you get your answer?</h2>

            <select value={reflection.source} onChange={(e) => setReflection({ ...reflection, source: e.target.value })}>
              <option value="">Select one</option>
              <option>Visual flash / image</option>
              <option>Body feeling</option>
              <option>Just knew</option>
              <option>Logical elimination</option>
              <option>Random guess</option>
              <option>Two options competed</option>
              <option>Changed at the last second</option>
            </select>

            <select value={reflection.bodyCue} onChange={(e) => setReflection({ ...reflection, bodyCue: e.target.value })}>
              <option value="">Any body cue?</option>
              <option>None</option>
              <option>Forehead / third-eye area</option>
              <option>Eyes</option>
              <option>Throat</option>
              <option>Chest / heart</option>
              <option>Solar plexus / gut</option>
              <option>Hands</option>
              <option>Whole body</option>
            </select>

            <select value={reflection.conflict} onChange={(e) => setReflection({ ...reflection, conflict: e.target.value })}>
              <option value="">Did another option compete?</option>
              <option>No</option>
              <option>Yes, but this felt stronger</option>
              <option>Yes, and I’m unsure which came first</option>
            </select>

            <select value={reflection.clarity} onChange={(e) => setReflection({ ...reflection, clarity: e.target.value })}>
              <option value="">How clear did it feel?</option>
              <option>Very clear</option>
              <option>Somewhat clear</option>
              <option>Noisy / uncertain</option>
              <option>Pure guess</option>
            </select>

            <button className="primary" onClick={submitReflection} disabled={!reflection.source}>
              Reveal Result
            </button>
          </div>
        )}

        {result && (
          <div className={result.correct ? "result correct" : "result wrong"}>
            <h2>{result.correct ? "Correct" : "Incorrect"}</h2>
            <p>
              Target: <strong>{result.target}</strong>
            </p>
            <p>
              You chose: <strong>{result.selected}</strong>
            </p>
            <p className="muted">Response time: {(result.responseTime / 1000).toFixed(2)}s</p>
            <button className="primary" onClick={() => resetTrial()}>
              Next Attempt
            </button>
          </div>
        )}
      </section>

      <section className="card stats">
        <h2>{mode === "shapes" ? "Shape" : "Color"} Stats</h2>
        <div className="statRow">
          <span>Total</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="statRow">
          <span>Correct</span>
          <strong>{stats.correct}</strong>
        </div>
        <div className="statRow">
          <span>Accuracy</span>
          <strong>{stats.accuracy}%</strong>
        </div>

        <h3>Accuracy by answer-source</h3>
        {Object.entries(stats.bySource).map(([source, data]) => (
          <div className="sourceRow" key={source}>
            <span>{source}</span>
            <strong>
              {data.correct}/{data.total} — {((data.correct / data.total) * 100).toFixed(1)}%
            </strong>
          </div>
        ))}

        <button className="danger" onClick={clearHistory}>
          Clear History
        </button>
      </section>
    </main>
  );
}
