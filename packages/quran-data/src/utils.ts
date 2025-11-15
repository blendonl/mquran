import { QuranWord } from './types';

/**
 * Normalize Arabic text for comparison
 * Removes diacritics and normalizes characters
 */
export function normalizeArabicText(text: string): string {
  return text
    .replace(/[\u064B-\u065F]/g, '') // Remove Arabic diacritics (Tashkeel)
    .replace(/[\u0671]/g, 'ا') // Normalize Alif Wasla to Alif
    .replace(/[\u0622\u0623\u0625]/g, 'ا') // Normalize different Alif forms
    .replace(/[\u0624]/g, 'و') // Normalize Waw with Hamza
    .replace(/[\u0626]/g, 'ي') // Normalize Ya with Hamza
    .replace(/[\u0629]/g, 'ه') // Normalize Ta Marbuta to Ha
    .replace(/[\u0640]/g, '') // Remove Tatweel
    .trim();
}

/**
 * Search for words in a given array of words
 */
export function searchWords(words: QuranWord[], query: string): QuranWord[] {
  const normalizedQuery = normalizeArabicText(query);
  return words.filter(word => {
    const normalizedWord = normalizeArabicText(word.text);
    return normalizedWord.includes(normalizedQuery);
  });
}

/**
 * Calculate similarity between two Arabic strings
 * Returns a value between 0 and 1 (1 being identical)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeArabicText(str1);
  const normalized2 = normalizeArabicText(str2);

  if (normalized1 === normalized2) return 1.0;

  // Simple Levenshtein distance-based similarity
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);

  return 1 - distance / maxLength;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Split Arabic text into words
 */
export function splitArabicText(text: string): string[] {
  return text.trim().split(/\s+/);
}

/**
 * Check if a string contains Arabic characters
 */
export function isArabic(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F]/;
  return arabicRegex.test(text);
}
