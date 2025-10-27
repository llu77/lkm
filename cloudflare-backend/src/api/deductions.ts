import { Hono } from 'hono';
import type { Env, ApiResponse } from '../types';

const app = new Hono<{ Bindings: Env }>();

// GET /api/deductions/list?employeeId=xxx&year=2024&month=10
app.get('/list', async (c) => {
  try {
    const employeeId = c.req.query('employeeId');
    const year = c.req.query('year');
    const month = c.req.query('month');

    let query = `SELECT * FROM deductions WHERE 1=1`;
    const bindings: any[] = [];

    if (employeeId) {
      query += ` AND employee_id = ?`;
      bindings.push(employeeId);
    }

    if (year) {
      query += ` AND year = ?`;
      bindings.push(parseInt(year));
    }

    if (month) {
      query += ` AND month = ?`;
      bindings.push(parseInt(month));
    }

    query += ` ORDER BY created_at DESC`;

    const { results } = await c.env.DB.prepare(query)
      .bind(...bindings)
      .all();

    return c.json<ApiResponse>({
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

// POST /api/deductions/create
app.post('/create', async (c) => {
  try {
    const body = await c.req.json();
    const {
      branchId,
      branchName,
      employeeId,
      employeeName,
      amount,
      month,
      year,
      reason,
      description,
    } = body;

    if (!branchId || !employeeId || !amount || !month || !year || !reason) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Missing required fields',
      }, 400);
    }

    const userId = 'default-user-id';

    const result = await c.env.DB.prepare(
      `INSERT INTO deductions (
        branch_id, branch_name, employee_id, employee_name,
        amount, month, year, reason, description, recorded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    )
      .bind(
        branchId,
        branchName,
        employeeId,
        employeeName,
        amount,
        month,
        year,
        reason,
        description || null,
        userId
      )
      .first();

    return c.json<ApiResponse>({
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

// DELETE /api/deductions/delete/:id
app.delete('/delete/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const result = await c.env.DB.prepare(
      `DELETE FROM deductions WHERE id = ? RETURNING id`
    )
      .bind(id)
      .first();

    if (!result) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Deduction not found',
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
