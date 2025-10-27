// TypeScript Types for LKM Backend

export interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
  ALLOWED_ORIGINS: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Database Models
export interface User {
  id: string;
  token_identifier?: string;
  name?: string;
  email?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  role?: string;
  is_anonymous?: boolean;
  created_at: number;
}

export interface Revenue {
  id: string;
  date: number;
  cash?: number;
  network?: number;
  budget?: number;
  total?: number;
  calculated_total?: number;
  is_matched?: boolean;
  mismatch_reason?: string;
  user_id: string;
  branch_id?: string;
  branch_name?: string;
  employees?: string; // JSON
  is_approved_for_bonus?: boolean;
  created_at: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  description?: string;
  date: number;
  user_id: string;
  branch_id?: string;
  branch_name?: string;
  created_at: number;
}

export interface Employee {
  id: string;
  branch_id: string;
  branch_name: string;
  employee_name: string;
  national_id?: string;
  id_expiry_date?: number;
  base_salary: number;
  supervisor_allowance: number;
  incentives: number;
  is_active: boolean;
  created_by: string;
  created_at: number;
}

export interface Branch {
  id: string;
  branch_id: string;
  branch_name: string;
  supervisor_email: string;
  is_active: boolean;
  created_at: number;
}
