#  Lumine Predict

> **Predictive Inventory Demand Forecasting & Supply Chain Optimization Platform**

[![Live Demo](https://lumina-predict.onrender.com)]() 

 **[https://lumina-predict.onrender.com]**

---

##  Overview

**Lumine Predict** is a state-of-the-art full-stack supply chain forecasting and warehouse management dashboard. Designed to scale seamlessly for large-scale logistics operations, the platform manages **1,250 active SKUs** across five core Indian product categories. 

By leveraging **Gemini AI models** server-side, Lumine Predict provides warehouse operators with real-time risk alerts, dynamic economic order quantities, predictive seasonality factor mapping, and automated executive-level stocking optimization reports.

---

## 🇮🇳 Premium Localized Catalog

The catalog is fully populated with **1,250 realistic products** featuring India's most iconic and premium brands:

*    **Drinkware** (250 SKUs): *Milton, Cello, Borosil, Signoraware, Prestige, Hawkins, Butterfly*
*    **Footwear** (250 SKUs): *Bata, Woodland, Paragon, Sparx, Campus, Khadims, Relaxo*
*    **Office Supplies** (250 SKUs): *Classmate, Camel, Camlin, Nataraj, Apsara, Kangaro, Solo, Luxor*
*    **Wearable Tech** (250 SKUs): *boAt, Noise, Fire-Boltt, Fastrack, Pebble, Boult, BeatXP*
*    **Furniture** (250 SKUs): *Godrej Interio, Nilkamal, Pepperfry, Urban Ladder, Sleepwell, Duroflex, Featherlite*

---

##  Key Features

###  Real-Time Inventory Health Monitoring
*   **Dynamic Valuation Tracking:** Instant financial valuation of total bound warehouse capital.
*   **Interactive Pagination & Filters:** Rapid search across 1,250 items with status filters (All, Low Stock, Overstocked, Normal) and category-based partitioning.
*   **Intelligent Stockout Risk Indicators:** Highlights high-risk depletion events using safety buffer variables ($MinStock$) and maximum storage limits ($MaxStock$).

###  Predictive Demand Forecasting
*   **12-Week Historic Trends:** Granular weekly consumption analysis.
*   **Trend Vectors:** Identification of demand trend directions (Rising, Stable, Falling).
*   **Seasonality Multipliers:** Mathematical adjustment coefficients modeling localized cyclical demand waves.

###  Smart Replenishment Planner
*   **EOQ-Inspired Quantity Optimization:** Auto-computes optimal reorder volumes factoring in unit cost, lead times, and current stock level balances.
*   **Procurement Action Flow:** Transition products from depletion alerts straight into order triggers.

###  Gemini Copilot & Executive Reports (Lumina AI Engine)
*   **Lumina Logistics Copilot:** A server-side contextual chatbot optimized to query stock metadata and guide operational decision-making.
*   **Executive Optimization Reports:** Automatic, one-click analysis generating comprehensive markdown audits with critical stockout hazard tables and overstock mitigation strategies.

---

##  Technology Stack

*   **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Recharts (Data Visualizations), Framer Motion (Animations).
*   **Backend:** Express (Node.js), TypeScript.
*   **AI Engine:** `@google/genai` (Server-side proxy keeping credentials secure).
*   **Database:** Local file-based low-latency persistence layer (`db_store.json`).

---

 
