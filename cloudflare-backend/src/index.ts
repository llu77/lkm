import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';

// Import API routes
import revenuesRouter from './api/revenues';
import employeesRouter from './api/employees';
import expensesRouter from './api/expenses';
import branchesRouter from './api/branches';
import advancesRouter from './api/advances';
import deductionsRouter from './api/deductions';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('/*', cors({
  origin: (origin) => {
    // Allow localhost and Cloudflare Pages
    if (
      origin.includes('localhost') ||
      origin.includes('.pages.dev') ||
      origin.includes('127.0.0.1')
    ) {
      return origin;
    }
    return 'https://lkm.pages.dev'; // Default origin
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'LKM API is running',
    timestamp: Date.now(),
    environment: c.env.ENVIRONMENT,
  });
});

// API Routes
app.route('/api/revenues', revenuesRouter);
app.route('/api/employees', employeesRouter);
app.route('/api/expenses', expensesRouter);
app.route('/api/branches', branchesRouter);
app.route('/api/advances', advancesRouter);
app.route('/api/deductions', deductionsRouter);

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: 'Not Found',
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    success: false,
    error: err.message || 'Internal Server Error',
  }, 500);
});

export default app;
