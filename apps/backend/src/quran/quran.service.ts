import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { QuranDataService } from '@mquran/quran-data';
import * as path from 'path';

@Injectable()
export class QuranService implements OnModuleInit {
  private quranDataService: QuranDataService;

  constructor() {
    // Initialize QuranDataService with path to data file
    const dataPath = path.join(__dirname, '../../../..', 'packages/quran-data/data/quran.json');
    this.quranDataService = new QuranDataService(dataPath);
  }

  async onModuleInit() {
    try {
      await this.quranDataService.loadData();
      console.log('✅ Quran data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load Quran data:', error);
      console.warn('⚠️  Run "yarn workspace @mquran/quran-data download-quran" to download Quran data');
    }
  }

  getAllSurahs() {
    try {
      const surahs = this.quranDataService.getAllSurahs();
      // Return metadata only (without ayahs to reduce payload size)
      return surahs.map(({ ayahs, ...metadata }) => metadata);
    } catch (error) {
      throw new NotFoundException('Quran data not available');
    }
  }

  getSurah(surahNumber: number) {
    const surah = this.quranDataService.getSurah(surahNumber);
    if (!surah) {
      throw new NotFoundException(`Surah ${surahNumber} not found`);
    }
    return surah;
  }

  getAyah(surahNumber: number, ayahNumber: number) {
    const ayah = this.quranDataService.getAyah(surahNumber, ayahNumber);
    if (!ayah) {
      throw new NotFoundException(
        `Ayah ${ayahNumber} in Surah ${surahNumber} not found`,
      );
    }
    return ayah;
  }

  getTranslation(surahNumber: number, ayahNumber: number, languageCode: string) {
    const translation = this.quranDataService.getTranslation(
      surahNumber,
      ayahNumber,
      languageCode,
    );

    if (!translation) {
      throw new NotFoundException(
        `Translation not found for Surah ${surahNumber}, Ayah ${ayahNumber} in language ${languageCode}`,
      );
    }

    return { translation };
  }

  searchWords(query: string) {
    if (!query || query.trim().length === 0) {
      return { results: [] };
    }

    const results = this.quranDataService.searchWords(query);
    return { results, count: results.length };
  }
}
