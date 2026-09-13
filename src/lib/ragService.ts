import fs from 'fs';
import path from 'path';
import { Transcript, TranscriptChunk, TranscriptFileType, KnowledgeRetrievalResult } from '../types';
import fallbackConfig from '../../firebase-applet-config.json';

const CACHE_DIR = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(CACHE_DIR, 'transcripts_cache.json');

interface CacheData {
  transcripts: Transcript[];
  chunks: TranscriptChunk[];
}

/**
 * Validates whether an email belongs to an authorized administrator.
 * Server-authoritative check: compares against ADMIN_EMAILS environment variable
 * and default owner email.
 */
export function isAuthorizedAdmin(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;

  const normalized = email.trim().toLowerCase();
  const envAdmins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  // Default platform owner/admin from project metadata
  const defaultAdmins = ['deepak112085@gmail.com'];
  const allAdmins = Array.from(new Set([...defaultAdmins, ...envAdmins]));

  return allAdmins.includes(normalized);
}

/**
 * Normalizes and extracts dialogue text from various transcript formats:
 * - .txt: plain text with whitespace normalization
 * - .srt: strips sequence numbers, timestamps, and formatting cues
 * - .vtt: strips WEBVTT header, timestamps, voice/style tags
 */
export function parseTranscriptText(
  rawContent: string,
  fileType: TranscriptFileType
): { text: string; wordCount: number } {
  if (!rawContent || typeof rawContent !== 'string') {
    return { text: '', wordCount: 0 };
  }

  let cleaned = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  if (fileType === 'srt') {
    // 1. Remove UTF-8 BOM if present
    cleaned = cleaned.replace(/^\uFEFF/, '');
    // 2. Remove subtitle sequence index numbers (standalone numbers on a line)
    cleaned = cleaned.replace(/^\d+\s*$/gm, '');
    // 3. Remove SRT timestamp lines: 00:01:20,000 --> 00:01:23,500
    cleaned = cleaned.replace(/\d{1,2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,\.]\d{3}[^\n]*/g, '');
    // 4. Strip inline formatting tags (<b>, <i>, <font>, etc.)
    cleaned = cleaned.replace(/<[^>]+>/g, '');
    // 5. Strip bracketed noise descriptions like [Applause] or (Music)
    cleaned = cleaned.replace(/\[[^\]]+\]|\([^\)]+\)/g, '');
  } else if (fileType === 'vtt') {
    // 1. Strip WEBVTT header and NOTE comments
    cleaned = cleaned.replace(/^WEBVTT[^\n]*/i, '');
    cleaned = cleaned.replace(/^NOTE[^\n]*\n(?:[^\n]*\n)*/gm, '');
    // 2. Strip VTT timestamps: 00:01.000 --> 00:04.000 or 00:00:01.000 --> 00:00:04.000
    cleaned = cleaned.replace(/(?:\d{1,2}:)?\d{2}:\d{2}\.\d{3}\s*-->\s*(?:\d{1,2}:)?\d{2}:\d{2}\.\d{3}[^\n]*/g, '');
    // 3. Strip voice cues and HTML styling: <v Speaker Name> text </v>
    cleaned = cleaned.replace(/<v [^>]+>|<\/v>|<[^>]+>/g, '');
    // 4. Strip bracketed noise descriptions
    cleaned = cleaned.replace(/\[[^\]]+\]|\([^\)]+\)/g, '');
  }

  // Common normalization: collapse excessive line breaks and trim lines
  const lines = cleaned
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const normalizedText = lines.join(' ').replace(/\s+/g, ' ').trim();
  const words = normalizedText ? normalizedText.split(/\s+/).filter(Boolean) : [];

  return {
    text: normalizedText,
    wordCount: words.length
  };
}

/**
 * Splits normalized transcript text into semantically cohesive chunks.
 * Chunks are sized between 600-900 characters with natural sentence boundary preservation
 * and an 80-character overlap for continuity.
 */
export function chunkTranscript(
  transcriptId: string,
  title: string,
  normalizedText: string
): TranscriptChunk[] {
  if (!normalizedText || normalizedText.trim().length === 0) {
    return [];
  }

  const TARGET_CHUNK_SIZE = 750;
  const CHUNK_OVERLAP = 90;
  const chunks: TranscriptChunk[] = [];
  const text = normalizedText.trim();
  const createdAt = new Date().toISOString();

  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + TARGET_CHUNK_SIZE;

    if (endIndex >= text.length) {
      endIndex = text.length;
    } else {
      // Look for natural sentence boundaries (. ? ! । \n) near the end
      const lookaround = text.substring(endIndex - 60, Math.min(endIndex + 60, text.length));
      const boundaryMatch = lookaround.match(/[\.\?\!\।]\s+/);

      if (boundaryMatch && boundaryMatch.index !== undefined) {
        endIndex = (endIndex - 60) + boundaryMatch.index + 1;
      } else {
        // Fallback to word boundary (space)
        const spaceIndex = text.lastIndexOf(' ', endIndex);
        if (spaceIndex > startIndex + 200) {
          endIndex = spaceIndex;
        }
      }
    }

    const chunkContent = text.substring(startIndex, endIndex).trim();
    if (chunkContent.length > 50) {
      chunks.push({
        id: `chk_${transcriptId}_${chunkIndex}`,
        transcriptId,
        title,
        content: chunkContent,
        chunkIndex,
        createdAt
      });
      chunkIndex++;
    }

    if (endIndex >= text.length) {
      break;
    }

    // Advance startIndex with overlap
    startIndex = Math.max(endIndex - CHUNK_OVERLAP, startIndex + 1);
  }

  return chunks;
}

/**
 * Loads the local persistent cache of transcripts and chunks.
 */
export function loadCache(): CacheData {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return { transcripts: [], chunks: [] };
    }
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      transcripts: Array.isArray(parsed.transcripts) ? parsed.transcripts : [],
      chunks: Array.isArray(parsed.chunks) ? parsed.chunks : []
    };
  } catch (err) {
    console.error('Failed to load transcripts cache from disk:', err);
    return { transcripts: [], chunks: [] };
  }
}

/**
 * Saves transcripts and chunks to the local persistent cache.
 */
export function saveCache(data: CacheData): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write transcripts cache to disk:', err);
  }
}

/**
 * Synchronizes a transcript and its chunks to Firestore using the admin's ID token.
 */
export async function syncTranscriptToFirestore(
  idToken: string,
  transcript: Transcript,
  chunks: TranscriptChunk[]
): Promise<boolean> {
  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId;
    const databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || fallbackConfig.firestoreDatabaseId || '(default)';
    const basePath = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
    const commitUrl = `${basePath}:commit`;

    const writes: any[] = [
      {
        update: {
          name: `projects/${projectId}/databases/${databaseId}/documents/transcripts/${transcript.id}`,
          fields: {
            id: { stringValue: transcript.id },
            title: { stringValue: transcript.title },
            fileName: { stringValue: transcript.fileName },
            fileType: { stringValue: transcript.fileType },
            uploadedBy: { stringValue: transcript.uploadedBy },
            uploadedAt: { stringValue: transcript.uploadedAt },
            status: { stringValue: transcript.status },
            chunkCount: { integerValue: String(transcript.chunkCount) },
            wordCount: { integerValue: String(transcript.wordCount) },
            summary: { stringValue: transcript.summary }
          }
        }
      }
    ];

    // Add chunks up to Firestore commit batch limit (500 writes max per commit)
    const chunksToSync = chunks.slice(0, 450);
    for (const chunk of chunksToSync) {
      writes.push({
        update: {
          name: `projects/${projectId}/databases/${databaseId}/documents/transcriptChunks/${chunk.id}`,
          fields: {
            id: { stringValue: chunk.id },
            transcriptId: { stringValue: chunk.transcriptId },
            title: { stringValue: chunk.title },
            content: { stringValue: chunk.content },
            chunkIndex: { integerValue: String(chunk.chunkIndex) },
            createdAt: { stringValue: chunk.createdAt }
          }
        }
      });
    }

    const res = await fetch(commitUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ writes })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('Firestore transcript sync notice:', res.status, err);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Non-blocking Firestore sync notice:', err);
    return false;
  }
}

/**
 * Deletes a transcript and its associated chunks from Firestore using the admin's ID token.
 */
export async function deleteTranscriptFromFirestore(
  idToken: string,
  transcriptId: string,
  chunkIds: string[]
): Promise<boolean> {
  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId;
    const databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || fallbackConfig.firestoreDatabaseId || '(default)';
    const basePath = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
    const commitUrl = `${basePath}:commit`;

    const writes: any[] = [
      {
        delete: `projects/${projectId}/databases/${databaseId}/documents/transcripts/${transcriptId}`
      }
    ];

    for (const chunkId of chunkIds.slice(0, 450)) {
      writes.push({
        delete: `projects/${projectId}/databases/${databaseId}/documents/transcriptChunks/${chunkId}`
      });
    }

    const res = await fetch(commitUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ writes })
    });

    return res.ok;
  } catch (err) {
    console.warn('Firestore transcript deletion notice:', err);
    return false;
  }
}

/**
 * Core RAG Retrieval Engine:
 * Analyzes the user's sales query (product, industry, buyer mindset, objection context)
 * and scores stored transcript chunks using keyword frequency, domain term weighting,
 * and semantic context relevance.
 */
export function retrieveRelevantKnowledge(
  query: {
    product: string;
    targetIndustry: string;
    businessModel?: string;
    dealSize?: string;
    buyerProfile?: string;
    additionalContext?: string;
  },
  topK: number = 4
): KnowledgeRetrievalResult {
  const cache = loadCache();
  if (!cache.chunks || cache.chunks.length === 0) {
    return {
      chunks: [],
      promptContext: '',
      matchedCount: 0
    };
  }

  // Tokenize user query
  const queryTokens = new Set<string>();
  const addTokens = (str?: string) => {
    if (!str) return;
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2)
      .forEach(t => queryTokens.add(t));
  };

  addTokens(query.product);
  addTokens(query.targetIndustry);
  addTokens(query.businessModel);
  addTokens(query.buyerProfile);
  addTokens(query.additionalContext);

  // Common high-signal Indian B2B sales objection trigger terms
  const objectionSignals = [
    'bhav', 'price', 'expensive', 'mehenga', 'discount', 'budget',
    'delay', 'baad', 'sochke', 'timing', 'next year', 'agle saal',
    'competitor', 'sasta', 'local', 'alternative',
    'trust', 'guarantee', 'risk', 'proof', 'roi', 'downtime',
    'loss', 'leakage', '6klh', 'stab', 'twist', 'lala', 'msme', '43b'
  ];

  // Score each chunk
  const scoredChunks: (TranscriptChunk & { score: number })[] = [];

  for (const chunk of cache.chunks) {
    const contentLower = chunk.content.toLowerCase();
    let score = 0;

    // 1. Direct query term matches
    queryTokens.forEach(token => {
      if (contentLower.includes(token)) {
        // Shorter query tokens get smaller weight, specialized terms get higher
        score += token.length > 5 ? 3 : 1.5;
      }
    });

    // 2. High-value sales objection signal matches
    for (const signal of objectionSignals) {
      if (contentLower.includes(signal)) {
        score += 2;
      }
    }

    // 3. Title keyword match
    const titleLower = chunk.title.toLowerCase();
    queryTokens.forEach(token => {
      if (titleLower.includes(token)) {
        score += 3;
      }
    });

    if (score > 0) {
      scoredChunks.push({
        ...chunk,
        score
      });
    }
  }

  // Sort descending by relevance score
  scoredChunks.sort((a, b) => b.score - a.score);
  const selectedChunks = scoredChunks.slice(0, topK);

  if (selectedChunks.length === 0) {
    // If no direct token match, take up to 2 high-level chunks from available transcripts if available
    const fallbackChunks = cache.chunks.slice(0, 2);
    if (fallbackChunks.length === 0) {
      return { chunks: [], promptContext: '', matchedCount: 0 };
    }
    const promptContext = formatPromptContext(fallbackChunks);
    return {
      chunks: fallbackChunks,
      promptContext,
      matchedCount: fallbackChunks.length
    };
  }

  const promptContext = formatPromptContext(selectedChunks);

  return {
    chunks: selectedChunks,
    promptContext,
    matchedCount: selectedChunks.length
  };
}

/**
 * Formats retrieved transcript chunks into an internally labeled prompt section
 * that Gemini can easily distinguish from the user's specific deal situation.
 */
function formatPromptContext(chunks: TranscriptChunk[]): string {
  if (!chunks || chunks.length === 0) return '';

  let context = `\n================================================================================
=== CLIENT VIDEO TRANSCRIPT KNOWLEDGE BASE (AUTHENTIC COACH METHODOLOGY & REAL CLIENT CASES) ===
================================================================================
The following excerpts have been retrieved from real video transcripts and coaching masterclasses by Manuj Bajaj.
Use these authentic turnaround stories, specific objection phrases, and Indian business psychology insights to directly enrich the Stab & Twist and 6KLH counters for this prospect:
`;

  chunks.forEach((chunk, idx) => {
    context += `\n--- [EXCERPT ${idx + 1} | Source: "${chunk.title}"] ---\n`;
    context += `"${chunk.content}"\n`;
  });

  context += `================================================================================\n`;
  return context;
}
