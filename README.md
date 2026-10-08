# 🌱 Youth Opportunity & Skills Portal

A mobile-first web portal that aggregates South African youth opportunities — learnerships, internships, bursaries, courses and skills programmes — in one accessible location.

---

## 🔗 Live Demo

> Deploy to GitHub Pages, Netlify or Vercel and paste your link here.

---

## 📸 Screenshots

> Add screenshots of each page here after deployment.

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
- [x] Dynamic opportunity cards with badges and metadata
- [x] Deadline countdown badges (🔥 urgent, ⏳ soon, ✅ open)
- [x] Pagination (9 cards per page)
- [x] Empty state with clear filters button
- [x] Form validation with accessible error messages
- [x] Mobile-first responsive design
- [x] Hamburger navigation for mobile

### Pages
- [x] Home page with hero, search, stats, categories, featured opportunities, deadlines, partner organisations
- [x] Opportunities listing page with full filter bar
- [x] Opportunity details page with full description, eligibility, documents, apply button
- [x] Career resources page (CV, cover letter, interview, professional profile, scam awareness)
- [x] Contact & Report page with three tabbed forms

### Advanced Features
- [x] Save/bookmark opportunities (localStorage)
- [x] Recently viewed tracking (localStorage)
- [x] URL parameter pre-filtering (e.g. `?category=learnership`)
- [x] Dark mode (respects system preference)
- [x] Toast notifications
- [x] Scam warning banner
- [x] Closing-soon labels

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
- JSON dataset (`js/data.js`)
- localStorage (saved opportunities, recently viewed)

---

## 📁 Project Structure

```
Youth_Opportunity&Skills Portal/
├── index.html                  # Home page
├── opportunities.html          # Opportunities listing
├── opportunity-details.html    # Single opportunity details
├── resources.html              # Career resources
├── contact.html                # Contact & report forms
├── css/
│   └── style.css               # All styles (mobile-first)
├── js/
│   ├── data.js                 # JSON dataset + categories/locations
│   ├── app.js                  # Shared utilities (cards, nav, save, toast)
│   ├── opportunities.js        # Filter, search, pagination logic
│   ├── details.js              # Details page rendering
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

- All opportunities are sample/demonstration data
- Each opportunity is clearly labelled as a sample
- Application links point to real organisation websites for reference only
- Scam warning displayed prominently on home page and details page
- Expired opportunities policy: reviewed and removed on the first Monday of each month
- Date added/updated shown on each opportunity

---

## 🚧 Known Limitations

- Forms do not send real emails (front-end only demonstration)
- No backend or database — data is static JSON
- No real-time opportunity updates
- Saved opportunities stored in browser localStorage only (not synced across devices)

---

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

- Tested on Chrome, Firefox and Edge (desktop)
- Tested on mobile viewport (375px, 414px, 768px)
- Filter combinations tested for correct results and empty states
- Form validation tested with empty fields, invalid email, short messages
- Keyboard navigation tested through all interactive elements
- Dark mode tested via browser DevTools

---

*Built for the Week 4 Youth Opportunity & Skills Portal project · June 2025*
