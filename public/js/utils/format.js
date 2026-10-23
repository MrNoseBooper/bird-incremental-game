const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
const WORDS = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion',
  'sextillion', 'septillion', 'octillion', 'nonillion', 'decillion'];

/** The big counter: "123,456" below a million, then "1.234 million". Rounds down like formatNumber. */
export function formatWords(value) {
  if (value < 1e6) return Math.floor(value).toLocaleString('en-US');
  let scaled = value;
  let tier = 0;
  while (scaled >= 1000 && tier < WORDS.length - 1) {
    scaled /= 1000;
    tier += 1;
  }
  if (scaled >= 1000) return value.toExponential(3);
  return `${(Math.floor(scaled * 1000 + 1e-9) / 1000).toFixed(3)} ${WORDS[tier]}`;
}

/** 1234567 -> "1.23M". Rounds down, so you never see more seeds than you actually have. */
export function formatNumber(value, decimals = 0) {
  let scaled = value;
  let tier = 0;
  while (scaled >= 1000 && tier < SUFFIXES.length - 1) {
    scaled /= 1000;
    tier += 1;
  }
  if (scaled >= 1000) return value.toExponential(2);
  const places = tier > 0 ? 2 : decimals;
  const factor = 10 ** places;
  return (Math.floor(scaled * factor + 1e-9) / factor).toFixed(places) + SUFFIXES[tier];
}

/** 75 -> "1:15" */
export function formatDuration(seconds) {
  const whole = Math.ceil(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
