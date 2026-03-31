You are a senior full-stack engineer and system architect.

Your task is to build a working Proof of Concept (POC) called:

"JanCase Hazaribagh" – a civic tech platform for citizens to report issues and for the mayor to monitor them using AI insights.

---

# 🧭 GOAL

Build a complete working application with:

1. Citizen submission interface
2. AI-powered backend processing
3. Mayor dashboard with maps, heatmaps, and animations

---

# 🧱 TECH STACK (STRICT – DO NOT CHANGE)

Frontend:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS

Backend:
- Next.js API routes

Database:
- NeonDB (Serverless PostgreSQL)
- Prisma ORM

Storage:
- use google drive api

AI:
- Gemini 1.5 Flash (Google AI Studio API)

Maps:
- React-Leaflet
- leaflet.heat plugin

Animations:
- Framer Motion

Icons:
- Lucide React

---

# 🗃️ DATABASE SCHEMA (PRISMA)

Create Prisma schema:

model Report {
  id              String   @id @default(uuid())
  createdAt       DateTime @default(now())

  imageUrl        String?
  description     String?

  category        String?
  severity        Float?

  latitude        Float?
  longitude       Float?
  wardNumber      Int?

  sentimentScore  Float?
  sentimentLabel  String?

  status          String   @default("Pending")
}

---

# ⚠️ REAL-WORLD REQUIREMENTS

Design for public users:

- Location is OPTIONAL
- Image is OPTIONAL
- Text is OPTIONAL
- Must support:
  - text-only
  - image-only
  - both

If everything is missing → prevent submission

---

# 📸 FEATURE 1: REPORT FORM

Build component:

ReportForm.tsx

Requirements:

- Mobile-first UI
- Glassmorphism design (light blur, rounded cards)
- Inputs:
  - Image upload (google drive api)
  - Text description
  - Location (optional)

Flow:
1. Upload image → get URL
2. Show preview
3. Submit → call API

UX:
- Show loading shimmer: "Analyzing issue..."
- Disable submit while processing

---

# 🧠 FEATURE 2: AI PROCESSING

API endpoint:

POST /api/reports

Steps:

1. Receive:
   - imageUrl (optional)
   - description (optional)
   - latitude, longitude (optional)

2. Call Gemini API with retry (5 times exponential backoff)

Prompt:

Analyze this civic issue.

Inputs:
- Image URL: {imageUrl}
- Description: {description}

Return JSON:
{
  "category": "Waste | Roads | Water | Electricity | Other",
  "severity": 0 to 1,
  "sentimentLabel": "angry | neutral | happy",
  "sentimentScore": -1 to 1
}

3. If AI fails → fallback:
{
  "category": "General",
  "severity": 0.5,
  "sentimentLabel": "neutral",
  "sentimentScore": 0
}

4. Calculate ward (simple mock logic)

5. Save to database via Prisma

6. Return created report

---

# 🏛️ FEATURE 3: MAYOR DASHBOARD

Create:

MayorDashboard.tsx

---

## Requirements:

### 1. MAP
- Use React-Leaflet
- Full-screen map

### 2. HEATMAP
- Use leaflet.heat
- Show only reports where status = "Pending"
- Intensity = density

### 3. EMOJI FLOOD (IMPORTANT)

When new report is added:

- angry → spawn 😡 emojis (20–30)
- happy → spawn 😊 emojis

Animation:
- Use Framer Motion
- Float upward
- Fade out
- Slight rotation

---

### 4. WARD SENTIMENT

- Group reports by ward
- Calculate average sentimentScore
- Color:
  - Red → negative
  - Green → positive

---

### 5. DUMMY DATA (IMPORTANT FOR POC)

Seed database with 100 fake reports:

- Random coordinates
- Random category
- Random sentiment

---

### 6. EXTRA PANELS

Add:

- Total reports count
- Reports per category
- Recent reports list

---

# 🎨 DESIGN SYSTEM

Colors:
- Primary: #312e81
- Accent: #3b82f6
- Background: #0f172a
- Angry: #ef4444
- Happy: #22c55e

Style:
- Citizen UI → Glassmorphism
- Dashboard → Dark + data-focused

---

# ⚡ REAL-TIME UPDATES

Use polling every 5–10 seconds  
DO NOT use WebSockets

---

# 📁 OUTPUT REQUIREMENTS

Generate:

1. Prisma schema
2. ReportForm.tsx
3. MayorDashboard.tsx
4. /api/reports/route.ts
5. Utility functions:
   - Gemini API client
   - Ward calculation
   - Heatmap data formatter

---

# ⚠️ IMPORTANT RULES

- Keep code clean and modular
- Use TypeScript strictly
- Use reusable components
- Avoid over-engineering
- Focus on working POC

---

# 🎯 FINAL TASK

Start by:

1. Creating project structure
2. Writing Prisma schema
3. Then implement API
4. Then frontend components

Build step by step and ensure all parts connect properly.