import { Hono } from 'hono';
import type { Env, Branch, ApiResponse } from '../types';

const app = new Hono<{ Bindings: Env }>();

// GET /api/branches/list
app.get('/list', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM branches WHERE is_active = 1 ORDER BY branch_id`
    ).all<Branch>();

    return c.json<ApiResponse<Branch[]>>({
      success: true,
      data: results,
    });
  } catch (error: any) {
    return c.json<ApiResponse>({
      success: false,
      error: error.message,
    }, 500);
  }
});

// GET /api/branches/get/:branchId
app.get('/get/:branchId', async (c) => {
  try {
    const branchId = c.req.param('branchId');

    const result = await c.env.DB.prepare(
      `SELECT * FROM branches WHERE branch_id = ?`
    )
      .bind(branchId)
      .first<Branch>();

    if (!result) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Branch not found',
      }, 404);
    }

    return c.json<ApiResponse<Branch>>({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json<ApiResponse>({
      success: false,
      error: error.message,
    }, 500);
  }
});

export default app;
