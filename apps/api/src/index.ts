import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import healthRouter from './routes/health';

const app = express();

// ─── Security & Parsing Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.WEB_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ─── Static Uploads ──────────────────────────────────────────────────────────
app.use('/uploads', express.static(env.UPLOAD_DIR));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);

// Phase 1: Auth routes will be added here
// app.use('/api/auth', authRouter);

// Phase 2: Profile routes will be added here
// app.use('/api/profile', profileRouter);

// Phase 3: Customer routes will be added here
// app.use('/api/customers', customersRouter);

// Phase 4: Items + Invoice routes will be added here
// app.use('/api/items', itemsRouter);
// app.use('/api/invoices', invoicesRouter);

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  app.listen(env.PORT, () => {
    console.info(`⚡ API running on http://localhost:${env.PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
