# 🌱 Youth Opportunity & Skills Portal

A mobile-first web portal that aggregates South African youth opportunities — learnerships, internships, bursaries, courses and skills programmes — in one accessible location.

---

## 🔗 Live Demo and Repository

- **Live website:** Add the deployed GitHub Pages, Netlify, or Vercel URL here after publishing.
- **GitHub repository:** Add the repository URL here after creating the repository.
- **Deployment method:** GitHub Pages is recommended because this is a static site.

> Do not publish or commit API keys, passwords, tokens, or private environment variables.

---

## 📸 Screenshots

Screenshots are intentionally not included because they must be captured from the deployed or locally running website. Capture at least:

- Home page on desktop
- Opportunities page on desktop
- Opportunity details page on mobile
- Career resources page on mobile
- Contact and report page on mobile

Place the image files in a `screenshots/` folder and use them in this README. The project must not contain placeholder image files that appear as broken links.

---

## 🧭 Wireframes

The wireframes below show the visual structure only. They do not change the website design.

### Home Page

```text
[Header] [Hero with search] [Statistics] [Categories]
[Featured Opportunities] [Closing Soon] [Partner Organisations]
[Career Resources CTA] [Footer]
```

### Opportunities Page

```text
[Header] [Page title] [Search + Category + Location + Experience + Closing + Sort]
[Results count] [Opportunity cards] [Pagination] [Footer]
```

### Opportunity Details Page

```text
[Header] [Opportunity title and status] [About] [Requirements]
[Qualifications] [Documents] [Application Instructions] [Official Source]
[Apply Now] [Back to Opportunities] [Footer]
```

---

## 🎯 Problem Statement

Young South Africans often search across multiple websites, social media platforms and informal channels for jobs, learnerships, internships, courses, bursaries and career events. This information is frequently difficult to find, spread across platforms, outdated, or unclear about requirements.

---

## ✅ Features Implemented

### Core Features
- [x] Keyword search across title, organisation, description and tags
- [x] Category filter (Learnership, Internship, Bursary, Course, Skills Programme)
- [x] Location filter
- [x] Experience level filter (Entry, Student, Graduate)
- [x] Closing date filter (This week, This month, Still open)
- [x] Sorting by deadline, title, organisation or newest
- [x] Dynamic opportunity cards with badges and metadata
- [x] Deadline countdown badges (🔥 urgent, ⏳ soon, ✅ open)
- [x] Pagination (9 cards per page)
- [x] Empty state with clear filters button
- [x] Form validation with accessible error messages
- [x] Mobile-first responsive design
- [x] Hamburger navigation for mobile

### Pages
- [x] Home page with hero, search, stats, categories, featured opportunities, deadlines, partner organisations
- [x] Opportunities listing page with full filter bar and sorting
- [x] Opportunity details page with full description, eligibility, documents, application and source links
- [x] Saved Opportunities page with localStorage persistence and removal controls
- [x] CV Builder page with live preview, localStorage persistence, validation, print and clear controls
- [x] Career resources page (CV, cover letter, interview, professional profile, scam awareness)
- [x] Contact & Report page with three tabbed forms

### Advanced Features
- [x] Save/bookmark opportunities (localStorage)
- [x] Recently viewed tracking (localStorage)
- [x] CV drafts stored only in the browser (localStorage)
- [x] URL parameter pre-filtering (e.g. `?category=learnership`)
- [x] Dark mode (respects system preference)
- [x] Toast notifications
- [x] Scam warning banner
- [x] Closing-soon labels
- [x] Browser print support for CV drafts

---

## 🏢 Partner Organisations Featured

| Organisation | Type | Website |
|---|---|---|
| Capaciti | ICT Learnerships & Internships | capaciti.org.za |
| Life Choices Academy | Digital Skills Programme | lifechoices.co.za |
| Beautiful Gate | Community Skills Training | beautifulgate.org.za |
| Chrysalis Academy | Youth Leadership & Vocational | chrysalisacademy.org.za |
| Harambee | Youth Employment Accelerator | harambee.co.za |
| WeThinkCode_ | Free Software Development | wethinkcode.co.za |
| NSFAS | Student Financial Aid | nsfas.org.za |
| Seda | Small Enterprise Development | seda.org.za |
| Eskom | Engineering Bursaries | eskom.co.za |
| Absa | Graduate Programme | absa.co.za |

---

## 🛠️ Technologies Used

- HTML5 (semantic elements)
- CSS3 (Flexbox, CSS Grid, custom properties, media queries)
- Vanilla JavaScript (ES6+)
- Live opportunity records from the authenticated backend API
- localStorage (saved opportunities, recently viewed)
- Optional Node.js / Express / SQLite API (`backend/`)

Backend setup, API route permissions, and Postman testing instructions are in [backend/README.md](backend/README.md).

### Run locally

Install backend dependencies once with `npm --prefix backend install`. From the project root, run `npm run dev`; it reuses a healthy API already listening on the configured port. Serve the frontend at `http://localhost:5500` with VS Code Live Server or `python -m http.server 5500`, then open `http://localhost:5500/account.html`. Run backend tests with `npm test`.

---

## 📁 Project Structure

```
Youth_Opportunity&Skills Portal/
├── index.html                  # Home page
├── opportunities.html          # Opportunities listing
├── opportunity-details.html    # Single opportunity details
├── saved-opportunities.html    # Saved opportunity collection
├── cv-builder.html            # CV form and live preview
├── resources.html              # Career resources
├── contact.html                # Contact & report forms
├── css/
│   └── style.css               # All styles (mobile-first)
├── js/
│   ├── opportunity-data.js     # API response mapping + categories/locations
│   ├── app.js                  # Shared utilities (cards, nav, save, toast)
│   ├── opportunities.js        # Filter, search, sort, pagination logic
│   ├── details.js              # Details page rendering
│   ├── saved.js                # Saved opportunity rendering
│   ├── cv-builder.js          # CV persistence, preview and print logic
│   └── contact.js              # Form validation
└── README.md
```

---

## ♿ Accessibility

- Semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`)
- Skip to main content link
- ARIA labels on interactive elements
- ARIA live regions for dynamic content
- Keyboard-navigable forms and navigation
- Visible focus states
- Sufficient colour contrast (WCAG AA)
- Readable font sizes (minimum 0.8rem)
- Clear validation error messages with `role="alert"`

---

## ⚠️ Responsible Content

- Public opportunities are served only from verified, unexpired backend records
- Each public card displays its verification state and last-checked date
- Application links open the opportunity's direct official application page
- Scam warning displayed prominently on home page and details page

## Official Opportunity Data

The current workspace uses the SQLite API in `backend/`; it has no configured Supabase URL, Supabase client, or Supabase migration. Opportunity records are added through the admin page at `admin/opportunities.html`, saved as unverified drafts, and published only after an administrator checks the specific official notice and direct application page. See [backend setup and verification workflow](backend/README.md).

No automated collector is enabled. The checked official source pages do not expose a public structured feed in the available evidence; see the backend README for the pages checked and the manual verification steps. Do not put Supabase service-role credentials or other private keys in frontend code.
- Expired opportunities policy: reviewed and removed on the first Monday of each month
- Date added/updated shown on each opportunity

---

## 🚧 Known Limitations

- Forms do not send real emails (front-end only demonstration)
- The static frontend remains usable without the optional backend; API-backed accounts and records require the backend and its local SQLite database to be running
- No real-time opportunity updates
- Saved opportunities and CV drafts are stored in browser localStorage only and are not synced across devices
- Application links must be confirmed by the user before submission

---

## 🚀 Deployment

The site is a static GitHub Pages-compatible project. Publish the repository root and configure the Pages source as the repository root. No build step or application server is required.

## 🚀 Recommended Future Improvements

- Backend API with real opportunity data
- User authentication and profiles
- Email notifications for closing deadlines
- Organisation dashboard to submit and manage opportunities
- Advanced search with full-text indexing
- Accessibility audit with screen reader testing
- Integration with SETA and government opportunity feeds

---

## 📋 User Stories

1. As a young job seeker, I want to search for opportunities by keyword so I can quickly find relevant listings.
2. As a student, I want to filter by category so I can find bursaries specifically.
3. As a recent graduate, I want to see the closing date clearly so I don't miss deadlines.
4. As a mobile user, I want the site to work well on my phone so I can browse on the go.
5. As a community organisation, I want to suggest a new opportunity so it can reach more youth.
6. As a user, I want to save opportunities so I can come back to them later.

---

## 🧪 Testing Evidence

| Check | Evidence |
|---|---|
| Desktop browsers | Chrome, Firefox, Edge |
| Mobile viewports | 375px, 414px, 768px |
| Search | Keyword, location, service, and natural-language queries |
| Filters | Category, location, experience, closing date, and sorting |
| Empty results | Verified message and clear-filter action |
| Forms | Empty fields, invalid email, and successful submission validation |
| Accessibility | Semantic landmarks, labels, focus states, ARIA live regions, and keyboard navigation |
| Responsive layout | Desktop and mobile viewport checks |
| Search feature | Existing organisation data only; no fake organisations added |
| Static diagnostics | No JavaScript, HTML, or CSS errors reported |

> Replace the testing table with the exact browser and device evidence from your final test run. Do not claim a browser was tested unless it was actually tested.

## 👤 User Journey

1. The user opens the home page and understands the portal's purpose.
2. The user searches for a city, province, service, or youth opportunity.
3. The user reviews matching opportunity cards and their locations.
4. The user applies category, location, experience, or closing-date filters.
5. The user opens an opportunity to review eligibility, qualifications, documents, and application instructions.
6. The user confirms the official source and application deadline before applying.
7. The user can save an opportunity or report incorrect information.

## 📦 Submission Checklist

- [ ] Live deployment URL is added.
- [ ] GitHub repository URL is added.
- [ ] Desktop and mobile screenshots are added.
- [ ] Wireframes are included.
- [ ] User journey is documented.
- [ ] Testing evidence is updated with actual results.
- [ ] Project files are committed to Git.
- [ ] The deployed site is tested after the latest changes.
- [ ] No API keys or private credentials are committed.
- [ ] Every public opportunity has a checked official notice, direct application URL, and future closing date.
- [ ] Expired opportunity removal policy is documented.
- [ ] Scam warning and reporting process are available.

---

*Built for the Week 4 Youth Opportunity & Skills Portal project · June 2025*
