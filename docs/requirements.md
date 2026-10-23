# Requirements: One-Time Dinner Bill Splitter

**Product Name (working):** DinnerSplit  
**Version:** 1.0 (MVP)  
**Last Updated:** 2026-10-23  

---

## 1. Vision & Goal

Build a **fast, frictionless web tool** for splitting a restaurant bill among friends **right at the table**.

### Core Promise
> Open the site → Split the bill → Share the result.  
> No account. No app download. No waiting.

### Target Situation
- 2–10 people at a restaurant
- Bill just arrived
- Everyone has a phone
- They want a fair split **in under 60 seconds**

---

## 2. Core Principles

| Principle              | Meaning                                      |
|------------------------|----------------------------------------------|
| Zero Friction          | No sign-up, no login, no email               |
| Mobile-first           | Optimized for phone use at the table         |
| Instant                | Result ready in < 60 seconds                 |
| Shareable              | One link/QR that anyone can open             |
| Simple                 | Only features needed for one dinner          |
| Private                | No server-side storage of bill data (prefer client-side) |

---

## 3. Out of Scope (MVP)

- User accounts / login
- OCR / receipt photo scanning
- AI features
- Ongoing group history / multi-day trips
- Recurring expenses
- Payment processing (Venmo/PayPal deep links are optional later)
- Currency conversion (can be added later)
- Offline PWA features (nice-to-have later)

---

## 4. User Flow (Happy Path)

1. User opens the website on phone
2. Sees a clean “Start splitting” screen
3. Adds people (names only)
4. Enters bill total **or** adds items one by one
5. Optionally sets tip % and tax
6. Chooses split method (Equal / Custom / By Item)
7. Sees clear result: who owes what
8. Shares via link or QR code
9. Friends open the same result on their phones

---

## 5. Functional Requirements

### 5.1 People Management
- [ ] Add people by name (minimum 2)
- [ ] Edit or remove a person
- [ ] Maximum recommended: 12 people (soft limit)
- [ ] Names are local only (not stored on server)

### 5.2 Bill Input
Two modes (user can switch):

**A. Simple Total Mode (default)**
- [ ] Enter total bill amount
- [ ] Optional: Tip percentage (0%, 10%, 15%, 18%, 20%, 25%, or custom)
- [ ] Optional: Tax amount or tax percentage
- [ ] Automatically calculate final total

**B. Itemized Mode**
- [ ] Add individual items (name + price)
- [ ] Assign each item to one or more people
- [ ] Support shared items (e.g. appetizer split between 3 people)
- [ ] Tip and tax applied to the whole bill proportionally

### 5.3 Split Methods
- [ ] **Equal split** (default)
- [ ] **Custom amount** per person
- [ ] **Percentage** per person
- [ ] **By item** (only available in Itemized Mode)

### 5.4 Settlement Result
- [ ] Show clear list: “Alex pays $32.50”, “Sam pays $28.00”…
- [ ] Show who paid the original bill (optional field)
- [ ] Calculate **minimum number of transfers** (who should pay whom)
- [ ] Display total tip and tax clearly
- [ ] Rounding: handle cents fairly (no missing/extra cents)

### 5.5 Sharing
- [ ] Generate a shareable link that contains the full split result
- [ ] Generate a QR code for the same link
- [ ] Copy summary text (for WhatsApp / iMessage)
- [ ] Optional: Download as simple image or PDF (nice-to-have)

### 5.6 Data & Privacy
- [ ] Prefer client-side only (data lives in the URL or browser memory)
- [ ] No required server storage for MVP
- [ ] No tracking of personal data
- [ ] Clear message: “Nothing is saved on our servers”

---

## 6. Non-Functional Requirements

| Category          | Requirement                                      |
|-------------------|--------------------------------------------------|
| Performance       | First meaningful paint < 1.5s on mobile          |
| Mobile UX         | Fully usable with one hand on phone              |
| Browser Support   | Modern Chrome, Safari, Firefox, Edge             |
| Accessibility     | Basic keyboard + screen reader support           |
| Design            | Clean, calm, high-contrast, restaurant-friendly  |
| Language          | English first (easy to expand later)             |

---

## 7. UI / UX Guidelines

- Large touch targets
- Minimal typing required
- Clear primary action at every step
- Progress feels instant
- Result screen should be easy to screenshot
- Avoid clutter — only show what is needed for the current step

---

## 8. Technical Suggestions (MVP)

- **Frontend only** is enough for v1
- Framework: any modern stack (React, Vue, Svelte, or even vanilla)
- State can live in URL (shareable) or local memory
- Hosting: Vercel / Netlify / Cloudflare Pages (free tier is fine)
- No database required for core flow

---

## 9. Success Metrics (MVP)

- Time from open → shareable result < 60 seconds
- Mobile bounce rate low
- High share rate (people actually send the link)
- Positive feedback on simplicity

---

## 10. Future Ideas (After MVP)

- Multi-currency support
- Save recent people list (localStorage)
- Receipt photo (OCR) as optional power feature
- “Who paid” + payment request deep links
- Dark mode
- PWA / Add to Home Screen

---

## 11. Open Questions

1. Should tip be calculated before or after tax? (default: tip on subtotal)
2. Do we support “someone already paid part of the bill”?
3. Maximum number of people we want to optimize for?

---

**Status:** Ready for design & development  
**Priority:** Ship a usable MVP as fast as possible.  
