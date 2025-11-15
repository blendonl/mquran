export interface QuranWord {
  id: number;
  position: number;
  text: string;
  textUthmani: string;
  textSimple: string;
  transliteration: string;
  audioUrl?: string;
}

export interface QuranAyah {
  id: number;
  number: number;
  numberInSurah: number;
  text: string;
  textUthmani: string;
  textSimple: string;
  words: QuranWord[];
  juz: number;
  page: number;
  hizbQuarter: number;
  sajda: boolean;
}

export interface QuranSurah {
  id: number;
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: 'Meccan' | 'Medinan';
  numberOfAyahs: number;
  ayahs: QuranAyah[];
}

export interface QuranTranslation {
  id: number;
  ayahNumber: number;
  surahNumber: number;
  text: string;
  languageCode: string;
  translatorName: string;
}

export interface QuranData {
  surahs: QuranSurah[];
  translations: {
    [languageCode: string]: QuranTranslation[];
  };
}

export interface WordMatch {
  word: QuranWord;
  ayah: QuranAyah;
  surah: QuranSurah;
  confidence: number;
}

export interface RecitationPosition {
  surah: number;
  ayah: number;
  word: number;
  timestamp: number;
}
