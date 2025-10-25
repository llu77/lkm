# LKM - نظام إدارة الموارد البشرية والرواتب

## 🌟 Overview

LKM is a comprehensive Human Resources and Payroll Management System built with React, Vite, Convex, and Tailwind CSS. It provides tools for managing employees, payroll, requests, expenses, and more across multiple branches.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm or pnpm
- Convex account (https://convex.dev)
- Cloudflare account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/llu77/lkm.git
   cd lkm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Convex environment variables**
   ```bash
   # On Linux/Mac
   ./setup-convex-env.sh
   
   # On Windows
   setup-convex-env.bat
   ```
   
   For detailed instructions, see [CONVEX_SETUP.md](./CONVEX_SETUP.md)

4. **Configure Convex**
   ```bash
   npx convex dev
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

---

## 📚 Documentation

- **[CONVEX_SETUP.md](./CONVEX_SETUP.md)** - Complete guide for setting up Convex environment variables
- **[CLOUDFLARE_PAGES_SETUP.md](./CLOUDFLARE_PAGES_SETUP.md)** - Deployment guide for Cloudflare Pages
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist
- **[EMAIL_SETTINGS_GUIDE.md](./EMAIL_SETTINGS_GUIDE.md)** - Email system configuration
- **[PAYROLL_GUIDE.md](./PAYROLL_GUIDE.md)** - Payroll management guide

---

## 🔧 Environment Variables

### Convex Backend Variables

These are set using `npx convex env set`:

| Variable | Description | Default |
|----------|-------------|---------|
| `MANAGE_REQUESTS_PASSWORD` | Admin password for requests page | `Omar1010#` |
| `SUPERVISOR_EMAIL_1010` | Email for branch 1010 supervisor | `labn@company.com` |
| `SUPERVISOR_EMAIL_2020` | Email for branch 2020 supervisor | `tuwaiq@company.com` |
| `DEFAULT_SUPERVISOR_EMAIL` | Fallback supervisor email | `admin@company.com` |
| `VITE_APP_URL` | Application URL for email links | `https://your-site.pages.dev` |

Run the setup script to configure all at once:
```bash
./setup-convex-env.sh
```

### Frontend Variables

These are set in `.env.local` or Cloudflare Pages settings:

| Variable | Description |
|----------|-------------|
| `VITE_CONVEX_URL` | Your Convex deployment URL |
| `VITE_EMPLOYEES_PASSWORD` | Password for employees page |
| `VITE_PAYROLL_PASSWORD` | Password for payroll page |
| `VITE_MANAGE_REQUESTS_PASSWORD` | Password for manage requests page |

---

## 🏗️ Project Structure

```
lkm/
├── src/                      # Frontend source code
│   ├── components/           # React components
│   ├── pages/               # Page components
│   ├── hooks/               # Custom React hooks
│   └── lib/                 # Utility functions
├── convex/                  # Convex backend functions
│   ├── schema.ts            # Database schema
│   ├── employees.ts         # Employee management
│   ├── payroll.ts           # Payroll functions
│   ├── branches.ts          # Branch management
│   └── ...                  # Other backend modules
├── public/                  # Static assets
├── setup-convex-env.sh      # Convex setup script (Linux/Mac)
├── setup-convex-env.bat     # Convex setup script (Windows)
└── docs/                    # Documentation files
```

---

## ✨ Features

### 👥 Employee Management
- Add, edit, and delete employees
- Track employee information by branch
- Manage advances and deductions

### 💰 Payroll System
- Generate monthly payroll
- Calculate salaries with bonuses and deductions
- Export payroll reports as PDF

### 📋 Request Management
- Employee vacation requests
- Advance payment requests
- Permission requests
- Objection and resignation handling

### 📊 Financial Tracking
- Revenue management by branch
- Expense tracking
- Bonus management
- Financial reports

### 🏢 Multi-Branch Support
- Branch 1010 (لبن)
- Branch 2020 (طويق)
- Separate data and supervisors per branch

### 📧 Email Integration
- Automated email notifications
- Scheduled reports
- Customizable email templates

---

## 🛠️ Development

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Format Code

```bash
npm run prettier-fix
```

### Convex Development

```bash
npx convex dev
```

---

## 🚢 Deployment

### Deploy to Cloudflare Pages

1. Follow the [CLOUDFLARE_PAGES_SETUP.md](./CLOUDFLARE_PAGES_SETUP.md) guide
2. Connect your GitHub repository
3. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variables in Cloudflare dashboard
5. Deploy!

### Convex Deployment

```bash
npx convex deploy
```

---

## 🔐 Security Notes

⚠️ **Important:**
- Change all default passwords before production deployment
- Never commit `.env` files to version control
- Use strong passwords for production
- Regularly rotate credentials
- Review the [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) before going live

---

## 📦 Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Backend:** Convex
- **Styling:** Tailwind CSS 4, Radix UI
- **Forms:** React Hook Form, Zod
- **PDF:** jsPDF
- **Email:** Resend
- **Deployment:** Cloudflare Pages

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is private and proprietary.

---

## 🆘 Support

For issues and questions:
- Check the documentation in the root directory
- Review existing GitHub issues
- Create a new issue with detailed information

---

## 🎯 Quick Links

- [Environment Setup Guide](./CONVEX_SETUP.md)
- [Deployment Guide](./CLOUDFLARE_PAGES_SETUP.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Email Configuration](./EMAIL_SETTINGS_GUIDE.md)

---

**Last Updated:** October 25, 2025  
**Version:** 1.0.0  
**Node Version:** 20.x
