# 🚖 NexaRide Backend

A clean, simple, and scalable backend for the **NexaRide** taxi service app. Built with **Node.js**, **TypeScript**, **Express**, **MongoDB**, **Redis**, **Socket.IO**, and **Stripe**. The project uses a **layered architecture** inspired by Clean Architecture principles, with the **Repository Pattern** and a clear **Domain Layer (DL)**.

---

## ⚙️ Tech Stack

- **Node.js + Express**
- **TypeScript**
- **MongoDB + Mongoose**
- **Redis** (caching & sockets)
- **Socket.IO** (real-time communication)
- **Stripe** (payments)
- **Geoapify** (location/ETA)

---

## 🚀 Features

### 🔐 Authentication

- JWT-based auth
- Role-based access (User / Driver / Admin)

### 🚖 Ride System

- Real-time ride requests
- Driver online/offline tracking
- Ride acceptance, start, finish
- Distance & ETA using Geoapify

### 💳 Wallet & Payments

- Wallet top-up using Stripe
- Ride payment processing
- Stripe webhook verification

### 💬 Chat

- Real-time user ↔ driver chat

### 🛠 Admin Controls

- Monitor rides, users, drivers
- Block/unblock users
- offer managment

---

## 🔧 Setup Instructions

### 1️⃣ Clone the project

```bash
git clone https://github.com/MuhammadRazalkv/NexaRide-Backend
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Configure environment variables

Create a `.env` file:

```
APP_GMAIL=app_gmail_to_send_mails
APP_PASSWORD_GMAIL=gmail_app_password

JWT_ACCESS_SECRET=your_secret
JWT_REFRESH_SECRET=your_secret

ADMIN_EMAIL=admin_email
ADMIN_PASSWORD=admin_password

CLOUDINARY_SECRET=your_secret
CLOUDINARY_API_KEY=your_cloudinary_api
CLOUDINARY_NAME=your_cloudinary_name

REFRESH_MAX_AGE=refresh_token_max_age
ACCESS_MAX_AGE=access_token_max_age


STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY==your_stripe_secret
WEBHOOK_SECRET_KEY==your_webhook_secret

FRONT_END_URL=your_front_end_url

GEOAPI_KEY=your_geo_api_key

PLUS_AMOUNT_MONTHLY=premium_amount_monthly
PLUS_AMOUNT_YEARLY=premium_amount_yearly

MONGO_URL=your_mongo_url

RETENTION_PERIOD_LOGGER=your_retention_period
```

### 4️⃣ Start the development server

```bash
npm run dev
```

## 🔒 Security

- JWT protection
- Zod input validation
- Rate limiting
- Bcrypt password hashing
- Role-based authorization
- Stripe webhook signature checks

---
## 🚪 Frontend
🔗 [NexaRide Frontend](https://github.com/MuhammadRazalkv/NexaRide-Frontend)
---
## 📞 Contact

For any queries, reach out to **Rasal**, developer of NexaRide.
