import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/* HEALTH CHECK */
app.get("/", (req, res) => {
  res.send("Brain Health Assistance Backend Running 🚀");
});

/* ---------------- CHAT + GRAPH ANALYSIS ---------------- */
app.post("/chat", async (req, res) => {
  try {
    const { message, graphData } = req.body;

    const values = graphData?.values || [];
    const notes = graphData?.notes || [];

    let trend = "unknown";
    let avg = 0;
    let min = 0;
    let max = 0;
    let volatility = 0;

    if (values.length > 0) {
      avg = values.reduce((a, b) => a + b, 0) / values.length;
      min = Math.min(...values);
      max = Math.max(...values);

      // volatility (important upgrade)
      for (let i = 1; i < values.length; i++) {
        volatility += Math.abs(values[i] - values[i - 1]);
      }
      volatility = volatility / (values.length - 1 || 1);

      const firstHalf = values.slice(0, Math.floor(values.length / 2));
      const secondHalf = values.slice(Math.floor(values.length / 2));

      const avg1 = firstHalf.reduce((a, b) => a + b, 0) / (firstHalf.length || 1);
      const avg2 = secondHalf.reduce((a, b) => a + b, 0) / (secondHalf.length || 1);

      if (avg2 > avg1 + 0.5) trend = "improving";
      else if (avg2 < avg1 - 0.5) trend = "declining";
      else trend = "stable";
    }

    // detect dips/spikes
    const spikes = [];
    const dips = [];

    values.forEach((v, i) => {
      if (v >= 4.5) spikes.push(`Day ${i + 1}`);
      if (v <= 2) dips.push(`Day ${i + 1}`);
    });

    // include notes summary
    const recentNotes = notes.slice(-5).filter(n => n.trim() !== "").join(" | ");

    const systemPrompt = `
You are a mental wellness AI assistant analyzing mood data.

IMPORTANT:
- Do NOT diagnose medical conditions
- Be supportive and empathetic
- Focus on emotional patterns

DATA ANALYSIS:
- Trend: ${trend}
- Average mood: ${avg.toFixed(2)}
- Max mood: ${max}
- Min mood: ${min}
- Volatility (emotional swings): ${volatility.toFixed(2)}
- Spikes: ${spikes.join(", ") || "none"}
- Dips: ${dips.join(", ") || "none"}
- Recent user notes: ${recentNotes || "no notes provided"}

USER MESSAGE:
${message}

RESPONSE FORMAT:
1. Emotional analysis
2. What pattern you observe (trend + volatility)
3. What may be causing it (based on notes if available)
4. Gentle advice
5. Short motivational closing
`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: "AI error occurred. Please check API key or server logs."
    });
  }
});

/* START SERVER */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});