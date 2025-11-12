# DataNexus - 品牌设计指南

## 1. 品牌命名

### 最终选择: **DataNexus**

**含义:**
- **Data**: 数据，核心业务
- **Nexus**: 连接点、枢纽、网络中心
- 寓意: 连接数据提供者和 AI Agent 的中心枢纽

**备选名称:**
- AgentX Market
- SolData
- DataFlow
- NexusData

---

## 2. 品牌标语 (Slogan)

### 主标语
```
"Autonomous Data Trading for AI Agents"
自主数据交易，为 AI Agent 而生
```

### 副标语
```
"Powered by Irys × Solana × x402"
基于 Irys、Solana 和 x402 构建
```

### 营销标语
```
"Where AI Agents Trade Data"
AI Agent 的数据交易市场

"The Data Nexus for Autonomous Agents"
自主 Agent 的数据枢纽

"Permanent Storage. Instant Payments. Autonomous Trading."
永久存储 · 即时支付 · 自主交易
```

---

## 3. Logo 设计

### 设计概念 1: 数据网络 (推荐)

```
视觉描述:
- 六边形网格结构（代表数据块）
- 中心有一个发光的节点（代表 Nexus）
- 连接线条形成网络
- 渐变色彩（紫→蓝→绿）

ASCII 示意:
      ╱╲
    ╱    ╲
   ╱  ◉   ╲
  ╱   ╱╲   ╲
 ╱   ╱  ╲   ╲
╱___╱____╲___╲
```

**配色方案:**
- 主色: #6366F1 (Indigo) - Solana/科技感
- 辅色: #10B981 (Emerald) - Irys/数据/增长
- 强调色: #F59E0B (Amber) - x402/交易/价值

---

### 设计概念 2: 字母标识

```
"DN" 字母组合设计
- D: 数据流动的形状
- N: 网络连接的形状
- 几何化、现代化

  ██▄   ██▄
  █ █   █ █
  █ █   █▀█
  ██▀   █ █
```

---

### 设计概念 3: 数据流

```
三个圆点代表数据节点
中间是 Agent 图标
流动的线条连接

    ●────────●
     \      /
      \    /
       🤖
      /    \
     /      \
    ●────────●
```

---

## 4. 配色系统

### 主色调
```css
/* 主色 - Indigo (科技/AI) */
--primary-50:  #EEF2FF;
--primary-100: #E0E7FF;
--primary-500: #6366F1;  /* 主要使用 */
--primary-600: #4F46E5;
--primary-900: #312E81;

/* 辅色 - Emerald (数据/增长) */
--secondary-50:  #ECFDF5;
--secondary-100: #D1FAE5;
--secondary-500: #10B981;  /* 主要使用 */
--secondary-600: #059669;
--secondary-900: #064E3B;

/* 强调色 - Amber (交易/价值) */
--accent-50:  #FFFBEB;
--accent-100: #FEF3C7;
--accent-500: #F59E0B;  /* 主要使用 */
--accent-600: #D97706;
--accent-900: #78350F;
```

### 中性色
```css
/* 深色主题 */
--gray-50:  #F9FAFB;
--gray-100: #F3F4F6;
--gray-500: #6B7280;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;
--gray-950: #030712;

/* 背景色 */
--bg-primary:   #0F172A;  /* Slate 900 */
--bg-secondary: #1E293B;  /* Slate 800 */
--bg-tertiary:  #334155;  /* Slate 700 */
```

### 语义色
```css
/* 成功 */
--success: #10B981;  /* Green */

/* 警告 */
--warning: #F59E0B;  /* Amber */

/* 错误 */
--error: #EF4444;    /* Red */

/* 信息 */
--info: #3B82F6;     /* Blue */
```

---

## 5. 字体系统

### 字体族
```css
/* 标题字体 */
--font-heading: 'Space Grotesk', 'Inter', sans-serif;

/* 正文字体 */
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* 代码字体 */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 字体大小
```css
--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
--text-5xl:  3rem;      /* 48px */
```

### 字重
```css
--font-normal:    400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;
```

---

## 6. 视觉元素

### 圆角
```css
--radius-sm:  0.25rem;  /* 4px */
--radius-md:  0.5rem;   /* 8px */
--radius-lg:  0.75rem;  /* 12px */
--radius-xl:  1rem;     /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-full: 9999px;
```

### 阴影
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

/* 发光效果 */
--glow-primary: 0 0 20px rgba(99, 102, 241, 0.5);
--glow-secondary: 0 0 20px rgba(16, 185, 129, 0.5);
```

### 间距
```css
--space-1:  0.25rem;  /* 4px */
--space-2:  0.5rem;   /* 8px */
--space-3:  0.75rem;  /* 12px */
--space-4:  1rem;     /* 16px */
--space-6:  1.5rem;   /* 24px */
--space-8:  2rem;     /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

---

## 7. UI 组件样式

### 按钮
```css
/* 主按钮 */
.btn-primary {
  background: linear-gradient(135deg, #6366F1, #4F46E5);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  box-shadow: 0 4px 6px rgba(99, 102, 241, 0.3);
  transition: all 0.2s;
}

.btn-primary:hover {
  box-shadow: 0 6px 12px rgba(99, 102, 241, 0.4);
  transform: translateY(-2px);
}

/* 次要按钮 */
.btn-secondary {
  background: transparent;
  border: 2px solid #6366F1;
  color: #6366F1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
}
```

### 卡片
```css
.card {
  background: linear-gradient(135deg, #1E293B, #334155);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.card:hover {
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 0 8px 16px rgba(99, 102, 241, 0.2);
  transform: translateY(-4px);
}
```

### 输入框
```css
.input {
  background: #1E293B;
  border: 2px solid #334155;
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.input:focus {
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  outline: none;
}
```

---

## 8. 图标系统

### 推荐图标库
- **Heroicons** (主要使用)
- **Lucide Icons** (备选)
- **Phosphor Icons** (备选)

### 核心图标
```
数据: 📊 database, chart-bar, table
上传: ⬆️ cloud-upload, arrow-up-tray
下载: ⬇️ cloud-download, arrow-down-tray
支付: 💳 credit-card, currency-dollar
Agent: 🤖 cpu-chip, command-line
搜索: 🔍 magnifying-glass
设置: ⚙️ cog, adjustments
用户: 👤 user, user-circle
```

---

## 9. 动画与交互

### 过渡效果
```css
/* 标准过渡 */
--transition-fast: 150ms ease-in-out;
--transition-base: 200ms ease-in-out;
--transition-slow: 300ms ease-in-out;

/* 使用示例 */
.element {
  transition: all var(--transition-base);
}
```

### 加载动画
```css
/* 脉冲效果 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 旋转效果 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 渐变移动 */
@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

---

## 10. 品牌应用示例

### 网站 Header
```
┌────────────────────────────────────────────────┐
│  [Logo] DataNexus    Marketplace  Docs  API   │
│                              [Connect Wallet]  │
└────────────────────────────────────────────────┘
```

### Hero Section
```
┌────────────────────────────────────────────────┐
│                                                │
│        Autonomous Data Trading                 │
│           for AI Agents                        │
│                                                │
│   Powered by Irys × Solana × x402             │
│                                                │
│   [Explore Marketplace]  [Read Docs]          │
│                                                │
└────────────────────────────────────────────────┘
```

### 数据产品卡片
```
┌──────────────────────────┐
│  📊                      │
│  Solana DeFi TVL Data    │
│  Daily TVL data for...   │
│                          │
│  💰 5 USDC               │
│  🔥 42 purchases         │
│                          │
│  [View Details]          │
└──────────────────────────┘
```

---

## 11. 营销素材

### Twitter Banner 文案
```
🚀 DataNexus - The Data Marketplace for AI Agents

✅ Permanent Storage (Irys)
✅ Instant Payments (x402)
✅ High Performance (Solana)
✅ Agent-First Design

Join the future of autonomous data trading 👇
```

### Pitch Deck 封面
```
┌────────────────────────────────────┐
│                                    │
│         [DataNexus Logo]           │
│                                    │
│    Autonomous Data Trading         │
│       for AI Agents                │
│                                    │
│   Powered by Irys × Solana × x402  │
│                                    │
│         x402 Hackathon 2024        │
│                                    │
└────────────────────────────────────┘
```

---

## 12. 品牌声音 (Brand Voice)

### 语气特点
- **专业但友好**: 技术准确，但易于理解
- **创新前瞻**: 强调 AI 和自动化
- **简洁高效**: 直接表达，避免冗余
- **社区导向**: 强调开放和协作

### 文案示例

**好的文案:**
✅ "让 AI Agent 自主交易数据"
✅ "永久存储，即时支付"
✅ "为自主 Agent 构建的数据市场"

**避免的文案:**
❌ "革命性的颠覆式创新平台"
❌ "全球领先的..."
❌ 过度营销的词汇

---

## 13. 设计资源

### 在线工具
- **Logo 设计**: Figma, Canva
- **配色方案**: Coolors.co, Adobe Color
- **图标**: Heroicons.com, Lucide.dev
- **字体**: Google Fonts, Font Squirrel

### 设计文件
```
/design
  /logo
    - logo.svg
    - logo.png (1024x1024)
    - logo-white.svg
    - logo-icon.svg
  /brand
    - colors.css
    - typography.css
    - components.css
  /marketing
    - twitter-banner.png (1500x500)
    - og-image.png (1200x630)
    - pitch-deck.pdf
```

---

## 14. 实施清单

### 立即行动
- [ ] 确定最终 Logo 设计
- [ ] 创建 SVG 格式 Logo
- [ ] 导出不同尺寸的 PNG
- [ ] 创建配色 CSS 变量文件
- [ ] 设置字体（Google Fonts）
- [ ] 创建 Twitter 账号并设置品牌
- [ ] 设计 Twitter Banner
- [ ] 创建 OG Image（社交分享图）

### 下一步
- [ ] 设计完整 UI Kit（Figma）
- [ ] 创建组件库（Storybook）
- [ ] 制作品牌指南 PDF
- [ ] 设计营销素材模板

