// 使用者角色
export const ROLES = ['admin', 'procurement', 'pm', 'finance', 'user'] as const;
export type Role = (typeof ROLES)[number];

// 專案狀態
export const PROJECT_STATUSES = ['planning', 'in_progress', 'completed', 'closed'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// 專案人員角色
export const PERSONNEL_ROLES = ['pm', 'engineer', 'site_manager', 'foreman', 'safety', 'other'] as const;
export type PersonnelRole = (typeof PERSONNEL_ROLES)[number];

// 專案任務狀態
export const TASK_STATUSES = ['todo', 'in_progress', 'done', 'blocked'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// 採購單狀態
export const PROCUREMENT_STATUSES = [
  'draft',
  'pending',
  'approved',
  'ordered',
  'received',
  'completed',
  'cancelled',
] as const;
export type ProcurementStatus = (typeof PROCUREMENT_STATUSES)[number];

// 採購付款方式
export const PAYMENT_METHODS = ['petty_cash', 'bank_transfer', 'check', 'credit', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// 報價單狀態
export const QUOTATION_STATUSES = ['draft', 'submitted', 'approved', 'signed', 'rejected'] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

// 會計科目類別
export const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

// 傳票類型
export const VOUCHER_TYPES = ['receipt', 'payment', 'transfer', 'general'] as const;
export type VoucherType = (typeof VOUCHER_TYPES)[number];

// 零用金交易類型
export const PETTY_CASH_TYPES = ['allocation', 'expense', 'settlement', 'return'] as const;
export type PettyCashType = (typeof PETTY_CASH_TYPES)[number];

// 廠商工種分類
export const TRADE_CATEGORIES = [
  'civil',
  'structure',
  'plumbing',
  'electrical',
  'hvac',
  'decoration',
  'waterproof',
  'demolition',
  'material',
  'equipment',
  'other',
] as const;
export type TradeCategory = (typeof TRADE_CATEGORIES)[number];

// 廠商檔案類型
export const SUPPLIER_FILE_TYPES = ['registration', 'contract', 'insurance', 'license', 'other'] as const;
export type SupplierFileType = (typeof SUPPLIER_FILE_TYPES)[number];

// 施工照片分類
export const PHOTO_CATEGORIES = ['before', 'during', 'after', 'inspection', 'defect', 'other'] as const;
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

// 天氣（施工日誌）
export const WEATHER_TYPES = ['sunny', 'cloudy', 'rainy', 'stormy'] as const;
export type WeatherType = (typeof WEATHER_TYPES)[number];

// 通知類型
export const NOTIFICATION_TYPES = ['info', 'warning', 'approval', 'budget_alert'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
