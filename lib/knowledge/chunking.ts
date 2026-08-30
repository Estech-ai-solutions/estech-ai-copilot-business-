const DEFAULT_MAX_TOKENS = 500;
const DEFAULT_OVERLAP = 50;
const MIN_TOKENS = 200;
const MAX_TOKENS = 800;
const CHARS_PER_TOKEN = 4;

function countTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / CHARS_PER_TOKEN));
}

function splitSentences(text: string): string[] {
  const sentenceRegex = /[^.!?]+[.!?]+(?:\s|$)/g;
  const matches = text.match(sentenceRegex);
  if (!matches || matches.length === 0) {
    return text.trim() ? [text.trim()] : [];
  }
  return matches.map((s) => s.trim()).filter(Boolean);
}

function estimateMaxChars(maxTokens: number): number {
  return maxTokens * CHARS_PER_TOKEN;
}

export function chunkText(text: string, options: { maxTokens?: number; overlap?: number } = {}): string[] {
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;
  const maxChars = estimateMaxChars(maxTokens);
  const overlapChars = estimateMaxChars(overlap);

  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: string[] = [];
  let currentHeading = '';
  let remaining = text.trim();

  while (remaining.length > 0) {
    if (countTokens(remaining) <= maxTokens) {
      if (remaining.trim().length > 0) {
        const chunkContent = currentHeading ? `${currentHeading}\n\n${remaining}` : remaining;
        chunks.push(chunkContent.trim());
      }
      break;
    }

    const paragraphSplit = remaining.split(/\n\s*\n/);
    let candidate = '';
    let usedParagraphs: string[] = [];

    for (const para of paragraphSplit) {
      const testCandidate = candidate ? `${candidate}\n\n${para}` : para;
      if (countTokens(testCandidate) > maxTokens && candidate) {
        break;
      }
      candidate = testCandidate;
      usedParagraphs.push(para);
    }

    if (countTokens(candidate) <= MIN_TOKENS * CHARS_PER_TOKEN && usedParagraphs.length > 1) {
      usedParagraphs.pop();
      candidate = usedParagraphs.join('\n\n');
    }

    if (countTokens(candidate) > MAX_TOKENS * CHARS_PER_TOKEN) {
      const sentences = splitSentences(candidate);
      candidate = '';
      let usedSentences: string[] = [];

      for (const sentence of sentences) {
        const testCandidate = candidate ? `${candidate} ${sentence}` : sentence;
        if (countTokens(testCandidate) > maxTokens && candidate) {
          break;
        }
        candidate = testCandidate;
        usedSentences.push(sentence);
      }

      if (countTokens(candidate) > MAX_TOKENS * CHARS_PER_TOKEN && usedSentences.length > 1) {
        usedSentences.pop();
        candidate = usedSentences.join(' ');
      }

      if (!candidate && sentences.length > 0) {
        candidate = sentences[0];
      }
    }

    if (!candidate) {
      const hardLimit = remaining.slice(0, maxChars);
      const lastPeriod = hardLimit.lastIndexOf('.');
      if (lastPeriod > maxChars * 0.5) {
        candidate = hardLimit.slice(0, lastPeriod + 1);
      } else {
        candidate = hardLimit;
      }
    }

    if (currentHeading && !candidate.includes(currentHeading)) {
      candidate = `${currentHeading}\n\n${candidate}`;
    }

    chunks.push(candidate.trim());

    const overlapText = candidate.slice(-overlapChars);
    const sentences = splitSentences(overlapText);
    const overlapSentenceCount = Math.min(sentences.length, Math.ceil(overlap / 10));
    const overlapStart = sentences.slice(-overlapSentenceCount).join(' ');

    const headingMatch = candidate.match(/^#+\s+.+$/m);
    if (headingMatch) {
      currentHeading = headingMatch[0];
    }

    const nextStart = remaining.indexOf(candidate);
    if (nextStart === -1) {
      break;
    }
    remaining = remaining.slice(nextStart + candidate.length).trim();

    if (overlapStart && remaining.length > 0) {
      const remainingTokenCount = countTokens(remaining);
      if (remainingTokenCount > maxTokens) {
        remaining = `${overlapStart} ${remaining}`;
      }
    }
  }

  return chunks;
}
