/**
 * Map for "Noodweer": cities in the Netherlands, Belgium and the north-west of Germany.
 * Each city belongs to one of four weather threats (colors).
 */

export type Color = 0 | 1 | 2 | 3;

export interface ThreatDef {
  name: string;
  short: string;
  hex: string;
}

export const THREATS: ThreatDef[] = [
  { name: 'Hoogwater', short: 'water', hex: '#2f6fd6' },
  { name: 'Brand', short: 'vuur', hex: '#d23a2f' },
  { name: 'Storm', short: 'storm', hex: '#d9a400' },
  { name: 'IJzel', short: 'ijs', hex: '#6fb3c6' }
];

export interface City {
  id: number;
  name: string;
  color: Color;
  x: number;
  y: number;
  neighbors: number[];
}

// [name, color, latitude, longitude]
const RAW: [string, Color, number, number][] = [
  // Hoogwater: west and middle of the Netherlands
  ['Amsterdam', 0, 52.37, 4.90],
  ['Rotterdam', 0, 51.92, 4.48],
  ['Den Haag', 0, 52.08, 4.30],
  ['Utrecht', 0, 52.09, 5.12],
  ['Amersfoort', 0, 52.16, 5.39],
  ['Zwolle', 0, 52.52, 6.08],
  ['Alkmaar', 0, 52.63, 4.75],
  ['Leeuwarden', 0, 53.20, 5.79],
  ['Arnhem', 0, 51.98, 5.91],
  // Brand: Ruhr area and Rhineland
  ['Essen', 1, 51.46, 7.01],
  ['Düsseldorf', 1, 51.23, 6.78],
  ['Keulen', 1, 50.94, 6.96],
  ['Bonn', 1, 50.73, 7.10],
  ['Aken', 1, 50.78, 6.08],
  ['Dortmund', 1, 51.51, 7.47],
  ['Venlo', 1, 51.37, 6.17],
  ['Siegen', 1, 50.87, 8.02],
  ['Kassel', 1, 51.31, 9.48],
  // Storm: Belgium and the south of the Netherlands
  ['Antwerpen', 2, 51.22, 4.40],
  ['Brussel', 2, 50.85, 4.35],
  ['Gent', 2, 51.05, 3.72],
  ['Brugge', 2, 51.21, 3.22],
  ['Breda', 2, 51.59, 4.78],
  ['Eindhoven', 2, 51.44, 5.47],
  ['Maastricht', 2, 50.85, 5.69],
  ['Luik', 2, 50.63, 5.57],
  ['Namen', 2, 50.47, 4.87],
  // IJzel: the north
  ['Groningen', 3, 53.22, 6.57],
  ['Emden', 3, 53.37, 7.21],
  ['Bremen', 3, 53.08, 8.80],
  ['Hamburg', 3, 53.55, 9.99],
  ['Hannover', 3, 52.37, 9.73],
  ['Osnabrück', 3, 52.28, 8.05],
  ['Bielefeld', 3, 52.02, 8.53],
  ['Münster', 3, 51.96, 7.63],
  ['Enschede', 3, 52.22, 6.89]
];

const EDGES: [string, string][] = [
  ['Alkmaar', 'Amsterdam'], ['Alkmaar', 'Leeuwarden'],
  ['Leeuwarden', 'Groningen'], ['Leeuwarden', 'Zwolle'],
  ['Amsterdam', 'Den Haag'], ['Amsterdam', 'Utrecht'], ['Amsterdam', 'Amersfoort'],
  ['Den Haag', 'Rotterdam'], ['Den Haag', 'Utrecht'],
  ['Rotterdam', 'Utrecht'], ['Rotterdam', 'Breda'], ['Rotterdam', 'Brugge'],
  ['Utrecht', 'Amersfoort'], ['Utrecht', 'Arnhem'],
  ['Amersfoort', 'Zwolle'], ['Amersfoort', 'Arnhem'], ['Amersfoort', 'Essen'],
  ['Zwolle', 'Enschede'], ['Zwolle', 'Groningen'],
  ['Arnhem', 'Enschede'], ['Arnhem', 'Venlo'],

  ['Brugge', 'Gent'],
  ['Gent', 'Antwerpen'], ['Gent', 'Brussel'],
  ['Antwerpen', 'Breda'], ['Antwerpen', 'Brussel'], ['Antwerpen', 'Eindhoven'],
  ['Breda', 'Eindhoven'],
  ['Brussel', 'Namen'], ['Brussel', 'Luik'],
  ['Namen', 'Luik'],
  ['Luik', 'Maastricht'], ['Luik', 'Aken'],
  ['Maastricht', 'Eindhoven'], ['Maastricht', 'Aken'],
  ['Eindhoven', 'Venlo'],

  ['Venlo', 'Düsseldorf'],
  ['Aken', 'Keulen'],
  ['Keulen', 'Bonn'], ['Keulen', 'Düsseldorf'],
  ['Düsseldorf', 'Essen'],
  ['Essen', 'Dortmund'], ['Essen', 'Münster'],
  ['Dortmund', 'Münster'], ['Dortmund', 'Siegen'], ['Dortmund', 'Kassel'], ['Dortmund', 'Bielefeld'],
  ['Bonn', 'Siegen'],
  ['Siegen', 'Kassel'],
  ['Kassel', 'Hannover'],

  ['Groningen', 'Emden'],
  ['Emden', 'Bremen'], ['Emden', 'Osnabrück'],
  ['Enschede', 'Münster'], ['Enschede', 'Osnabrück'],
  ['Münster', 'Osnabrück'],
  ['Osnabrück', 'Bielefeld'], ['Osnabrück', 'Bremen'],
  ['Bielefeld', 'Hannover'],
  ['Bremen', 'Hamburg'], ['Bremen', 'Hannover'],
  ['Hamburg', 'Hannover']
];

export const MAP_WIDTH = 1000;
export const MAP_HEIGHT = 780;

const SCALE = 215;
const project = (lat: number, lon: number) => ({
  x: Math.round((lon - 2.75) * 0.62 * SCALE),
  y: Math.round((53.85 - lat) * SCALE)
});

/** Hand-placed positions where real geography would put labels on top of each other. */
const OVERRIDES: { [name: string]: { x: number; y: number } } = {
  'Alkmaar': { x: 262, y: 235 },
  'Arnhem': { x: 430, y: 428 },
  'Düsseldorf': { x: 522, y: 578 },
  'Amsterdam': { x: 280, y: 320 },
  'Den Haag': { x: 180, y: 375 },
  'Rotterdam': { x: 215, y: 455 },
  'Utrecht': { x: 300, y: 400 },
  'Amersfoort': { x: 375, y: 345 },
  'Maastricht': { x: 395, y: 630 },
  'Luik': { x: 365, y: 700 },
  'Aken': { x: 460, y: 665 },
  'Keulen': { x: 578, y: 645 },
  'Bonn': { x: 628, y: 718 }
};

export const CITIES: City[] = RAW.map(([name, color, lat, lon], id) => ({
  id, name, color, ...(OVERRIDES[name] || project(lat, lon)), neighbors: []
}));

const byName = new Map(CITIES.map(c => [c.name, c] as [string, City]));
for (const [a, b] of EDGES) {
  const ca = byName.get(a);
  const cb = byName.get(b);
  if (!ca || !cb) {
    throw new Error('Unknown city in edge: ' + a + ' - ' + b);
  }
  ca.neighbors.push(cb.id);
  cb.neighbors.push(ca.id);
}

export const CITY_ID = (name: string): number => byName.get(name).id;
