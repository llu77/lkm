import { Hono } from 'hono';
import type { Env, Employee, ApiResponse } from '../types';

const app = new Hono<{ Bindings: Env }>();

// GET /api/employees/list?branchId=1010
app.get('/list', async (c) => {
  try {
    const branchId = c.req.query('branchId');

    let query;
    let bindings: any[] = [];

    if (branchId && branchId !== 'all') {
      query = `SELECT * FROM employees WHERE branch_id = ? ORDER BY created_at DESC`;
      bindings = [branchId];
    } else {
      query = `SELECT * FROM employees ORDER BY created_at DESC`;
    }

    const { results } = await c.env.DB.prepare(query)
      .bind(...bindings)
      .all<Employee>();

    return c.json<ApiResponse<Employee[]>>({
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

// GET /api/employees/active?branchId=1010
app.get('/active', async (c) => {
  try {
    const branchId = c.req.query('branchId');

    let query;
    let bindings: any[] = [];

    if (branchId && branchId !== 'all') {
      query = `SELECT * FROM employees WHERE branch_id = ? AND is_active = 1 ORDER BY created_at DESC`;
      bindings = [branchId];
    } else {
      query = `SELECT * FROM employees WHERE is_active = 1 ORDER BY created_at DESC`;
    }

    const { results } = await c.env.DB.prepare(query)
      .bind(...bindings)
      .all<Employee>();

    return c.json<ApiResponse<Employee[]>>({
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

// GET /api/employees/get/:id
app.get('/get/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const result = await c.env.DB.prepare(
      `SELECT * FROM employees WHERE id = ?`
    )
      .bind(id)
      .first<Employee>();

    if (!result) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Employee not found',
      }, 404);
    }

    return c.json<ApiResponse<Employee>>({
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

// POST /api/employees/add
app.post('/add', async (c) => {
  try {
    const body = await c.req.json();
    const {
      branchId,
      branchName,
      employeeName,
      nationalId,
      idExpiryDate,
      baseSalary,
      supervisorAllowance,
      incentives,
    } = body;

    // Validation
    if (!branchId || !branchName || !employeeName || !baseSalary) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Missing required fields',
      }, 400);
    }

    // Default user_id
    const userId = 'default-user-id';

    const result = await c.env.DB.prepare(
      `INSERT INTO employees (
        branch_id, branch_name, employee_name, national_id,
        id_expiry_date, base_salary, supervisor_allowance,
        incentives, is_active, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    )
      .bind(
        branchId,
        branchName,
        employeeName,
        nationalId || null,
        idExpiryDate || null,
        baseSalary,
        supervisorAllowance || 0,
        incentives || 0,
        1,
        userId
      )
      .first<Employee>();

    return c.json<ApiResponse<Employee>>({
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

// PUT /api/employees/update/:id
app.put('/update/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const {
      employeeName,
      nationalId,
      idExpiryDate,
      baseSalary,
      supervisorAllowance,
      incentives,
      isActive,
    } = body;

    const result = await c.env.DB.prepare(
      `UPDATE employees
       SET employee_name = ?, national_id = ?, id_expiry_date = ?,
           base_salary = ?, supervisor_allowance = ?,
           incentives = ?, is_active = ?
       WHERE id = ?
       RETURNING *`
    )
      .bind(
        employeeName,
        nationalId || null,
        idExpiryDate || null,
        baseSalary,
        supervisorAllowance || 0,
        incentives || 0,
        isActive ? 1 : 0,
        id
      )
      .first<Employee>();

    if (!result) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Employee not found',
      }, 404);
    }

    return c.json<ApiResponse<Employee>>({
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

// DELETE /api/employees/delete/:id
app.delete('/delete/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const result = await c.env.DB.prepare(
      `DELETE FROM employees WHERE id = ? RETURNING id`
    )
      .bind(id)
      .first();

    if (!result) {
      return c.json<ApiResponse>({
        success: false,
        error: 'Employee not found',
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
