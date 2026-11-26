/** Types renvoyés par le backend avec chaque réponse de l'IA (sources consultées + vérification automatique). */

export interface AiSource {
  id: string;                 // S1, S2...
  kind: 'DOCUMENT' | 'JURISPRUDENCE' | 'LEGISLATION' | 'DONNEE';
  title: string;
  documentId: number | null;
  page: number | null;
  excerpt: string;
  link: string | null;        // route interne pour une donnée du logiciel
  officialUrl: string | null; // texte officiel (Judilibre, Légifrance...)
  details: Record<string, string>;
}

export interface AiCheckedReference {
  kind: 'POURVOI' | 'ARTICLE' | 'ECLI' | 'DECISION';
  text: string;
  key: string;
  status: 'TROUVEE_DANS_SOURCE' | 'VERIFIEE_OFFICIELLE' | 'NON_VERIFIEE' | 'INTROUVABLE';
  sourceId: string | null;
  officialUrl: string | null;
  message: string;
}

export interface AiIssue {
  type: string;
  severity: 'BLOQUANT' | 'A_NOTER';
  text: string;
  message: string;
}

export interface AiVerification {
  status: 'VERIFIEE' | 'PARTIELLE' | 'A_CONTROLER' | 'NON_SOURCEE' | 'SANS_SOURCE';
  statusLabel: string;
  citedSources: string[];
  references: AiCheckedReference[];
  issues: AiIssue[];
  officialCheckEnabled: boolean;
}

export interface AiAnswerPayload {
  result: string;
  sources?: AiSource[];
  verification?: AiVerification;
  /** Droit dans lequel la base légale a été recherchée, ex. ['LUXEMBOURG', 'INTERNATIONAL']. */
  perimetre?: string[];
}

/** Morceau de texte à afficher : texte simple, citation [S#] ou passage signalé. */
export interface AnswerSegment {
  type: 'text' | 'cite' | 'flag';
  value: string;
  ids?: string[];
  known?: boolean[];
  message?: string;
}

const CITATION = /\[(S\d+(?:\s*[,;]\s*S\d+)*)\]/g;

/**
 * Découpe la réponse en segments : citations [S#] (pastilles cliquables) et passages signalés par la
 * vérification (références non vérifiées, citations non retrouvées), surlignés en rouge.
 */
export function buildSegments(text: string, verification?: AiVerification, sources?: AiSource[]): AnswerSegment[] {
  const known = new Set((sources || []).map(s => s.id));
  type Mark = { start: number; end: number; seg: AnswerSegment };
  const marks: Mark[] = [];

  let m: RegExpExecArray | null;
  CITATION.lastIndex = 0;
  while ((m = CITATION.exec(text)) !== null) {
    const ids = m[1].split(/\s*[,;]\s*/);
    marks.push({ start: m.index, end: m.index + m[0].length, seg: { type: 'cite', value: m[0], ids, known: ids.map(id => known.has(id)) } });
  }

  const flagged = new Map<string, string>();
  (verification?.references || [])
    .filter(r => r.status === 'NON_VERIFIEE' || r.status === 'INTROUVABLE')
    .forEach(r => flagged.set(r.text, r.message));
  (verification?.issues || [])
    .filter(i => i.type === 'CITATION_NON_RETROUVEE' || i.type === 'REFERENCE_INTROUVABLE' || i.type === 'REFERENCE_NON_VERIFIEE')
    .forEach(i => flagged.set(i.text, i.message));

  flagged.forEach((message, needle) => {
    if (!needle) return;
    let from = 0;
    let idx: number;
    while ((idx = text.indexOf(needle, from)) !== -1) {
      const end = idx + needle.length;
      if (!marks.some(k => idx < k.end && end > k.start)) {
        marks.push({ start: idx, end, seg: { type: 'flag', value: needle, message } });
      }
      from = end;
    }
  });

  marks.sort((a, b) => a.start - b.start);
  const segments: AnswerSegment[] = [];
  let cursor = 0;
  for (const mark of marks) {
    if (mark.start < cursor) continue;
    if (mark.start > cursor) segments.push({ type: 'text', value: text.slice(cursor, mark.start) });
    segments.push(mark.seg);
    cursor = mark.end;
  }
  if (cursor < text.length) segments.push({ type: 'text', value: text.slice(cursor) });
  return segments;
}
