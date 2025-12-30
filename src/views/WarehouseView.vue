<template>
  <div class="warehouse-view">
    <div class="warehouse-header">
      <h2>📦 仓库</h2>
      <div class="capacity-bar" :class="{ 'has-buff': effectiveCapacity !== store.warehouseCapacity }">
        <div class="capacity-fill" :style="{ width: capacityPercent + '%' }"></div>
        <span class="capacity-text">
          {{ store.getWarehouseUsed() }} / {{ effectiveCapacity }}
          <span v-if="effectiveCapacity !== store.warehouseCapacity" class="buff-indicator">
            ({{ effectiveCapacity > store.warehouseCapacity ? '+' : '' }}{{ effectiveCapacity - store.warehouseCapacity }})
          </span>
        </span>
      </div>
    </div>

    <div class="warehouse-content">
      <div v-if="warehouseItems.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>仓库空空如也</p>
        <p class="hint">收获的作物会自动存入仓库</p>
      </div>

      <div v-else class="item-grid">
        <div 
          v-for="item in warehouseItems" 
          :key="item.itemId" 
          class="warehouse-item"
        >
          <div class="item-icon">
            <img :src="getImgPath(item.itemId)" :alt="store.itemDefs[item.itemId]?.name" />
            <span class="quantity-badge">{{ item.quantity }}</span>
          </div>
          <div class="item-info">
            <span class="item-name">{{ store.itemDefs[item.itemId]?.name }}</span>
            <div class="price-info">
              <span class="current-price">💰 {{ getCurrentPrice(item.itemId) }}</span>
              <span 
                class="price-change"
                :class="getPriceChangeClass(item.itemId)"
              >
                {{ getPriceChangeText(item.itemId) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="warehouse-footer">
      <p class="tip">💡 提示：前往市集出售作物，关注每日行情获取更高收益！</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()

const warehouseItems = computed(() => {
  return store.warehouse.filter(item => item.quantity > 0)
})

const effectiveCapacity = computed(() => {
  return store.getEffectiveWarehouseCapacity()
})

const capacityPercent = computed(() => {
  return (store.getWarehouseUsed() / effectiveCapacity.value) * 100
})

const getImgPath = (itemId) => {
  const def = store.itemDefs[itemId]
  if (!def) return ''
  let imgName = def.img || `${itemId}.png`
  if (imgName.startsWith('./assets/')) return imgName
  return `./assets/${imgName}`
}

const getCurrentPrice = (cropId) => {
  const priceData = store.marketPrices[cropId]
  return priceData ? priceData.currentPrice : store.itemDefs[cropId]?.sellPrice || 0
}

const getPriceChangeClass = (cropId) => {
  const change = store.getPriceChange(cropId)
  if (change > 0) return 'up'
  if (change < 0) return 'down'
  return 'neutral'
}

const getPriceChangeText = (cropId) => {
  const change = store.getPriceChange(cropId)
  if (change > 0) return `↑+${change}`
  if (change < 0) return `↓${change}`
  return '—'
}
</script>

<style scoped>
.warehouse-view {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #f5e6d3 0%, #e8d4b8 100%);
  display: flex;
  flex-direction: column;
  padding: 15px;
  box-sizing: border-box;
}

.warehouse-header {
  text-align: center;
  margin-bottom: 15px;
}

.warehouse-header h2 {
  color: #8b5a2b;
  margin: 0 0 10px 0;
  font-size: 22px;
}

.capacity-bar {
  background: #ddd;
  border-radius: 15px;
  height: 24px;
  position: relative;
  overflow: hidden;
  border: 2px solid #c4a574;
}

.capacity-fill {
  height: 100%;
  background: linear-gradient(90deg, #76c7c0, #4db6ac);
  border-radius: 12px;
  transition: width 0.3s ease;
}

.capacity-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  font-size: 12px;
  color: #555;
  text-shadow: 0 1px 2px rgba(255,255,255,0.8);
}

.capacity-bar.has-buff {
  border-color: #ffd700;
  animation: buffGlow 2s ease-in-out infinite;
}

.buff-indicator {
  color: #ff9800;
  font-size: 10px;
  font-weight: bold;
}

@keyframes buffGlow {
  0%, 100% { box-shadow: 0 0 5px rgba(255, 215, 0, 0.3); }
  50% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.6); }
}

.warehouse-content {
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 15px;
  overflow-y: auto;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
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
  font-size: 60px;
  margin-bottom: 15px;
}

.empty-state p {
  margin: 5px 0;
  font-size: 16px;
}

.empty-state .hint {
  font-size: 13px;
  color: #bbb;
}

.item-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.warehouse-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #e6d5b8;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.item-icon {
  position: relative;
  width: 50px;
  height: 50px;
  background: #f8f8f8;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-icon img {
  max-width: 40px;
  max-height: 40px;
  object-fit: contain;
}

.quantity-badge {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background: #ff9d66;
  color: white;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-weight: bold;
  color: #5a4a42;
  font-size: 15px;
}

.price-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.current-price {
  font-size: 14px;
  color: #f9a825;
  font-weight: bold;
}

.price-change {
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 8px;
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

.warehouse-footer {
  margin-top: 15px;
  text-align: center;
}

.tip {
  font-size: 12px;
  color: #8b5a2b;
  background: rgba(255,255,255,0.7);
  padding: 10px;
  border-radius: 10px;
  margin: 0;
}
</style>

