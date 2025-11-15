import { QuranData, QuranSurah, QuranAyah, QuranWord, QuranTranslation } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class QuranDataService {
  private quranData: QuranData | null = null;
  private dataPath: string;

  constructor(dataPath?: string) {
    this.dataPath = dataPath || path.join(__dirname, '../data/quran.json');
  }

  /**
   * Load Quran data from JSON file
   */
  async loadData(): Promise<void> {
    try {
      const rawData = fs.readFileSync(this.dataPath, 'utf-8');
      this.quranData = JSON.parse(rawData);
    } catch (error) {
      throw new Error(`Failed to load Quran data: ${error}`);
    }
  }

  /**
   * Get all surahs
   */
  getAllSurahs(): QuranSurah[] {
    if (!this.quranData) {
      throw new Error('Quran data not loaded. Call loadData() first.');
    }
    return this.quranData.surahs;
  }

  /**
   * Get a specific surah by number
   */
  getSurah(surahNumber: number): QuranSurah | undefined {
    if (!this.quranData) {
      throw new Error('Quran data not loaded. Call loadData() first.');
    }
    return this.quranData.surahs.find(s => s.number === surahNumber);
  }

  /**
   * Get a specific ayah
   */
  getAyah(surahNumber: number, ayahNumber: number): QuranAyah | undefined {
    const surah = this.getSurah(surahNumber);
    if (!surah) return undefined;
    return surah.ayahs.find(a => a.numberInSurah === ayahNumber);
  }

  /**
   * Get a specific word
   */
  getWord(surahNumber: number, ayahNumber: number, wordPosition: number): QuranWord | undefined {
    const ayah = this.getAyah(surahNumber, ayahNumber);
    if (!ayah) return undefined;
    return ayah.words.find(w => w.position === wordPosition);
  }

  /**
   * Get translation for an ayah
   */
  getTranslation(surahNumber: number, ayahNumber: number, languageCode: string = 'en'): string | undefined {
    if (!this.quranData) {
      throw new Error('Quran data not loaded. Call loadData() first.');
    }

    const translations = this.quranData.translations[languageCode];
    if (!translations) return undefined;

    const translation = translations.find(
      t => t.surahNumber === surahNumber && t.ayahNumber === ayahNumber
    );
    return translation?.text;
  }

  /**
   * Search for words in the Quran
   */
  searchWords(query: string): QuranWord[] {
    if (!this.quranData) {
      throw new Error('Quran data not loaded. Call loadData() first.');
    }

    const results: QuranWord[] = [];
    const normalizedQuery = this.normalizeArabicText(query);

    for (const surah of this.quranData.surahs) {
      for (const ayah of surah.ayahs) {
        for (const word of ayah.words) {
          const normalizedWord = this.normalizeArabicText(word.text);
          if (normalizedWord.includes(normalizedQuery)) {
            results.push(word);
          }
        }
      }
    }

    return results;
  }

  /**
   * Normalize Arabic text for comparison
   * Removes diacritics and normalizes characters
   */
  private normalizeArabicText(text: string): string {
    return text
      .replace(/[\u064B-\u065F]/g, '') // Remove Arabic diacritics
      .replace(/[\u0671]/g, 'ا') // Normalize Alif Wasla to Alif
      .replace(/[\u0622\u0623\u0625]/g, 'ا') // Normalize different Alif forms
      .replace(/[\u0624]/g, 'و') // Normalize Waw with Hamza
      .replace(/[\u0626]/g, 'ي') // Normalize Ya with Hamza
      .replace(/[\u0629]/g, 'ه') // Normalize Ta Marbuta to Ha
      .trim();
  }

  /**
   * Get total number of ayahs in the Quran
   */
  getTotalAyahs(): number {
    if (!this.quranData) {
      throw new Error('Quran data not loaded. Call loadData() first.');
    }
    return this.quranData.surahs.reduce((total, surah) => total + surah.numberOfAyahs, 0);
  }

  /**
   * Check if data is loaded
   */
  isLoaded(): boolean {
    return this.quranData !== null;
  }
}
