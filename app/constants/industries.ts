export const INDUSTRIES = {
  TI: 'TI',
  SAUDE: 'SAUDE',
  VENDAS: 'VENDAS',
  ADMINISTRATIVO: 'ADMINISTRATIVO',
  ENGENHARIA: 'ENGENHARIA',
  GERAL: 'GERAL',
} as const;

export type Industry = keyof typeof INDUSTRIES; 