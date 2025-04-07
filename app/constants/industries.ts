export type Industry =
  | 'GERAL'
  | 'TECNOLOGIA'
  | 'FINANCAS'
  | 'SAUDE'
  | 'EDUCACAO'
  | 'VAREJO'
  | 'MARKETING'
  | 'ENGENHARIA'
  | 'RECURSOS_HUMANOS'
  | 'VENDAS';

export const INDUSTRIES: { [key in Industry]: string } = {
  GERAL: 'Geral',
  TECNOLOGIA: 'Tecnologia',
  FINANCAS: 'Finanças',
  SAUDE: 'Saúde',
  EDUCACAO: 'Educação',
  VAREJO: 'Varejo',
  MARKETING: 'Marketing',
  ENGENHARIA: 'Engenharia',
  RECURSOS_HUMANOS: 'Recursos Humanos',
  VENDAS: 'Vendas',
}; 