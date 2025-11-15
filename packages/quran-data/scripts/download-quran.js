const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = 'https://api.quran.com/api/v4';
const DATA_DIR = path.join(__dirname, '../data');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

async function downloadChapters() {
  console.log('Downloading Quran chapters...');
  try {
    const response = await axios.get(`${BASE_URL}/chapters`);
    return response.data.chapters;
  } catch (error) {
    console.error('Error downloading chapters:', error.message);
    throw error;
  }
}

async function downloadVerses(chapterNumber) {
  console.log(`Downloading verses for chapter ${chapterNumber}...`);
  try {
    const response = await axios.get(
      `${BASE_URL}/verses/by_chapter/${chapterNumber}`,
      {
        params: {
          words: true,
          translations: 131, // English - Sahih International
          per_page: 300,
          page: 1,
        },
      }
    );
    return response.data.verses;
  } catch (error) {
    console.error(`Error downloading verses for chapter ${chapterNumber}:`, error.message);
    throw error;
  }
}

async function downloadTranslations(chapterNumber, translationId = 131) {
  console.log(`Downloading translations for chapter ${chapterNumber}...`);
  try {
    const response = await axios.get(
      `${BASE_URL}/quran/translations/${translationId}`,
      {
        params: {
          chapter_number: chapterNumber,
        },
      }
    );
    return response.data.translations;
  } catch (error) {
    console.error(`Error downloading translations for chapter ${chapterNumber}:`, error.message);
    return [];
  }
}

function transformVerseData(verse) {
  return {
    id: verse.id,
    number: verse.verse_number,
    numberInSurah: verse.verse_number,
    text: verse.text_uthmani,
    textUthmani: verse.text_uthmani,
    textSimple: verse.text_imlaei || verse.text_uthmani,
    words: (verse.words || []).map((word, index) => ({
      id: word.id,
      position: word.position,
      text: word.text_uthmani,
      textUthmani: word.text_uthmani,
      textSimple: word.text_imlaei || word.text_uthmani,
      transliteration: word.transliteration?.text || '',
      audioUrl: word.audio?.url || '',
    })),
    juz: verse.juz_number || 1,
    page: verse.page_number || 1,
    hizbQuarter: verse.hizb_number || 1,
    sajda: verse.sajda || false,
  };
}

async function downloadQuranData() {
  console.log('Starting Quran data download...\n');

  await ensureDataDir();

  // Download all chapters metadata
  const chapters = await downloadChapters();
  console.log(`Downloaded ${chapters.length} chapters\n`);

  const surahs = [];
  const translations = { en: [] };

  // Download verses for each chapter
  for (const chapter of chapters) {
    console.log(`\nProcessing Surah ${chapter.id}: ${chapter.name_simple}`);

    const verses = await downloadVerses(chapter.id);
    console.log(`  - Downloaded ${verses.length} verses`);

    // Transform and store verse data
    const surah = {
      id: chapter.id,
      number: chapter.id,
      name: chapter.name_arabic,
      englishName: chapter.name_simple,
      englishNameTranslation: chapter.translated_name?.name || '',
      revelationType: chapter.revelation_place === 'makkah' ? 'Meccan' : 'Medinan',
      numberOfAyahs: chapter.verses_count,
      ayahs: verses.map(transformVerseData),
    };

    surahs.push(surah);

    // Store translations
    verses.forEach(verse => {
      if (verse.translations && verse.translations.length > 0) {
        translations.en.push({
          id: verse.id,
          ayahNumber: verse.verse_number,
          surahNumber: chapter.id,
          text: verse.translations[0].text,
          languageCode: 'en',
          translatorName: 'Sahih International',
        });
      }
    });

    // Rate limiting - wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Save the complete Quran data
  const quranData = {
    surahs,
    translations,
  };

  const outputPath = path.join(DATA_DIR, 'quran.json');
  await fs.writeFile(outputPath, JSON.stringify(quranData, null, 2), 'utf-8');

  console.log('\n✅ Successfully downloaded and saved Quran data!');
  console.log(`📁 Data saved to: ${outputPath}`);
  console.log(`📊 Total surahs: ${surahs.length}`);
  console.log(`📊 Total ayahs: ${surahs.reduce((sum, s) => sum + s.numberOfAyahs, 0)}`);
  console.log(`📊 Total translations: ${translations.en.length}`);
}

// Run the download
downloadQuranData().catch(error => {
  console.error('\n❌ Error downloading Quran data:', error);
  process.exit(1);
});
