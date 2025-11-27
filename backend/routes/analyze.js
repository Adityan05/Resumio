const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const axios = require("axios");
const FormData = require("form-data");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const prisma = require("../lib/prisma");
const authenticateToken = require("../middleware/auth");
const {
  HISTORY_LIMIT,
  MAX_UPLOAD_SIZE_BYTES,
  MIN_RESUME_KEYWORD_MATCHES,
  RESUME_KEYWORDS,
  NON_RESUME_HINTS,
} = require("../utils/constants");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Store active progress sessions
const progressSessions = new Map();

// SSE endpoint for progress updates
router.get('/progress/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  const token = req.query.token || req.headers.authorization?.split(' ')[1];
  
  // Simple token validation for SSE
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Store the response object for this session
  progressSessions.set(sessionId, res);

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ phase: 'connected', progress: 0, message: 'Connected' })}\n\n`);

  // Clean up on client disconnect
  req.on('close', () => {
    progressSessions.delete(sessionId);
  });
});

// Helper function to send progress updates
const sendProgress = (sessionId, phase, progress, message) => {
  const res = progressSessions.get(sessionId);
  if (res) {
    res.write(`data: ${JSON.stringify({ phase, progress, message })}\n\n`);
  }
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const deleteFileSafe = async (targetPath) => {
  if (!targetPath) return;
  try {
    await fs.promises.unlink(targetPath);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error(`Failed to delete temp file ${targetPath}`, err.message);
    }
  }
};

const parsePdfBuffer = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const totalPages =
      result?.total ??
      result?.pages?.length ??
      (Array.isArray(result?.partial) ? result.partial.length : 0) ??
      0;
    return {
      text: result?.text || "",
      numpages: totalPages,
    };
  } finally {
    await parser.destroy();
  }
};

const extractJson = (payload) => {
  if (!payload) return null;
  const first = payload.indexOf("{");
  const last = payload.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) return null;
  return payload.slice(first, last + 1);
};

const sanitizeJson = (payload) => {
  if (!payload) return payload;
  return payload
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\\(?!["\\/bfnrtu0-9])/g, "\\\\");
};

const estimatePdfPages = (buffer) => {
  try {
    const content = buffer.toString("latin1");
    const matches = content.match(/\/Type\s*\/Page\b/gi);
    return matches ? matches.length : 0;
  } catch (err) {
    console.error("Failed to estimate PDF page count", err.message);
    return 0;
  }
};

const validateResumeContent = (text) => {
  if (!text) {
    return {
      isValid: false,
      message: "Please upload a proper resume PDF so we can analyze it.",
    };
  }

  const normalized = text.toLowerCase();
  const hint = NON_RESUME_HINTS.find(({ keyword }) =>
    normalized.includes(keyword)
  );
  if (hint) {
    return { isValid: false, message: hint.message };
  }

  const keywordHits = RESUME_KEYWORDS.reduce(
    (count, keyword) => count + (normalized.includes(keyword) ? 1 : 0),
    0
  );

  if (keywordHits < MIN_RESUME_KEYWORD_MATCHES) {
    return {
      isValid: false,
      message:
        "Please upload a proper resume. We could not find typical resume sections like Education or Experience.",
    };
  }

  return { isValid: true };
};

router.post(
  "/",
  authenticateToken,
  upload.single("resume"),
  async (req, res) => {
    let filePath;
    const sessionId = req.headers['x-session-id'] || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      if (req.file.size > MAX_UPLOAD_SIZE_BYTES) {
        await deleteFileSafe(req.file.path);
        return res.status(400).json({ error: "File exceeds 5MB limit." });
      }

      if (req.file.mimetype !== "application/pdf") {
        await deleteFileSafe(req.file.path);
        return res
          .status(400)
          .json({ error: "Only PDF resumes are supported." });
      }

      filePath = req.file.path;
      const dataBuffer = fs.readFileSync(filePath);

      // Send progress: Starting PDF parsing
      sendProgress(sessionId, 'parsing', 20, 'Parsing PDF content...');

      // 1. Try to parse text
      let text = "";
      let numpages = 0;
      try {
        const data = await parsePdfBuffer(dataBuffer);
        text = data.text;
        numpages = data.numpages;
        sendProgress(sessionId, 'parsing', 35, 'PDF parsing complete');
      } catch (e) {
        console.error("PDF Parse Error", e.message);
        sendProgress(sessionId, 'parsing', 35, 'PDF parsing failed, continuing...');
      }

      if (!numpages) {
        numpages = estimatePdfPages(dataBuffer);
      }

      // Check page count
      if (numpages > 2) {
        await deleteFileSafe(filePath);
        return res
          .status(400)
          .json({ error: "Uploaded PDF has more than 2 pages." });
      }

      // 2. If text is insufficient, use OCR
      if (!text || text.trim().length < 50) {
        try {
          sendProgress(sessionId, 'ocr', 45, 'Text insufficient, sending to OCR backend...');
          console.log("Text insufficient, attempting OCR...");
          const formData = new FormData();
          formData.append("file", fs.createReadStream(filePath));

          const ocrUrl = process.env.OCR_API_URL || "http://localhost:8000/ocr";
          const ocrResponse = await axios.post(ocrUrl, formData, {
            headers: {
              ...formData.getHeaders(),
            },
          });

          if (ocrResponse.data && ocrResponse.data.text) {
            text = ocrResponse.data.text;
            sendProgress(sessionId, 'ocr', 60, 'OCR processing complete');
            console.log("OCR Success, extracted text length:", text.length);
          } else {
            sendProgress(sessionId, 'ocr', 60, 'OCR completed with no additional text');
          }
        } catch (e) {
          console.error("OCR Error:", e.message);
          sendProgress(sessionId, 'ocr', 60, 'OCR failed, continuing with existing text...');
        }
      } else {
        sendProgress(sessionId, 'parsing', 60, 'Sufficient text extracted, skipping OCR');
      }

      if (!text || !text.trim()) {
        await deleteFileSafe(filePath);
        return res
          .status(400)
          .json({ error: "Could not extract text from resume." });
      }

      const resumeCheck = validateResumeContent(text);
      if (!resumeCheck.isValid) {
        await deleteFileSafe(filePath);
        return res.status(400).json({ error: resumeCheck.message });
      }

      // 3. Analyze with Gemini
      sendProgress(sessionId, 'ai', 70, 'Starting AI analysis...');
      
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0,
          topK: 1,
          topP: 0.1,
        },
      });

      const prompt = `
      You are an expert Resume Analyzer (ATS). 
      Use a deterministic rubric so identical resumes always produce identical scores.
      Evaluate each section independently before assigning the overall score.
      Return ONLY a valid JSON object with the following structure (no markdown fences):
      {
        "atsScore": number (0-100) derived as the average of the section scores mapped as High=90, Medium=70, Low=50 (round to the nearest whole number),
        "sectionScores": {
            "Education": "High" | "Medium" | "Low",
            "Experience": "High" | "Medium" | "Low",
            "Skills": "High" | "Medium" | "Low",
            "Projects": "High" | "Medium" | "Low"
        },
        "missingInfo": ["string", "string"],
        "corrections": ["string", "string"]
      }
      Missing info and corrections should reflect gaps that would improve ATS performance.
      Resume Text (do not rephrase or summarize, just analyze):
      ${text}
    `;

      sendProgress(sessionId, 'ai', 80, 'Generating AI insights...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const textResponse = response.text();
      sendProgress(sessionId, 'ai', 90, 'AI analysis complete');

      console.log("Gemini Response:", textResponse.substring(0, 100) + "...");

      // Clean up JSON markdown if present (just in case)
      const jsonStr = (
        extractJson(textResponse) ||
        textResponse.replace(/```json/g, "").replace(/```/g, "")
      ).trim();

      let analysisData;
      try {
        analysisData = JSON.parse(jsonStr);
      } catch (e) {
        try {
          analysisData = JSON.parse(sanitizeJson(jsonStr));
        } catch (retryError) {
          console.error("JSON Parse Error", retryError);
          console.error("Raw Response:", textResponse);
          await deleteFileSafe(filePath);
          return res
            .status(500)
            .json({
              error:
                "Failed to parse AI response. The model might have refused the request.",
            });
        }
      }

      // 4. Save to DB + enforce rolling history (max 50 per user)
      const userId = req.user.userId;
      await prisma.$transaction(async (tx) => {
        const resume = await tx.resume.create({
          data: {
            userId: userId,
            fileName: req.file.originalname,
            filePath: filePath,
          },
        });

        await tx.analysis.create({
          data: {
            resumeId: resume.id,
            atsScore: analysisData.atsScore,
            details: analysisData,
          },
        });

        const excess = await tx.resume.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          skip: HISTORY_LIMIT,
          select: { id: true },
        });

        if (excess.length) {
          const excessIds = excess.map((entry) => entry.id);
          await tx.analysis.deleteMany({
            where: { resumeId: { in: excessIds } },
          });
          await tx.resume.deleteMany({
            where: { id: { in: excessIds } },
          });
        }
        });

        sendProgress(sessionId, 'complete', 100, 'Analysis complete!');
        
        // Close the SSE connection after a short delay
        setTimeout(() => {
          const progressRes = progressSessions.get(sessionId);
          if (progressRes) {
            progressRes.end();
            progressSessions.delete(sessionId);
          }
        }, 1000);

        res.json({ ...analysisData, sessionId });

        await deleteFileSafe(filePath);
    } catch (error) {
      console.error(error);
      await deleteFileSafe(filePath || (req.file && req.file.path));
      const message =
        error.message === "File too large"
          ? "File exceeds the allowed size limit."
          : error.message || "Analysis failed";
      res.status(500).json({ error: message });
    }
  }
);

module.exports = router;
