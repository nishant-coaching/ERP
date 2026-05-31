# Nishant Coaching Classes ERP

A modern, full-stack ERP web application for coaching institute management.

## Setup

```bash
cd nishant-erp
npm run install:all
npm run dev
```

- **Client:** http://localhost:5173
- **API:** http://localhost:5000

Set `MONGODB_URI` in `server/.env` (see `server/.env.example`).

---

## Remove all dummy / demo data

Dummy students, fees, and demo logins come from **`npm run seed`**. They are not part of normal app startup.

### 1. Clear the database (no demo data added back)

```bash
cd nishant-erp
npm run clear-db
```

This deletes all users, students, parents, fees, marks, tests, and notifications.

### 2. Do not run `npm run seed` again

`npm run seed` **re-creates** the full demo dataset. Skip it for production.

### 3. Create your real admin account

```bash
npm run create-admin -- you@yourinstitute.com YourSecurePassword "Your Name"
```

Then log in on the **Admin** tab with that email and password.

### 4. Add real data in the app

- **Students:** Admin → Students → Add Student (link to a parent)
- **Parents:** Create parent records in DB or extend the app with parent signup
- **Fees / marks:** Use the admin modules after students exist

---

## Optional: demo data for testing only

```bash
npm run seed
```

| Role   | Email                      | Password     |
|--------|----------------------------|--------------|
| Admin  | admin@nishantclasses.com   | password123  |
| Parent | parent1@email.com          | password123  |

---

## Other ways to wipe MongoDB

- **MongoDB Compass:** Connect → database `nishant-erp` → drop database
- **mongosh:** `use nishant-erp` then `db.dropDatabase()`

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start API + frontend |
| `npm run clear-db` | Empty database (production reset) |
| `npm run create-admin -- email pass "Name"` | One real admin user |
| `npm run seed` | Fill demo data (development only) |

## Logo

Add `client/public/logo.png` and update `client/src/components/Logo.jsx` if needed.
