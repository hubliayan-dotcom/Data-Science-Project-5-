import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateRetailData } from './src/lib/data-generator';
import { getForecastAndInventory } from './src/lib/engine';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/data/generate', (req, res) => {
    const data = generateRetailData();
    res.json(data);
  });

  app.post('/api/analysis', (req, res) => {
    const { storeId, itemId, history } = req.body;
    if (!history || !Array.isArray(history)) {
      return res.status(400).json({ error: 'History data is required' });
    }
    const result = getForecastAndInventory(storeId, itemId, history);
    res.json(result);
  });

  // Global Error Handler for JSON requests
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof Error && 'type' in err && err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Payload too large' });
    }
    next(err);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
