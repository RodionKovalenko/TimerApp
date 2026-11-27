export interface Question {
  id: number;
  round: number;
  text: string;
}

export interface QuestionSet {
  title: string;
  intro?: string;
  /** Word for a round, e.g. "Ronde" or "Niveau". */
  roundLabel: string;
  /** Index 0 is the "all rounds" button. */
  roundNames: string[];
  questions: Question[];
  doneText: string;
  /** "trekt" or "leest voor": what the player whose turn it is does. */
  turnVerb?: string;
  /** Shown after "Jij trekt" / "De ander trekt". */
  turnHint?: string;
  /** Keep a score for two players. */
  scoring?: boolean;
  /** Tabs to switch between related sets. */
  parts?: { label: string; path: string }[];
  storageKey: string;
}

function build(texts: string[], perRound: number): Question[] {
  return texts.map((text, i) => ({ id: i + 1, round: Math.floor(i / perRound) + 1, text }));
}

const KERST_TEXTS: string[] = [
  // Ronde 1: herinneringen
  'Wat is je mooiste kersterinnering uit je kindertijd?',
  'Geloofde je in de kerstman of Sinterklaas? Hoe kwam je erachter?',
  'Welk cadeau is je altijd bijgebleven, en waarom?',
  'Hoe vierde je familie kerst? Wat aten jullie, wie was erbij?',
  'Welk kerstgerecht of welke geur doet je meteen aan thuis denken?',
  'Welk kerstliedje of welke kerstfilm hoort voor jou bij kerst?',
  'Was er een kerst die echt misging? Wat gebeurde er?',
  'Wie in je familie maakte kerst bijzonder?',
  'Welke traditie mis je die er nu niet meer is?',
  'Hoe was kerst in de jaren dat je alleen was?',
  'Wat is het mooiste cadeau dat je ooit aan iemand anders hebt gegeven?',
  'Welke kerst zou je nog één keer willen overdoen?',
  // Ronde 2: wij nu
  'Wat betekent kerst eigenlijk voor jou: familie, rust, geloof, eten?',
  'Ben je eerder een kerstmens of een oud-en-nieuwmens?',
  'Welke traditie van jou zou je met mij willen delen?',
  'Wat zou jij nooit willen missen met kerst, en wat mag weg?',
  'Wat was je eerste indruk van mij, en wat is daarvan veranderd?',
  'Op welk moment sinds september dacht je: dit is echt?',
  'Wat is het mooiste “cadeau” dat je dit jaar van mij kreeg, iets wat geen ding is?',
  'Wat waardeer je aan mij wat je nog nooit hardop hebt gezegd?',
  'Waar was je dit jaar het meest dankbaar voor?',
  'Wat was dit jaar moeilijk voor je?',
  'Wat heb je dit jaar over jezelf geleerd?',
  'Wanneer voel je je het meest thuis bij mij?',
  // Ronde 3: vooruit kijken
  'Hoe ziet jouw ideale kerst eruit over vijf jaar? Waar zijn we, wie zit er aan tafel?',
  'Welke nieuwe traditie zouden wij samen kunnen beginnen?',
  'Kerst in Amersfoort, in Essen, of ergens heel anders?',
  'Hoe zouden we kerst met beide families kunnen combineren?',
  'Wat wil je volgend jaar samen meemaken?',
  'Welke droom wil je in de komende jaren waarmaken?',
  'Wat wil je in het nieuwe jaar anders doen dan dit jaar?',
  'Wat hoop je dat wij over tien jaar nog steeds doen?',
  'Wat wil je dat ik van jou weet, wat ik misschien nog niet weet?',
  'Wat wens je mij voor het nieuwe jaar?',
  'Wat wil je mij nog zeggen voordat het jaar voorbij is?',
  'Kijk elkaar een minuut aan zonder te praten en zeg daarna één ding dat je voelde.'
];

export const KERSTVRAGEN: QuestionSet = {
  title: '36 kerstvragen',
  roundLabel: 'Ronde',
  roundNames: ['Alle', 'herinneringen', 'wij nu', 'vooruit kijken'],
  questions: build(KERST_TEXTS, 12),
  doneText: 'Alle kaartjes zijn getrokken. Fijne kerst! 🎄',
  storageKey: 'kerstvragen-state'
};

const VRAGENKAARTEN_TEXTS: string[] = [
  // Niveau 1: Opwarmen
  'Wat was het mooiste moment van jouw week?',
  'Welk eten uit je jeugd mis je het meest?',
  'Waar kun je om lachen terwijl je weet dat het eigenlijk niet grappig is?',
  'Als je morgen een vrije dag had zonder verplichtingen, hoe zou die eruitzien?',
  'Welk liedje brengt je meteen terug naar een bepaalde tijd in je leven?',
  'Wat is iets kleins waar je onredelijk blij van wordt?',
  'Welke stad zou je nog één keer willen bezoeken, en waarom?',
  'Waar heb je het laatst echt om moeten lachen?',
  'Wat wilde je als kind later worden?',
  'Wat is je meest nutteloze talent?',
  // Niveau 2: Dieper
  'Waar ben je stiekem trots op, maar zeg je bijna nooit hardop?',
  'Wanneer heb je je voor het laatst echt eenzaam gevoeld?',
  'Welk advies zou je je twintigjarige zelf geven?',
  'Wat heb je van je ouders meegekregen dat je wilt houden, en wat niet?',
  'Waar ben je bang voor, maar zou je het toch graag een keer doen?',
  'Welke beslissing heeft je leven het meest veranderd?',
  'Wanneer voel je je het meest jezelf?',
  'Wat vind je moeilijk om om hulp te vragen?',
  'Over welke fout van vroeger ben je nu eigenlijk blij?',
  'Wat betekent “thuis” voor jou?',
  // Niveau 3: Wij samen
  'Wat was je eerste indruk van mij, en klopte die?',
  'Wanneer dacht je voor het eerst: dit wordt iets serieus?',
  'Wat doe ik waardoor je je geliefd voelt, misschien zonder dat ik het weet?',
  'Wat zou je graag vaker samen willen doen?',
  'Wat vind je het moeilijkst aan de afstand tussen ons?',
  'Welke herinnering aan ons zou je nooit willen vergeten?',
  'Wat is iets wat je me nog nooit verteld hebt?',
  'Hoe ziet voor jou een perfecte gewone dinsdag samen eruit?',
  'Waar zie jij ons over vijf jaar?',
  'Wat kan ik doen om jou in een moeilijke week te steunen?'
];

const VRAGEN_PARTS = [
  { label: 'Deel 1: Vragenkaarten', path: '/vragenkaarten' },
  { label: 'Deel 2: Hoe goed ken je mij?', path: '/hoe-goed-ken-je-mij' }
];

export const VRAGENKAARTEN: QuestionSet = {
  title: 'Vragenkaarten',
  intro: 'Om de beurt trek je een vraag. De ander antwoordt eerst, daarna mag jij ook antwoorden.',
  roundLabel: 'Niveau',
  roundNames: ['Alle', 'opwarmen', 'dieper', 'wij samen'],
  questions: build(VRAGENKAARTEN_TEXTS, 10),
  doneText: 'Alle kaartjes zijn getrokken. Dank je wel voor alle antwoorden. ❤️',
  turnHint: 'de ander antwoordt eerst',
  parts: VRAGEN_PARTS,
  storageKey: 'vragenkaarten-state'
};

const HOE_GOED_TEXTS: string[] = [
  'Wat is mijn lievelingseten uit mijn jeugd?',
  'Wat is mijn grootste angst?',
  'Waar zou mijn droomreis naartoe gaan?',
  'Wat doe ik als eerste als ik gestrest ben?',
  'Welke film of serie kan ik eindeloos opnieuw kijken?',
  'Wie is mijn beste vriend of vriendin uit mijn jeugd?',
  'Waar erger ik me het snelst aan?',
  'Wat bestel ik als ik niet kan kiezen?',
  'Ben ik een ochtendmens of een avondmens?',
  'Wat is mijn verborgen talent?',
  'Welke taal zou ik graag nog willen leren?',
  'Wat was mijn eerste baan?',
  'Waarmee kun je mij het meest blij maken op een slechte dag?',
  'Welk cadeau dat ik ooit kreeg vond ik het mooist?',
  'Wat zou ik doen met een miljoen euro?'
];

export const HOE_GOED: QuestionSet = {
  title: 'Hoe goed ken je mij?',
  intro: 'Lees een vraag voor. Allebei schrijf je op wat de ánder zou antwoorden, en je schrijft ook je eigen '
    + 'antwoord op. Daarna vergelijk je. Een goed geraden antwoord is 1 punt. Bij een fout antwoord vertelt de '
    + 'ander het verhaal erachter, en dat is eigenlijk het leukste deel.',
  roundLabel: '',
  roundNames: ['Alle'],
  questions: build(HOE_GOED_TEXTS, HOE_GOED_TEXTS.length),
  doneText: 'Alle vragen zijn gesteld.',
  turnVerb: 'leest voor',
  scoring: true,
  parts: VRAGEN_PARTS,
  storageKey: 'hoe-goed-state'
};

export const QUESTION_SETS: { [key: string]: QuestionSet } = {
  kerstvragen: KERSTVRAGEN,
  vragenkaarten: VRAGENKAARTEN,
  hoeGoed: HOE_GOED
};
