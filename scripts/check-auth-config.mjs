const requiredRedirects = [
  'https://trailblazer.advancedanalytica.co.uk/**',
  'http://localhost:4321/**',
  'http://127.0.0.1:4321/**',
];

console.log('Required Supabase redirect URLs:');
requiredRedirects.forEach((value) => console.log(`- ${value}`));
