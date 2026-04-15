import { useEffect, useMemo, useState } from "react";

const colorOptions = ["black", "red", "orange", "yellow", "green", "blue", "purple", "white"];
const shapeOptions = ["square", "circle", "triangle", "star"];
const numberOptions = Array.from({ length: 20 }, (_, i) => i + 1);

const confidenceLevels = ["Low", "Medium", "High"];
const modes = ["Color", "Shape", "Number"];
const tabs = ["Trainer", "Stats", "History", "Leaderboard"];

const APP_STORAGE_KEY = "prediction_trainer_app_data_v8";
const LEADERBOARD_STORAGE_KEY = "prediction_trainer_leaderboard_v3";
const LEADERBOARD_NAME_KEY = "prediction_trainer_name_v3";

const MODE_PRIORITY = {
  Number: 3,
  Color: 2,
  Shape: 1,
};

export default function App() {
  const [activeTab, setActiveTab] = useState("Trainer");
  const [playerName, setPlayerName] = useState("");
  const [mode, setMode] = useState("Color");
  const [target, setTarget] = useState(null);
  const [revealedTarget, setRevealedTarget] = useState(null);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState("");
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [confidence, setConfidence] = useState("Medium");
  const [history, setHistory] = useState([]);
  const [roundStartTime, setRoundStartTime] = useState(null);
  const [lastReactionMs, setLastReactionMs] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const options =
    mode === "Color" ? colorOptions : mode === "Shape" ? shapeOptions : numberOptions;

  useEffect(() => {
    const savedApp = localStorage.getItem(APP_STORAGE_KEY);
    const savedLeaderboard = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    const savedName = localStorage.getItem(LEADERBOARD_NAME_KEY);

    if (savedApp) {
      try {
        const parsed = JSON.parse(savedApp);
        setActiveTab(parsed.activeTab ?? "Trainer");
        setMode(parsed.mode ?? "Color");
        setScore(parsed.score ?? 0);
        setTotal(parsed.total ?? 0);
        setConfidence(parsed.confidence ?? "Medium");
        setHistory(parsed.history ?? []);
        setLastReactionMs(parsed.lastReactionMs ?? null);
      } catch (err) {
        console.error("Failed to load app data:", err);
      }
    }

    if (savedLeaderboard) {
      try {
        setLeaderboard(JSON.parse(savedLeaderboard));
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      }
    }

    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  useEffect(() => {
    const appData = {
      activeTab,
      mode,
      score,
      total,
      confidence,
      history,
      lastReactionMs,
    };

    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(appData));
  }, [activeTab, mode, score, total, confidence, history, lastReactionMs]);

  useEffect(() => {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(leaderboard));
  }, [leaderboard]);

  useEffect(() => {
    localStorage.setItem(LEADERBOARD_NAME_KEY, playerName);
  }, [playerName]);

  const startRound = () => {
    const random = options[Math.floor(Math.random() * options.length)];
    setTarget(random);
    setRevealedTarget(null);
    setSelected(null);
    setResult("");
    setLastReactionMs(null);
    setRoundStartTime(Date.now());
  };

  const guess = (choice) => {
    if (target === null) return;

    const reactionMs = roundStartTime ? Date.now() - roundStartTime : null;
    const correct = choice === target;

    setSelected(choice);
    setRevealedTarget(target);
    setLastReactionMs(reactionMs);
    setResult(correct ? "✅ Correct" : `❌ Wrong (was ${String(target)})`);
    setScore((prev) => (correct ? prev + 1 : prev));
    setTotal((prev) => prev + 1);

    const entry = {
      mode,
      guessed: choice,
      actual: target,
      confidence,
      correct,
      reactionMs,
      timestamp: new Date().toLocaleString(),
    };

    setHistory((prev) => [entry, ...prev]);
    setTarget(null);
    setRoundStartTime(null);
  };

  const clearHistoryOnly = () => {
    localStorage.removeItem(APP_STORAGE_KEY);
    setActiveTab("Trainer");
    setMode("Color");
    setTarget(null);
    setRevealedTarget(null);
    setSelected(null);
    setResult("");
    setScore(0);
    setTotal(0);
    setConfidence("Medium");
    setHistory([]);
    setRoundStartTime(null);
    setLastReactionMs(null);
  };

  const clearLeaderboardOnly = () => {
    localStorage.removeItem(LEADERBOARD_STORAGE_KEY);
    setLeaderboard([]);
  };

  const formatTime = (ms) => {
    if (ms === null || ms === undefined) return "-";
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const overallAccuracy = total > 0 ? Number(((score / total) * 100).toFixed(1)) : 0;

  const getChanceBaseline = () => {
    if (mode === "Shape") return { percent: 25, text: "1 in 4" };
    if (mode === "Color") return { percent: 12.5, text: "1 in 8" };
    return { percent: 5, text: "1 in 20" };
  };

  const baseline = getChanceBaseline();
  const differenceFromChance = Number((overallAccuracy - baseline.percent).toFixed(1));

  const modeStats = useMemo(() => {
    return modes.map((modeName) => {
      const entries = history.filter((entry) => entry.mode === modeName);
      const correct = entries.filter((entry) => entry.correct).length;
      const reactionEntries = entries.filter((entry) => typeof entry.reactionMs === "number");
      const avgReaction =
        reactionEntries.length > 0
          ? Math.round(
              reactionEntries.reduce((sum, entry) => sum + entry.reactionMs, 0) /
                reactionEntries.length
            )
          : null;

      return {
        mode: modeName,
        correct,
        total: entries.length,
        accuracy: entries.length > 0 ? Number(((correct / entries.length) * 100).toFixed(1)) : 0,
        avgReaction,
      };
    });
  }, [history]);

  const confidenceStats = useMemo(() => {
    return confidenceLevels.map((level) => {
      const entries = history.filter((entry) => entry.confidence === level);
      const correct = entries.filter((entry) => entry.correct).length;
      const reactionEntries = entries.filter((entry) => typeof entry.reactionMs === "number");
      const avgReaction =
        reactionEntries.length > 0
          ? Math.round(
              reactionEntries.reduce((sum, entry) => sum + entry.reactionMs, 0) /
                reactionEntries.length
            )
          : null;

      return {
        level,
        correct,
        total: entries.length,
        accuracy: entries.length > 0 ? Number(((correct / entries.length) * 100).toFixed(1)) : 0,
        avgReaction,
      };
    });
  }, [history]);

  const currentModeStat =
    modeStats.find((item) => item.mode === mode) || {
      mode,
      correct: 0,
      total: 0,
      accuracy: 0,
      avgReaction: null,
    };

  const leaderboardThreshold = 100;
  const leaderboardRemaining = Math.max(leaderboardThreshold - currentModeStat.total, 0);
  const leaderboardEligible = currentModeStat.total >= leaderboardThreshold;

  const submitToLeaderboard = () => {
    const trimmedName = playerName.trim();

    if (!trimmedName) {
      alert("Enter a name first.");
      return;
    }

    if (!leaderboardEligible) {
      alert(`You need at least ${leaderboardThreshold} attempts in ${mode} mode to submit.`);
      return;
    }

    const entry = {
      name: trimmedName,
      mode,
      attempts: currentModeStat.total,
      accuracy: currentModeStat.accuracy,
      timestamp: Date.now(),
    };

    setLeaderboard((prev) => {
      const withoutSameNameMode = prev.filter(
        (item) => !(item.name.toLowerCase() === trimmedName.toLowerCase() && item.mode === mode)
      );

      const updated = [...withoutSameNameMode, entry];

      updated.sort((a, b) => {
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        if (b.attempts !== a.attempts) return b.attempts - a.attempts;
        if (MODE_PRIORITY[b.mode] !== MODE_PRIORITY[a.mode]) {
          return MODE_PRIORITY[b.mode] - MODE_PRIORITY[a.mode];
        }
        return a.timestamp - b.timestamp;
      });

      return updated;
    });
  };

  const getTextColor = (color) => {
    if (color === "yellow" || color === "white") return "black";
    return "white";
  };

  const renderShape = (shape) => {
    if (shape === "square") {
      return <div style={{ width: 44, height: 44, backgroundColor: "#1f2937" }} />;
    }

    if (shape === "circle") {
      return (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            backgroundColor: "#1f2937",
          }}
        />
      );
    }

    if (shape === "triangle") {
      return (
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "22px solid transparent",
            borderRight: "22px solid transparent",
            borderBottom: "40px solid #1f2937",
          }}
        />
      );
    }

    if (shape === "star") {
      return <div style={{ fontSize: 38, lineHeight: 1, color: "#1f2937" }}>★</div>;
    }

    return null;
  };

  const getTileBorder = (option) => {
    let border = option === "white" ? "2px solid #9ca3af" : "2px solid #d1d5db";

    if (selected !== null) {
      if (option === revealedTarget) {
        border = "4px solid #22c55e";
      } else if (option === selected) {
        border = "4px solid #ef4444";
      }
    }

    return border;
  };

  const cardStyle = {
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  };

  const statCardStyle = {
    ...cardStyle,
    textAlign: "center",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        fontFamily: "Arial, sans-serif",
        color: "#111827",
        padding: "32px 16px 48px",
      }}
    >
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        <div
          style={{
            ...cardStyle,
            marginBottom: "36px",
            textAlign: "center",
            background: "linear-gradient(135deg, #ffffff, #eef2ff)",
          }}
        >
          <h1 style={{ margin: 0 }}>Prediction Trainer</h1>
          <p style={{ marginTop: "14px", color: "#4b5563" }}>
            Train across colors, shapes, and numbers while tracking confidence, speed, and accuracy.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 18px",
                borderRadius: "999px",
                border: activeTab === tab ? "2px solid #111827" : "1px solid #d1d5db",
                backgroundColor: activeTab === tab ? "#e0e7ff" : "white",
                cursor: "pointer",
                fontWeight: activeTab === tab ? "bold" : "normal",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Trainer" && (
          <div style={{ display: "grid", gap: "20px" }}>
            <div style={{ ...cardStyle, textAlign: "center" }}>
              <h2 style={{ marginTop: 0, marginBottom: "24px" }}>Round Setup</h2>

              <div style={{ display: "grid", gap: "22px", justifyItems: "center" }}>
                <div>
                  <div style={{ fontWeight: "bold", marginBottom: "10px" }}>Mode</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                    {modes.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        style={{
                          minWidth: "90px",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: mode === m ? "2px solid #111827" : "1px solid #d1d5db",
                          backgroundColor: mode === m ? "#ddd6fe" : "white",
                          cursor: "pointer",
                          fontWeight: mode === m ? "bold" : "normal",
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: "bold", marginBottom: "10px" }}>Confidence</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                    {confidenceLevels.map((level) => (
                      <button
                        key={level}
                        onClick={() => setConfidence(level)}
                        style={{
                          minWidth: "90px",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: confidence === level ? "2px solid #111827" : "1px solid #d1d5db",
                          backgroundColor: confidence === level ? "#dbeafe" : "white",
                          cursor: "pointer",
                          fontWeight: confidence === level ? "bold" : "normal",
                        }}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                  <button
                    onClick={startRound}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "10px",
                      border: "none",
                      backgroundColor: "#111827",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Start Round
                  </button>

                  <button
                    onClick={clearHistoryOnly}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      backgroundColor: "white",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    Clear History
                  </button>
                </div>
              </div>
            </div>

            <div style={{ ...cardStyle, textAlign: "center" }}>
              <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Choose Your Answer</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: mode === "Number" ? "repeat(5, 90px)" : "repeat(4, 90px)",
                  justifyContent: "center",
                  gap: "12px",
                }}
              >
                {options.map((option) => (
                  <button
                    key={String(option)}
                    onClick={() => guess(option)}
                    style={{
                      width: "90px",
                      height: "90px",
                      borderRadius: "14px",
                      border: getTileBorder(option),
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: mode === "Color" ? option : "#f9fafb",
                      color: mode === "Color" ? getTextColor(option) : "black",
                      fontWeight: "bold",
                      fontSize: mode === "Number" ? "24px" : "16px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                    }}
                  >
                    {mode === "Color" &&
                      String(option).charAt(0).toUpperCase() + String(option).slice(1)}
                    {mode === "Shape" && renderShape(option)}
                    {mode === "Number" && option}
                  </button>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ textAlign: "center" }}>
                <h3 style={{ marginTop: 0, marginBottom: "8px" }}>Expected by Chance</h3>
                <div style={{ fontSize: "1.15rem", fontWeight: "bold" }}>
                  {baseline.percent}% ({baseline.text})
                </div>
                <div style={{ marginTop: "8px", color: "#4b5563" }}>
                  Difference from chance: {differenceFromChance > 0 ? "+" : ""}
                  {differenceFromChance}%
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ textAlign: "center" }}>
                <h3 style={{ marginTop: 0, marginBottom: "8px" }}>Leaderboard Progress</h3>
                <div style={{ fontSize: "1.15rem", fontWeight: "bold", marginBottom: "8px" }}>
                  {mode}: {currentModeStat.total} / {leaderboardThreshold} attempts
                </div>
                <div style={{ marginBottom: "8px", color: "#4b5563" }}>
                  Current mode accuracy: {currentModeStat.accuracy}%
                </div>

                <div
                  style={{
                    width: "100%",
                    maxWidth: "320px",
                    height: "14px",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "999px",
                    margin: "0 auto 10px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min((currentModeStat.total / leaderboardThreshold) * 100, 100)}%`,
                      height: "100%",
                      backgroundColor: leaderboardEligible ? "#22c55e" : "#60a5fa",
                      borderRadius: "999px",
                    }}
                  />
                </div>

                <div style={{ color: leaderboardEligible ? "#166534" : "#4b5563", fontWeight: "bold" }}>
                  {leaderboardEligible
                    ? "Eligible for leaderboard submission"
                    : `${leaderboardRemaining} more attempts needed`}
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
              }}
            >
              <div style={statCardStyle}>
                <h3 style={{ marginTop: 0 }}>Last Result</h3>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{result || "—"}</div>
              </div>

              <div style={statCardStyle}>
                <h3 style={{ marginTop: 0 }}>Reaction Time</h3>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{formatTime(lastReactionMs)}</div>
              </div>

              <div style={statCardStyle}>
                <h3 style={{ marginTop: 0 }}>Score</h3>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                  {score} / {total}
                </div>
              </div>

              <div style={statCardStyle}>
                <h3 style={{ marginTop: 0 }}>Overall Accuracy</h3>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{overallAccuracy}%</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Stats" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, textAlign: "center" }}>Mode Stats</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  fontWeight: "bold",
                  paddingBottom: "10px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div>Mode</div>
                <div>Accuracy</div>
                <div>Avg Speed</div>
              </div>

              {modeStats.map((stat) => (
                <div
                  key={stat.mode}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    padding: "12px 0",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <div>{stat.mode}</div>
                  <div>
                    {stat.correct} / {stat.total} ({stat.accuracy}%)
                  </div>
                  <div>{formatTime(stat.avgReaction)}</div>
                </div>
              ))}
            </div>

            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, textAlign: "center" }}>Confidence Breakdown</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  fontWeight: "bold",
                  paddingBottom: "10px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div>Confidence</div>
                <div>Accuracy</div>
                <div>Avg Speed</div>
              </div>

              {confidenceStats.map((stat) => (
                <div
                  key={stat.level}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    padding: "12px 0",
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <div>{stat.level}</div>
                  <div>
                    {stat.correct} / {stat.total} ({stat.accuracy}%)
                  </div>
                  <div>{formatTime(stat.avgReaction)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "History" && (
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, textAlign: "center" }}>Session History</h2>

            {history.length === 0 ? (
              <p style={{ color: "#6b7280", textAlign: "center" }}>No rounds logged yet.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <div
                  style={{
                    minWidth: "900px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.2fr",
                    backgroundColor: "#f9fafb",
                    fontWeight: "bold",
                    padding: "12px",
                    borderRadius: "10px",
                    gap: "10px",
                  }}
                >
                  <div>Mode</div>
                  <div>Guessed</div>
                  <div>Actual</div>
                  <div>Confidence</div>
                  <div>Reaction</div>
                  <div>Result</div>
                </div>

                {history.slice(0, 30).map((entry, index) => (
                  <div
                    key={`${entry.timestamp}-${index}`}
                    style={{
                      minWidth: "900px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.2fr",
                      padding: "12px",
                      gap: "10px",
                      borderBottom: "1px solid #f3f4f6",
                      alignItems: "center",
                    }}
                  >
                    <div>{entry.mode}</div>
                    <div style={{ textTransform: "capitalize" }}>{String(entry.guessed)}</div>
                    <div style={{ textTransform: "capitalize" }}>{String(entry.actual)}</div>
                    <div>{entry.confidence}</div>
                    <div>{formatTime(entry.reactionMs)}</div>
                    <div>{entry.correct ? "✅ Correct" : "❌ Wrong"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Leaderboard" && (
          <div style={{ display: "grid", gap: "20px" }}>
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, textAlign: "center" }}>Leaderboard Submission</h2>

              <div style={{ maxWidth: "420px", margin: "0 auto", textAlign: "center" }}>
                <div style={{ marginBottom: "10px", fontWeight: "bold" }}>Name</div>
                <input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter a name"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    marginBottom: "14px",
                    fontSize: "16px",
                  }}
                />

                <div style={{ color: "#4b5563", marginBottom: "14px", lineHeight: 1.6 }}>
                  {mode} progress: {currentModeStat.total} / {leaderboardThreshold} attempts
                  <br />
                  Current accuracy: {currentModeStat.accuracy}%
                  <br />
                  {leaderboardEligible
                    ? "This mode is eligible for leaderboard submission."
                    : `${leaderboardRemaining} more attempts needed before submission.`}
                </div>

                <button
                  onClick={submitToLeaderboard}
                  style={{
                    padding: "12px 20px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#111827",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "bold",
                    marginRight: "10px",
                  }}
                >
                  Submit Current Mode
                </button>

                <button
                  onClick={clearLeaderboardOnly}
                  style={{
                    padding: "12px 20px",
                    borderRadius: "10px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "white",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Clear Leaderboard
                </button>
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, textAlign: "center" }}>Top Rankings</h2>

              {leaderboard.length === 0 ? (
                <p style={{ color: "#6b7280", textAlign: "center" }}>No leaderboard entries yet.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <div
                    style={{
                      minWidth: "700px",
                      display: "grid",
                      gridTemplateColumns: "80px 1.2fr 1fr 1fr 1fr",
                      backgroundColor: "#f9fafb",
                      fontWeight: "bold",
                      padding: "12px",
                      borderRadius: "10px",
                      gap: "10px",
                    }}
                  >
                    <div>Rank</div>
                    <div>Name</div>
                    <div>Mode</div>
                    <div>Accuracy</div>
                    <div>Attempts</div>
                  </div>

                  {leaderboard.map((entry, index) => (
                    <div
                      key={`${entry.name}-${entry.mode}-${index}`}
                      style={{
                        minWidth: "700px",
                        display: "grid",
                        gridTemplateColumns: "80px 1.2fr 1fr 1fr 1fr",
                        padding: "12px",
                        gap: "10px",
                        borderBottom: "1px solid #f3f4f6",
                        alignItems: "center",
                      }}
                    >
                      <div>#{index + 1}</div>
                      <div>{entry.name}</div>
                      <div>{entry.mode}</div>
                      <div>{entry.accuracy}%</div>
                      <div>{entry.attempts}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, textAlign: "center" }}>Leaderboard Rules</h3>
              <div style={{ color: "#4b5563", lineHeight: 1.6 }}>
                Minimum 100 attempts required in the selected mode. Rankings sort by accuracy first,
                then attempts, then difficulty priority: Numbers, Colors, Shapes.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
