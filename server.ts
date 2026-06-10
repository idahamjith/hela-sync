import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { 
  singlishToUnicode, 
  legacyToUnicode, 
  unicodeToLegacy, 
  detectEncoding,
  smartPostProcess
} from './src/utils/converter';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for conversion
  app.post("/api/convert", (req, res) => {
    try {
      const { text, mode, smartPostProcess: useSmartProc } = req.body;
      let { activeFont } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      let currentMode = mode || 'auto';
      if (currentMode === 'auto') {
        currentMode = detectEncoding(text);
      }

      let converted = '';
      if (currentMode === 'singlish-to-unicode') {
        converted = singlishToUnicode(text);
      } else if (currentMode === 'legacy-to-unicode') {
        converted = legacyToUnicode(text, activeFont || 'fm-abhaya');
      } else if (currentMode === 'unicode-to-legacy') {
        converted = unicodeToLegacy(text, activeFont || 'fm-abhaya');
      } else {
        converted = text;
      }

      if (useSmartProc !== false && (currentMode === 'singlish-to-unicode' || currentMode === 'legacy-to-unicode' || currentMode === 'auto')) {
        const postProcessed = smartPostProcess(converted);
        return res.json({ result: postProcessed.text, confidence: postProcessed.confidence, mode: currentMode });
      }

      res.json({ result: converted, confidence: 100, mode: currentMode });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // For Express 4
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
