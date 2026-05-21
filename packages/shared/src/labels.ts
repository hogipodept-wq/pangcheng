import type {
  Role,
  ProjectStatus,
  PersonnelRole,
  TaskStatus,
  ProcurementStatus,
  PaymentMethod,
  QuotationStatus,
  AccountType,
  VoucherType,
  PettyCashType,
  TradeCategory,
  SupplierFileType,
  PhotoCategory,
  WeatherType,
  NotificationType,
} from './enums.js';

export const ROLE_LABELS: Record<Role, string> = {
  admin: '系統管理員',
  procurement: '採購人員',
  pm: '專案經理',
  finance: '財務人員',
  user: '一般使用者',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: '規劃中',
  in_progress: '進行中',
  completed: '已完工',
  closed: '已結案',
};

export const PERSONNEL_ROLE_LABELS: Record<PersonnelRole, string> = {
  pm: '專案經理',
  engineer: '工程師',
  site_manager: '工地主任',
  foreman: '領班',
  safety: '安全衛生',
  other: '其他',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '待辦',
  in_progress: '進行中',
  done: '已完成',
  blocked: '受阻',
};

export const PROCUREMENT_STATUS_LABELS: Record<ProcurementStatus, string> = {
  draft: '草稿',
  pending: '待審核',
  approved: '已核准',
  ordered: '已下單',
  received: '已收貨',
  completed: '已完成',
  cancelled: '已取消',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  petty_cash: '零用金',
  bank_transfer: '銀行轉帳',
  check: '支票',
  credit: '月結賒帳',
  other: '其他',
};

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: '草稿',
  submitted: '送審中',
  approved: '已核准',
  signed: '已簽回',
  rejected: '已退回',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: '資產',
  liability: '負債',
  equity: '業主權益',
  revenue: '收入',
  expense: '支出',
};

export const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
  receipt: '收入傳票',
  payment: '支出傳票',
  transfer: '轉帳傳票',
  general: '一般傳票',
};

export const PETTY_CASH_TYPE_LABELS: Record<PettyCashType, string> = {
  allocation: '撥款',
  expense: '支出',
  settlement: '沖銷',
  return: '退還',
};

export const TRADE_CATEGORY_LABELS: Record<TradeCategory, string> = {
  civil: '土木工程',
  structure: '結構工程',
  plumbing: '給排水',
  electrical: '電氣工程',
  hvac: '空調機電',
  decoration: '裝修工程',
  waterproof: '防水工程',
  demolition: '拆除工程',
  material: '建材供應',
  equipment: '機具租賃',
  other: '其他',
};

export const SUPPLIER_FILE_TYPE_LABELS: Record<SupplierFileType, string> = {
  registration: '營業登記',
  contract: '合約',
  insurance: '保險',
  license: '證照',
  other: '其他',
};

export const PHOTO_CATEGORY_LABELS: Record<PhotoCategory, string> = {
  before: '施工前',
  during: '施工中',
  after: '施工後',
  inspection: '自主檢查',
  defect: '缺失',
  other: '其他',
};

export const WEATHER_LABELS: Record<WeatherType, string> = {
  sunny: '晴',
  cloudy: '陰',
  rainy: '雨',
  stormy: '暴雨',
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  info: '一般通知',
  warning: '警告',
  approval: '簽核',
  budget_alert: '預算警示',
};
