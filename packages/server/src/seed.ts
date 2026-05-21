import { eq } from 'drizzle-orm';
import { db } from './db.js';
import { hashPassword } from './auth.js';
import {
  users,
  companySettings,
  clients,
  clientContacts,
  suppliers,
  projects,
  projectPersonnel,
  projectBidItems,
  projectTasks,
  procurements,
  procurementItems,
  procurementQuotes,
  staff,
  constructionLogs,
  quotations,
  quotationItems,
  accounts,
  notifications,
} from './schema.js';

/** 首次啟動時建立預設帳號與示範資料 */
export function seedDatabase(): void {
  const existing = db.select().from(users).all();
  if (existing.length > 0) return;

  console.log('[seed] 初始化資料庫，建立預設帳號與示範資料…');

  // 使用者帳號
  db.insert(users)
    .values([
      { username: 'admin', passwordHash: hashPassword('admin1234'), name: '系統管理員', role: 'admin', email: 'admin@pangcheng.com' },
      { username: 'procurement', passwordHash: hashPassword('admin1234'), name: '陳采購', role: 'procurement' },
      { username: 'pm', passwordHash: hashPassword('admin1234'), name: '林專案', role: 'pm' },
      { username: 'finance', passwordHash: hashPassword('admin1234'), name: '黃財務', role: 'finance' },
    ])
    .run();

  // 公司設定
  db.insert(companySettings)
    .values({
      name: '磐承營造工程有限公司',
      taxId: '24681357',
      address: '台北市中山區建國北路二段 88 號 6 樓',
      phone: '02-2500-1234',
      email: 'service@pangcheng.com',
    })
    .run();

  // 業主
  db.insert(clients)
    .values([
      { name: '富鼎建設股份有限公司', taxId: '12345678', type: 'company', address: '台北市信義區松仁路 100 號', phone: '02-8780-5000', email: 'contact@fuding.com.tw' },
      { name: '永慶都市更新投資', taxId: '87654321', type: 'company', address: '新北市板橋區文化路一段 50 號', phone: '02-2960-7788' },
      { name: '王志明', type: 'individual', address: '台北市大同區迪化街一段 200 號', phone: '0912-345-678', note: '老宅延壽補助案業主' },
    ])
    .run();

  db.insert(clientContacts)
    .values([
      { clientId: 1, name: '張經理', title: '工務部經理', phone: '0922-111-222', email: 'chang@fuding.com.tw', isPrimary: true },
      { clientId: 1, name: '李小姐', title: '專案窗口', phone: '0933-444-555' },
      { clientId: 2, name: '吳主任', title: '都更專案主任', phone: '0955-666-777', isPrimary: true },
    ])
    .run();

  // 廠商
  db.insert(suppliers)
    .values([
      { name: '大同鋼鐵建材行', taxId: '11223344', tradeCategory: 'material', contactPerson: '趙老闆', phone: '02-2701-3333', rating: 5 },
      { name: '宏昌水電工程行', taxId: '22334455', tradeCategory: 'plumbing', contactPerson: '錢師傅', phone: '0911-222-333', rating: 4 },
      { name: '永豐混凝土', taxId: '33445566', tradeCategory: 'structure', contactPerson: '孫經理', phone: '02-2999-8888', rating: 4 },
      { name: '亞泰防水工程', taxId: '44556677', tradeCategory: 'waterproof', contactPerson: '周師傅', phone: '0922-333-444', rating: 5 },
      { name: '聯立機具租賃', taxId: '55667788', tradeCategory: 'equipment', contactPerson: '吳先生', phone: '02-2666-7777', rating: 3 },
      { name: 'great 拆除工程', taxId: '66778899', tradeCategory: 'demolition', contactPerson: '鄭老闆', phone: '0933-555-666', rating: 4 },
    ])
    .run();

  // 專案
  db.insert(projects)
    .values([
      { code: 'P2026-001', name: '信義區商辦大樓新建工程', clientId: 1, status: 'in_progress', address: '台北市信義區松高路 18 號', manager: '林專案', startDate: '2026-01-15', endDate: '2027-06-30', contractAmount: 185000000, budgetAmount: 152000000, description: '地上 18 層、地下 4 層鋼骨商辦大樓' },
      { code: 'P2026-002', name: '板橋都更住宅整建案', clientId: 2, status: 'in_progress', address: '新北市板橋區文化路一段', manager: '林專案', startDate: '2026-03-01', endDate: '2027-12-31', contractAmount: 96000000, budgetAmount: 80000000, description: '老舊公寓都市更新重建' },
      { code: 'P2026-003', name: '迪化街老宅延壽補強工程', clientId: 3, status: 'planning', address: '台北市大同區迪化街一段 200 號', manager: '林專案', startDate: '2026-06-01', endDate: '2026-11-30', contractAmount: 4800000, budgetAmount: 3900000, description: '歷史建物結構補強與防水延壽' },
      { code: 'P2025-012', name: '內湖廠房屋頂修繕工程', clientId: 1, status: 'completed', address: '台北市內湖區行愛路', manager: '林專案', startDate: '2025-08-01', endDate: '2025-12-20', contractAmount: 7200000, budgetAmount: 6100000 },
    ])
    .run();

  db.insert(projectPersonnel)
    .values([
      { projectId: 1, name: '林專案', role: 'pm', phone: '0911-000-001' },
      { projectId: 1, name: '王工程師', role: 'engineer', phone: '0911-000-002' },
      { projectId: 1, name: '陳主任', role: 'site_manager', phone: '0911-000-003' },
      { projectId: 2, name: '林專案', role: 'pm', phone: '0911-000-001' },
      { projectId: 2, name: '李工程師', role: 'engineer', phone: '0911-000-004' },
    ])
    .run();

  db.insert(projectBidItems)
    .values([
      { projectId: 1, itemNo: 'A-01', name: '基礎開挖', spec: '連續壁工法', unit: 'm3', quantity: 12000, unitPrice: 850, amount: 10200000 },
      { projectId: 1, itemNo: 'A-02', name: '鋼骨結構', spec: 'SN490', unit: 'ton', quantity: 2400, unitPrice: 42000, amount: 100800000 },
      { projectId: 1, itemNo: 'A-03', name: '外牆帷幕', spec: '玻璃帷幕', unit: 'm2', quantity: 8600, unitPrice: 9500, amount: 81700000 },
      { projectId: 3, itemNo: 'C-01', name: '結構補強', spec: '碳纖維補強', unit: '式', quantity: 1, unitPrice: 1800000, amount: 1800000 },
      { projectId: 3, itemNo: 'C-02', name: '屋頂防水', spec: 'PU 防水', unit: 'm2', quantity: 320, unitPrice: 1200, amount: 384000 },
    ])
    .run();

  db.insert(projectTasks)
    .values([
      { projectId: 1, name: '基礎工程', status: 'done', startDate: '2026-01-15', endDate: '2026-04-30', progress: 100, assignee: '陳主任', sortOrder: 1 },
      { projectId: 1, name: '地下室結構', status: 'in_progress', startDate: '2026-05-01', endDate: '2026-09-30', progress: 45, assignee: '王工程師', sortOrder: 2 },
      { projectId: 1, name: '地上樓層結構', status: 'todo', startDate: '2026-10-01', endDate: '2027-03-31', progress: 0, assignee: '王工程師', sortOrder: 3 },
      { projectId: 2, name: '舊屋拆除', status: 'in_progress', startDate: '2026-03-01', endDate: '2026-05-31', progress: 70, assignee: '李工程師', sortOrder: 1 },
    ])
    .run();

  // 採購單
  db.insert(procurements)
    .values([
      { code: 'PO2026-0001', projectId: 1, supplierId: 3, title: '地下室結構混凝土採購', status: 'received', paymentMethod: 'bank_transfer', requestedBy: '陳采購', requestDate: '2026-04-10', expectedDate: '2026-04-25', receivedDate: '2026-04-24', totalAmount: 0, note: '4000psi 預拌混凝土' },
      { code: 'PO2026-0002', projectId: 1, supplierId: 1, title: '鋼骨結構材料第一批', status: 'ordered', paymentMethod: 'credit', requestedBy: '陳采購', requestDate: '2026-05-02', expectedDate: '2026-06-15', totalAmount: 0 },
      { code: 'PO2026-0003', projectId: 2, supplierId: 6, title: '舊建物拆除工程發包', status: 'approved', paymentMethod: 'bank_transfer', requestedBy: '陳采購', requestDate: '2026-03-05', totalAmount: 0 },
      { code: 'PO2026-0004', projectId: 1, supplierId: 5, title: '工地機具租賃（5月）', status: 'pending', paymentMethod: 'petty_cash', requestedBy: '陳主任', requestDate: '2026-05-08', totalAmount: 0 },
      { code: 'PO2026-0005', projectId: 3, supplierId: 4, title: '屋頂防水材料採購', status: 'draft', paymentMethod: 'bank_transfer', requestedBy: '陳采購', requestDate: '2026-05-15', totalAmount: 0 },
    ])
    .run();

  const procItems: { procurementId: number; name: string; spec: string; unit: string; quantity: number; unitPrice: number }[] = [
    { procurementId: 1, name: '預拌混凝土 4000psi', spec: '4000psi', unit: 'm3', quantity: 850, unitPrice: 2800 },
    { procurementId: 1, name: '泵送費', spec: '-', unit: '式', quantity: 1, unitPrice: 120000 },
    { procurementId: 2, name: 'H 型鋼 SN490', spec: 'H400x400', unit: 'ton', quantity: 320, unitPrice: 42000 },
    { procurementId: 3, name: '建物拆除工程', spec: '含廢棄物清運', unit: '式', quantity: 1, unitPrice: 3850000 },
    { procurementId: 4, name: '挖土機租賃', spec: '20噸級', unit: '月', quantity: 2, unitPrice: 85000 },
    { procurementId: 4, name: '高空作業車', spec: '12米', unit: '月', quantity: 1, unitPrice: 48000 },
    { procurementId: 5, name: 'PU 防水塗料', spec: '室外型', unit: '桶', quantity: 40, unitPrice: 3200 },
  ];
  for (const it of procItems) {
    db.insert(procurementItems)
      .values({ ...it, amount: it.quantity * it.unitPrice })
      .run();
  }
  // 回寫採購單總額
  for (let pid = 1; pid <= 5; pid++) {
    const items = procItems.filter((i) => i.procurementId === pid);
    const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    db.update(procurements).set({ totalAmount: total }).where(eq(procurements.id, pid)).run();
  }

  db.insert(procurementQuotes)
    .values([
      { procurementId: 3, supplierId: 6, supplierName: 'great 拆除工程', quoteAmount: 3850000, quoteDate: '2026-03-03', selected: true },
      { procurementId: 3, supplierId: null, supplierName: '宏達拆除', quoteAmount: 4100000, quoteDate: '2026-03-03', selected: false },
      { procurementId: 3, supplierId: null, supplierName: '全方位工程', quoteAmount: 3990000, quoteDate: '2026-03-04', selected: false },
    ])
    .run();

  // 人員
  db.insert(staff)
    .values([
      { name: '陳主任', role: '工地主任', phone: '0911-000-003', hireDate: '2020-03-01', dailyWage: 3500 },
      { name: '王工程師', role: '結構工程師', phone: '0911-000-002', hireDate: '2021-07-15', dailyWage: 3200 },
      { name: '阿勇師', role: '模板領班', phone: '0922-888-999', hireDate: '2019-01-10', dailyWage: 2800 },
      { name: '小許', role: '鋼筋工', phone: '0933-777-888', hireDate: '2023-05-20', dailyWage: 2400 },
      { name: '阿德', role: '水電工', phone: '0955-666-777', hireDate: '2022-09-01', dailyWage: 2600 },
    ])
    .run();

  // 施工日誌
  db.insert(constructionLogs)
    .values([
      {
        projectId: 1,
        date: '2026-05-12',
        weather: 'sunny',
        temperature: '28°C',
        workforce: 24,
        summary: '地下二層樓板鋼筋綁紮',
        content: '完成 B2 東側樓板鋼筋綁紮約 60%，明日續作西側。',
        recordedBy: '陳主任',
        itemsJson: JSON.stringify([
          { name: '樓板鋼筋綁紮', location: 'B2 東側', quantity: '60', unit: '%', note: '進度正常' },
        ]),
        laborJson: JSON.stringify([
          { trade: '鋼筋工', count: 16, note: '' },
          { trade: '模板工', count: 6, note: '' },
          { trade: '普工', count: 2, note: '' },
        ]),
        equipmentJson: JSON.stringify([{ name: '塔吊', count: 1, hours: '8 小時', note: '' }]),
        inspectionsJson: JSON.stringify([
          { category: '鋼筋工程', item: '鋼筋間距與保護層查驗', location: 'B2 東側樓板', result: 'pass', inspector: '王工程師', note: '' },
        ]),
      },
      { projectId: 1, date: '2026-05-13', weather: 'cloudy', temperature: '26°C', workforce: 22, summary: '地下二層樓板混凝土澆置', content: 'B2 東側樓板混凝土澆置完成，養護中。', recordedBy: '陳主任' },
      { projectId: 2, date: '2026-05-13', weather: 'rainy', temperature: '24°C', workforce: 12, summary: '舊建物拆除作業', content: '因雨暫停外牆拆除，改進行室內隔間清運。', recordedBy: '李工程師' },
    ])
    .run();

  // 報價單
  db.insert(quotations)
    .values([
      {
        code: 'Q2026-001',
        projectName: '迪化街老宅延壽補強工程',
        description: '歷史建物結構補強與屋頂防水延壽工程',
        status: 'submitted',
        quoteDate: '2026-05-10',
        validUntil: '2026-06-09',
        duration: '120 工作天',
        location: '台北市大同區迪化街一段 200 號',
        clientId: 3,
        clientName: '王志明',
        clientContact: '王志明',
        clientPhone: '0912-345-678',
        subtotal: 2184000,
        discountPercent: 0,
        discountAmount: 0,
        taxRate: 5,
        taxAmount: 109200,
        totalAmount: 2293200,
        paymentTerms: '簽約30%、開工30%、完工30%、驗收10%',
        terms: '1. 本報價單有效期限為報價日起30天。\n2. 付款方式依合約約定辦理。\n3. 如有追加減工程，另行議價。\n4. 以上報價不含營業稅。',
        createdBy: '陳采購',
      },
      {
        code: 'Q2026-002',
        projectName: '內湖商辦室內裝修工程',
        description: '辦公室空間木作與油漆裝修',
        status: 'draft',
        quoteDate: '2026-05-18',
        validUntil: '2026-06-17',
        duration: '60 工作天',
        location: '台北市內湖區',
        clientName: '富鼎建設股份有限公司',
        clientContact: '張經理',
        clientPhone: '02-8780-5000',
        subtotal: 1920000,
        discountPercent: 0,
        discountAmount: 0,
        taxRate: 5,
        taxAmount: 96000,
        totalAmount: 2016000,
        terms: '1. 本報價單有效期限為報價日起30天。\n2. 付款方式依合約約定辦理。\n3. 如有追加減工程，另行議價。\n4. 以上報價不含營業稅。',
        createdBy: '系統管理員',
      },
    ])
    .run();

  db.insert(quotationItems)
    .values([
      { quotationId: 1, category: '結構工程', name: '結構補強', spec: '碳纖維補強工法', unit: '式', quantity: 1, unitPrice: 1800000, amount: 1800000 },
      { quotationId: 1, category: '裝修工程', name: '屋頂防水', spec: 'PU 防水塗料', unit: 'm2', quantity: 320, unitPrice: 1200, amount: 384000 },
      { quotationId: 2, category: '拆除工程', name: '舊裝修拆除清運', spec: '含廢棄物清運', unit: '式', quantity: 1, unitPrice: 200000, amount: 200000 },
      { quotationId: 2, category: '裝修工程', name: '木作裝修', spec: '系統櫃與隔間', unit: '坪', quantity: 80, unitPrice: 18000, amount: 1440000 },
      { quotationId: 2, category: '裝修工程', name: '油漆工程', spec: '乳膠漆', unit: '坪', quantity: 80, unitPrice: 3500, amount: 280000 },
    ])
    .run();

  // 會計科目（精簡版）
  db.insert(accounts)
    .values([
      { code: '1101', name: '現金', type: 'asset' },
      { code: '1102', name: '銀行存款', type: 'asset' },
      { code: '1103', name: '零用金', type: 'asset' },
      { code: '1140', name: '應收帳款', type: 'asset' },
      { code: '2101', name: '應付帳款', type: 'liability' },
      { code: '3101', name: '業主資本', type: 'equity' },
      { code: '4101', name: '工程收入', type: 'revenue' },
      { code: '5101', name: '材料成本', type: 'expense' },
      { code: '5102', name: '發包工程款', type: 'expense' },
      { code: '5103', name: '機具租賃費', type: 'expense' },
      { code: '5104', name: '人事費用', type: 'expense' },
    ])
    .run();

  // 通知
  db.insert(notifications)
    .values([
      { type: 'approval', title: '採購單待審核', message: 'PO2026-0004 工地機具租賃 等待審核', link: '/procurement' },
      { type: 'budget_alert', title: '預算提醒', message: '信義區商辦大樓新建工程 採購支出已達預算 70%', link: '/projects/1' },
      { type: 'info', title: '歡迎使用磐承 ERP', message: '系統已完成初始化，預設管理員帳號為 admin。' },
    ])
    .run();

  console.log('[seed] 示範資料建立完成。');
}
