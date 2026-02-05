// src/utils/phoneticUtils.ts

// Mapping ARPAbet phonemes to user-friendly descriptions
const phonemeDescriptions: Record<string, string> = {
  'AA': 'ah sound (like in "father")',
  'AE': 'short a sound (like in "cat")',
  'AH': 'uh sound (like in "but")',
  'AO': 'aw sound (like in "dog")',
  'AW': 'ow sound (like in "cow")',
  'AY': 'eye sound (like in "my")',
  'EH': 'short e sound (like in "bed")',
  'ER': 'er sound (like in "bird")',
  'EY': 'ay sound (like in "say")',
  'IH': 'short i sound (like in "sit")',
  'IY': 'ee sound (like in "see")',
  'OW': 'oh sound (like in "go")',
  'OY': 'oy sound (like in "boy")',
  'UH': 'u sound (like in "put")',
  'UW': 'oo sound (like in "too")',
  'B': 'b sound',
  'CH': 'ch sound',
  'D': 'd sound',
  'DH': 'th sound (voiced, like in "this")',
  'F': 'f sound',
  'G': 'g sound',
  'HH': 'h sound',
  'JH': 'j sound',
  'K': 'k sound',
  'L': 'l sound',
  'M': 'm sound',
  'N': 'n sound',
  'NG': 'ng sound',
  'P': 'p sound',
  'R': 'r sound',
  'S': 's sound',
  'SH': 'sh sound',
  'T': 't sound',
  'TH': 'th sound (unvoiced, like in "think")',
  'V': 'v sound',
  'W': 'w sound',
  'Y': 'y sound',
  'Z': 'z sound',
  'ZH': 'zh sound (like in "measure")'
};

// Function 1: Get syllable count from phonetic code
export const getSyllableCount = (phonetic: string): number => {
  const stressMarkers = phonetic.match(/\d/g);
  return stressMarkers ? stressMarkers.length : 1;
};

// Function 2: Find which syllable is stressed
export const getStressedSyllable = (phonetic: string): number => {
  const phonemes = phonetic.split(' ');
  for (let i = 0; i < phonemes.length; i++) {
    if (phonemes[i].includes('1')) {
      return Math.floor(i / 2) + 1; // Improved approximation
    }
  }
  return 1;
};

// Function 3: Get common pronunciation mistakes for specific words
export const getCommonMistakes = (word: string): string => {
  const commonTips: Record<string, string> = {
    'knight': 'The "k" is silent. Focus on the "nite" sound.',
    'Wednesday': 'Don\'t pronounce the "d". It sounds like "Wenz-day".',
    'salmon': 'The "l" is silent. Say "sam-un".',
    'castle': 'The "t" is silent. Focus on "cas-el".',
    'listen': 'The "t" is silent. It sounds like "lis-en".',
    'photograph': 'Put the emphasis on the FIRST part: FO-to-graph.',
    'photographer': 'Put the emphasis on the SECOND part: pho-TOG-ra-pher.',
    'comfortable': 'Try to say it in 3 beats: COM-fort-able.',
    'vegetable': 'It has 3 beats: VEG-ta-ble.',
    'chocolate': 'Only 2 beats: CHOC-late.',
    'interesting': 'Emphasis on the FIRST beat: IN-ter-est-ing.',
    'pronunciation': 'Note the "nun" in the middle: pro-NUN-ci-a-tion.',
    'library': 'Say both "r"s: li-brary.',
    'February': 'Don\'t skip the first "r": Feb-ru-ary.',
    'mischievous': 'It has 3 beats: MIS-chi-vous.',
    'jewelry': 'It sounds like "jool-ree".',
    'espresso': 'It starts with "es", not "ex".',
    'women': 'The "o" sounds like "i": WIM-in.',
    'said': 'Rhymes with "bed".',
    'break': 'Rhymes with "cake".',
  };

  return commonTips[word] || `Focus on pronouncing each sound in "${word}" clearly.`;
};

const splitPhonemes = (phonetic: string) => {
  return phonetic
    .replace(/[\/[\]]/g, '')
    .split(/\s+/)
    .map(p => p.replace(/\d/, '').toUpperCase())
    .filter(p => p !== '');
};

// Compare phonemes and provide dynamic feedback
export const analyzePhonemeDifferences = (spokenPhonetic: string, targetPhonetic: string): string => {
  const spoken = splitPhonemes(spokenPhonetic);
  const target = splitPhonemes(targetPhonetic);

  if (spoken.length === 0) return "We couldn't quite catch that. Try speaking a bit louder.";

  let mistakes: string[] = [];

  // Check for sound omissions or substitutions
  for (let i = 0; i < target.length; i++) {
    const targetSound = target[i];
    const spokenSound = spoken[i];

    if (!spokenSound) {
      mistakes.push(`You missed the ${phonemeDescriptions[targetSound] || targetSound} at the end.`);
      break;
    } else if (spokenSound !== targetSound) {
      const desc = phonemeDescriptions[targetSound] || targetSound;
      const spokenDesc = phonemeDescriptions[spokenSound] || spokenSound;
      mistakes.push(`You pronounced the "${targetSound}" part as a ${spokenDesc} instead of a ${desc}.`);
      break; // Only give one specific phonetic tip at a time
    }
  }

  if (mistakes.length === 0 && spoken.length > target.length) {
    mistakes.push("You added some extra sounds at the end.");
  }

  return mistakes[0] || "";
};

// Helper to identify where the strings differ
const getDifferenceLocation = (s1: string, s2: string): 'beginning' | 'middle' | 'end' | 'length' => {
  if (Math.abs(s1.length - s2.length) > 3) return 'length';

  const minLen = Math.min(s1.length, s2.length);
  let firstDiff = -1;
  for (let i = 0; i < minLen; i++) {
    if (s1[i] !== s2[i]) {
      firstDiff = i;
      break;
    }
  }

  if (firstDiff === -1) return 'end';
  if (firstDiff < minLen * 0.3) return 'beginning';
  if (firstDiff > minLen * 0.7) return 'end';
  return 'middle';
};

// Function 4: Generate feedback based on phonetic comparison
export const generatePhoneticFeedback = (
  spoken: string,
  targetWord: string,
  targetPhonetic: string,
  spokenPhonetic?: string | null
): string => {
  const spokenLower = spoken.toLowerCase().trim();
  const targetLower = targetWord.toLowerCase().trim();

  if (spokenLower === targetLower) {
    return 'Perfect! Your pronunciation is spot on. 🎉';
  }

  // 1. Phonetic Comparison (Best)
  if (spokenPhonetic) {
    const phoneticMistake = analyzePhonemeDifferences(spokenPhonetic, targetPhonetic);
    if (phoneticMistake) return phoneticMistake;
  }

  // 2. Word-specific Tips
  const specificTip = getCommonMistakes(targetWord);
  if (specificTip !== `Focus on pronouncing each sound in "${targetWord}" clearly.`) {
    return specificTip;
  }

  // 3. Character-based analysis fallback
  if (spokenLower.length > 0) {
    const diffLoc = getDifferenceLocation(spokenLower, targetLower);
    const syllableCount = getSyllableCount(targetPhonetic);

    if (diffLoc === 'beginning') {
      return `Your mistake was at the start of the word. Try to focus more on how "${targetWord}" begins!`;
    } else if (diffLoc === 'middle') {
      return `The middle part of your pronunciation wasn't quite right. Try focusing on the center sounds of "${targetWord}".`;
    } else if (diffLoc === 'end') {
      return `Almost! Your mistake was at the very end of the word. Make sure to pronounce the final sound clearly.`;
    } else if (diffLoc === 'length') {
      return `It sounds like you skipped some sounds or added extra ones. This word should have ${syllableCount} distinct parts.`;
    }
  }

  // 4. Default dynamic tip based on target phonetics
  const phonemes = splitPhonemes(targetPhonetic);
  if (phonemes.includes('TH')) return `Focus on the "th" sound – place your tongue between your teeth.`;
  if (phonemes.includes('R')) return `Pay attention to the "r" sound – it should be clear and distinct.`;
  if (phonemes.includes('NG')) return `The "ng" sound at the end is key here.`;
  if (phonemes.includes('SH') || phonemes.includes('CH')) return `Focus on the "sh" or "ch" sound in this word.`;

  return `Try to say each syllable of "${targetWord}" slowly and clearly.`;
};


