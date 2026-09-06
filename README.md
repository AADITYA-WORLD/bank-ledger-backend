# Bank Ledger Backend

A double-entry ledger-based banking backend, built to learn real-world backend concepts: authentication, atomic transactions, and financial data integrity.

## Features

- User authentication (JWT + HTTP-only cookies)
- Token blacklisting on logout (MongoDB TTL index for auto-cleanup)
- Double-entry ledger system — balance is always derived from Ledger entries, never stored directly
- Atomic money transfers using MongoDB sessions/transactions
- Idempotency keys to prevent duplicate transactions
- Admin-controlled system reserve account
- One-time signup bonus
- Email notifications (welcome email, transfer confirmations) via Gmail API + Nodemailer
- Paginated transaction history

## Tech Stack

- Node.js, Express
- MongoDB, Mongoose
- JWT for authentication
- Nodemailer + Google OAuth2 for emails
- bcryptjs for password hashing

## Architecture — Double-Entry Ledger

Instead of storing a `balance` field on the Account model, every transaction creates **two Ledger entries**: a debit (money leaving an account) and a credit (money entering an account). The balance of any account is calculated on demand by summing its Ledger entries:


balance = sum(credits) - sum(debits)


This mirrors how real accounting systems work — the Ledger is the single source of truth, so there's no risk of a cached balance drifting out of sync with actual transaction history.

## Folder Structure

\```
src/
├── config/         # DB connection
├── models/         # User, Account, Transaction, Ledger, BlacklistToken
├── controllers/     # Business logic
├── routes/          # Route definitions
├── middlewares/      # Auth + admin guards
├── utils/            # Token generation, email templates, balance calculation
scripts/
└── seedSystemAccount.js   # One-time script to create the system reserve account
\```

## Getting Started

1. Clone the repo and install dependencies:
   \```
   npm install
   \```
2. Copy `.env.example` to `.env` and fill in your own values.
3. Seed the system reserve account (one-time):
   \```
   node src/scripts/seedSystemAccount.js
   \```
   Copy the printed `SYSTEM_ACCOUNT_ID` into your `.env`.
4. Start the server:
   \```
   node server.js
   \```

## API Testing

A Postman collection is included in the `/postman` folder — import it to test all endpoints directly.

## API Overview

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register a new user (creates account automatically) |
| POST | /api/auth/login | Login, returns JWT |
| POST | /api/auth/logout | Logout, blacklists current token |
| GET | /api/auth/getme | Get current logged-in user |
| GET | /api/account/balance | Get current balance (derived from Ledger) |
| POST | /api/account/claim-bonus | Claim one-time signup bonus |
| POST | /api/transfer/transfer-money | (Admin only) Transfer from system reserve to a user |
| POST | /api/transfer | Transfer money to another user |
| GET | /api/account/transactions?page=1&limit=5 | Paginated transaction history |


## Note on Emails
Due to Resend's free-tier sandbox restriction, transactional emails currently only deliver to the developer's verified email address. In a production setup, a verified custom domain would be used to send to any recipient.


## Notes
This is a learning project built to practice backend fundamentals — it is not connected to a real payment gateway, and the system reserve account is a simulated construct for demonstrating double-entry bookkeeping.