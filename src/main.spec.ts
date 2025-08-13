// src/main.spec.ts

// The parseOrigins function you want to test
function parseOrigins(csv?: string) {
  return csv ? csv.split(',').map(s => s.trim()).filter(Boolean) : [];
}

describe('parseOrigins', () => {
  it('should parse a comma-separated string into an array of origins', () => {
    const csv = 'http://localhost:3000, https://example.com ,';
    const result = parseOrigins(csv);
    expect(result).toEqual(['http://localhost:3000', 'https://example.com']);
  });

  it('should return an empty array for an empty or undefined string', () => {
    expect(parseOrigins('')).toEqual([]);
    expect(parseOrigins(undefined)).toEqual([]);
  });

  it('should handle extra spaces correctly', () => {
    const csv = ' http://localhost:4200 , https://api.example.com ';
    const result = parseOrigins(csv);
    expect(result).toEqual(['http://localhost:4200', 'https://api.example.com']);
  });
});