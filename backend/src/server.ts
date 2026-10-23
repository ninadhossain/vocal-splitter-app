import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import uploadRouter from './routes/upload';
import jobsRouter from './routes/jobs';
import stemsRouter from './routes/stems';
import { STEMS_DIR, UPLOADS_DIR } from './config/storage';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: allowedOrigin === '*' ? '*' : [allowedOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'x-api-token', 'x-openai-key'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'AI Audio Stem Separator Backend API Gateway',
    version: '1.0.0',
    uploadsDir: UPLOADS_DIR,
    stemsDir: STEMS_DIR,
  });
});

// Mount Routes
app.use('/api/upload', uploadRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/stems', stemsRouter);

// Error Handling Middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

async function bootstrap() {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Vocal Splitter API Gateway running at: http://localhost:${PORT}`);
    console.log(`📡 SSE Stream: http://localhost:${PORT}/api/jobs/:id/events`);
    console.log(`💾 Stems Directory: ${STEMS_DIR}`);
    console.log(`====================================================`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use by another process.`);
      console.error(`👉 Run this in PowerShell to release the port:`);
      console.error(`   Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\n`);
      process.exit(1);
    } else {
      console.error('[Server Error]', err);
    }
  });
}

bootstrap().catch((err) => {
  console.error('[Bootstrap Error]', err);
});

export default app;
