import Fuse from 'fuse.js';
import { NCD_KNOWLEDGE_BASE, OFFLINE_FALLBACK_MESSAGES } from '../../data/ncdKnowledgeBase';

/**
 * Build searchable document array tailored for Fuse.js based on active language
 */
function buildSearchableIndex(lang = 'en') {
  return NCD_KNOWLEDGE_BASE.map(item => {
    const activeKeywords = item.keywords[lang] || item.keywords.en || [];
    const englishKeywords = item.keywords.en || [];
    const allKeywords = [...new Set([...activeKeywords, ...englishKeywords])];

    const question = item.question[lang] || item.question.en;
    const answer = item.answer[lang] || item.answer.en;

    return {
      id: item.id,
      topic: item.topic,
      keywords: allKeywords,
      question,
      answer,
      searchContent: `${question} ${allKeywords.join(' ')} ${answer}`,
      rawItem: item
    };
  });
}

const fuseInstances = {
  en: null,
  kn: null,
  hi: null,
  mr: null
};

function getFuseInstance(lang) {
  const activeLang = ['en', 'kn', 'hi', 'mr'].includes(lang) ? lang : 'en';
  if (!fuseInstances[activeLang]) {
    const list = buildSearchableIndex(activeLang);
    fuseInstances[activeLang] = new Fuse(list, {
      keys: [
        { name: 'keywords', weight: 0.5 },
        { name: 'question', weight: 0.3 },
        { name: 'searchContent', weight: 0.2 }
      ],
      threshold: 0.55,
      ignoreLocation: true,
      minMatchCharLength: 2,
      includeScore: true
    });
  }
  return { fuse: fuseInstances[activeLang], lang: activeLang };
}

/**
 * Retrieve verified offline clinical guidance using weighted keyword correlation + Fuse.js
 * against the bundled NCD knowledge base.
 *
 * @param {string} query - The user or CHW's health question
 * @param {string} lang - Language code ('en', 'kn', 'hi', 'mr')
 * @returns {object} { answer: string, confidence: number, isFallback: boolean, topic: string|null }
 */
export function searchOfflineKnowledgeBase(query, lang = 'en') {
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    const fallbackText = OFFLINE_FALLBACK_MESSAGES[lang] || OFFLINE_FALLBACK_MESSAGES.en;
    return {
      answer: fallbackText,
      confidence: 0,
      isFallback: true,
      topic: null
    };
  }

  const activeLang = ['en', 'kn', 'hi', 'mr'].includes(lang) ? lang : 'en';
  const normalizedQuery = query.toLowerCase().trim();

  // 1. Weighted Keyword & Specificity Pass
  let bestMatchItem = null;
  let highestScore = 0;

  for (const item of NCD_KNOWLEDGE_BASE) {
    let itemScore = 0;
    const localKws = item.keywords[activeLang] || [];
    const enKws = item.keywords.en || [];
    const allKws = [...localKws, ...enKws];

    for (const kw of allKws) {
      const normalizedKw = kw.toLowerCase();
      if (normalizedQuery.includes(normalizedKw)) {
        // Longer matching phrases carry much higher clinical weight
        itemScore += normalizedKw.length * 3;
      } else if (normalizedKw.includes(normalizedQuery)) {
        itemScore += 5;
      }
    }

    // Token intersection check (split into words)
    const queryTokens = normalizedQuery.split(/[\s,?.!/]+/).filter(t => t.length >= 2);
    for (const token of queryTokens) {
      if (allKws.some(kw => kw.toLowerCase().includes(token))) {
        itemScore += 4;
      }
    }

    if (itemScore > highestScore) {
      highestScore = itemScore;
      bestMatchItem = item;
    }
  }

  // If a strong clinical keyword correlation is found
  if (bestMatchItem && highestScore >= 12) {
    return {
      answer: bestMatchItem.answer[activeLang] || bestMatchItem.answer.en,
      confidence: Math.min(99, Math.round(50 + highestScore)),
      isFallback: false,
      topic: bestMatchItem.topic
    };
  }

  // 2. Fuzzy Search Pass via Fuse.js
  const { fuse } = getFuseInstance(activeLang);
  const results = fuse.search(normalizedQuery);

  if (results && results.length > 0) {
    const bestMatch = results[0];
    const score = bestMatch.score ?? 1;

    // Strict threshold: score must be <= 0.45 for a verified answer
    if (score <= 0.45) {
      const confidence = Math.max(15, Math.round((1 - score) * 100));
      return {
        answer: bestMatch.item.answer,
        confidence,
        isFallback: false,
        topic: bestMatch.item.topic
      };
    }
  }

  // 3. Graceful fallback when query is unknown or out of domain
  const fallbackText = OFFLINE_FALLBACK_MESSAGES[activeLang] || OFFLINE_FALLBACK_MESSAGES.en;
  return {
    answer: fallbackText,
    confidence: 0,
    isFallback: true,
    topic: null
  };
}
