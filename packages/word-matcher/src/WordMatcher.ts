import {
  QuranData,
  QuranWord,
  QuranAyah,
  QuranSurah,
  WordMatch,
  RecitationPosition,
  normalizeArabicText,
  calculateSimilarity,
} from '@mquran/quran-data';

interface MatchResult {
  word: QuranWord;
  ayah: QuranAyah;
  surah: QuranSurah;
  confidence: number;
  isSequential: boolean;
}

export class WordMatcher {
  private quranData: QuranData;
  private currentPosition: RecitationPosition | null = null;
  private matchHistory: MatchResult[] = [];
  private readonly MIN_CONFIDENCE = 0.6; // Minimum confidence threshold
  private readonly SEQUENTIAL_BOOST = 0.2; // Confidence boost for sequential matches
  private readonly CONTEXT_WINDOW = 5; // Number of words to look ahead/behind

  constructor(quranData: QuranData) {
    this.quranData = quranData;
  }

  /**
   * Match a recognized word against the Quran
   * Uses context from previous matches to improve accuracy
   */
  matchWord(recognizedText: string): MatchResult | null {
    const normalizedInput = normalizeArabicText(recognizedText);

    if (!normalizedInput) {
      return null;
    }

    let bestMatch: MatchResult | null = null;
    let bestConfidence = 0;

    // If we have a current position, prioritize searching nearby words
    if (this.currentPosition) {
      bestMatch = this.searchNearbyWords(normalizedInput);
      if (bestMatch && bestMatch.confidence >= this.MIN_CONFIDENCE) {
        this.updatePosition(bestMatch);
        return bestMatch;
      }
    }

    // If no good match nearby or no current position, search the entire Quran
    for (const surah of this.quranData.surahs) {
      for (const ayah of surah.ayahs) {
        for (const word of ayah.words) {
          const confidence = this.calculateMatchConfidence(normalizedInput, word);

          if (confidence > bestConfidence && confidence >= this.MIN_CONFIDENCE) {
            bestConfidence = confidence;
            bestMatch = {
              word,
              ayah,
              surah,
              confidence,
              isSequential: false,
            };
          }
        }
      }
    }

    if (bestMatch) {
      this.updatePosition(bestMatch);
    }

    return bestMatch;
  }

  /**
   * Search for words near the current position
   */
  private searchNearbyWords(normalizedInput: string): MatchResult | null {
    if (!this.currentPosition) return null;

    const { surah: surahNum, ayah: ayahNum, word: wordNum } = this.currentPosition;
    const surah = this.quranData.surahs.find(s => s.number === surahNum);

    if (!surah) return null;

    let bestMatch: MatchResult | null = null;
    let bestConfidence = 0;

    // Search within the current ayah and nearby ayahs
    const startAyah = Math.max(1, ayahNum - 1);
    const endAyah = Math.min(surah.numberOfAyahs, ayahNum + 2);

    for (let a = startAyah; a <= endAyah; a++) {
      const ayah = surah.ayahs.find(ay => ay.numberInSurah === a);
      if (!ayah) continue;

      for (const word of ayah.words) {
        let confidence = this.calculateMatchConfidence(normalizedInput, word);

        // Boost confidence if this is the next expected word
        const isNextWord =
          ayah.numberInSurah === ayahNum && word.position === wordNum + 1;

        if (isNextWord) {
          confidence += this.SEQUENTIAL_BOOST;
        }

        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestMatch = {
            word,
            ayah,
            surah,
            confidence,
            isSequential: isNextWord,
          };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Calculate confidence score for a word match
   */
  private calculateMatchConfidence(normalizedInput: string, word: QuranWord): number {
    const normalizedWord = normalizeArabicText(word.text);
    const normalizedSimple = normalizeArabicText(word.textSimple);

    // Calculate similarity scores
    const uthmaniSimilarity = calculateSimilarity(normalizedInput, normalizedWord);
    const simpleSimilarity = calculateSimilarity(normalizedInput, normalizedSimple);

    // Use the best similarity score
    return Math.max(uthmaniSimilarity, simpleSimilarity);
  }

  /**
   * Update current position based on matched word
   */
  private updatePosition(match: MatchResult): void {
    this.currentPosition = {
      surah: match.surah.number,
      ayah: match.ayah.numberInSurah,
      word: match.word.position,
      timestamp: Date.now(),
    };

    this.matchHistory.push(match);

    // Keep only last 10 matches in history
    if (this.matchHistory.length > 10) {
      this.matchHistory.shift();
    }
  }

  /**
   * Get current position in recitation
   */
  getCurrentPosition(): RecitationPosition | null {
    return this.currentPosition;
  }

  /**
   * Get match history
   */
  getMatchHistory(): MatchResult[] {
    return this.matchHistory;
  }

  /**
   * Reset the matcher state
   */
  reset(): void {
    this.currentPosition = null;
    this.matchHistory = [];
  }

  /**
   * Set manual position (for user navigation)
   */
  setPosition(surah: number, ayah: number, word: number = 1): void {
    this.currentPosition = {
      surah,
      ayah,
      word,
      timestamp: Date.now(),
    };
  }

  /**
   * Get the next expected word based on current position
   */
  getNextWord(): { word: QuranWord; ayah: QuranAyah; surah: QuranSurah } | null {
    if (!this.currentPosition) return null;

    const { surah: surahNum, ayah: ayahNum, word: wordNum } = this.currentPosition;
    const surah = this.quranData.surahs.find(s => s.number === surahNum);

    if (!surah) return null;

    const ayah = surah.ayahs.find(a => a.numberInSurah === ayahNum);
    if (!ayah) return null;

    // Try to get next word in current ayah
    const nextWord = ayah.words.find(w => w.position === wordNum + 1);

    if (nextWord) {
      return { word: nextWord, ayah, surah };
    }

    // If no next word in current ayah, get first word of next ayah
    const nextAyah = surah.ayahs.find(a => a.numberInSurah === ayahNum + 1);
    if (nextAyah && nextAyah.words.length > 0) {
      return { word: nextAyah.words[0], ayah: nextAyah, surah };
    }

    // If no next ayah, try next surah
    const nextSurah = this.quranData.surahs.find(s => s.number === surahNum + 1);
    if (nextSurah && nextSurah.ayahs.length > 0 && nextSurah.ayahs[0].words.length > 0) {
      const firstAyah = nextSurah.ayahs[0];
      return { word: firstAyah.words[0], ayah: firstAyah, surah: nextSurah };
    }

    return null;
  }

  /**
   * Batch match multiple words (for handling speech recognition that returns multiple words)
   */
  matchWords(recognizedWords: string[]): MatchResult[] {
    const matches: MatchResult[] = [];

    for (const word of recognizedWords) {
      const match = this.matchWord(word);
      if (match) {
        matches.push(match);
      }
    }

    return matches;
  }
}
