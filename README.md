

**StockSense** is a modern, high-performance stock market tracking, paper trading, and personalized investment advisory platform built with **React**, **TypeScript**, **TailwindCSS**, and **Vite**.

![StockSense Banner](https://img.shields.io/badge/StockSense-v1.0.0-indigo?style=for-the-badge&logo=react)
![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)
![Deployment Status](https://img.shields.io/badge/Deployment-Vercel-black?style=for-the-badge&logo=vercel)

---

## 🌟 Key Features

### 1. 💡 Plan-Based Investment Advisor
- **Goal-Oriented Planning:** Input your investment budget (e.g., ₹50,000), target duration (e.g., 5 years), and minimum target annual return % (e.g., 8%/yr).
- **Automated Asset Matcher:** Dynamically filters stock universes to recommend optimal share quantities fitting your budget.
- **Sell & Reallocation Suggestions:** Identifies holdings in your portfolio that fall below your target return or exceed your risk capacity for short time horizons.
- **Compound Growth Calculator:** Visualizes projected wealth growth over time using compound interest calculations.

### 2. 🔒 Secure 2FA OTP Email Verification
- Integrated with **EmailJS** for client-side OTP dispatches directly to user email inboxes.
- Real-time on-screen delivery diagnostics and error alerts.
- Built-in 30-second cooldown timer to prevent rate-limiting.
- Collapsible debug helper for offline development testing.

### 3. 📊 Interactive Portfolio & Paper Trading
- Real-time stock quotes, interactive charts, and gain/loss tracking.
- Paper trading simulation: Buy and sell shares with virtual paper cash.
- Sector distribution charts, risk metrics, and history logs.

### 4. 🎨 Premium UI/UX Design
- Sleek dark/light theme support.
- Micro-interactions powered by **Framer Motion**.
- Iconography by **Lucide React**.

---

## 🛠️ Technology Stack

- **Frontend Core:** React 18, TypeScript, Vite
- **Styling:** TailwindCSS, Framer Motion
- **Icons:** Lucide React
- **Email Service:** EmailJS Browser SDK (`@emailjs/browser`)
- **Routing & Forms:** React Router v6, React Hook Form
- **Deployment:** Vercel

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18.0 or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/upareonkar08/StockSense.git
   cd StockSense
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🌐 Live Deployment & Links

- 🚀 **Live Web Application:** [https://stocksense-two-navy.vercel.app](https://stocksense-two-navy.vercel.app)
- 🐙 **GitHub Repository:** [https://github.com/upareonkar08/StockSense](https://github.com/upareonkar08/StockSense)

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
