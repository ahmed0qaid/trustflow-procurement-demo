# Acme Procurement Demo

This is a companion upstream procurement application for TrustFlow Sentinel. It simulates an existing enterprise procurement system creating a payment-destination change request and sending it to TrustFlow.

Its responsibility is:
CREATE → PREPARE → SEND

TrustFlow's responsibility is:
VERIFY → EXTRACT → ENRICH → EVALUATE → REVIEW → AUDIT

Acme does NOT implement TrustFlow policy decisions.

## Setup Instructions

### Prerequisites
- Node.js (v20+)
- npm

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Configuration
Create a `.env.local` file from `.env.example`:
```bash
cp .env.example .env.local
```
Update any URLs if necessary. The default configuration connects to the Xano backend.

### Development
Start the development server:
```bash
npm run dev
```
The app runs on `http://localhost:5174`.

### Build
To build for production:
```bash
npm run build
```

## Demo Presets

Three pre-configured scenarios are available:

| Preset | Scenario | Documents |
|--------|----------|-----------|
| Standard Payment | Same-payee routine payment | Invoice |
| Legitimate Factoring | Third-party payee with supporting docs | Invoice, Assignment, Bank Letter |
| Unauthorized Change | Suspicious payee and domain | Invoice, Bank Letter |

## Technology

- React 19
- TypeScript 5.8
- Vite 7
- lucide-react (icons)
