import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

const now = () => new Date().toISOString();

/** 使用者帳號 */
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  email: text('email'),
  role: text('role').notNull().default('user'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(now),
});

/** 公司設定（單列） */
export const companySettings = sqliteTable('company_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().default('磐承營造工程'),
  taxId: text('tax_id'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  logoUrl: text('logo_url'),
  updatedAt: text('updated_at').notNull().$defaultFn(now),
});

/** 業主 */
export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  taxId: text('tax_id'),
  type: text('type').notNull().default('company'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  note: text('note'),
  createdAt: text('created_at').notNull().$defaultFn(now),
});

/** 業主聯絡人 */
export const clientContacts = sqliteTable('client_contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull(),
  name: text('name').notNull(),
  title: text('title'),
  phone: text('phone'),
  email: text('email'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).notNull().default(false),
  note: text('note'),
});

/** 廠商 */
export const suppliers = sqliteTable('suppliers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  taxId: text('tax_id'),
  tradeCategory: text('trade_category').notNull().default('other'),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  rating: integer('rating').notNull().default(0),
  note: text('note'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(now),
});

/** 廠商檔案 */
export const supplierFiles = sqliteTable('supplier_files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  supplierId: integer('supplier_id').notNull(),
  fileType: text('file_type').notNull().default('other'),
  name: text('name').notNull(),
  fileUrl: text('file_url').notNull(),
  expiryDate: text('expiry_date'),
  uploadedAt: text('uploaded_at').notNull().$defaultFn(now),
});

/** 專案 */
export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull(),
  name: text('name').notNull(),
  projectType: text('project_type'),
  clientId: integer('client_id'),
  clientContactInfo: text('client_contact_info'),
  designUnit: text('design_unit'),
  supervisionUnit: text('supervision_unit'),
  status: text('status').notNull().default('planning'),
  address: text('address'),
  manager: text('manager'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  duration: text('duration'),
  contractAmount: real('contract_amount').notNull().default(0),
  budgetAmount: real('budget_amount').notNull().default(0),
  description: text('description'),
  createdAt: text('created_at').notNull().$defaultFn(now),
});

/** 專案人員配置 */
export const projectPersonnel = sqliteTable('project_personnel', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull(),
  userId: integer('user_id'),
  name: text('name').notNull(),
  role: text('role').notNull().default('engineer'),
  phone: text('phone'),
  license: text('license'),
  note: text('note'),
});

/** 專案任務（甘特圖） */
export const projectTasks = sqliteTable('project_tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull().default('todo'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  progress: integer('progress').notNull().default(0),
  assignee: text('assignee'),
  note: text('note'),
  sortOrder: integer('sort_order').notNull().default(0),
});

/** 專案標單項目 */
export const projectBidItems = sqliteTable('project_bid_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull(),
  itemNo: text('item_no'),
  name: text('name').notNull(),
  spec: text('spec'),
  unit: text('unit'),
  quantity: real('quantity').notNull().default(0),
  unitPrice: real('unit_price').notNull().default(0),
  amount: real('amount').notNull().default(0),
  note: text('note'),
});

/** 採購單 */
export const procurements = sqliteTable('procurements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull(),
  projectId: integer('project_id'),
  supplierId: integer('supplier_id'),
  title: text('title').notNull(),
  status: text('status').notNull().default('draft'),
  paymentMethod: text('payment_method').notNull().default('bank_transfer'),
  requestedBy: text('requested_by'),
  requestDate: text('request_date'),
  expectedDate: text('expected_date'),
  receivedDate: text('received_date'),
  totalAmount: real('total_amount').notNull().default(0),
  note: text('note'),
  createdAt: text('created_at').notNull().$defaultFn(now),
});

/** 採購品項 */
export const procurementItems = sqliteTable('procurement_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  procurementId: integer('procurement_id').notNull(),
  name: text('name').notNull(),
  spec: text('spec'),
  unit: text('unit'),
  quantity: real('quantity').notNull().default(0),
  unitPrice: real('unit_price').notNull().default(0),
  amount: real('amount').notNull().default(0),
  note: text('note'),
});

/** 廠商報價（採購比價） */
export const procurementQuotes = sqliteTable('procurement_quotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  procurementId: integer('procurement_id').notNull(),
  supplierId: integer('supplier_id'),
  supplierName: text('supplier_name').notNull(),
  quoteAmount: real('quote_amount').notNull().default(0),
  quoteDate: text('quote_date'),
  selected: integer('selected', { mode: 'boolean' }).notNull().default(false),
  note: text('note'),
});

/** 會計科目 */
export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull().default('asset'),
  parentId: integer('parent_id'),
  note: text('note'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

/** 會計傳票 */
export const vouchers = sqliteTable('vouchers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull(),
  type: text('type').notNull().default('general'),
  date: text('date').notNull(),
  summary: text('summary'),
  totalAmount: real('total_amount').notNull().default(0),
  projectId: integer('project_id'),
  createdBy: text('created_by'),
  source: text('source').notNull().default('manual'),
  sourceId: integer('source_id'),
  createdAt: text('created_at').notNull().$defaultFn(now),
});

/** 傳票分錄 */
export const voucherEntries = sqliteTable('voucher_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  voucherId: integer('voucher_id').notNull(),
  accountId: integer('account_id'),
  accountCode: text('account_code'),
  accountName: text('account_name'),
  debit: real('debit').notNull().default(0),
  credit: real('credit').notNull().default(0),
  summary: text('summary'),
});

/** 零用金交易 */
export const pettyCashTransactions = sqliteTable('petty_cash_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),
  type: text('type').notNull().default('expense'),
  amount: real('amount').notNull().default(0),
  balance: real('balance').notNull().default(0),
  summary: text('summary'),
  projectId: integer('project_id'),
  voucherId: integer('voucher_id'),
  handledBy: text('handled_by'),
  createdAt: text('created_at').notNull().$defaultFn(now),
});

/** 人員 */
export const staff = sqliteTable('staff', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  role: text('role'),
  phone: text('phone'),
  email: text('email'),
  idNumber: text('id_number'),
  hireDate: text('hire_date'),
  dailyWage: real('daily_wage').notNull().default(0),
  note: text('note'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(now),
});

/** 人員零用金帳戶 */
export const staffPettyCash = sqliteTable('staff_petty_cash', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  staffId: integer('staff_id').notNull(),
  balance: real('balance').notNull().default(0),
  updatedAt: text('updated_at').notNull().$defaultFn(now),
});

/** 人員零用金交易明細 */
export const staffPettyCashTransactions = sqliteTable('staff_petty_cash_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  staffPettyCashId: integer('staff_petty_cash_id').notNull(),
  date: text('date').notNull(),
  type: text('type').notNull().default('expense'),
  amount: real('amount').notNull().default(0),
  balance: real('balance').notNull().default(0),
  summary: text('summary'),
});

/** 報價單 */
export const quotations = sqliteTable('quotations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull(),
  projectName: text('project_name').notNull(),
  description: text('description'),
  status: text('status').notNull().default('draft'),
  quoteDate: text('quote_date'),
  validUntil: text('valid_until'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  duration: text('duration'),
  location: text('location'),
  clientId: integer('client_id'),
  clientName: text('client_name'),
  clientContact: text('client_contact'),
  clientPhone: text('client_phone'),
  clientEmail: text('client_email'),
  clientAddress: text('client_address'),
  subtotal: real('subtotal').notNull().default(0),
  discountPercent: real('discount_percent').notNull().default(0),
  discountAmount: real('discount_amount').notNull().default(0),
  taxRate: real('tax_rate').notNull().default(5),
  taxAmount: real('tax_amount').notNull().default(0),
  totalAmount: real('total_amount').notNull().default(0),
  paymentTerms: text('payment_terms'),
  terms: text('terms'),
  note: text('note'),
  createdBy: text('created_by'),
  signedFileUrl: text('signed_file_url'),
  createdAt: text('created_at').notNull().$defaultFn(now),
});

/** 報價品項 */
export const quotationItems = sqliteTable('quotation_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quotationId: integer('quotation_id').notNull(),
  category: text('category'),
  itemNo: text('item_no'),
  name: text('name').notNull(),
  spec: text('spec'),
  unit: text('unit'),
  quantity: real('quantity').notNull().default(0),
  unitPrice: real('unit_price').notNull().default(0),
  amount: real('amount').notNull().default(0),
  note: text('note'),
});

/** 報價範本 */
export const quotationTemplates = sqliteTable('quotation_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  itemsJson: text('items_json').notNull().default('[]'),
  createdAt: text('created_at').notNull().$defaultFn(now),
});

/** 施工日誌 */
export const constructionLogs = sqliteTable('construction_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull(),
  date: text('date').notNull(),
  weather: text('weather').notNull().default('sunny'),
  temperature: text('temperature'),
  workforce: integer('workforce').notNull().default(0),
  summary: text('summary'),
  content: text('content'),
  recordedBy: text('recorded_by'),
  createdAt: text('created_at').notNull().$defaultFn(now),
});

/** 施工照片 / 自主檢查照片 */
export const inspectionPhotos = sqliteTable('inspection_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull(),
  constructionLogId: integer('construction_log_id'),
  category: text('category').notNull().default('during'),
  title: text('title'),
  photoUrl: text('photo_url').notNull(),
  takenAt: text('taken_at'),
  location: text('location'),
  description: text('description'),
  uploadedBy: text('uploaded_by'),
  createdAt: text('created_at').notNull().$defaultFn(now),
});

/** 行事曆事件 */
export const calendarEvents = sqliteTable('calendar_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  type: text('type').notNull().default('general'),
  projectId: integer('project_id'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  allDay: integer('all_day', { mode: 'boolean' }).notNull().default(true),
  location: text('location'),
  description: text('description'),
  createdBy: text('created_by'),
  createdAt: text('created_at').notNull().$defaultFn(now),
});

/** 附件 */
export const attachments = sqliteTable('attachments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
  name: text('name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size').notNull().default(0),
  mimeType: text('mime_type'),
  uploadedBy: text('uploaded_by'),
  createdAt: text('created_at').notNull().$defaultFn(now),
});

/** 文件連結 */
export const documentLinks = sqliteTable('document_links', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  note: text('note'),
  createdAt: text('created_at').notNull().$defaultFn(now),
});

/** 通知 */
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id'),
  type: text('type').notNull().default('info'),
  title: text('title').notNull(),
  message: text('message'),
  link: text('link'),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(now),
});

/** 預算警示 */
export const budgetAlerts = sqliteTable('budget_alerts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  projectId: integer('project_id').notNull(),
  threshold: real('threshold').notNull().default(0.8),
  currentRatio: real('current_ratio').notNull().default(0),
  message: text('message'),
  resolved: integer('resolved', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(now),
});
