const fs = require('fs');
const vm = require('vm');

const dataContext = { console };
vm.createContext(dataContext);
vm.runInContext(fs.readFileSync('js/data.js', 'utf8'), dataContext);

const searchContext = { console, opportunities: dataContext.opportunities, URLSearchParams, setTimeout, clearTimeout };
searchContext.globalThis = searchContext;
vm.createContext(searchContext);
vm.runInContext(fs.readFileSync('js/youth-search.js', 'utf8'), searchContext);

const queries = [
  'youth organisations in Cape Town',
  'youth organisations in Gauteng',
  'youth organisations in Johannesburg',
  'youth organisations in Durban',
  'youth organisations offering skills training',
  'organisations helping unemployed youth',
  'organisations for young people in Soweto'
];

for (const query of queries) {
  const result = searchContext.searchYouthOrganisations(query, { organisations: searchContext.opportunities, limit: 10 });
  if (result.results.length === 0) throw new Error('No results: ' + query);
  console.log(query + ' => ' + result.results.length + ' results, top=' + result.results[0].title);
}

const provinces = ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'];
for (const province of provinces) {
  const result = searchContext.parseYouthSearch('youth organisations in ' + province);
  if (result.province !== province) throw new Error('Province parse failed: ' + province + ': ' + JSON.stringify(result));
}

console.log('Requested query checks: 7/7 passed');
console.log('Province parser checks: 9/9 passed');
