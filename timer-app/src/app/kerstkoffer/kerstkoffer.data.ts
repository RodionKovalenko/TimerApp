/**
 * "De Kerstkoffer": an escape room in the browser. Every chapter is one lock with a puzzle,
 * three hints of increasing strength, and the accepted answers (compared after normalizing).
 */
export interface Chapter {
  id: 'trein' | 'kaarsen' | 'cadeaus' | 'mijn' | 'kaart' | 'finale';
  title: string;
  story: string;
  question: string;
  answers: string[];
  placeholder: string;
  hints: string[];
  /** Letter found behind the lock; needed for the final lock. */
  letter?: string;
  solved: string;
}

export const INTRO = {
  title: 'De Kerstkoffer',
  text: [
    'Het is kerstavond. Als jullie thuiskomen, staat er midden in de gang een oude houten koffer. '
    + 'Er zitten vijf sloten op, en onder het handvat zit een envelop.',
    '“Lieve jullie,” staat er in krullende letters, “in deze koffer zit iets wat alleen voor jullie twee bedoeld is. '
    + 'Elk slot vraagt om een code. Achter elk slot ligt een letter. Bewaar ze goed, want het laatste slot '
    + 'gaat alleen open met alle vijf. Lukt het niet? Kijk dan naar de hints, ik help graag een beetje. '
    + 'Werk samen. — De Kerstuil 🦉”'
  ]
};

export const ENDING = [
  'Klik. Het laatste slot springt open en het deksel gaat langzaam omhoog.',
  'In de koffer ligt een dik kaartje met een gouden rand. Er staat maar één zin op:',
  '“Het mooiste cadeau zit niet in een koffer, maar in hoe jullie hem samen openmaakten.”',
  'Daaronder, in kleine letters: “Fijne kerst, van Essen tot Amersfoort. — De Kerstuil 🦉”'
];

export const CHAPTERS: Chapter[] = [
  {
    id: 'trein',
    title: 'Slot 1: De reis',
    story: 'Op het eerste slot zit een oud treinkaartje geplakt: Amersfoort → Essen, overstap in Arnhem. '
      + 'Het slot heeft vier cijferwieltjes. Op de achterkant van het kaartje staat: '
      + '“We kwamen om 14:52 aan in Essen. Overstappen in Arnhem duurt minstens 10 minuten. '
      + 'We namen de láátste trein uit Amersfoort waarmee dat nog lukte.”',
    question: 'Hoe laat vertrok die trein uit Amersfoort? (4 cijfers)',
    answers: ['1233'],
    placeholder: '0000',
    hints: [
      'Begin aan het einde: met welke trein uit Arnhem kwamen jullie om 14:52 in Essen aan?',
      'De trein van 13:37 uit Arnhem komt om 14:52 aan. Jullie moeten dus uiterlijk om 13:27 in Arnhem zijn.',
      'De trein van 12:48 komt pas om 13:30 aan (te laat voor 10 minuten overstap). De laatste die wel lukt: 12:33. Code: 1233.'
    ],
    letter: 'E',
    solved: 'Het eerste slot klikt open. In het vakje erachter ligt een kaartje met de letter E.'
  },
  {
    id: 'kaarsen',
    title: 'Slot 2: De kaarsen',
    story: 'Achter het eerste slot ligt een rij kaarsjes en een papiertje met vreemde letters: PTUUJQUTTWY. '
      + 'Eronder staat: “Tel de vlammen. Zoveel plaatsen schuif je elke letter terug in het alfabet. '
      + 'Dan weet je bij welke poort ik op jullie wacht.”',
    question: 'Welk woord staat er op het papiertje?',
    answers: ['koppelpoort', 'dekoppelpoort'],
    placeholder: 'woord',
    hints: [
      'Tel alleen de kaarsen die branden, niet de kaarsen die uit zijn.',
      'Er branden 5 kaarsen. Schuif elke letter 5 plaatsen terug: P wordt K, T wordt O.',
      'PTUUJQUTTWY wordt KOPPELPOORT, de beroemde waterpoort van Amersfoort.'
    ],
    letter: 'A',
    solved: 'Het tweede slot gaat open. Tussen de kaarsjes vinden jullie een kaartje met de letter A.'
  },
  {
    id: 'cadeaus',
    title: 'Slot 3: Drie cadeaus',
    story: 'Het derde slot heeft geen cijfers, maar drie gekleurde knoppen: rood, groen en goud. '
      + 'Ernaast ligt een briefje over drie cadeaus die de Kerstuil vorig jaar heeft gebracht, '
      + 'aan Anna, Bram en Cees: een sjaal, een boek en een kaars, elk in een andere kleur papier.',
    question: 'In welke kleur papier zat de kaars?',
    answers: ['groen'],
    placeholder: 'kleur',
    hints: [
      'Begin bij de zekerste aanwijzing: wie kreeg de kaars?',
      'Cees kreeg de kaars. Anna kreeg geen boek, dus Anna kreeg de sjaal, en die zat in rood papier.',
      'Bram kreeg het boek in goud papier. Dan blijft voor de kaars van Cees alleen groen over.'
    ],
    letter: 'N',
    solved: 'Jullie drukken op de groene knop. Het slot springt open en er valt een kaartje uit met de letter N.'
  },
  {
    id: 'mijn',
    title: 'Slot 4: De mijnlift',
    story: 'Op het vierde slot staat een plaatje van de oude mijnlift van Zollverein in Essen. '
      + 'Op de verdiepingen van de lift staan getallen, maar het laatste getal is weggekrast. '
      + 'Het slot heeft twee cijferwieltjes.',
    question: 'Welk getal hoort op de bovenste verdieping?',
    answers: ['33'],
    placeholder: '00',
    hints: [
      'Kijk naar de verschillen tussen de getallen.',
      'De verschillen zijn 1, 2, 4, 8, … ze verdubbelen steeds.',
      'Het volgende verschil is 16, dus 17 + 16 = 33. (Of: elk getal × 2 − 1.)'
    ],
    letter: 'S',
    solved: 'De wieltjes staan op 33 en het slot gaat open. Achter de mijnlift ligt een kaartje met de letter S.'
  },
  {
    id: 'kaart',
    title: 'Slot 5: De letterkaart',
    story: 'Achter het vierde slot ligt een kaart met letters in een rooster, en een routebeschrijving. '
      + '“Begin bij de ster. Volg de stappen en schrijf de letter op waar je na elke stap uitkomt.”',
    question: 'Welk woord vormen de letters?',
    answers: ['thuis'],
    placeholder: 'woord',
    hints: [
      'De ster staat op de E. “Omhoog” is naar de bovenste rij toe.',
      'Na stap 1 sta je op de T, na stap 2 op de H.',
      'De letters zijn T, H, U, I, S: THUIS.'
    ],
    letter: 'M',
    solved: 'Het vijfde slot gaat open. Onder de kaart ligt het laatste kaartje, met de letter M.'
  },
  {
    id: 'finale',
    title: 'Het laatste slot',
    story: 'Nu is er nog één slot over, het grote slot in het midden. Het heeft vijf letterwieltjes. '
      + 'Op het deksel is iets gegraveerd: “Zo hebben jullie deze koffer geopend, en zo wil ik dat jullie '
      + 'kerst vieren.”',
    question: 'Welk woord maken jullie met de vijf letters?',
    answers: ['samen'],
    placeholder: 'woord',
    hints: [
      'Gebruik alle vijf de letters die jullie gevonden hebben: E, A, N, S, M.',
      'Het woord begint met een S.',
      'SAMEN.'
    ],
    solved: ''
  }
];

/** Lowercase, without spaces, punctuation or accents, so "12:33" matches "1233". */
export function normalize(answer: string): string {
  return (answer || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function isCorrect(chapter: Chapter, answer: string): boolean {
  const a = normalize(answer);
  return chapter.answers.some(x => normalize(x) === a);
}

// Puzzle material shown on the page -----------------------------------------------------------

export const TRAINS_TO_ARNHEM: [string, string][] = [
  ['11:33', '12:11'],
  ['12:03', '12:41'],
  ['12:33', '13:11'],
  ['12:48', '13:30'],
  ['13:03', '13:41']
];

export const TRAINS_TO_ESSEN: [string, string][] = [
  ['12:37', '13:52'],
  ['13:37', '14:52'],
  ['14:37', '15:52']
];

/** true = burning. */
export const CANDLES = [true, false, true, true, false, true, true];

export const GIFT_CLUES = [
  'Anna kreeg geen boek.',
  'Het cadeau in rood papier was een sjaal.',
  'Bram zijn cadeau zat in goud papier.',
  'Cees kreeg de kaars.'
];

export const MINE_NUMBERS = [2, 3, 5, 9, 17];

export const LETTER_GRID = [
  'MATEO',
  'RHKLN',
  'SUWIZ',
  'BDEPG',
  'FCJVY'
];
/** Row and column of the star. */
export const GRID_START: [number, number] = [3, 2];
export const GRID_STEPS = [
  '3 omhoog',
  '1 omlaag en 1 naar links',
  '1 omlaag',
  '2 naar rechts',
  '3 naar links'
];
