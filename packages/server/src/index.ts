import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './router.js';
import { createContext } from './trpc.js';
import { runMigrations } from './db.js';
import { seedDatabase } from './seed.js';
import { verifyToken } from './auth.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(dirname, '..');
const uploadsDir = path.join(serverRoot, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// 初始化資料庫
runMigrations();
seedDatabase();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));

// 健康檢查
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'pangcheng-erp', time: new Date().toISOString() });
});

// 檔案上傳（採購憑證、施工照片、廠商文件等）
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

app.post('/api/upload', upload.single('file'), (req, res) => {
  const token = req.cookies?.token as string | undefined;
  if (!token || !verifyToken(token)) {
    res.status(401).json({ error: '請先登入' });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: '未收到檔案' });
    return;
  }
  res.json({
    url: `/uploads/${req.file.filename}`,
    name: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
  });
});

app.use('/uploads', express.static(uploadsDir));

// tRPC API
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// 正式環境：提供已建置的前端
const webDist = path.resolve(serverRoot, '../web/dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[server] 磐承 ERP 後端已啟動： http://localhost:${PORT}`);
});
