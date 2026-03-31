# Development Plan for JanCase Hazaribagh

## Phase 1: Foundation and Data Pipeline
- Create the Next.js 14 app structure with `src/app`, `src/components`, `src/lib`, `prisma`, and API routes.
- Add Prisma with the `Report` model, connect NeonDB, and configure reusable Prisma client access.
- Implement Gemini analysis utility with retry, exponential backoff, strict JSON parsing, and fallback behavior.
- Add ward calculation, heatmap formatting, and seed data generation for 100 fake reports.
- Build `POST /api/reports` and a matching read endpoint for dashboard consumption.

## Phase 2: Citizen Reporting Experience
- Build `ReportForm.tsx` with a mobile-first glassmorphism UI.
- Support text-only, image-only, or mixed submissions and block fully empty reports.
- Upload images through Google Drive integration and submit resulting URLs to the reports API.
- Add loading shimmer, disabled submit states, success feedback, and error handling.

## Phase 3: Mayor Dashboard and Monitoring
- Build `MayorDashboard.tsx` with a dark monitoring interface.
- Render a React-Leaflet map, pending-only heatmap, total counts, category breakdowns, ward sentiment, and recent reports.
- Refresh dashboard data through polling every 5 to 10 seconds.
- Trigger emoji flood animations for newly detected `angry` and `happy` reports.
