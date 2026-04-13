import { useState } from "react";

const colors = [
  "black",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "white",
];

const confidenceLevels = ["Low", "Medium", "High"];

export default function App() {
  const [target, setTarget] = useState(null);
  const [result, setResult] = useState("");
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [confidence, setConfidence] = useState("Medium");
  const [lastConfidence, setLastConfidence] = useState("");
  const [selected, setSelected] = useState(null);

  const startRound = () => {
    const random = colors[Math.floor(Math.random() * colors.length)];
    setTarget(random);
    setResult("");
    setSelected(null);
  };

  const guess = (choice) => {
    if (!target) return;

    setSelected(choice);

    const correct = choice === target;

    setResult(correct ? "✅ Correct" : `❌ Wrong (was ${target})`);
    setScore((prev) => (correct ? prev + 1 : prev));
    setTotal((prev) => prev + 1);
    setLastConfidence(confidence);
    setTarget(null);
  };

  const getTextColor = (color) => {
    // make text readable
    if (color === "yellow" || color === "white") return "black";
    return "white";
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px", fontFamily: "Arial" }}>
      <h1>Prediction Trainer</h1>

      {/* Confidence */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Select Confidence</h3>
        {confidenceLevels.map((level) => (
          <button
            key={level}
            onClick={() => setConfidence(level)}
            style={{
              margin: "5px",
              padding: "10px 16px",
              border: confidence === level ? "2px solid black" : "1px solid gray",
              backgroundColor: confidence === level ? "#e0e0e0" : "white",
              cursor: "pointer",
            }}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Start */}
      <button onClick={startRound} style={{ padding: "10px 20px", cursor: "pointer" }}>
        Start Round
      </button>

      {/* Color Buttons */}
      <div style={{ marginTop: "20px" }}>
        {colors.map((color) => {
          let border = "2px solid transparent";

          if (selected) {
            if (color === target) {
              border = "4px solid limegreen"; // correct
            } else if (color === selected) {
              border = "4px solid red"; // wrong guess
            }
          }

          return (
            <button
              key={color}
              onClick={() => guess(color)}
              style={{
                margin: "8px",
                padding: "20px",
                width: "80px",
                height: "80px",
                backgroundColor: color,
                color: getTextColor(color),
                border: border,
                cursor: "pointer",
                textTransform: "capitalize",
                fontWeight: "bold",
              }}
            >
              {color}
            </button>
          );
        })}
      </div>

      {/* Result */}
      <h2>{result}</h2>
      {lastConfidence && <h3>Confidence Used: {lastConfidence}</h3>}

      {/* Score */}
      <h3>
        Score: {score} / {total}
      </h3>
    </div>
  );
}