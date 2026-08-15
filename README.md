# BusinessMint Solution Billing — Full-Stack Invoice Management System

A complete billing/invoicing web application with **Admin** and **Employee** logins.
- **Admin** can create/manage employee accounts, configure company settings, and create/view all invoices.
- **Employees** can log in and create invoices, and view invoices they created.
- Every invoice can be saved and downloaded as a professionally designed **PDF** (Proforma or Tax Invoice), matching the reference BusinessMint Solution invoice layout — with bank details, UPI QR code, and an authorized-signatory stamp.

Tech stack: **React (Vite) + Tailwind CSS** frontend, **Node.js + Express** backend, **MySQL** database (via Sequelize ORM), **Puppeteer** for pixel-accurate PDF generation, **JWT** authentication.

---

## 1. Project Structure

```
billing-software/
├── backend/
│   ├── server.js                 # App entry point
│   ├── src/
│   │   ├── config/db.js          # Sequelize/MySQL connection
│   │   ├── models/                # User, CompanySetting, Invoice, InvoiceItem
│   │   ├── middleware/auth.js     # JWT verification + role guard
│   │   ├── controllers/           # Business logic
│   │   ├── routes/                # Express routers
│   │   ├── templates/invoiceTemplate.js  # HTML invoice layout
│   │   ├── utils/pdfGenerator.js  # Puppeteer -> PDF
│   │   └── seed.js                # Creates the first admin account
│   ├── sql/schema.sql             # Reference SQL schema (auto-created by Sequelize too)
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/                 # Login, Dashboard, Employees, CreateInvoice, Invoices, InvoiceView, Settings
    │   ├── components/            # Navbar, ProtectedRoute
    │   ├── context/AuthContext.jsx
    │   └── api/axios.js
    └── vite.config.js
```

---

## 2. Prerequisites

- Node.js 18+ and npm
- MySQL 8+ (or MariaDB) running locally or remotely
- (Puppeteer will download a bundled Chromium on first `npm install` — needs internet access once)

---

## 3. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=billing_software
DB_USER=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=some_long_random_string
CLIENT_URL=http://localhost:5173
```

Create the database (Sequelize will auto-create all tables on first run, but you need the database itself to exist):

```bash
mysql -u root -p -e "CREATE DATABASE billing_software CHARACTER SET utf8mb4;"
```

(Optional) You can also run `sql/schema.sql` manually if you prefer creating tables yourself instead of relying on Sequelize's auto-sync.

Seed the first Admin account:

```bash
npm run seed
```

This prints the admin login (default `admin@rexera.com` / `Admin@123` — change these in `.env` before seeding, or change the password after logging in).

Start the backend:

```bash
npm run dev      # with nodemon, auto-restarts on changes
# or
npm start
```

Backend runs at **http://localhost:5000**. Health check: `GET /api/health`.

---

## 4. Frontend Setup

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** and proxies `/api` calls to the backend automatically (see `vite.config.js`).

---

## 5. Using the App

1. Go to `http://localhost:5173/login` and sign in with the admin account created by the seed script.
2. As Admin:
   - Go to **Employees** → **+ Add Employee** to create employee logins (name, email, temporary password, branch, phone).
   - Go to **Settings** to update your company name, GSTIN, address, bank details, UPI ID, and default GST rate — these appear on every invoice PDF.
   - Go to **Create Invoice** to raise a Proforma or Tax invoice.
3. As Employee: log in with the credentials the admin created. Employees can create invoices and see only the invoices they generated; Admins see all invoices from every employee.
4. Open any invoice and click **Download PDF** to get the finished, formatted invoice (with QR code and stamp) exactly like the reference design.

---

## 6. Key API Endpoints

| Method | Endpoint                  | Access          | Description                          |
|--------|----------------------------|-----------------|---------------------------------------|
| POST   | /api/auth/login             | Public           | Login (admin or employee)            |
| GET    | /api/auth/me                 | Authenticated    | Get current user                     |
| POST   | /api/auth/change-password    | Authenticated    | Change own password                  |
| POST   | /api/employees                | Admin only        | Create employee                      |
| GET    | /api/employees                | Admin only        | List employees                       |
| PUT    | /api/employees/:id             | Admin only        | Update / activate / deactivate       |
| DELETE | /api/employees/:id             | Admin only        | Remove employee                      |
| GET    | /api/settings                  | Authenticated    | Get company settings                 |
| PUT    | /api/settings                  | Admin only        | Update company settings              |
| POST   | /api/invoices                   | Admin + Employee   | Create invoice                       |
| GET    | /api/invoices                   | Admin + Employee   | List invoices (admin=all, emp=own)   |
| GET    | /api/invoices/:id                 | Admin + Employee   | Get single invoice                   |
| GET    | /api/invoices/:id/pdf              | Admin + Employee   | Download invoice PDF                 |

---

## 7. Notes & Production Tips

- Passwords are hashed with bcrypt; auth uses signed JWTs (`JWT_SECRET` — set a strong, unique value in production).
- Invoice numbers auto-increment (`INV-2158`, `INV-2159`, ...) based on the last saved invoice.
- If an employee with existing invoices is removed, the account is deactivated instead of deleted, to preserve invoice history integrity.
- For production deployment: set `NODE_ENV=production`, run the frontend build (`npm run build` inside `frontend`) and serve the static output behind a reverse proxy (e.g. Nginx) alongside the Node API, and use a managed MySQL instance.
- Puppeteer launches a headless Chromium instance for PDF rendering and is reused across requests for performance; ensure your server has enough memory (min. ~512MB free) when running the backend.
