/**
 * Constantes globais do sistema Unica
 */

// Configurações do sistema
export const SYSTEM_CONFIG = {
  APP_NAME: 'Unica Clube de Benefícios',
  COMPANY_NAME: 'Grupo Zan Norte',
  DEFAULT_CURRENCY: 'BRL',
  POINTS_VALUE: 1.0, // 1 ponto = R$ 1,00
  MIN_PURCHASE_VALUE: 1.0, // Valor mínimo de compra
} as const

// Roles do sistema com labels
export const ROLES = {
  DEVELOPER: {
    value: 'DEVELOPER',
    label: 'Desenvolvedor',
    description: 'Acesso técnico ao sistema',
  },
  ADMIN: {
    value: 'ADMIN',
    label: 'Administrador',
    description: 'Controle total do negócio',
  },
  PARCEIRO: {
    value: 'PARCEIRO',
    label: 'Parceiro',
    description: 'Empresa parceira',
  },
  ASSINANTE: {
    value: 'ASSINANTE',
    label: 'Assinante',
    description: 'Cliente do clube',
  },
} as const

// Tipos de benefício com labels
export const BENEFIT_TYPES = {
  DESCONTO: {
    value: 'DESCONTO',
    label: 'Desconto',
    description: 'Desconto percentual ou fixo',
    icon: 'Percent',
  },
  CASHBACK: {
    value: 'CASHBACK',
    label: 'Cashback',
    description: 'Retorno em dinheiro',
    icon: 'RefreshCcw',
  },
  PONTOS: {
    value: 'PONTOS',
    label: 'Pontos',
    description: 'Pontos mensais',
    icon: 'Coins',
  },
  ACESSO_EXCLUSIVO: {
    value: 'ACESSO_EXCLUSIVO',
    label: 'Acesso Exclusivo',
    description: 'Acesso a parceiros específicos',
    icon: 'Star',
  },
} as const

// Status de assinatura com labels
export const SUBSCRIPTION_STATUS = {
  PENDING: {
    value: 'PENDING',
    label: 'Pendente',
    color: 'yellow',
  },
  ACTIVE: {
    value: 'ACTIVE',
    label: 'Ativo',
    color: 'green',
  },
  SUSPENDED: {
    value: 'SUSPENDED',
    label: 'Suspenso',
    color: 'orange',
  },
  CANCELED: {
    value: 'CANCELED',
    label: 'Cancelado',
    color: 'red',
  },
} as const

// Status de transação com labels
export const TRANSACTION_STATUS = {
  PENDING: {
    value: 'PENDING',
    label: 'Pendente',
    color: 'yellow',
  },
  COMPLETED: {
    value: 'COMPLETED',
    label: 'Concluída',
    color: 'green',
  },
  FAILED: {
    value: 'FAILED',
    label: 'Falhou',
    color: 'red',
  },
  CANCELLED: {
    value: 'CANCELLED',
    label: 'Cancelada',
    color: 'gray',
  },
} as const

// Tipos de transação com labels
export const TRANSACTION_TYPES = {
  PURCHASE: {
    value: 'PURCHASE',
    label: 'Compra',
    icon: 'ShoppingCart',
  },
  CASHBACK: {
    value: 'CASHBACK',
    label: 'Cashback',
    icon: 'RefreshCcw',
  },
  BONUS: {
    value: 'BONUS',
    label: 'Bônus',
    icon: 'Gift',
  },
  MONTHLY_POINTS: {
    value: 'MONTHLY_POINTS',
    label: 'Pontos Mensais',
    icon: 'Calendar',
  },
  REFUND: {
    value: 'REFUND',
    label: 'Estorno',
    icon: 'RotateCcw',
  },
} as const

// Categorias de parceiros
export const PARTNER_CATEGORIES = [
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'saude', label: 'Saúde' },
  { value: 'beleza', label: 'Beleza' },
  { value: 'educacao', label: 'Educação' },
  { value: 'entretenimento', label: 'Entretenimento' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'varejo', label: 'Varejo' },
  { value: 'automotivo', label: 'Automotivo' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'pet', label: 'Pet' },
  { value: 'outros', label: 'Outros' },
] as const

// Estados brasileiros
export const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
] as const

// Dias da semana
export const WEEK_DAYS = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
] as const

// Configurações de paginação
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const

// Mensagens de erro comuns
export const ERROR_MESSAGES = {
  GENERIC: 'Ocorreu um erro inesperado. Tente novamente.',
  UNAUTHORIZED: 'Você não tem permissão para acessar este recurso.',
  NOT_FOUND: 'Recurso não encontrado.',
  VALIDATION: 'Dados inválidos. Verifique os campos.',
  NETWORK: 'Erro de conexão. Verifique sua internet.',
  SESSION_EXPIRED: 'Sua sessão expirou. Faça login novamente.',
} as const

// Mensagens de sucesso comuns
export const SUCCESS_MESSAGES = {
  CREATED: 'Cadastro realizado com sucesso!',
  UPDATED: 'Atualização realizada com sucesso!',
  DELETED: 'Registro removido com sucesso!',
  SAVED: 'Alterações salvas com sucesso!',
} as const
