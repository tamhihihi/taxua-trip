import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { consultWithGeminiAI, generateLocalRuleBasedConsultation, TripConsultRequest } from './src/server/aiAdvisor.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // API Endpoints for AI Advisor
  app.post('/api/ai/consult', async (req, res) => {
    try {
      const consultReq: TripConsultRequest = req.body;
      if (!consultReq.checkIn || !consultReq.checkOut) {
        return res.status(400).json({ error: 'Missing checkIn or checkOut date' });
      }

      const result = await consultWithGeminiAI(consultReq);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('[API /api/ai/consult] Error:', err);
      // Graceful local fallback so user experience is never broken
      const fallback = generateLocalRuleBasedConsultation(req.body);
      return res.json({ success: true, data: fallback, fallback: true });
    }
  });

  // Fast quick quote endpoint
  app.post('/api/ai/quick-quote', (req, res) => {
    try {
      const quote = generateLocalRuleBasedConsultation(req.body);
      return res.json({ success: true, data: quote });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString()
    });
  });

  if (!isProd) {
    // Development mode with Vite Middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: Number(port)
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve static files from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`[Tà Xùa Trip Server] Server listening on http://0.0.0.0:${port} (Env: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Tà Xùa Trip Server] Startup failure:', err);
  process.exit(1);
});
