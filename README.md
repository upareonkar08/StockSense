# 📈 StockSense — AI-Powered Portfolio Analytics & Personal Investment Advisor

**StockSense** is a comprehensive, production-grade financial web application designed to empower retail investors with AI-driven portfolio health analysis, plan-based investment advisory engines, risk scoring, paper trading simulation, historical backtesting, and secure 2FA authentication.

![StockSense Banner](https://img.shields.io/badge/StockSense-v1.2.0-indigo?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8.0-purple?style=for-the-badge&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38BDF8?style=for-the-badge&logo=tailwindcss)
![Deployment Status](https://img.shields.io/badge/Deployment-Vercel-black?style=for-the-badge&logo=vercel)
![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)

---

## 🌐 Live Application & Links

* 🚀 **Production Live Web App:** [https://stocksense-two-navy.vercel.app](https://stocksense-two-navy.vercel.app)
* 🐙 **GitHub Repository:** [https://github.com/upareonkar08/StockSense](https://github.com/upareonkar08/StockSense)
* 📧 **EmailJS Service Dashboard:** `service_7hh7trl` | `template_qzx56wf`

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features & Modules](#-key-features--modules)
  - [1. Plan-Based Investment Advisor](#1-plan-based-investment-advisor)
  - [2. Secure 2FA OTP Email Verification](#2-secure-2fa-otp-email-verification)
  - [3. Dynamic Portfolio Health & Risk Engine](#3-dynamic-portfolio-health--risk-engine)
  - [4. Virtual Paper Trading Simulator](#4-virtual-paper-trading-simulator)
  - [5. Portfolio Rebalancing & Optimizer](#5-portfolio-rebalancing--optimizer)
  - [6. 5-Year Historical Strategy Backtester](#6-5-year-historical-strategy-backtester)
  - [7. AI Analyst Financial Tutor](#7-ai-analyst-financial-tutor)
  - [8. Real-Time Visitor Tracking System](#8-real-time-visitor-tracking-system)
  - [9. Current Affairs & News Stock Advisor](#9-current-affairs--news-stock-advisor)
- [Technical Architecture & Data Flow](#-technical-architecture--data-flow)
- [Directory Structure](#-directory-structure)
- [Installation & Local Setup](#-installation--local-setup)
- [EmailJS Integration Guide](#-emailjs-integration-guide)
- [Building & Deployment](#-building--deployment)
- [License](#-license)

---

## 🌟 Overview

Navigating equity markets requires balancing capital preservation with growth targets. StockSense bridges the gap between raw portfolio tracking and actionable financial planning. By combining quantitative asset evaluation with a user-friendly interface, StockSense allows investors to set specific financial goals (e.g., investing ₹50,000 for 5 years with an 8% annual return target) and receive custom stock buy/sell execution plans.

---

## 🔥 Key Features & Modules

### 1. 💡 Plan-Based Investment Advisor
The **Plan-Based Advisor** (`src/pages/Suggestions.tsx`) evaluates investor targets against market asset profiles:
- **Goal Questionnaire:** Input target investment capital (₹), duration (years), and minimum expected annual return (%).
- **Compound Growth Calculator:** Visualizes projected wealth growth using compound interest math:
  $$FV = P \times (1 + r)^t$$
- **Algorithmic Asset Matching:** Filters the stock universe to select stocks meeting or exceeding the investor's minimum target annual return.
- **Risk Capacity Scoping:**
  - **Short Horizon (< 3 years):** Conservative focus (low volatility anchors like Johnson & Johnson, ExxonMobil).
  - **Medium Horizon (3–5 years):** Balanced growth (large-cap tech & finance like Apple, Microsoft, JPMorgan).
  - **Long Horizon (> 5 years):** Aggressive growth assets (high-beta tech like NVIDIA, Tesla).
- **Automated Reallocation & Sell Warnings:** Identifies existing holdings that yield returns *below* the user's minimum target return or pose excess risk for their timeframe, generating `[SELL]` or `[TRIM]` recommendations.
- **Paper Trading Auto-Execution:** One-click execution button to buy recommended stocks directly into paper trading accounts.

---

### 2. 🔒 Secure 2FA OTP Email Verification
The **Authentication System** (`src/pages/Login.tsx`) features client-side 2-Factor Authentication via **EmailJS**:
- **Async Dispatch:** Displays active loading state (*"Dispatching OTP via EmailJS..."*) while sending a random 6-digit verification code.
- **Real-Time On-Screen Error Diagnostics:** If EmailJS fails due to service configuration or rate limits, a clear red banner details the exact API response.
- **30-Second Cooldown Throttling:** Disables resend requests for 30 seconds to enforce API safety and prevent inbox spamming.
- **Debug Helper Toggle:** Hides the OTP code on screen by default for real email verification, while offering a collapsible debug helper for offline testing.
- **Harmonized Payload:** Sends `to_email`, `user_email`, `email`, `otp`, `otp_code`, `code`, and `to_name` parameters to match any EmailJS template configuration.

---

### 3. 📊 Dynamic Portfolio Health & Risk Engine
The **Dashboard & Health Module** (`src/pages/Dashboard.tsx`, `src/pages/Health.tsx`) computes portfolio metrics in real-time:
- **Dynamic Health Score (0–100):** Evaluates asset diversification, sector weighting balance, and single-stock concentration penalties.
- **Risk Rating:** Categorizes overall risk as *Low*, *Medium*, or *High* based on concentration heuristics ($>60\%$ single-stock allocation triggers high-risk alerts).
- **Interactive Performance Charts:** Powered by **Recharts**, featuring timeframe filters (`1M`, `3M`, `6M`, `1Y`) and interactive sector pie distribution charts.

---

### 4. ⚡ Virtual Paper Trading Simulator
The **Paper Trading Module** (`src/pages/PaperTrading.tsx`):
- Provides a simulated virtual cash wallet (default ₹100,000 baseline).
- Supports market buy/sell orders with instant cash balance and holdings recalculation.
- Persists user transactions and portfolio state across sessions via `localStorage`.

---

### 5. 🔄 Portfolio Rebalancing & Optimizer
The **Optimizer Module** (`src/pages/Optimizer.tsx`):
- Compares actual sector distributions against target asset allocations.
- Calculates exact dollar/rupee rebalancing trades required to realign portfolio weights.

---

### 6. 📈 5-Year Historical Strategy Backtester
The **Backtest Module** (`src/pages/Backtest.tsx`):
- Tests custom portfolio allocations against 5 years of historical market data.
- Compares portfolio CAGR, Sharpe ratio, and maximum drawdown against the **S&P 500** benchmark index.

---

### 7. 🤖 AI Analyst Financial Tutor
The **Analyst Chat Module** (`src/pages/Tutor.tsx`):
- Conversational financial assistant providing insights on portfolio theory, risk management, asset classes, and valuation ratios (P/E, Dividend Yield, Beta).

---

### 8. 👁️ Real-Time Visitor Tracking System
The **Visitor Counter System** (`src/components/ui/VisitorCounter.tsx`):
- **Cloud Counter API:** Connects to `api.counterapi.dev` to track global site visits.
- **Session-Aware Deduplication:** Uses `sessionStorage` to count unique browser sessions.
- **Local Fallback:** Persists visit count in `localStorage` if network or cloud API requests are blocked.
---

### 9. 📰 Current Affairs & News Stock Advisor
The **Current Affairs Module** (`src/pages/NewsAdvisor.tsx`):
- **Real-Time Event Mapping:** Maps macroeconomic news events (AI hardware demand surges, central bank interest rate cuts, clean energy tax incentives, defense spending increases) to direct equity beneficiaries.
- **Custom Headline AI Analyzer:** Input any custom breaking news story or headline to instantly receive AI-analyzed sentiment scores and top beneficiary stock picks.
- **1-Click Portfolio Execution:** Buy or paper-trade recommended beneficiary stocks directly into your portfolio.

---

## 🛠️ Technical Architecture & Data Flow

```
                     ┌────────────────────────────────┐
                     │          React Router          │
                     └───────────────┬────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
 ┌───────────────────┐                               ┌───────────────────┐
 │   Auth Context    │                               │ Portfolio Context │
 │ (EmailJS 2FA OTP) │                               │(Holdings & Cash)  │
 └─────────┬─────────┘                               └─────────┬─────────┘
           │                                                   │
           ▼                                                   ▼
┌─────────────────────┐                             ┌─────────────────────┐
│  localStorage Sync  │                             │  localStorage Sync  │
└─────────────────────┘                             └─────────────────────┘
```

---

## 📁 Directory Structure

```
StockSense/
├── public/                     # Static assets and favicon
├── src/
│   ├── components/
│   │   ├── charts/             # Recharts wrapper components (Area, Pie)
│   │   ├── dashboard/          # StatCards, HoldingsTable, Recommendations
│   │   ├── layout/             # DashboardLayout, Navbar, Footer, Sidebar
│   │   └── ui/                 # Button, Input, Modal, Badge, VisitorCounter
│   ├── context/                # React Context (AuthContext, PortfolioContext)
│   ├── data/                   # Initial stock universes and dummy datasets
│   ├── hooks/                  # Custom hooks (useAuth, usePortfolio)
│   ├── pages/                  # Page Views
│   │   ├── Landing.tsx         # Product overview & features
│   │   ├── Login.tsx           # EmailJS 2FA OTP authentication
│   │   ├── Signup.tsx          # Registration with password meter
│   │   ├── Dashboard.tsx       # Main analytics & stats dashboard
│   │   ├── Portfolio.tsx       # Holdings management & performance
│   │   ├── Health.tsx          # Health score & risk breakdown
│   │   ├── Optimizer.tsx       # Sector rebalancing engine
│   │   ├── Suggestions.tsx     # Plan-Based Investment Advisor
│   │   ├── PaperTrading.tsx    # Virtual paper trading simulator
│   │   ├── Backtest.tsx        # 5-Year historical strategy backtester
│   │   ├── Tutor.tsx           # AI Analyst Chat Assistant
│   │   └── Profile.tsx         # User profile settings
│   ├── utils/                  # Math utilities, formatters, counter API
│   ├── App.tsx                 # Application routes & provider wrappers
│   └── main.tsx                # Entry point
├── index.html                  # HTML template
├── package.json                # Project dependencies & scripts
├── tailwind.config.js          # Tailwind styling system configuration
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite bundler configuration
```

---

## 💻 Installation & Local Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### Steps

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/upareonkar08/StockSense.git
   cd StockSense
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Launch Local Development Server:**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:5173` in your browser.

4. **Verify TypeScript & Build:**
   ```bash
   npm run build
   ```

---

## 📧 EmailJS Integration Guide

The OTP authentication system uses **EmailJS**. To connect your own EmailJS account:

1. Create a free account at [EmailJS](https://www.emailjs.com/).
2. Create an **Email Service** (e.g., Gmail) and copy your **Service ID**.
3. Create an **Email Template** with the following template variables:
   - `{{to_email}}` (Recipient email)
   - `{{otp_code}}` (6-digit verification code)
   - `{{to_name}}` (Recipient name)
4. Copy your **Template ID** and **Public Key**.
5. Update parameters in `src/pages/Login.tsx`:
   ```ts
   emailjs.send(
     'YOUR_SERVICE_ID',
     'YOUR_TEMPLATE_ID',
     { to_email: email, otp_code: otp, ... },
     'YOUR_PUBLIC_KEY'
   );
   ```

---

## 🚀 Building & Deployment

### Vercel Deployment

StockSense is configured for automatic continuous deployment via Vercel.

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Deploy to Production:
   ```bash
   vercel --prod
   ```

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

<p center>
Developed with ❤️ by <a href="https://github.com/upareonkar08">Onkar Upare</a>
</p>
