/**
 * Droits applicables gérés par la base légale du cabinet (mêmes valeurs que Pays.java côté serveur et que l'écran
 * « Gestion jurisprudence »). L'international (CJUE, CEDH, conventions) est toujours ajouté à la recherche.
 */
export const PAYS_JURIDICTION = ['FRANCE', 'LUXEMBOURG', 'BELGIQUE', 'ALLEMAGNE', 'SUISSE', 'INTERNATIONAL'] as const;
export type PaysJuridiction = typeof PAYS_JURIDICTION[number];

const ALIASES: Record<string, PaysJuridiction> = {
  FR: 'FRANCE', LU: 'LUXEMBOURG', BE: 'BELGIQUE', BELGIUM: 'BELGIQUE', DE: 'ALLEMAGNE', GERMANY: 'ALLEMAGNE',
  DEUTSCHLAND: 'ALLEMAGNE', CH: 'SUISSE', SWITZERLAND: 'SUISSE', SCHWEIZ: 'SUISSE'
};

/** Pays saisi librement (« France », « lu », « Belgium »...) → valeur gérée, ou null si le pays n'est pas géré. */
export function normalizePays(value?: string | null): PaysJuridiction | null {
  if (!value) return null;
  const v = value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();
  const mapped = (ALIASES[v] || v) as PaysJuridiction;
  return (PAYS_JURIDICTION as readonly string[]).includes(mapped) ? mapped : null;
}
