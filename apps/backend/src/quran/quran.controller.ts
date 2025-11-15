import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { QuranService } from './quran.service';

@Controller('quran')
export class QuranController {
  constructor(private readonly quranService: QuranService) {}

  @Get('surahs')
  getAllSurahs() {
    return this.quranService.getAllSurahs();
  }

  @Get('surahs/:surahNumber')
  getSurah(@Param('surahNumber', ParseIntPipe) surahNumber: number) {
    return this.quranService.getSurah(surahNumber);
  }

  @Get('surahs/:surahNumber/ayahs/:ayahNumber')
  getAyah(
    @Param('surahNumber', ParseIntPipe) surahNumber: number,
    @Param('ayahNumber', ParseIntPipe) ayahNumber: number,
  ) {
    return this.quranService.getAyah(surahNumber, ayahNumber);
  }

  @Get('translations/:surahNumber/:ayahNumber')
  getTranslation(
    @Param('surahNumber', ParseIntPipe) surahNumber: number,
    @Param('ayahNumber', ParseIntPipe) ayahNumber: number,
    @Query('lang') lang: string = 'en',
  ) {
    return this.quranService.getTranslation(surahNumber, ayahNumber, lang);
  }

  @Get('search')
  searchWords(@Query('q') query: string) {
    return this.quranService.searchWords(query);
  }
}
