import { Hono } from 'hono';
import type { Env, Expense, ApiResponse } from '../types';

const app = new Hono<{ Bindings: Env }>();

// GET /api/expenses/list?branchId=1010&month=10&year=2024
app.get('/list', async (c) => {
  try {
    const branchId = c.req.query('branchId');
    const month = c.req.query('month');
    const year = c.req.query('year');

    if (!branchId) {
      return c.json<ApiResponse>({
        success: false,
        error: 'branchId is required',
      }, 400);
    }

    // Calculate date range
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth();
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth, 1).getTime();
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59).getTime();

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM expenses
       WHERE branch_id = ?
       AND date >= ?
       AND date <= ?
       ORDER BY date DESC`
    )
      .bind(branchId, startOfMonth, endOfMonth)
      .all<Expense>();

    return c.json<ApiResponse<Expense[]>>({
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

// POST /api/expenses/create
app.post('/create', async (c) => {
  try {
    const body = await c.req.json();
    const {
      title,
      amount,
      category,
      description,
      date,
      branchId,
      branchName,
    } = body;

    // Validation
    if (!title || !amount || !category || !date || !branchId || !branchName) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Missing required fields',
      }, 400);
    }

    // Default user_id
    const userId = 'default-user-id';

    const result = await c.env.DB.prepare(
      `INSERT INTO expenses (
        title, amount, category, description, date,
        user_id, branch_id, branch_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    )
      .bind(
        title,
        amount,
        category,
        description || null,
        date,
        userId,
        branchId,
        branchName
      )
      .first<Expense>();

    return c.json<ApiResponse<Expense>>({
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

// PUT /api/expenses/update/:id
app.put('/update/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const {
      title,
      amount,
      category,
      description,
      date,
    } = body;

    const result = await c.env.DB.prepare(
      `UPDATE expenses
       SET title = ?, amount = ?, category = ?,
           description = ?, date = ?
       WHERE id = ?
       RETURNING *`
    )
      .bind(
        title,
        amount,
        category,
        description || null,
        date,
        id
      )
      .first<Expense>();

    if (!result) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Expense not found',
      }, 404);
    }

    return c.json<ApiResponse<Expense>>({
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

// DELETE /api/expenses/delete/:id
app.delete('/delete/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const result = await c.env.DB.prepare(
      `DELETE FROM expenses WHERE id = ? RETURNING id`
    )
      .bind(id)
      .first();

    if (!result) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Expense not found',
      }, 404);
    }

    return c.json<ApiResponse>({
      success: true,
      data: { id },
    });
  } catch (error: any) {
    return c.json<ApiResponse>({
      success: false,
      error: error.message,
    }, 500);
  }
});

export default app;
