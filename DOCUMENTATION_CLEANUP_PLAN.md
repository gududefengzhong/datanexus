# 📚 文档整理计划

## 当前问题

- **根目录**：19 个 Markdown 文件
- **docs 目录**：19 个文档
- **总计**：38 个文档文件
- **问题**：文档太多，没有分类，评委看起来会很头疼

---

## 🎯 整理方案

### 新的文档结构

```
datanexus/
├── README.md                          # ✅ 保留 - 项目主入口
├── QUICK_START.md                     # ✅ 保留 - 快速开始指南
├── HACKATHON_SUBMISSION.md            # ✅ 保留 - Hackathon 提交信息
│
├── docs/
│   ├── 01-getting-started/            # 🆕 入门指南
│   │   ├── QUICK_REFERENCE.md
│   │   ├── BUYER_GUIDE.md
│   │   └── SELLER_GUIDE.md
│   │
│   ├── 02-architecture/               # 🆕 架构文档
│   │   ├── ARCHITECTURE.md
│   │   ├── DATABASE_SCHEMA_DOCUMENTATION.md
│   │   ├── PAYMENT_FLOW_EXPLAINED.md
│   │   └── PURCHASE_MODEL_EXPLAINED.md
│   │
│   ├── 03-implementation/             # 🆕 实现指南
│   │   ├── X402_IMPLEMENTATION_GUIDE.md
│   │   ├── X402_PURCHASE_FLOW.md
│   │   ├── EIGENAI_INTEGRATION_GUIDE.md
│   │   ├── HYBRID_ENCRYPTION_GUIDE.md
│   │   └── USDC_PAYMENT_SETUP.md
│   │
│   ├── 04-api/                        # 🆕 API 文档
│   │   ├── API_DOCUMENTATION.md
│   │   └── USER_STORIES.md
│   │
│   ├── 05-deployment/                 # 🆕 部署文档
│   │   ├── VERCEL_DEPLOYMENT_GUIDE.md
│   │   ├── VERCEL_ENV_SECURITY_GUIDE.md
│   │   └── DIRECT_VERCEL_DEPLOYMENT.md
│   │
│   ├── 06-project-management/         # 🆕 项目管理
│   │   ├── PROJECT_STATUS.md
│   │   ├── ROADMAP.md
│   │   ├── PRD.md
│   │   └── REQUIREMENTS.md
│   │
│   └── 07-archive/                    # 🆕 归档（旧文档）
│       ├── CLEANUP_AND_SECURITY_SUMMARY.md
│       ├── DEPLOYMENT_READY_SUMMARY.md
│       ├── MATERIALS_SUMMARY.md
│       ├── PRE_DEPLOYMENT_CHECKLIST.md
│       ├── SUBMISSION_CHECKLIST.md
│       ├── DEMO_VIDEO_SCRIPT.md
│       ├── VIDEO_RECORDING_GUIDE.md
│       ├── DEMO_AGENT_X402_INTEGRATION.md
│       ├── SMART_CONTRACT_INFO.md
│       ├── USDC_MINT_FIX.md
│       ├── PRIVATE_KEYS_EXPLAINED.md
│       ├── BRAND_DESIGN.md
│       └── MARKETING_PLAYBOOK.md
```

---

## 📋 文档分类详情

### ✅ 根目录保留（3 个）

| 文件 | 说明 | 操作 |
|------|------|------|
| `README.md` | 项目主入口，包含所有核心信息 | ✅ 保留 |
| `QUICK_START.md` | 快速开始指南 | ✅ 保留 |
| `HACKATHON_SUBMISSION.md` | Hackathon 提交信息 | ✅ 保留 |

### 🗑️ 根目录删除（16 个）

这些文档要么过时，要么重复，要么应该移到 docs 目录：

| 文件 | 原因 | 操作 |
|------|------|------|
| `CLEANUP_AND_SECURITY_SUMMARY.md` | 临时文档，已过时 | 🗑️ 移到 archive |
| `DATABASE_SCHEMA_DOCUMENTATION.md` | 应该在 architecture 目录 | 📁 移动 |
| `DEMO_AGENT_X402_INTEGRATION.md` | 已过时，被新文档替代 | 🗑️ 移到 archive |
| `DEMO_VIDEO_SCRIPT.md` | 不需要视频了 | 🗑️ 移到 archive |
| `DEPLOYMENT_READY_SUMMARY.md` | 临时文档，已过时 | 🗑️ 移到 archive |
| `DIRECT_VERCEL_DEPLOYMENT.md` | 应该在 deployment 目录 | 📁 移动 |
| `MATERIALS_SUMMARY.md` | 临时文档，已过时 | 🗑️ 移到 archive |
| `PRE_DEPLOYMENT_CHECKLIST.md` | 临时文档，已过时 | 🗑️ 移到 archive |
| `PROJECT_STATUS.md` | 应该在 project-management 目录 | 📁 移动 |
| `QUICK_REFERENCE.md` | 应该在 getting-started 目录 | 📁 移动 |
| `ROADMAP.md` | 应该在 project-management 目录 | 📁 移动 |
| `SMART_CONTRACT_INFO.md` | 已过时，escrow 已实现 | 🗑️ 移到 archive |
| `SUBMISSION_CHECKLIST.md` | 临时文档，已过时 | 🗑️ 移到 archive |
| `VERCEL_DEPLOYMENT_GUIDE.md` | 应该在 deployment 目录 | 📁 移动 |
| `VERCEL_ENV_SECURITY_GUIDE.md` | 应该在 deployment 目录 | 📁 移动 |
| `VIDEO_RECORDING_GUIDE.md` | 不需要视频了 | 🗑️ 移到 archive |

### 📁 docs 目录整理（19 个）

#### 01-getting-started（3 个）
- `QUICK_REFERENCE.md` - 从根目录移动
- `BUYER_GUIDE.md` - 保留
- `SELLER_GUIDE.md` - 保留

#### 02-architecture（4 个）
- `ARCHITECTURE.md` - 保留
- `DATABASE_SCHEMA_DOCUMENTATION.md` - 从根目录移动
- `PAYMENT_FLOW_EXPLAINED.md` - 保留
- `PURCHASE_MODEL_EXPLAINED.md` - 新创建

#### 03-implementation（5 个）
- `X402_IMPLEMENTATION_GUIDE.md` - 保留
- `X402_PURCHASE_FLOW.md` - 保留
- `EIGENAI_INTEGRATION_GUIDE.md` - 保留
- `HYBRID_ENCRYPTION_GUIDE.md` - 保留
- `USDC_PAYMENT_SETUP.md` - 保留

#### 04-api（2 个）
- `API_DOCUMENTATION.md` - 保留
- `USER_STORIES.md` - 保留

#### 05-deployment（3 个）
- `VERCEL_DEPLOYMENT_GUIDE.md` - 从根目录移动
- `VERCEL_ENV_SECURITY_GUIDE.md` - 从根目录移动
- `DIRECT_VERCEL_DEPLOYMENT.md` - 从根目录移动

#### 06-project-management（4 个）
- `PROJECT_STATUS.md` - 从根目录移动
- `ROADMAP.md` - 从根目录移动
- `PRD.md` - 保留
- `REQUIREMENTS.md` - 保留

#### 07-archive（13 个）
所有过时的临时文档

---

## 🚀 执行步骤

### Step 1: 创建新目录结构
```bash
mkdir -p docs/01-getting-started
mkdir -p docs/02-architecture
mkdir -p docs/03-implementation
mkdir -p docs/04-api
mkdir -p docs/05-deployment
mkdir -p docs/06-project-management
mkdir -p docs/07-archive
```

### Step 2: 移动文件

#### 从根目录移动到 docs/01-getting-started
```bash
mv QUICK_REFERENCE.md docs/01-getting-started/
```

#### 从根目录移动到 docs/02-architecture
```bash
mv DATABASE_SCHEMA_DOCUMENTATION.md docs/02-architecture/
```

#### 从 docs 移动到 docs/02-architecture
```bash
mv docs/ARCHITECTURE.md docs/02-architecture/
mv docs/PAYMENT_FLOW_EXPLAINED.md docs/02-architecture/
mv docs/PURCHASE_MODEL_EXPLAINED.md docs/02-architecture/
```

#### 从 docs 移动到 docs/01-getting-started
```bash
mv docs/BUYER_GUIDE.md docs/01-getting-started/
mv docs/SELLER_GUIDE.md docs/01-getting-started/
```

#### 从 docs 移动到 docs/03-implementation
```bash
mv docs/X402_IMPLEMENTATION_GUIDE.md docs/03-implementation/
mv docs/X402_PURCHASE_FLOW.md docs/03-implementation/
mv docs/EIGENAI_INTEGRATION_GUIDE.md docs/03-implementation/
mv docs/HYBRID_ENCRYPTION_GUIDE.md docs/03-implementation/
mv docs/USDC_PAYMENT_SETUP.md docs/03-implementation/
```

#### 从 docs 移动到 docs/04-api
```bash
mv docs/API_DOCUMENTATION.md docs/04-api/
mv docs/USER_STORIES.md docs/04-api/
```

#### 从根目录移动到 docs/05-deployment
```bash
mv VERCEL_DEPLOYMENT_GUIDE.md docs/05-deployment/
mv VERCEL_ENV_SECURITY_GUIDE.md docs/05-deployment/
mv DIRECT_VERCEL_DEPLOYMENT.md docs/05-deployment/
```

#### 从根目录移动到 docs/06-project-management
```bash
mv PROJECT_STATUS.md docs/06-project-management/
mv ROADMAP.md docs/06-project-management/
```

#### 从 docs 移动到 docs/06-project-management
```bash
mv docs/PRD.md docs/06-project-management/
mv docs/REQUIREMENTS.md docs/06-project-management/
```

#### 从根目录移动到 docs/07-archive
```bash
mv CLEANUP_AND_SECURITY_SUMMARY.md docs/07-archive/
mv DEMO_AGENT_X402_INTEGRATION.md docs/07-archive/
mv DEMO_VIDEO_SCRIPT.md docs/07-archive/
mv DEPLOYMENT_READY_SUMMARY.md docs/07-archive/
mv MATERIALS_SUMMARY.md docs/07-archive/
mv PRE_DEPLOYMENT_CHECKLIST.md docs/07-archive/
mv SMART_CONTRACT_INFO.md docs/07-archive/
mv SUBMISSION_CHECKLIST.md docs/07-archive/
mv VIDEO_RECORDING_GUIDE.md docs/07-archive/
```

#### 从 docs 移动到 docs/07-archive
```bash
mv docs/USDC_MINT_FIX.md docs/07-archive/
mv docs/PRIVATE_KEYS_EXPLAINED.md docs/07-archive/
mv docs/BRAND_DESIGN.md docs/07-archive/
mv docs/MARKETING_PLAYBOOK.md docs/07-archive/
```

### Step 3: 删除 hackathon-demo 目录
```bash
rm -rf hackathon-demo
```

### Step 4: 更新 README.md 中的文档链接

---

## 📊 整理后的效果

### 根目录（3 个文件）
```
README.md
QUICK_START.md
HACKATHON_SUBMISSION.md
```

### docs 目录（7 个子目录，21 个文档）
```
docs/
├── 01-getting-started/     (3 个文档)
├── 02-architecture/        (4 个文档)
├── 03-implementation/      (5 个文档)
├── 04-api/                 (2 个文档)
├── 05-deployment/          (3 个文档)
├── 06-project-management/  (4 个文档)
└── 07-archive/             (13 个文档 - 评委不需要看)
```

### 评委需要看的核心文档（13 个）

1. **根目录**（3 个）
   - `README.md` - 项目概览
   - `QUICK_START.md` - 快速开始
   - `HACKATHON_SUBMISSION.md` - 提交信息

2. **docs/01-getting-started**（3 个）
   - 用户指南

3. **docs/02-architecture**（4 个）
   - 架构设计

4. **docs/03-implementation**（5 个）
   - 技术实现

5. **docs/04-api**（2 个）
   - API 文档

---

## ✅ 优点

1. **清晰的分类** - 按功能分类，易于查找
2. **减少混乱** - 根目录只有 3 个文件
3. **归档旧文档** - 不删除，但移到 archive
4. **评委友好** - 核心文档一目了然
5. **易于维护** - 新文档知道放在哪里

---

## 🎯 下一步

执行上述命令，整理文档结构！

