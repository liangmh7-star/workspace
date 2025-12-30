import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useNpcStore } from './npc'

export const useGameStore = defineStore('game', () => {
  const npcStore = useNpcStore()

  // --- State ---
  const coins = ref(100)
  const water = ref(20)
  const maxWater = ref(50)
  const level = ref(1)
  const exp = ref(0)
  
  // Level Up Notification State
  const showLevelUpModal = ref(false)
  const levelUpRewards = ref([])

  // Game Day System (manual day advance)
  const gameDay = ref(1)
  const lastDayCheck = ref(Date.now())

  // Daily farming limit
  const dailyFarmingLimit = 8
  const dailyFarmingUsed = ref(0)

  // Warehouse System (capacity 30, crops only)
  const warehouse = ref([]) // Array of { itemId, quantity } - each item takes 1 slot
  const warehouseCapacity = 30

  // Market Price System
  const marketPrices = ref({}) // { cropId: { currentPrice, previousPrice, priceHistory: [] } }

  // Cooking System - Dishes inventory
  const dishes = ref({
    'dish_tomato_radish': 0,
    'dish_potato_shreds': 0,
    'dish_chili_corn': 0,
    'dish_pumpkin_paste': 0
  })

  // Buff System (Roguelike daily buff)
  const currentBuff = ref(null) // Current active buff id
  const buffChoices = ref([]) // 3 buff choices for the day
  const buffSelected = ref(false) // Whether buff has been selected for today
  const tomorrowDebuff = ref(null) // Debuff from "期货合约" for next day

  // All available buffs
  const buffDefs = {
    'sunny_day': {
      id: 'sunny_day',
      name: '太阳当空照',
      emoji: '☀️',
      desc: '今日所有作物的生长速度 +20%',
      effect: { growSpeedBonus: 0.2 }
    },
    'insider_info': {
      id: 'insider_info',
      name: '小道消息',
      emoji: '📰',
      desc: '今日红番茄和甜玉米的市场收购价 +20%',
      effect: { priceBonus: { crops: ['crop_tomato', 'crop_corn'], bonus: 0.2 } }
    },
    'temp_expand': {
      id: 'temp_expand',
      name: '临时扩容',
      emoji: '📦',
      desc: '今日仓库容量上限增加 10 格',
      effect: { warehouseBonus: 10 }
    },
    'neighbor_help': {
      id: 'neighbor_help',
      name: '邻里互助',
      emoji: '🤝',
      desc: '今日购买所有种子的价格降低 20%',
      effect: { seedDiscount: 0.2 }
    },
    'fertile_soil': {
      id: 'fertile_soil',
      name: '肥沃土壤',
      emoji: '🌱',
      desc: '今日收获作物获得的基础经验值 +30%',
      effect: { expBonus: 0.3 }
    },
    'inflation': {
      id: 'inflation',
      name: '通货膨胀',
      emoji: '💸',
      desc: '今日作物出售价格提升 50%，但购买种子的价格翻倍',
      effect: { sellBonus: 0.5, seedPenalty: 1.0 }
    },
    'crazy_growth': {
      id: 'crazy_growth',
      name: '疯狂生长',
      emoji: '🌿',
      desc: '作物生长速度 +200%，但收获时有 20% 概率直接枯萎变成杂草',
      effect: { growSpeedBonus: 2.0, wiltChance: 0.2 }
    },
    'black_market': {
      id: 'black_market',
      name: '黑市交易',
      emoji: '🕶️',
      desc: '今日金土豆收购价翻 3 倍，但其余所有作物收购价跌至 1 金币',
      effect: { potatoBonus: 2.0, otherCropPenalty: true }
    },
    'overdraft': {
      id: 'overdraft',
      name: '透支体力',
      emoji: '💪',
      desc: '今日作物收获数量翻倍，但收获时无法获得任何经验值',
      effect: { doubleHarvest: true, noExp: true }
    },
    'speculator': {
      id: 'speculator',
      name: '投机者',
      emoji: '🎰',
      desc: '神秘种子开出金苹果的概率提升至 20%，但开出杂草的概率也大幅提升',
      effect: { mysteryGoldenChance: 0.2, mysteryWeedChance: 0.7 }
    },
    'golden_touch': {
      id: 'golden_touch',
      name: '金手指',
      emoji: '✨',
      desc: '今日触发"金牌作物"（3倍经验）的概率从 20% 提升至 50%',
      effect: { goldenChance: 0.5 }
    },
    'trash_to_treasure': {
      id: 'trash_to_treasure',
      name: '变废为宝',
      emoji: '♻️',
      desc: '今日出售"杂草"的价格从 1 金币提升至 50 金币',
      effect: { weedPrice: 50 }
    },
    'futures_contract': {
      id: 'futures_contract',
      name: '期货合约',
      emoji: '📈',
      desc: '立即获得 200 金币，但明日所有作物的市场行情强制减半',
      effect: { instantCoins: 200, tomorrowPricePenalty: 0.5 }
    },
    'picky_selection': {
      id: 'picky_selection',
      name: '精挑细选',
      emoji: '🔍',
      desc: '今日仓库容量减少 10 格，但所有作物的出售价格提升 30%',
      effect: { warehousePenalty: 10, sellBonus: 0.3 }
    },
    'mystery_gift': {
      id: 'mystery_gift',
      name: '神秘客的馈赠',
      emoji: '🎁',
      desc: '今日每卖出 10 个作物，仓库自动增加 1 颗神秘种子',
      effect: { mysteryGiftThreshold: 10 }
    }
  }

  // Track crops sold today (for mystery_gift buff)
  const cropsSoldToday = ref(0)

  // Recipes: ingredients -> dish
  const recipes = {
    'crop_turnip+crop_tomato': 'dish_tomato_radish',    // 萝卜+番茄 = 茄汁萝卜
    'crop_tomato+crop_turnip': 'dish_tomato_radish',
    'crop_potato+crop_tomato': 'dish_potato_shreds',    // 土豆+番茄 = 酸甜土豆丝
    'crop_tomato+crop_potato': 'dish_potato_shreds',
    'crop_tomato+crop_corn': 'dish_chili_corn',         // 番茄+玉米 = 红油玉米
    'crop_corn+crop_tomato': 'dish_chili_corn',
    'crop_tomato+crop_pumpkin': 'dish_pumpkin_paste',   // 番茄+南瓜 = 甜甜南瓜泥
    'crop_pumpkin+crop_tomato': 'dish_pumpkin_paste'
  }

  // Inventory: { itemId: count }
  const inventory = ref({
    // Initial Seeds
    'seed_turnip': 5,
    'seed_potato': 2,
    
    // Initial Crops
    'crop_turnip': 0,
    'crop_potato': 0,
    'crop_tomato': 0,
    'crop_corn': 0,
    'crop_pumpkin': 0,
    
    // Furniture
    'furniture_chair': 0,
    'furniture_lamp': 0,
    'furniture_bookshelf': 0,
    'furniture_rug': 0,
    'furniture_potted_plant': 0,
    'furniture_sofa': 0,
    'furniture_table_lamp': 0,
    'furniture_wooden_desk': 0,
    'furniture_hanging_painting': 0,
    'furniture_fireplace': 0,
    'furniture_clock': 0,
    'furniture_full_length_mirror': 0,
    'furniture_retro_tv': 0,
    'furniture_cozy_bed': 0
  })

  // Plots: Array of objects
  const plots = ref([
    { id: 1, status: 'empty', plantId: null, startTime: 0, duration: 0 },
    { id: 2, status: 'empty', plantId: null, startTime: 0, duration: 0 },
    { id: 3, status: 'locked', plantId: null, startTime: 0, duration: 0 },
    { id: 4, status: 'locked', plantId: null, startTime: 0, duration: 0 },
  ])

  // Orders
  const orders = ref([])
  const orderRefreshInterval = ref(null)

  // Home Layout (Placed Furniture)
  const homeLayout = ref([])

  // Story Progress
  const story = ref({
    unlockedChapters: [1], 
    currentChapter: 1,
    readChapters: []
  })

  // Definitions
  const itemDefs = {
    // Seeds & Vegetables
    'seed_turnip': { name: '白萝卜种子', type: 'seed', growTime: 10, output: 'crop_turnip', cost: 10, img: './assets/seed_bag.png', unlockLevel: 1 },
    'seed_potato': { name: '金土豆种子', type: 'seed', growTime: 20, output: 'crop_potato', cost: 15, img: './assets/seed_bag.png', unlockLevel: 1 },
    'seed_tomato': { name: '红番茄种子', type: 'seed', growTime: 30, output: 'crop_tomato', cost: 20, img: './assets/seed_bag.png', unlockLevel: 2 },
    'seed_corn': { name: '甜玉米种子', type: 'seed', growTime: 40, output: 'crop_corn', cost: 25, img: './assets/seed_bag.png', unlockLevel: 5 },
    'seed_pumpkin': { name: '大南瓜种子', type: 'seed', growTime: 60, output: 'crop_pumpkin', cost: 40, img: './assets/seed_bag.png', unlockLevel: 7 },
    'seed_mystery': { name: '神秘种子', type: 'seed', growTime: 25, output: 'mystery', cost: 10, img: './assets/seed_mystery.png', unlockLevel: 1, isMystery: true },
    
    'crop_turnip': { name: '白萝卜', type: 'crop', sellPrice: 20, img: './assets/crop_turnip_transparent.png' },
    'crop_potato': { name: '金土豆', type: 'crop', sellPrice: 35, img: './assets/crop_potato_transparent.png' },
    'crop_tomato': { name: '红番茄', type: 'crop', sellPrice: 50, img: './assets/crop_tomato_transparent_transparent.png' },
    'crop_corn': { name: '甜玉米', type: 'crop', sellPrice: 65, img: './assets/crop_corn_transparent.png' },
    'crop_pumpkin': { name: '大南瓜', type: 'crop', sellPrice: 100, img: './assets/crop_pumpkin_transparent.png' },
    
    // Mystery seed outputs
    'crop_weed': { name: '杂草', type: 'crop', sellPrice: 1, img: './assets/crop_weed.png' },
    'crop_golden_apple': { name: '金苹果', type: 'crop', sellPrice: 500, img: './assets/crop_golden_apple.png' },
    
    // Dishes (cooked food)
    'dish_tomato_radish': { name: '茄汁萝卜', type: 'dish', img: './assets/dish_tomato_radish.png' },
    'dish_potato_shreds': { name: '酸甜土豆丝', type: 'dish', img: './assets/dish_potato_shreds.png' },
    'dish_chili_corn': { name: '红油玉米', type: 'dish', img: './assets/dish_chili_corn.png' },
    'dish_pumpkin_paste': { name: '甜甜南瓜泥', type: 'dish', img: './assets/dish_pumpkin_paste.png' },
    
    // Furniture
    'furniture_chair': { name: '木制花园椅', type: 'furniture', cost: 100, score: 10, img: './assets/furniture_chair.png', unlockLevel: 1 },
    'furniture_lamp': { name: '复古路灯', type: 'furniture', cost: 150, score: 15, img: './assets/furniture_lamp.png', unlockLevel: 1 },
    'furniture_bookshelf': { name: '木质书架', type: 'furniture', cost: 300, score: 30, img: './assets/furniture_bookshelf_transparent_transparent.png', unlockLevel: 3 },
    'furniture_rug': { name: '圆形地毯', type: 'furniture', cost: 200, score: 20, img: './assets/furniture_rug_transparent_transparent.png', unlockLevel: 3 },
    'furniture_potted_plant': { name: '大型绿植', type: 'furniture', cost: 350, score: 35, img: './assets/furniture_plant_new_transparent.png', unlockLevel: 4 },
    'furniture_sofa': { name: '舒适沙发', type: 'furniture', cost: 500, score: 50, img: './assets/furniture_sofa_v15_final_transparent.png', unlockLevel: 5 },
    'furniture_table_lamp': { name: '复古台灯', type: 'furniture', cost: 400, score: 40, img: './assets/furniture_table_lamp_new_transparent.png', unlockLevel: 6 },
    'furniture_wooden_desk': { name: '木质书桌', type: 'furniture', cost: 600, score: 60, img: './assets/furniture_wooden_desk_new_transparent.png', unlockLevel: 5 },
    'furniture_hanging_painting': { name: '风景挂画', type: 'furniture', cost: 250, score: 25, img: './assets/furniture_painting_v13_final.png', unlockLevel: 6 },
    'furniture_fireplace': { name: '复古壁炉', type: 'furniture', cost: 800, score: 80, img: './assets/furniture_fireplace_transparent_transparent.png', unlockLevel: 7 },
    'furniture_retro_tv': { name: '电视机', type: 'furniture', cost: 1200, score: 85, img: './assets/furniture_tv_painting_v16_transparent.png', unlockLevel: 8 },
    'furniture_clock': { name: '落地摆钟', type: 'furniture', cost: 900, score: 90, img: './assets/furniture_clock_transparent_transparent.png', unlockLevel: 8 },
    'furniture_full_length_mirror': { name: '穿衣镜', type: 'furniture', cost: 1000, score: 100, img: './assets/furniture_full_length_mirror_transparent_transparent.png', unlockLevel: 9 },
    'furniture_cozy_bed': { name: '舒适大床', type: 'furniture', cost: 1500, score: 120, img: './assets/furniture_cozy_bed_transparent.png', unlockLevel: 10 }
  }

  // Story Content - Updated with "Time Capsule" Coherent Storyline (Lv 10/20/30)
  const storyChapters = [
    {
      id: 1,
      title: "辞职信",
      unlockLevel: 1,
      content: [
        { speaker: "我", text: "终于递交了辞职信...再见，996的生活。", mood: "normal" },
        { speaker: "我", text: "听说老家的房子还在，是时候回去看看了。", mood: "happy" },
        { speaker: "我", text: "希望儿时的那些朋友们，还记得我。", mood: "normal" }
      ]
    },
    {
      id: 2,
      title: "重逢",
      unlockLevel: 2,
      content: [
        { speaker: "小白", text: "哇！你真的回来啦？我还以为你把我们忘了呢！", mood: "happy" },
        { speaker: "我", text: "怎么会呢，我还记得我们以前经常去河边的大树下玩。", mood: "happy" },
        { speaker: "小光", text: "太好了！以后又可以一起踢球了！", mood: "happy" },
        { speaker: "小影", text: "......欢迎回家。", mood: "normal" }
      ]
    },
    {
      id: 3,
      title: "旧地重游",
      unlockLevel: 4, 
      content: [
        { speaker: "我", text: "这里...变化真大啊。以前这里明明是个小山坡。", mood: "normal" },
        { speaker: "小绿", text: "是啊，不过只要用心耕种，土地会重新焕发生机的。", mood: "happy" },
        { speaker: "小光", text: "别感伤啦！我们一起努力，把村子建设得比以前更好！", mood: "happy" }
      ]
    },
    {
      id: 4,
      title: "重逢的契机",
      unlockLevel: 10,
      content: [
          { speaker: "小白", text: "呐呐，我最近做梦，梦到了我们小时候一起埋下的“宝物”！", mood: "happy" },
          { speaker: "我", text: "宝物？你是说时光胶囊吗？", mood: "normal" },
          { speaker: "小白", text: "对！但是...我记不清埋在哪里了。呜呜...", mood: "sad" },
          { speaker: "小光", text: "我记得好像是在河边？那时候我们还在那里抓鱼来着。", mood: "normal" },
          { speaker: "小影", text: "不...我觉得是在那棵老树下。那天傍晚夕阳很红。", mood: "normal" },
          { speaker: "小绿", text: "既然大家都有印象，不如我们一起去找找吧？", mood: "happy" }
      ]
    },
    {
      id: 5,
      title: "寻找回忆",
      unlockLevel: 20,
      content: [
          { speaker: "旁白", text: "（大家来到了河边的大树下，一起挖掘着...）", mood: "normal" },
          { speaker: "小光", text: "挖到了！真的是个铁盒子！", mood: "happy" },
          { speaker: "小白", text: "快打开快打开！", mood: "happy" },
          { speaker: "我", text: "（打开盒子，里面躺着小时候的画、几颗弹珠，还有一封泛黄的信）", mood: "normal" },
          { speaker: "小影", text: "“给未来的我们”...这字写得好丑啊，一定是小光写的。", mood: "happy" },
          { speaker: "小光", text: "喂！那时候大家明明都说写得很有气势！", mood: "sad" },
          { speaker: "小绿", text: "呵呵，看着这些稚嫩的笔迹，感觉一切都像在昨天。", mood: "happy" }
      ]
    },
    {
      id: 6,
      title: "新的约定",
      unlockLevel: 30,
      content: [
          { speaker: "我", text: "“长大后我们要一起举办最棒的庆典”...信里最后是这么写的。", mood: "normal" },
          { speaker: "小白", text: "庆典！好怀念啊，以前村子里的庆典最热闹了！", mood: "happy" },
          { speaker: "小绿", text: "既然大家又聚在了一起，不如真的着手准备村庄的庆典吧？", mood: "happy" },
          { speaker: "小光", text: "好主意！这次我们要办得比以前更大！", mood: "happy" },
          { speaker: "我", text: "那我来负责提供最好的农产品！一定会让大家大吃一惊的。", mood: "happy" },
          { speaker: "小影", text: "那我就来记录这一切吧。作为我们新的回忆。", mood: "normal" }
      ]
    }
  ]

  // --- Actions ---
  function initGame() {
    npcStore.initNpc() // Init NPC Store

    const saved = localStorage.getItem('fairy-tale-weaver-save')
    if (saved) {
      const data = JSON.parse(saved)
      coins.value = data.coins || 100
      water.value = data.water || 20
      level.value = data.level || 1
      exp.value = data.exp || 0
      gameDay.value = data.gameDay || 1
      lastDayCheck.value = data.lastDayCheck || Date.now()
      
      // Merge inventory to keep new items if added
      inventory.value = { ...inventory.value, ...(data.inventory || {}) }
      
      plots.value = data.plots || plots.value
      homeLayout.value = data.homeLayout || []
      story.value = data.story || { unlockedChapters: [1], currentChapter: 1, readChapters: [] }
      
      // Load warehouse
      warehouse.value = data.warehouse || []
      
      // Load market prices
      if (data.marketPrices) {
        marketPrices.value = data.marketPrices
      }
      
      // Load daily farming used
      dailyFarmingUsed.value = data.dailyFarmingUsed || 0
      
      // Load dishes
      if (data.dishes) {
        dishes.value = { ...dishes.value, ...data.dishes }
      }
      
      // Load buff state
      currentBuff.value = data.currentBuff || null
      buffChoices.value = data.buffChoices || []
      buffSelected.value = data.buffSelected || false
      tomorrowDebuff.value = data.tomorrowDebuff || null
      cropsSoldToday.value = data.cropsSoldToday || 0
    }
    
    // Initialize market prices if empty
    initMarketPrices()
    
    // Initialize buff choices if not selected yet
    if (!buffSelected.value && buffChoices.value.length === 0) {
      generateBuffChoices()
    }
    
    // Check for unlocks on init too, in case rules changed
    checkUnlocks()
  }

  // Initialize market prices for all crops
  function initMarketPrices() {
    const crops = ['crop_turnip', 'crop_potato', 'crop_tomato', 'crop_corn', 'crop_pumpkin']
    crops.forEach(cropId => {
      if (!marketPrices.value[cropId]) {
        const basePrice = itemDefs[cropId].sellPrice
        const initialPrice = basePrice
        marketPrices.value[cropId] = {
          currentPrice: initialPrice,
          previousPrice: initialPrice,
          priceHistory: [initialPrice] // Start with 1 day history
        }
      }
    })
    saveGame()
  }

  // Note: Day advance is now manual via advanceToNextDay()

  // Update market prices daily with random fluctuation
  function updateMarketPrices() {
    const crops = ['crop_turnip', 'crop_potato', 'crop_tomato', 'crop_corn', 'crop_pumpkin']
    crops.forEach(cropId => {
      const basePrice = itemDefs[cropId].sellPrice
      const priceData = marketPrices.value[cropId]
      
      // Random fluctuation: -30% to +50% of base price
      const fluctuation = (Math.random() - 0.4) * 0.8 // Range: -0.32 to +0.48
      const newPrice = Math.round(basePrice * (1 + fluctuation))
      const minPrice = Math.round(basePrice * 0.5)
      const maxPrice = Math.round(basePrice * 2)
      
      priceData.previousPrice = priceData.currentPrice
      priceData.currentPrice = Math.max(minPrice, Math.min(maxPrice, newPrice))
      
      // Add to history, keep only last 7 days
      priceData.priceHistory.push(priceData.currentPrice)
      if (priceData.priceHistory.length > 7) {
        priceData.priceHistory.shift()
      }
    })
  }

  // Get price change indicator
  function getPriceChange(cropId) {
    const priceData = marketPrices.value[cropId]
    if (!priceData) return 0
    return priceData.currentPrice - priceData.previousPrice
  }

  // Warehouse functions
  function getWarehouseUsed() {
    return warehouse.value.reduce((sum, item) => sum + item.quantity, 0)
  }

  function addToWarehouse(cropId, quantity = 1) {
    const used = getWarehouseUsed()
    const spaceAvailable = warehouseCapacity - used
    const actualQuantity = Math.min(quantity, spaceAvailable)
    
    if (actualQuantity <= 0) return 0
    
    const existing = warehouse.value.find(item => item.itemId === cropId)
    if (existing) {
      existing.quantity += actualQuantity
    } else {
      warehouse.value.push({ itemId: cropId, quantity: actualQuantity })
    }
    saveGame()
    return actualQuantity
  }

  function removeFromWarehouse(cropId, quantity = 1) {
    const existing = warehouse.value.find(item => item.itemId === cropId)
    if (!existing || existing.quantity < quantity) return false
    
    existing.quantity -= quantity
    if (existing.quantity <= 0) {
      const idx = warehouse.value.findIndex(item => item.itemId === cropId)
      warehouse.value.splice(idx, 1)
    }
    saveGame()
    return true
  }

  function getWarehouseItemCount(cropId) {
    const item = warehouse.value.find(item => item.itemId === cropId)
    return item ? item.quantity : 0
  }

  // Sell crop at market price (coins only, no exp)
  function sellCrop(cropId, quantity = 1) {
    const warehouseCount = getWarehouseItemCount(cropId)
    if (warehouseCount < quantity) return false
    
    // Check if it's a special item with fixed price
    const itemDef = itemDefs[cropId]
    let basePrice
    
    if (cropId === 'crop_weed' || cropId === 'crop_golden_apple') {
      // Fixed price items
      basePrice = itemDef.sellPrice
    } else {
      // Market price items
      const priceData = marketPrices.value[cropId]
      if (!priceData) return false
      basePrice = priceData.currentPrice
    }
    
    // Apply buff effects to price
    const unitPrice = getEffectiveSellPrice(cropId, basePrice)
    
    const revenue = unitPrice * quantity
    removeFromWarehouse(cropId, quantity)
    coins.value += revenue
    
    // Track crops sold for mystery gift buff
    cropsSoldToday.value += quantity
    checkMysteryGift()
    
    saveGame()
    return true
  }

  function saveGame() {
    localStorage.setItem('fairy-tale-weaver-save', JSON.stringify({
      coins: coins.value,
      water: water.value,
      level: level.value,
      exp: exp.value,
      inventory: inventory.value,
      plots: plots.value,
      homeLayout: homeLayout.value,
      story: story.value,
      gameDay: gameDay.value,
      lastDayCheck: lastDayCheck.value,
      warehouse: warehouse.value,
      marketPrices: marketPrices.value,
      dailyFarmingUsed: dailyFarmingUsed.value,
      dishes: dishes.value,
      // Buff system
      currentBuff: currentBuff.value,
      buffChoices: buffChoices.value,
      buffSelected: buffSelected.value,
      tomorrowDebuff: tomorrowDebuff.value,
      cropsSoldToday: cropsSoldToday.value
    }))
  }

  function plant(plotId, seedId) {
    const plot = plots.value.find(p => p.id === plotId)
    // Check daily farming limit
    if (dailyFarmingUsed.value >= dailyFarmingLimit) {
      return false
    }
    if (plot && plot.status === 'empty' && inventory.value[seedId] > 0) {
      inventory.value[seedId]--
      plot.status = 'growing'
      plot.plantId = seedId
      plot.startTime = Date.now()
      // Apply growth speed buff
      plot.duration = getEffectiveGrowTime(itemDefs[seedId].growTime)
      dailyFarmingUsed.value++
      saveGame()
      return true
    }
    return false
  }

  // Can farm today check
  function canFarmToday() {
    return dailyFarmingUsed.value < dailyFarmingLimit
  }

  // Generate 3 random buff choices for the day
  function generateBuffChoices() {
    const allBuffIds = Object.keys(buffDefs)
    const shuffled = [...allBuffIds].sort(() => Math.random() - 0.5)
    buffChoices.value = shuffled.slice(0, 3)
    buffSelected.value = false
    currentBuff.value = null
    cropsSoldToday.value = 0
  }

  // Select a buff for the day
  function selectBuff(buffId) {
    if (buffSelected.value) return false
    if (!buffChoices.value.includes(buffId)) return false
    
    currentBuff.value = buffId
    buffSelected.value = true
    
    // Apply instant effects
    const buff = buffDefs[buffId]
    if (buff.effect.instantCoins) {
      coins.value += buff.effect.instantCoins
    }
    if (buff.effect.tomorrowPricePenalty) {
      tomorrowDebuff.value = { pricePenalty: buff.effect.tomorrowPricePenalty }
    }
    
    saveGame()
    return true
  }

  // Get current effective warehouse capacity
  function getEffectiveWarehouseCapacity() {
    let capacity = warehouseCapacity
    if (currentBuff.value) {
      const buff = buffDefs[currentBuff.value]
      if (buff.effect.warehouseBonus) {
        capacity += buff.effect.warehouseBonus
      }
      if (buff.effect.warehousePenalty) {
        capacity -= buff.effect.warehousePenalty
      }
    }
    return Math.max(0, capacity)
  }

  // Get effective growth time (with buff effects)
  function getEffectiveGrowTime(baseTime) {
    let time = baseTime
    if (currentBuff.value) {
      const buff = buffDefs[currentBuff.value]
      if (buff.effect.growSpeedBonus) {
        // Reduce grow time by bonus percentage
        time = Math.round(time / (1 + buff.effect.growSpeedBonus))
      }
    }
    return Math.max(1, time)
  }

  // Get effective seed price (with buff effects)
  function getEffectiveSeedPrice(basePrice) {
    let price = basePrice
    if (currentBuff.value) {
      const buff = buffDefs[currentBuff.value]
      if (buff.effect.seedDiscount) {
        price = Math.round(price * (1 - buff.effect.seedDiscount))
      }
      if (buff.effect.seedPenalty) {
        price = Math.round(price * (1 + buff.effect.seedPenalty))
      }
    }
    return Math.max(1, price)
  }

  // Get effective sell price (with buff effects)
  function getEffectiveSellPrice(cropId, basePrice) {
    let price = basePrice
    if (currentBuff.value) {
      const buff = buffDefs[currentBuff.value]
      
      // Special weed price
      if (cropId === 'crop_weed' && buff.effect.weedPrice) {
        return buff.effect.weedPrice
      }
      
      // Black market - potato 3x, others 1 coin
      if (buff.effect.potatoBonus && cropId === 'crop_potato') {
        price = Math.round(price * (1 + buff.effect.potatoBonus))
      } else if (buff.effect.otherCropPenalty && cropId !== 'crop_potato' && cropId !== 'crop_golden_apple') {
        return 1
      }
      
      // Price bonus for specific crops
      if (buff.effect.priceBonus) {
        if (buff.effect.priceBonus.crops.includes(cropId)) {
          price = Math.round(price * (1 + buff.effect.priceBonus.bonus))
        }
      }
      
      // General sell bonus
      if (buff.effect.sellBonus) {
        price = Math.round(price * (1 + buff.effect.sellBonus))
      }
    }
    
    // Apply tomorrow debuff (from yesterday's 期货合约)
    if (tomorrowDebuff.value && tomorrowDebuff.value.pricePenalty) {
      price = Math.round(price * tomorrowDebuff.value.pricePenalty)
    }
    
    return Math.max(1, price)
  }

  // Get effective golden crop chance
  function getEffectiveGoldenChance() {
    let chance = 0.2 // Default 20%
    if (currentBuff.value) {
      const buff = buffDefs[currentBuff.value]
      if (buff.effect.goldenChance) {
        chance = buff.effect.goldenChance
      }
    }
    return chance
  }

  // Get mystery seed output with buff effects
  function getMysteryOutputWithBuff() {
    let weedChance = 0.6
    let goldenChance = 0.1
    
    if (currentBuff.value) {
      const buff = buffDefs[currentBuff.value]
      if (buff.effect.mysteryWeedChance) {
        weedChance = buff.effect.mysteryWeedChance
      }
      if (buff.effect.mysteryGoldenChance) {
        goldenChance = buff.effect.mysteryGoldenChance
      }
    }
    
    const rand = Math.random()
    if (rand < weedChance) {
      return 'crop_weed'
    } else if (rand < weedChance + (1 - weedChance - goldenChance)) {
      // Normal crop
      const normalCrops = ['crop_turnip', 'crop_potato', 'crop_tomato', 'crop_corn', 'crop_pumpkin']
      return normalCrops[Math.floor(Math.random() * normalCrops.length)]
    } else {
      return 'crop_golden_apple'
    }
  }

  // Check if harvest should wilt (crazy_growth buff)
  function shouldHarvestWilt() {
    if (currentBuff.value) {
      const buff = buffDefs[currentBuff.value]
      if (buff.effect.wiltChance) {
        return Math.random() < buff.effect.wiltChance
      }
    }
    return false
  }

  // Check for mystery gift (神秘客的馈赠 buff)
  function checkMysteryGift() {
    if (currentBuff.value) {
      const buff = buffDefs[currentBuff.value]
      if (buff.effect.mysteryGiftThreshold) {
        const threshold = buff.effect.mysteryGiftThreshold
        while (cropsSoldToday.value >= threshold) {
          cropsSoldToday.value -= threshold
          inventory.value['seed_mystery'] = (inventory.value['seed_mystery'] || 0) + 1
        }
      }
    }
  }

  // Manual advance to next day
  function advanceToNextDay() {
    gameDay.value++
    dailyFarmingUsed.value = 0
    cropsSoldToday.value = 0
    
    // Clear tomorrow debuff (it was applied today)
    tomorrowDebuff.value = null
    
    updateMarketPrices()
    generateBuffChoices()
    lastDayCheck.value = Date.now()
    saveGame()
  }

  function waterPlot(plotId) {
    const plot = plots.value.find(p => p.id === plotId)
    if (plot && plot.status === 'growing' && water.value > 0) {
      water.value--
      plot.duration = Math.max(0, plot.duration - 5) 
      saveGame()
    }
  }

  // Last harvest result for UI effects
  const lastHarvestResult = ref(null)

  function harvest(plotId) {
    const plot = plots.value.find(p => p.id === plotId)
    if (plot && plot.status === 'ready') {
      const seedId = plot.plantId
      const seedDef = itemDefs[seedId]
      let outputId = seedDef.output
      let baseExp = 10
      let isGolden = false
      let harvestQuantity = 1
      
      // Check for wilt (疯狂生长 buff)
      if (shouldHarvestWilt()) {
        outputId = 'crop_weed'
        baseExp = 0
      } else {
        // Handle mystery seed with buff effects
        if (seedDef.isMystery) {
          outputId = getMysteryOutputWithBuff()
          baseExp = 5 // Lower base exp for mystery seeds
        }
        
        // Golden crop chance (with buff)
        const goldenChance = getEffectiveGoldenChance()
        if (Math.random() < goldenChance) {
          isGolden = true
          baseExp *= 3
        }
        
        // Apply exp bonus (肥沃土壤 buff)
        if (currentBuff.value) {
          const buff = buffDefs[currentBuff.value]
          if (buff.effect.expBonus) {
            baseExp = Math.round(baseExp * (1 + buff.effect.expBonus))
          }
          // No exp from harvest (透支体力 buff)
          if (buff.effect.noExp) {
            baseExp = 0
          }
          // Double harvest (透支体力 buff)
          if (buff.effect.doubleHarvest) {
            harvestQuantity = 2
          }
        }
      }
      
      // Try to add to warehouse
      const effectiveCapacity = getEffectiveWarehouseCapacity()
      const used = getWarehouseUsed()
      
      for (let i = 0; i < harvestQuantity; i++) {
        if (used + i < effectiveCapacity) {
          addToWarehouse(outputId, 1)
        } else {
          // Warehouse full, add to regular inventory as fallback
          inventory.value[outputId] = (inventory.value[outputId] || 0) + 1
        }
      }
      
      plot.status = 'empty'
      plot.plantId = null
      plot.startTime = 0
      plot.duration = 0
      
      // Only exp from harvesting, no coins
      if (baseExp > 0) {
        addExp(baseExp)
      }
      
      // Store harvest result for UI
      lastHarvestResult.value = {
        cropId: outputId,
        isGolden: isGolden,
        exp: baseExp,
        quantity: harvestQuantity,
        timestamp: Date.now()
      }
      
      saveGame()
      return lastHarvestResult.value
    }
    return null
  }

  // Get random output for mystery seed
  function getMysteryOutput() {
    const rand = Math.random()
    if (rand < 0.6) {
      // 60% - Weed
      return 'crop_weed'
    } else if (rand < 0.9) {
      // 30% - Random normal crop (each 1/5 = 6%)
      const normalCrops = ['crop_turnip', 'crop_potato', 'crop_tomato', 'crop_corn', 'crop_pumpkin']
      return normalCrops[Math.floor(Math.random() * normalCrops.length)]
    } else {
      // 10% - Golden apple
      return 'crop_golden_apple'
    }
  }

  // Cooking functions
  function getRecipeResult(ingredient1, ingredient2) {
    const key1 = `${ingredient1}+${ingredient2}`
    const key2 = `${ingredient2}+${ingredient1}`
    return recipes[key1] || recipes[key2] || null
  }

  function canCook(ingredient1, ingredient2) {
    // Check if we have ingredients in warehouse
    const count1 = getWarehouseItemCount(ingredient1)
    const count2 = getWarehouseItemCount(ingredient2)
    if (count1 < 1 || count2 < 1) return false
    
    // Check if recipe exists
    return getRecipeResult(ingredient1, ingredient2) !== null
  }

  function cookDish(ingredient1, ingredient2, quality) {
    // quality: 'disaster', 'normal', 'delicious'
    const dishId = getRecipeResult(ingredient1, ingredient2)
    if (!dishId) return null
    
    // Remove ingredients from warehouse
    removeFromWarehouse(ingredient1, 1)
    removeFromWarehouse(ingredient2, 1)
    
    // Add dish to inventory
    dishes.value[dishId] = (dishes.value[dishId] || 0) + 1
    
    // Add some exp for cooking
    addExp(5)
    
    saveGame()
    return { dishId, quality }
  }

  function getDishCount(dishId) {
    return dishes.value[dishId] || 0
  }

  function useDish(dishId) {
    if (dishes.value[dishId] > 0) {
      dishes.value[dishId]--
      saveGame()
      return true
    }
    return false
  }

  function checkUnlocks() {
    // Level Up Unlocks logic
    if (level.value >= 2) {
        if (plots.value[2].status === 'locked') plots.value[2].status = 'empty'
    }
    if (level.value >= 3) {
        if (plots.value[3].status === 'locked') plots.value[3].status = 'empty'
    }
    
    // Check for story unlocks
    storyChapters.forEach(chapter => {
        if (level.value >= chapter.unlockLevel && !story.value.unlockedChapters.includes(chapter.id)) {
            story.value.unlockedChapters.push(chapter.id)
            // Optional: Auto-show story logic could be handled by UI watching this
        }
    })
    saveGame()
  }

  function addExp(amount) {
    if (level.value >= 30) return 

    exp.value += amount
    const nextLevelExp = level.value * 100 
    
    if (exp.value >= nextLevelExp) {
      level.value++
      exp.value -= nextLevelExp
      
      showLevelUpModal.value = true
      levelUpRewards.value = [] 

      checkUnlocks()
    }
  }

  function closeLevelUpModal() {
    showLevelUpModal.value = false
  }

  function tick() {
    if (Date.now() % 10000 < 1000 && water.value < maxWater.value) {
      water.value++
    }

    plots.value.forEach(plot => {
      if (plot.status === 'growing') {
        const elapsed = (Date.now() - plot.startTime) / 1000
        if (elapsed >= plot.duration) {
          plot.status = 'ready'
        }
      }
    })
  }

  function refreshOrders() {
      // Periodic refresh... limit max 3
      if (orders.value.length < 3) {
          generateOrders()
      } else {
          // If full, remove oldest
          orders.value.shift()
          generateOrders()
      }
      saveGame()
  }

  function generateOrders() {
    if (orders.value.length >= 3) return

    const availableSeeds = Object.keys(itemDefs)
      .filter(k => itemDefs[k].type === 'seed' && (itemDefs[k].unlockLevel || 1) <= level.value)
    
    const availableCrops = availableSeeds.map(s => itemDefs[s].output)
    
    if (availableCrops.length === 0) return 

    const needs = availableCrops[Math.floor(Math.random() * availableCrops.length)]
    const count = Math.floor(Math.random() * 3) + 1
    
    // Assign Random NPC
    const npcIds = ['xiaobai', 'xiaolv', 'xiaoguang', 'xiaoying']
    const npcId = npcIds[Math.floor(Math.random() * npcIds.length)]

    orders.value.push({
      id: Date.now() + Math.random(),
      req: needs,
      count: count,
      npcId: npcId,
      reward: itemDefs[needs].sellPrice * count * 1.2
    })
  }

  function fulfillOrder(orderId) {
    const idx = orders.value.findIndex(o => o.id === orderId)
    if (idx === -1) return

    const order = orders.value[idx]
    if ((inventory.value[order.req] || 0) >= order.count) {
      inventory.value[order.req] -= order.count
      coins.value += Math.floor(order.reward)
      
      // Exp logic
      const xpGain = Math.min(200, Math.max(50, Math.floor(order.reward / 2)))
      addExp(xpGain)
      
      // NPC Heart Reward (+5)
      if (order.npcId) {
        npcStore.increaseHeart(order.npcId, 5)
      }

      orders.value.splice(idx, 1)
      setTimeout(generateOrders, 2000)
      saveGame()
    }
  }

  function buyItem(itemId) {
    const def = itemDefs[itemId]
    if ((def.unlockLevel || 1) > level.value) return

    // Apply buff effects to seed price
    let actualCost = def.cost
    if (def.type === 'seed') {
      actualCost = getEffectiveSeedPrice(def.cost)
    }

    if (coins.value >= actualCost) {
      coins.value -= actualCost
      inventory.value[itemId] = (inventory.value[itemId] || 0) + 1
      saveGame()
    }
  }

  function placeFurniture(itemId, x, y, scale = 1.0) {
    if (inventory.value[itemId] > 0) {
      inventory.value[itemId]--
      homeLayout.value.push({
        id: Date.now() + Math.random(),
        itemId: itemId,
        x: x,
        y: y,
        scale: scale
      })
      saveGame()
    }
  }

  function moveFurniture(id, x, y, scale) {
    const item = homeLayout.value.find(i => i.id === id)
    if (item) {
      item.x = x
      item.y = y
      if (scale !== undefined) item.scale = scale
      saveGame()
    }
  }

  function removeFurniture(id) {
    const idx = homeLayout.value.findIndex(i => i.id === id)
    if (idx !== -1) {
      const item = homeLayout.value[idx]
      inventory.value[item.itemId] = (inventory.value[item.itemId] || 0) + 1
      homeLayout.value.splice(idx, 1)
      saveGame()
    }
  }
  
  function markChapterRead(chapterId) {
    if (!story.value.readChapters.includes(chapterId)) {
        story.value.readChapters.push(chapterId)
        saveGame()
    }
  }

  return {
    coins, water, maxWater, level, exp, inventory, plots, orders, itemDefs, homeLayout, story, storyChapters,
    showLevelUpModal, levelUpRewards, closeLevelUpModal,
    // Market & Warehouse
    gameDay, marketPrices, warehouse, warehouseCapacity,
    getPriceChange, getWarehouseUsed, getWarehouseItemCount, addToWarehouse, removeFromWarehouse, sellCrop,
    getEffectiveWarehouseCapacity, getEffectiveSeedPrice, getEffectiveSellPrice,
    // Daily farming system
    dailyFarmingLimit, dailyFarmingUsed, canFarmToday, advanceToNextDay,
    // Harvest result
    lastHarvestResult,
    // Cooking system
    dishes, recipes, getRecipeResult, canCook, cookDish, getDishCount, useDish,
    // Buff system (Roguelike)
    currentBuff, buffChoices, buffSelected, buffDefs, tomorrowDebuff,
    generateBuffChoices, selectBuff,
    // Core functions
    initGame, plant, waterPlot, harvest, tick, fulfillOrder, buyItem,
    placeFurniture, moveFurniture, removeFurniture, markChapterRead, addExp, checkUnlocks, saveGame
  }
})
