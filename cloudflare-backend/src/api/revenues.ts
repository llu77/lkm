import { Hono } from 'hono';
import type { Env, Revenue, ApiResponse } from '../types';

const app = new Hono<{ Bindings: Env }>();

// GET /api/revenues/list?branchId=1010&month=10&year=2024
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
      `SELECT * FROM revenues
       WHERE branch_id = ?
       AND date >= ?
       AND date <= ?
       ORDER BY date DESC`
    )
      .bind(branchId, startOfMonth, endOfMonth)
      .all<Revenue>();

    return c.json<ApiResponse<Revenue[]>>({
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

// GET /api/revenues/stats?branchId=1010
app.get('/stats', async (c) => {
  try {
    const branchId = c.req.query('branchId');

    if (!branchId) {
      return c.json<ApiResponse>({
        success: false,
        error: 'branchId is required',
      }, 400);
    }

    const { results } = await c.env.DB.prepare(
      `SELECT
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(cash), 0) as total_cash,
        COALESCE(SUM(network), 0) as total_network,
        COALESCE(SUM(budget), 0) as total_budget
       FROM revenues
       WHERE branch_id = ?`
    )
      .bind(branchId)
      .all();

    const stats = results[0] || {
      count: 0,
      total_revenue: 0,
      total_cash: 0,
      total_network: 0,
      total_budget: 0,
    };

    // Current month stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

    const { results: currentMonthResults } = await c.env.DB.prepare(
      `SELECT COALESCE(SUM(total), 0) as current_month_total
       FROM revenues
       WHERE branch_id = ?
       AND date >= ?
       AND date <= ?`
    )
      .bind(branchId, startOfMonth, endOfMonth)
      .all();

    const currentMonthTotal = currentMonthResults[0]?.current_month_total || 0;

    return c.json<ApiResponse>({
      success: true,
      data: {
        ...stats,
        currentMonthTotal,
      },
    });
  } catch (error: any) {
    return c.json<ApiResponse>({
      success: false,
      error: error.message,
    }, 500);
  }
});

// POST /api/revenues/create
app.post('/create', async (c) => {
  try {
    const body = await c.req.json();
    const {
      date,
      cash,
      network,
      budget,
      branchId,
      branchName,
      employees,
      mismatchReason,
    } = body;

    // Validation
    if (!date || !branchId || !branchName) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Missing required fields',
      }, 400);
    }

    // Calculate total (cash + network)
    const total = (cash || 0) + (network || 0);
    const calculatedTotal = total;
    const isMatched = !mismatchReason;

    // For now, use a default user_id (in real app, get from auth)
    const userId = 'default-user-id';

    // Convert employees array to JSON string
    const employeesJson = employees ? JSON.stringify(employees) : null;

    const result = await c.env.DB.prepare(
      `INSERT INTO revenues (
        date, cash, network, budget, total, calculated_total,
        is_matched, mismatch_reason, user_id, branch_id, branch_name,
        employees, is_approved_for_bonus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    )
      .bind(
        date,
        cash || 0,
        network || 0,
        budget || 0,
        total,
        calculatedTotal,
        isMatched ? 1 : 0,
        mismatchReason || null,
        userId,
        branchId,
        branchName,
        employeesJson,
        0
      )
      .first<Revenue>();

    return c.json<ApiResponse<Revenue>>({
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

// PUT /api/revenues/update/:id
app.put('/update/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const {
      date,
      cash,
      network,
      budget,
      employees,
      mismatchReason,
    } = body;

    // Calculate total
    const total = (cash || 0) + (network || 0);
    const calculatedTotal = total;
    const isMatched = !mismatchReason;
    const employeesJson = employees ? JSON.stringify(employees) : null;

    const result = await c.env.DB.prepare(
      `UPDATE revenues
       SET date = ?, cash = ?, network = ?, budget = ?,
           total = ?, calculated_total = ?, is_matched = ?,
           mismatch_reason = ?, employees = ?
       WHERE id = ?
       RETURNING *`
    )
      .bind(
        date,
        cash || 0,
        network || 0,
        budget || 0,
        total,
        calculatedTotal,
        isMatched ? 1 : 0,
        mismatchReason || null,
        employeesJson,
        id
      )
      .first<Revenue>();

    if (!result) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Revenue not found',
      }, 404);
    }

    return c.json<ApiResponse<Revenue>>({
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

// DELETE /api/revenues/delete/:id
app.delete('/delete/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const result = await c.env.DB.prepare(
      `DELETE FROM revenues WHERE id = ? RETURNING id`
    )
      .bind(id)
      .first();

    if (!result) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Revenue not found',
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
