<template>
  <div class="market-view">
    <div class="market-header">
      <h2>🛒 市集</h2>
      <div class="day-info">
        <span class="day-badge">第 {{ store.gameDay }} 天</span>
      </div>
    </div>

    <div class="tabs">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'sell' }"
        @click="activeTab = 'sell'"
      >
        出售
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'chart' }"
        @click="activeTab = 'chart'"
      >
        行情
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'shop' }"
        @click="activeTab = 'shop'"
      >
        商店
      </button>
    </div>

    <div class="board">
      <!-- SELL TAB -->
      <div v-if="activeTab === 'sell'" class="tab-content">
        <div class="sell-list">
          <div v-if="sellableItems.length === 0" class="empty-state">
            <span class="empty-icon">📭</span>
            <p>仓库中没有可出售的作物</p>
            <p class="hint">去农场收获一些作物吧！</p>
          </div>

          <div 
            v-for="item in sellableItems" 
            :key="item.cropId" 
            class="sell-card"
          >
            <div class="crop-info">
              <img :src="getImgPath(item.cropId)" class="crop-icon" />
              <div class="crop-details">
                <span class="crop-name">{{ store.itemDefs[item.cropId]?.name }}</span>
                <span class="stock">库存: {{ item.quantity }}</span>
              </div>
            </div>

            <div class="price-section">
              <div class="price-display">
                <span class="current-price" :class="{ 'has-buff': item.hasBuffEffect }">
                  💰 {{ item.currentPrice }}
                  <span v-if="item.hasBuffEffect" class="buff-badge">✨</span>
                </span>
                <span 
                  class="price-change"
                  :class="item.changeClass"
                >
                  {{ item.changeText }}
                </span>
              </div>
              <div class="sell-controls">
                <button class="qty-btn" @click="decreaseQty(item.cropId)">-</button>
                <span class="qty-value">{{ sellQuantities[item.cropId] || 1 }}</span>
                <button class="qty-btn" @click="increaseQty(item.cropId, item.quantity)">+</button>
              </div>
              <button 
                class="sell-btn"
                @click="sellItem(item.cropId)"
                :disabled="!item.quantity"
              >
                出售 💰{{ (sellQuantities[item.cropId] || 1) * item.currentPrice }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CHART TAB -->
      <div v-if="activeTab === 'chart'" class="tab-content">
        <div class="chart-section">
          <h3>📈 近7日行情走势</h3>
          
          <div class="crop-selector">
            <button 
              v-for="crop in allCrops" 
              :key="crop.id"
              class="crop-tab"
              :class="{ active: selectedCrop === crop.id }"
              @click="selectedCrop = crop.id"
            >
              {{ crop.name }}
            </button>
          </div>

          <div class="chart-container">
            <svg class="price-chart" viewBox="0 0 300 150" preserveAspectRatio="xMidYMid meet">
              <!-- Grid lines -->
              <line x1="40" y1="20" x2="40" y2="120" stroke="#eee" stroke-width="1"/>
              <line x1="40" y1="120" x2="280" y2="120" stroke="#eee" stroke-width="1"/>
              <line x1="40" y1="70" x2="280" y2="70" stroke="#eee" stroke-width="1" stroke-dasharray="4"/>
              <line x1="40" y1="45" x2="280" y2="45" stroke="#eee" stroke-width="1" stroke-dasharray="4"/>
              <line x1="40" y1="95" x2="280" y2="95" stroke="#eee" stroke-width="1" stroke-dasharray="4"/>
              
              <!-- Y axis labels -->
              <text x="35" y="25" text-anchor="end" fill="#999" font-size="10">{{ chartMaxPrice }}</text>
              <text x="35" y="73" text-anchor="end" fill="#999" font-size="10">{{ chartMidPrice }}</text>
              <text x="35" y="123" text-anchor="end" fill="#999" font-size="10">{{ chartMinPrice }}</text>
              
              <!-- X axis labels (days) -->
              <text 
                v-for="(day, idx) in chartDays" 
                :key="idx"
                :x="getChartX(idx)"
                y="135"
                text-anchor="middle"
                fill="#999"
                font-size="9"
              >
                {{ day }}
              </text>
              
              <!-- Price line -->
              <polyline
                :points="chartPoints"
                fill="none"
                :stroke="chartLineColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              
              <!-- Data points -->
              <circle
                v-for="(point, idx) in chartDataPoints"
                :key="idx"
                :cx="point.x"
                :cy="point.y"
                r="4"
                :fill="chartLineColor"
                stroke="white"
                stroke-width="2"
              />
            </svg>
          </div>

          <div class="chart-info">
            <div class="info-row">
              <span class="label">当前价格:</span>
              <span class="value price">💰 {{ currentCropPrice }}</span>
            </div>
            <div class="info-row">
              <span class="label">基准价格:</span>
              <span class="value">💰 {{ baseCropPrice }}</span>
            </div>
            <div class="info-row">
              <span class="label">涨跌幅:</span>
              <span class="value" :class="priceChangePercent >= 0 ? 'up' : 'down'">
                {{ priceChangePercent >= 0 ? '+' : '' }}{{ priceChangePercent }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- SHOP TAB -->
      <div v-if="activeTab === 'shop'" class="tab-content">
        <h3 class="shop-title">🛍️ 皮埃尔杂货铺</h3>
        <div class="shop-grid">
          <div v-for="(def, id) in shopItems" :key="id" class="shop-item" :class="{ locked: (def.unlockLevel || 1) > store.level }">
            <div class="item-preview">
              <img :src="getImgPath(id)" />
              <div v-if="(def.unlockLevel || 1) > store.level" class="lock-overlay">
                🔒 <br>Lv.{{ def.unlockLevel }}
              </div>
            </div>
            <div class="item-info">
              <span class="name">{{ def.name }}</span>
              <div class="price-action">
                <span class="price" :class="{ 'has-buff': getEffectivePrice(id, def) !== def.cost }">
                  💰 {{ getEffectivePrice(id, def) }}
                  <span v-if="getEffectivePrice(id, def) !== def.cost" class="buff-badge">✨</span>
                </span>
                <button 
                  class="buy-btn" 
                  :disabled="store.coins < getEffectivePrice(id, def) || (def.unlockLevel || 1) > store.level"
                  @click="store.buyItem(id)"
                >
                  购买
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const activeTab = ref('sell')
const selectedCrop = ref('crop_turnip')
const sellQuantities = ref({})

const allCrops = computed(() => [
  { id: 'crop_turnip', name: '白萝卜' },
  { id: 'crop_potato', name: '金土豆' },
  { id: 'crop_tomato', name: '红番茄' },
  { id: 'crop_corn', name: '甜玉米' },
  { id: 'crop_pumpkin', name: '大南瓜' }
])

const sellableItems = computed(() => {
  const items = []
  // Normal crops with market prices
  const marketCrops = ['crop_turnip', 'crop_potato', 'crop_tomato', 'crop_corn', 'crop_pumpkin']
  // Fixed price items
  const fixedPriceCrops = ['crop_weed', 'crop_golden_apple']
  
  marketCrops.forEach(cropId => {
    const quantity = store.getWarehouseItemCount(cropId)
    if (quantity > 0) {
      const priceData = store.marketPrices[cropId]
      const basePrice = priceData?.currentPrice || store.itemDefs[cropId]?.sellPrice || 0
      // Apply buff effects to price
      const effectivePrice = store.getEffectiveSellPrice(cropId, basePrice)
      const change = store.getPriceChange(cropId)
      const hasBuffEffect = effectivePrice !== basePrice
      
      items.push({
        cropId,
        quantity,
        currentPrice: effectivePrice,
        basePrice: basePrice,
        hasBuffEffect,
        isFixedPrice: false,
        changeClass: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
        changeText: change > 0 ? `↑+${change}` : change < 0 ? `↓${change}` : '—'
      })
    }
  })
  
  // Add fixed price items
  fixedPriceCrops.forEach(cropId => {
    const quantity = store.getWarehouseItemCount(cropId)
    if (quantity > 0) {
      const itemDef = store.itemDefs[cropId]
      const basePrice = itemDef.sellPrice
      // Apply buff effects to fixed price items too
      const effectivePrice = store.getEffectiveSellPrice(cropId, basePrice)
      const hasBuffEffect = effectivePrice !== basePrice
      
      items.push({
        cropId,
        quantity,
        currentPrice: effectivePrice,
        basePrice: basePrice,
        hasBuffEffect,
        isFixedPrice: true,
        changeClass: hasBuffEffect ? 'buffed' : 'fixed',
        changeText: hasBuffEffect ? `×${(effectivePrice / basePrice).toFixed(1)}` : '固定'
      })
    }
  })
  
  return items
})

const shopItems = computed(() => {
  const items = {}
  for (const [id, def] of Object.entries(store.itemDefs)) {
    if (def.cost) { 
      items[id] = def
    }
  }
  return items
})

// Chart computations
const chartHistory = computed(() => {
  const priceData = store.marketPrices[selectedCrop.value]
  return priceData?.priceHistory || []
})

const chartMinPrice = computed(() => {
  if (chartHistory.value.length === 0) return 0
  return Math.floor(Math.min(...chartHistory.value) * 0.8)
})

const chartMaxPrice = computed(() => {
  if (chartHistory.value.length === 0) return 100
  return Math.ceil(Math.max(...chartHistory.value) * 1.2)
})

const chartMidPrice = computed(() => {
  return Math.round((chartMinPrice.value + chartMaxPrice.value) / 2)
})

const chartDays = computed(() => {
  const days = []
  const currentDay = store.gameDay
  for (let i = chartHistory.value.length - 1; i >= 0; i--) {
    days.unshift(`D${currentDay - (chartHistory.value.length - 1 - i)}`)
  }
  return days
})

const getChartX = (idx) => {
  const totalPoints = Math.max(chartHistory.value.length, 1)
  const spacing = 240 / Math.max(totalPoints - 1, 1)
  return 40 + idx * spacing
}

const getChartY = (price) => {
  const range = chartMaxPrice.value - chartMinPrice.value
  if (range === 0) return 70
  return 120 - ((price - chartMinPrice.value) / range) * 100
}

const chartPoints = computed(() => {
  return chartHistory.value.map((price, idx) => {
    return `${getChartX(idx)},${getChartY(price)}`
  }).join(' ')
})

const chartDataPoints = computed(() => {
  return chartHistory.value.map((price, idx) => ({
    x: getChartX(idx),
    y: getChartY(price)
  }))
})

const chartLineColor = computed(() => {
  if (chartHistory.value.length < 2) return '#76c7c0'
  const first = chartHistory.value[0]
  const last = chartHistory.value[chartHistory.value.length - 1]
  return last >= first ? '#e53935' : '#43a047'
})

const currentCropPrice = computed(() => {
  const priceData = store.marketPrices[selectedCrop.value]
  return priceData?.currentPrice || 0
})

const baseCropPrice = computed(() => {
  return store.itemDefs[selectedCrop.value]?.sellPrice || 0
})

const priceChangePercent = computed(() => {
  if (baseCropPrice.value === 0) return 0
  return Math.round(((currentCropPrice.value - baseCropPrice.value) / baseCropPrice.value) * 100)
})

const getImgPath = (itemId) => {
  const def = store.itemDefs[itemId]
  if (!def) return ''
  let imgName = def.img || `${itemId}.png`
  if (imgName.startsWith('/assets/')) return imgName
  return `/assets/${imgName}`
}

const increaseQty = (cropId, maxQty) => {
  const current = sellQuantities.value[cropId] || 1
  if (current < maxQty) {
    sellQuantities.value[cropId] = current + 1
  }
}

const decreaseQty = (cropId) => {
  const current = sellQuantities.value[cropId] || 1
  if (current > 1) {
    sellQuantities.value[cropId] = current - 1
  }
}

const sellItem = (cropId) => {
  const qty = sellQuantities.value[cropId] || 1
  store.sellCrop(cropId, qty)
  sellQuantities.value[cropId] = 1
}

const getEffectivePrice = (itemId, def) => {
  if (def.type === 'seed') {
    return store.getEffectiveSeedPrice(def.cost)
  }
  return def.cost
}
</script>

<style scoped>
.market-view {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #fff9f0 0%, #f5e6d3 100%);
  padding: 15px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.market-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.market-header h2 {
  margin: 0;
  color: #8b5a2b;
  font-size: 22px;
}

.day-badge {
  background: linear-gradient(135deg, #ff9d66, #ff7043);
  color: white;
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(255, 112, 67, 0.3);
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  background: rgba(255,255,255,0.7);
  border: none;
  border-radius: 10px;
  font-weight: bold;
  color: #8b5a2b;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.tab-btn.active {
  background: #ff9d66;
  color: white;
  transform: scale(1.02);
  box-shadow: 0 2px 8px rgba(255, 157, 102, 0.4);
}

.board {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 15px;
  flex: 1;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sell-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.empty-icon {
  font-size: 50px;
  margin-bottom: 10px;
}

.empty-state p {
  margin: 5px 0;
}

.empty-state .hint {
  font-size: 12px;
  color: #bbb;
}

.sell-card {
  background: #fff;
  border: 1px solid #e6d5b8;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.crop-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.crop-icon {
  width: 45px;
  height: 45px;
  object-fit: contain;
  background: #f8f8f8;
  border-radius: 10px;
  padding: 5px;
}

.crop-details {
  display: flex;
  flex-direction: column;
}

.crop-name {
  font-weight: bold;
  color: #5a4a42;
  font-size: 15px;
}

.stock {
  font-size: 12px;
  color: #999;
}

.price-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.price-display {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.current-price {
  font-weight: bold;
  color: #f9a825;
  font-size: 16px;
}

.price-change {
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 6px;
  display: inline-block;
}

.price-change.up {
  color: #e53935;
  background: #ffebee;
}

.price-change.down {
  color: #43a047;
  background: #e8f5e9;
}

.price-change.neutral {
  color: #999;
  background: #f5f5f5;
}

.price-change.fixed {
  color: #9c27b0;
  background: #f3e5f5;
}

.price-change.buffed {
  color: #ff9800;
  background: #fff3e0;
  animation: buffPulse 1.5s ease-in-out infinite;
}

.current-price.has-buff,
.price.has-buff {
  color: #ff9800 !important;
  animation: buffPulse 1.5s ease-in-out infinite;
}

.buff-badge {
  font-size: 10px;
  margin-left: 2px;
}

@keyframes buffPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.sell-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 16px;
  font-weight: bold;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:active {
  background: #f0f0f0;
}

.qty-value {
  font-weight: bold;
  min-width: 24px;
  text-align: center;
  color: #333;
}

.sell-btn {
  background: linear-gradient(135deg, #76c7c0, #4db6ac);
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(77, 182, 172, 0.3);
}

.sell-btn:disabled {
  background: #ccc;
  box-shadow: none;
}

/* Chart Section */
.chart-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chart-section h3 {
  text-align: center;
  color: #8b5a2b;
  margin: 0 0 12px 0;
  font-size: 16px;
}

.crop-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
  justify-content: center;
}

.crop-tab {
  padding: 6px 12px;
  border: 1px solid #e6d5b8;
  border-radius: 15px;
  background: #fff;
  font-size: 11px;
  color: #8b5a2b;
  cursor: pointer;
  transition: all 0.2s;
}

.crop-tab.active {
  background: #ff9d66;
  color: white;
  border-color: #ff9d66;
}

.chart-container {
  background: #fafafa;
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 12px;
}

.price-chart {
  width: 100%;
  height: auto;
}

.chart-info {
  background: #f8f8f8;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-row .label {
  color: #888;
  font-size: 13px;
}

.info-row .value {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.info-row .value.price {
  color: #f9a825;
}

.info-row .value.up {
  color: #e53935;
}

.info-row .value.down {
  color: #43a047;
}

/* Shop Section */
.shop-title {
  text-align: center;
  color: #8b5a2b;
  margin: 0 0 12px 0;
  font-size: 16px;
}

.shop-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.shop-item {
  background: #fff;
  border: 1px solid #e6d5b8;
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
}

.shop-item.locked {
  opacity: 0.8;
  background: #eee;
}

.item-preview {
  width: 70px;
  height: 70px;
  background: #f8f8f8;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.item-preview img {
  max-width: 85%;
  max-height: 85%;
}

.lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  text-align: center;
  font-weight: bold;
  font-size: 12px;
}

.item-info {
  width: 100%;
}

.item-info .name {
  font-size: 12px;
  font-weight: bold;
  color: #555;
  display: block;
  text-align: center;
  margin-bottom: 5px;
}

.price-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-action .price {
  font-size: 12px;
  color: #f9a825;
  font-weight: bold;
}

.buy-btn {
  background: #76c7c0;
  color: white;
  border: none;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  cursor: pointer;
}

.buy-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
