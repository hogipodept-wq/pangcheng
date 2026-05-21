# 磐承營造工程 ERP 系統

營造工程公司的企業資源規劃（ERP）系統。涵蓋專案管理、採購發包、廠商與業主管理、
施工日誌與施工照片、人員管理、財務作業等模組。Web 端為主，部分模組（採購、施工照片）
規劃 iOS App 端。

## 技術架構

- **前端（Web）**：React 19 + Vite + Tailwind CSS + tRPC client
- **後端**：Node.js + Express + tRPC + Drizzle ORM
- **資料庫**：SQLite（檔案型，零設定；可升級至 MySQL/PostgreSQL）
- **行動端**：React Native（規劃中）

## 專案結構

```
pangcheng/
├── packages/
│   ├── shared/   # 前後端共用型別、列舉、標籤
│   ├── server/   # 後端 API（Express + tRPC + Drizzle）
│   └── web/      # Web 前端（React + Vite）
└── reference/    # 舊版設計與規格參考檔
```

## 開發指令

```bash
pnpm install        # 安裝相依套件
pnpm dev            # 同時啟動後端與前端開發伺服器
pnpm build          # 建置前端正式版
pnpm start          # 啟動正式環境後端（含已建置前端）
```

開發模式下：後端 http://localhost:3001 ，前端 http://localhost:5173

## 預設帳號

系統首次啟動會自動建立管理員帳號與示範資料：

- 帳號：`admin`
- 密碼：`admin1234`
