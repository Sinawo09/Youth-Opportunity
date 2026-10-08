(() => {
  const PROVINCES = [
    'eastern cape',
    'free state',
    'gauteng',
    'kwa zulu natal',
    'kzulu natal',
    'kwazulu natal',
    'kzn',
    'limpopo',
    'mpumalanga',
    'northern cape',
    'north west',
    'western cape'
  ];

  const PROVINCE_ALIASES = {
    'eastern cape': 'Eastern Cape',
    'free state': 'Free State',
    'gauteng': 'Gauteng',
    'kwa zulu natal': 'KwaZulu-Natal',
    'kzulu natal': 'KwaZulu-Natal',
    'kwazulu natal': 'KwaZulu-Natal',
    'kzn': 'KwaZulu-Natal',
    'limpopo': 'Limpopo',
    'mpumalanga': 'Mpumalanga',
    'northern cape': 'Northern Cape',
    'north west': 'North West',
    'western cape': 'Western Cape'
  };

  const CITY_ALIASES = {
    'cape town': 'Cape Town',
    'johannesburg': 'Johannesburg',
    'soweto': 'Johannesburg',
    'pretoria': 'Pretoria',
    'durban': 'Durban'
  };

  const SERVICE_TERMS = [
    { terms: ['skills', 'skill', 'training', 'train', 'learnership', 'learning', 'course', 'education'], label: 'skills or training' },
    { terms: ['employment', 'employed', 'job', 'jobs', 'work', 'workplace', 'employment support'], label: 'employment or work' },
    { terms: ['unemployed', 'unemployment', 'job seeker', 'job seekers', 'young people', 'youth'], label: 'youth support' },
    { terms: ['internship', 'internships'], label: 'internships' },
    { terms: ['bursary', 'bursaries', 'funding'], label: 'bursaries or funding' },
    { terms: ['entrepreneurship', 'business', 'enterprise'], label: 'entrepreneurship' },
    { terms: ['support', 'helping', 'help', 'development', 'guidance'], label: 'support' }
  ];

  const LOCATION_TERMS = [...PROVINCES, ...Object.keys(CITY_ALIASES)];

  function normalise(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/[-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parseYouthSearch(query) {
    const text = normalise(query);
    const detectedProvince = PROVINCES.find(province => text.includes(province));
    const detectedCity = Object.keys(CITY_ALIASES).find(city => text.includes(city));
    const service = SERVICE_TERMS.find(group => group.terms.some(term => text.includes(term)));
    const detectedLocations = [];

    if (detectedProvince) detectedLocations.push(PROVINCE_ALIASES[detectedProvince]);
    if (detectedCity) detectedLocations.push(CITY_ALIASES[detectedCity]);

    return {
      text,
      location: detectedLocations[0] || null,
      locations: detectedLocations,
      province: detectedProvince ? PROVINCE_ALIASES[detectedProvince] : null,
      city: detectedCity ? CITY_ALIASES[detectedCity] : null,
      service: service ? service.label : null,
      serviceTerms: service ? service.terms.filter(term => text.includes(term)) : [],
      queryTerms: text.split(' ').filter(term => term.length > 2)
    };
  }

  function searchableText(opportunity) {
    return normalise([
      opportunity.title,
      opportunity.organisation,
      opportunity.description,
      opportunity.fullDescription,
      opportunity.category,
      opportunity.location,
      ...(opportunity.tags || []),
      ...(opportunity.eligibility || []),
      ...(opportunity.qualifications || []),
      ...(opportunity.requirements || [])
    ].join(' '));
  }

  function calculateRelevance(opportunity, analysis) {
    const text = searchableText(opportunity);
    let score = 0;
    const matchedTerms = [];

    if (analysis.locations.length) {
      const exactLocation = analysis.locations.find(location => text.includes(normalise(location)));
      if (exactLocation) {
        score += 80;
        matchedTerms.push(exactLocation);
      }
    } else if (analysis.city || analysis.province) {
      score += 20;
      matchedTerms.push(analysis.location || analysis.city || analysis.province);
    }

    if (analysis.serviceTerms.length) {
      analysis.serviceTerms.forEach(term => {
        if (text.includes(term)) {
          score += 28;
          matchedTerms.push(term);
        }
      });
    }

    analysis.queryTerms.forEach(term => {
      if (text.includes(term)) score += 4;
    });

    if (/youth|young people|young south africans/.test(analysis.text)) score += 6;
    if (/unemployed|employment|job|skills|training|learnership|internship|bursary/.test(analysis.text)) score += 8;

    return { score: Math.min(score, 200), matchedTerms };
  }

  function searchYouthOrganisations(query, options = {}) {
    const analysis = parseYouthSearch(query);
    const source = options.organisations || globalThis.opportunities || [];
    const limit = Number.isFinite(options.limit) ? Math.max(0, options.limit) : source.length;

    const results = source
      .map(opportunity => ({
        opportunity,
        ...calculateRelevance(opportunity, analysis)
      }))
      .filter(result => !analysis.text || result.score > 0)
      .sort((a, b) => b.score - a.score || a.opportunity.title.localeCompare(b.opportunity.title))
      .slice(0, limit)
      .map(({ opportunity, score, matchedTerms }) => ({
        ...opportunity,
        searchScore: score,
        searchMatchedTerms: matchedTerms
      }));

    return {
      query: analysis.text,
      analysis,
      results,
      source: 'existing-data',
      totalAvailable: source.length
    };
  }

  function initYouthSearchBar() {
    const form = document.querySelector('.search-bar');
    const input = form?.querySelector('input[type="search"]');
    const button = form?.querySelector('button[type="submit"]');
    if (!form || !input || !button) return;

    form.addEventListener('submit', event => {
      event.preventDefault();
      const query = input.value.trim();
      if (!query) {
        input.focus();
        return;
      }

      button.disabled = true;
      button.textContent = 'Searching…';
      button.setAttribute('aria-busy', 'true');

      window.setTimeout(() => {
        const params = new URLSearchParams({ search: query });
        window.location.href = `opportunities.html?${params.toString()}`;
      }, 220);
    });
  }

  globalThis.searchYouthOrganisations = searchYouthOrganisations;
  globalThis.parseYouthSearch = parseYouthSearch;
  globalThis.initYouthSearchBar = initYouthSearchBar;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initYouthSearchBar);
    else initYouthSearchBar();
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { searchYouthOrganisations, parseYouthSearch };
  }
})();
