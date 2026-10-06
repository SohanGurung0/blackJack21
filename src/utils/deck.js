const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = [
  { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 },
  { label: '5', value: 5 }, { label: '6', value: 6 }, { label: '7', value: 7 },
  { label: '8', value: 8 }, { label: '9', value: 9 }, { label: '10', value: 10 },
  { label: 'J', value: 10 }, { label: 'Q', value: 10 }, { label: 'K', value: 10 },
  { label: 'A', value: 11 }
];

export const createDeck = () => 
  suits.flatMap(suit => values.map(v => ({ id: `${v.label}-${suit}`, suit, label: v.label, value: v.value, isHidden: false })));

export const shuffleDeck = deck => {
  const res = [...deck];
  for (let i = res.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [res[i], res[j]] = [res[j], res[i]];
  }
  return res;
};

export const calculateScore = hand => {
  let { score, aces } = hand.reduce((a, c) => c.isHidden ? a : { score: a.score + c.value, aces: a.aces + (c.label === 'A' ? 1 : 0) }, { score: 0, aces: 0 });
  while (score > 21 && aces-- > 0) score -= 10;
  return score;
};