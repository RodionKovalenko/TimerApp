export interface Question {
  id: number;
  round: number;
  text: string;
}

export const ROUND_NAMES = ['Alle', 'herinneringen', 'wij nu', 'vooruit kijken'];

const TEXTS: string[] = [
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

export const QUESTIONS: Question[] = TEXTS.map((text, i) => ({
  id: i + 1,
  round: Math.floor(i / 12) + 1,
  text
}));
