# 架构说明 (Architecture)

## 目录结构
```
src/
├── components/      # Vue 组件
│   ├── HelpModal.vue      # 玩法指引弹窗
│   ├── BuffSelectModal.vue # 每日Buff选择弹窗
│   └── GiftModal.vue      # 赠礼弹窗
├── stores/          # Pinia 状态管理
│   ├── game.js      # 核心游戏逻辑 (资源、库存、地块、家具、Buff)
│   └── npc.js       # NPC 数据与好感度事件
├── views/           # 页面视图
│   ├── GardenView.vue   # 核心种植界面
│   ├── MarketView.vue   # 市集与商店界面
│   ├── WarehouseView.vue # 仓库界面
│   ├── HomeView.vue     # 小屋装修界面
│   ├── CookingView.vue  # 烹饪界面
│   ├── ProfileView.vue  # NPC 档案界面
│   └── StoryView.vue    # 主线剧情播放界面
├── App.vue          # 根组件
└── main.js          # 入口文件
```

## 核心设计

### 1. 数据流向
- **单一数据源**: 所有游戏数据（金币、库存、地块状态、NPC 好感度）均托管在 Pinia Store 中
- **持久化**: `game.js` 和 `npc.js` 订阅 state 变更，自动同步到 `localStorage`

### 2. 响应式系统
- **Vue 3 Composition API**: 逻辑复用更灵活
- **Store 拆分**: 
    - `game.js`: 负责"物"的逻辑（作物生长、家具摆放、经济循环、Buff系统）
    - `npc.js`: 负责"人"的逻辑（好感度、剧情触发、赠礼反馈）

### 3. 组件通信
- **Props/Emits**: 仅用于通用 UI 组件（如弹窗）
- **Store**: 业务组件直接读取/修改 Store，避免深层 Props 传递

### 4. 适配策略
- **视口锁定**: CSS 强制 `max-width: 500px` 并在 PC 端居中
- **资源管理**: 所有动态图片资源均位于 `public/assets/`，通过文件名字符串在 Store 中引用

### 5. 核心系统

#### 5.1 周期系统
- 每个周期（天）有8次耕种机会
- 手动点击"下一天"推进游戏进程
- 每天开始时选择一个Buff效果

#### 5.2 市场系统
- 作物价格每日波动（基准价的50%-200%）
- 7日行情走势图可视化
- 特殊物品（杂草、金苹果）固定价格

#### 5.3 Buff系统（肉鸽机制）
- 每天开始时三选一
- 影响：生长速度、价格、仓库容量、经验获取等
- 部分Buff有利有弊，增加策略性

#### 5.4 烹饪系统
- 选择2种食材组合成菜肴
- 进度条小游戏决定菜肴品质
- 菜肴可赠送NPC提升好感度

### 6. 剧情系统
- **微小说架构**: 剧情数据结构化存储在 Store 中，支持多段对话、表情变化和角色切换
- **条件触发**: 监听 `level` 和 `heart` 变化自动解锁对应章节/事件
