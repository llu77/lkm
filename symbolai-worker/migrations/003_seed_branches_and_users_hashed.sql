-- =========================================
-- Seed Data for Branches and Users
-- Generated with properly hashed passwords
-- =========================================

-- Insert Branches
INSERT INTO branches (id, name, name_ar, location, phone, manager_name, is_active)
VALUES ('branch_1010', 'Laban Branch', 'فرع لبن', 'Riyadh - Laban District', '+966501234567', 'محمد أحمد', 1);

INSERT INTO branches (id, name, name_ar, location, phone, manager_name, is_active)
VALUES ('branch_2020', 'Tuwaiq Branch', 'فرع طويق', 'Riyadh - Tuwaiq District', '+966501234568', 'عبدالله خالد', 1);


-- Insert Users (Supervisors, Partners, Employees)
-- User: supervisor_laban (Password: laban1010)
INSERT INTO users_new (id, username, password, email, full_name, phone, role_id, branch_id, is_active)
VALUES ('user_supervisor_1010', 'supervisor_laban', '1efaaf2195720bd5bad0c2285df2db04065f9b989061bba9674032e0905629a5', 'supervisor.laban@symbolai.net', 'محمد أحمد - مشرف فرع لبن', '+966501234567', 'role_supervisor', 'branch_1010', 1);

-- User: supervisor_tuwaiq (Password: tuwaiq2020)
INSERT INTO users_new (id, username, password, email, full_name, phone, role_id, branch_id, is_active)
VALUES ('user_supervisor_2020', 'supervisor_tuwaiq', '29b600bac689312719c4b5a1f334f207cd6976a6913e550c8cf0605a272309d4', 'supervisor.tuwaiq@symbolai.net', 'عبدالله خالد - مشرف فرع طويق', '+966501234568', 'role_supervisor', 'branch_2020', 1);

-- User: partner_laban (Password: partner1010)
INSERT INTO users_new (id, username, password, email, full_name, phone, role_id, branch_id, is_active)
VALUES ('user_partner_1010', 'partner_laban', 'daeba6437909179fe6f0c559c501bf8bba18cee5c27c5c74d486d1014c18f7fc', 'partner.laban@symbolai.net', 'سعد عبدالرحمن - شريك فرع لبن', '+966501234569', 'role_partner', 'branch_1010', 1);

-- User: partner_tuwaiq (Password: partner2020)
INSERT INTO users_new (id, username, password, email, full_name, phone, role_id, branch_id, is_active)
VALUES ('user_partner_2020', 'partner_tuwaiq', '93926f57fa352aa9da7a969e7e3cb0c39d81e2feb975e2cd7d4c02b187005faa', 'partner.tuwaiq@symbolai.net', 'فيصل ناصر - شريك فرع طويق', '+966501234570', 'role_partner', 'branch_2020', 1);

-- User: emp_laban_ahmad (Password: emp1010)
INSERT INTO users_new (id, username, password, email, full_name, phone, role_id, branch_id, is_active)
VALUES ('user_employee_1010_1', 'emp_laban_ahmad', '63e993352d8919a3a468a9d842a9f5e0ace2ecf6476fb2327bc78b20701dd2fe', 'ahmad.ali@symbolai.net', 'أحمد علي - موظف فرع لبن', '+966501234571', 'role_employee', 'branch_1010', 1);

-- User: emp_laban_omar (Password: emp1010)
INSERT INTO users_new (id, username, password, email, full_name, phone, role_id, branch_id, is_active)
VALUES ('user_employee_1010_2', 'emp_laban_omar', '63e993352d8919a3a468a9d842a9f5e0ace2ecf6476fb2327bc78b20701dd2fe', 'omar.hassan@symbolai.net', 'عمر حسن - موظف فرع لبن', '+966501234572', 'role_employee', 'branch_1010', 1);

-- User: emp_laban_fatima (Password: emp1010)
INSERT INTO users_new (id, username, password, email, full_name, phone, role_id, branch_id, is_active)
VALUES ('user_employee_1010_3', 'emp_laban_fatima', '63e993352d8919a3a468a9d842a9f5e0ace2ecf6476fb2327bc78b20701dd2fe', 'fatima.ahmed@symbolai.net', 'فاطمة أحمد - موظف فرع لبن', '+966501234575', 'role_employee', 'branch_1010', 1);

-- User: emp_laban_noura (Password: emp1010)
INSERT INTO users_new (id, username, password, email, full_name, phone, role_id, branch_id, is_active)
VALUES ('user_employee_1010_4', 'emp_laban_noura', '63e993352d8919a3a468a9d842a9f5e0ace2ecf6476fb2327bc78b20701dd2fe', 'noura.khalid@symbolai.net', 'نورة خالد - موظف فرع لبن', '+966501234576', 'role_employee', 'branch_1010', 1);

-- User: emp_tuwaiq_khalid (Password: emp2020)
INSERT INTO users_new (id, username, password, email, full_name, phone, role_id, branch_id, is_active)
VALUES ('user_employee_2020_1', 'emp_tuwaiq_khalid', '96a4512a6d4fa640978b18cbefee117457504eb134147ffa8af3d86ad4aaf625', 'khalid.salem@symbolai.net', 'خالد سالم - موظف فرع طويق', '+966501234573', 'role_employee', 'branch_2020', 1);

-- User: emp_tuwaiq_youssef (Password: emp2020)
INSERT INTO users_new (id, username, password, email, full_name, phone, role_id, branch_id, is_active)
VALUES ('user_employee_2020_2', 'emp_tuwaiq_youssef', '96a4512a6d4fa640978b18cbefee117457504eb134147ffa8af3d86ad4aaf625', 'youssef.fahad@symbolai.net', 'يوسف فهد - موظف فرع طويق', '+966501234574', 'role_employee', 'branch_2020', 1);


-- Insert Employee Records
INSERT INTO employees (id, branch_id, employee_name, national_id, base_salary, supervisor_allowance, incentives, is_active)
VALUES ('emp_rec_1010_1', 'branch_1010', 'أحمد علي محمد', '1234567890', 5000, 0, 500, 1);

INSERT INTO employees (id, branch_id, employee_name, national_id, base_salary, supervisor_allowance, incentives, is_active)
VALUES ('emp_rec_1010_2', 'branch_1010', 'عمر حسن عبدالله', '1234567891', 4500, 0, 300, 1);

INSERT INTO employees (id, branch_id, employee_name, national_id, base_salary, supervisor_allowance, incentives, is_active)
VALUES ('emp_rec_1010_3', 'branch_1010', 'فاطمة أحمد سعيد', '1234567892', 4000, 0, 200, 1);

INSERT INTO employees (id, branch_id, employee_name, national_id, base_salary, supervisor_allowance, incentives, is_active)
VALUES ('emp_rec_1010_4', 'branch_1010', 'نورة خالد محمد', '1234567893', 4200, 0, 250, 1);

INSERT INTO employees (id, branch_id, employee_name, national_id, base_salary, supervisor_allowance, incentives, is_active)
VALUES ('emp_rec_2020_1', 'branch_2020', 'خالد سالم عبدالله', '2234567890', 5200, 0, 600, 1);

INSERT INTO employees (id, branch_id, employee_name, national_id, base_salary, supervisor_allowance, incentives, is_active)
VALUES ('emp_rec_2020_2', 'branch_2020', 'يوسف فهد أحمد', '2234567891', 4800, 0, 400, 1);


-- =========================================
-- Summary of Created Data
-- =========================================
-- Branches: 2 (Laban - 1010, Tuwaiq - 2020)
-- Supervisors: 2 (1 per branch)
-- Partners: 2 (1 per branch)
-- Employee Users: 6 total (4 Laban + 2 Tuwaiq)
-- Employee Records: 6 total (4 Laban + 2 Tuwaiq)
--
-- Branch Totals:
-- Laban: 1 Supervisor + 4 Employees = 5 people
-- Tuwaiq: 1 Supervisor + 2 Employees = 3 people
--
-- Login Credentials:
-- Supervisor Laban: supervisor_laban / laban1010
-- Supervisor Tuwaiq: supervisor_tuwaiq / tuwaiq2020
-- Partner Laban: partner_laban / partner1010
-- Partner Tuwaiq: partner_tuwaiq / partner2020
-- Employees Laban: emp_laban_ahmad, emp_laban_omar, emp_laban_fatima, emp_laban_noura / emp1010
-- Employees Tuwaiq: emp_tuwaiq_khalid, emp_tuwaiq_youssef / emp2020
