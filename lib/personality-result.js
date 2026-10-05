import { generateSlug } from './slug';

// Shared by the test page (in the browser), the result pages and the share images.

/** URL segment for a result key: "Miss Fortune" -> "miss-fortune", "de_bruyne" -> "de-bruyne". */
export function resultSlug(key) {
  return generateSlug(String(key).replace(/_/g, ' ')) || encodeURIComponent(String(key));
}

/** The result whose key matches a URL segment, with `key` and `slug` added; null if none. */
export function findResult(test, slug) {
  const entry = Object.entries(test?.results || {}).find(([key]) => resultSlug(key) === slug);
  return entry ? { ...entry[1], key: entry[0], slug } : null;
}

/**
 * The result for a set of answers (option indexes by question). The highest total wins; on a
 * tie the result that reached the score first stays, as it always has.
 */
export function pickResult(test, answers) {
  const scores = {};
  answers.forEach((optionIndex, questionIndex) => {
    const option = test.questions[questionIndex]?.options?.[optionIndex];
    Object.entries(option?.points || {}).forEach(([key, points]) => {
      scores[key] = (scores[key] || 0) + points;
    });
  });

  let best = Object.keys(test.results)[0];
  let bestScore = 0;
  Object.entries(scores).forEach(([key, score]) => {
    if (score > bestScore && test.results[key]) {
      bestScore = score;
      best = key;
    }
  });

  return { ...test.results[best], key: best, slug: resultSlug(best) };
}

/** The fields a share image needs, nothing else. */
export function publicTest(test) {
  return {
    slug: test.slug,
    title: test.title || '',
    imageUrl: test.imageUrl || null,
    results: Object.entries(test.results || {}).map(([key, result]) => ({
      slug: resultSlug(key),
      title: result.title || key,
      description: result.description || '',
      imageUrl: result.imageUrl || null,
      color: result.color || null,
      traits: Array.isArray(result.traits) ? result.traits : [],
    })),
  };
}
