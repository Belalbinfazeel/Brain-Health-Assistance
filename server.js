import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 CHECK API KEY
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in .env");
  process.exit(1);
}

// 🔥 INIT GEMINI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ USE WORKING MODEL
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview"
});

// 💬 CHAT API
app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.json({ reply: "Please type something 🙂" });
    }

    // 🧠 SMART PROMPT
    const prompt = `
You are a calm and supportive mental health assistant.
- Be friendly and empathetic
- Keep replies short (2-4 lines)
- Give helpful suggestions
- Speak like a human, not a robot

User: ${message}
`;

    // 🔥 GENERATE RESPONSE
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("User:", message);
    console.log("AI:", text);

    res.json({
      reply: text || "I'm here for you 💙"
    });

  } catch (err) {
    console.error("❌ ERROR:", err);

    res.status(500).json({
      reply: "⚠️ AI error occurred. Check API key or model"
    });
  }
});

// 🚀 START SERVER
app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});