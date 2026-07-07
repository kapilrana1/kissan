# Kissan Record - Farmer Khata Management System

MVC architecture me bana hua application jisme login ke baad sabhi kissano ka khata (record) manage kiya ja sakta hai.

## Tech Stack
- Node.js (v22.5+) + Express (MVC)
- EJS templates (View)
- SQLite database (Node.js built-in `node:sqlite` module - no extra install/compiler needed)
- express-session + bcryptjs (login/authentication)

## Folder Structure (MVC)
```
kissan-record/
├── app.js                 # Entry point
├── config/database.js     # DB connection + schema
├── models/                 # M - Farmer, User, WheatEntry
├── views/                  # V - EJS templates
├── controllers/            # C - business logic
├── routes/                 # URL -> Controller mapping
├── middleware/auth.js      # Login-check middleware
└── public/css/style.css    # Styling
```

## Setup

```bash
cd kissan-record
npm install
npm start
```

App chalega: http://localhost:3000

## Default Login
- Username: `admin`
- Password: `admin123`

(Pehli baar app run hone par yeh admin user automatically ban jayega. Password baad me database me change kar sakte hain.)

## Features
- Secure login/logout (password hashed with bcrypt, session-based auth)
- Sabhi kissano ka khata: Naam, Mobile, Address
- Har kissan ke liye Wheat Entry record: Wheat Variety, Bags, Quantity, Rate (Amount auto-calculate = Quantity x Rate), Advance, Bonus
- Automatic bakaya (due) calculation: Amount + Bonus - Advance
- Dashboard: total kissan, total wheat amount, total bonus/advance, total due
- Search kissan by naam/mobile/address
- Add / Edit / Delete kissan khata aur wheat entries
