<script setup>
import { ref } from 'vue'
import { useGameStore } from '../stores/game'
import HelpModal from '../components/HelpModal.vue'

const store = useGameStore()
const showSeedMenu = ref(false)
const showHelp = ref(false)
const selectedPlotId = ref(null)
const goldenEffect = ref(null) // { x, y, exp, show }
const showDayTransition = ref(false) // Day/night transition effect

const handlePlotClick = (plot) => {
  if (plot.status === 'locked') return
  
  if (plot.status === 'empty') {
    if (!store.canFarmToday()) {
      // Show hint that farming limit reached
      return
    }
    selectedPlotId.value = plot.id
    showSeedMenu.value = true
  } else if (plot.status === 'growing') {
    store.waterPlot(plot.id)
  } else if (plot.status === 'ready') {
    const result = store.harvest(plot.id)
    if (result && result.isGolden) {
      // Show golden effect
      showGoldenEffect(plot.id, result.exp)
    }
  }
}

const showGoldenEffect = (plotId, exp) => {
  goldenEffect.value = { plotId, exp, show: true }
  setTimeout(() => {
    goldenEffect.value = null
  }, 2000)
}

const selectSeed = (seedId) => {
  store.plant(selectedPlotId.value, seedId)
  showSeedMenu.value = false
  selectedPlotId.value = null
}

const getImgPath = (imgName) => {
  if (!imgName) return ''
  if (imgName.startsWith('/assets/')) return imgName
  return `/assets/${imgName}`
}

const getSeedImage = (plantId) => {
  if (!plantId) return '/assets/seed_bag.png'
  const seedDef = store.itemDefs[plantId]
  if (!seedDef) return '/assets/seed_bag.png'
  return getImgPath(seedDef.img)
}

const getPlantImage = (plantId) => {
  if (!plantId) return ''
  const seedDef = store.itemDefs[plantId]
  if (!seedDef) return ''
  
  // Mystery seed shows question mark during growth
  if (seedDef.isMystery) {
    return '/assets/seed_mystery.png'
  }
  
  const outputId = seedDef.output
  const outputDef = store.itemDefs[outputId]
  
  return outputDef ? getImgPath(outputDef.img) : getImgPath(seedDef.img)
}

const handleNextDay = () => {
  // Show day transition animation
  showDayTransition.value = true
  
  // After darkness peaks, advance the day
  setTimeout(() => {
    store.advanceToNextDay()
  }, 800)
  
  // Hide transition after animation completes
  setTimeout(() => {
    showDayTransition.value = false
  }, 1600)
}
</script>

<template>
  <div class="garden-view" :style="{ backgroundImage: `url(/assets/hometown_bg.png)` }">
    <!-- Top Bar: Day Info & Farming Counter & Buff -->
    <div class="top-bar">
      <div class="day-info">
        <span class="day-label">第</span>
        <span class="day-number">{{ store.gameDay }}</span>
        <span class="day-label">天</span>
      </div>
      <div class="top-bar-right">
        <div class="farming-counter">
          <span class="farming-icon">🌱</span>
          <span class="farming-text">{{ store.dailyFarmingUsed }}/{{ store.dailyFarmingLimit }}</span>
        </div>
        <div class="buff-tag" v-if="store.currentBuff">
          <span class="buff-emoji">{{ store.buffDefs[store.currentBuff]?.emoji }}</span>
          <span class="buff-name">{{ store.buffDefs[store.currentBuff]?.name }}</span>
        </div>
      </div>
    </div>

    <!-- Help Button -->
    <button class="help-btn" @click="showHelp = true">❓ 玩法</button>

    <div class="plot-grid">
      <div 
        v-for="plot in store.plots" 
        :key="plot.id"
        class="plot"
        :class="[plot.status, { 'no-farming': plot.status === 'empty' && !store.canFarmToday() }]"
        @click="handlePlotClick(plot)"
      >
        <div v-if="plot.status === 'empty'" class="indicator pulse">
          <span v-if="store.canFarmToday()">➕</span>
          <span v-else class="exhausted">💤</span>
        </div>
        
        <div v-if="plot.status === 'growing'" class="plant-container">
          <img :src="getSeedImage(plot.plantId)" class="plant-icon small" />
          <div class="timer-bar">
            <div 
              class="timer-fill" 
              :style="{ width: (1 - (Date.now() - plot.startTime)/1000/plot.duration) * 100 + '%' }"
            ></div>
          </div>
          <div v-if="store.water > 0" class="water-hint">
            <span class="water-emoji">💧</span>
          </div>
        </div>

        <div v-if="plot.status === 'ready'" class="plant-container ready">
          <img :src="getPlantImage(plot.plantId)" class="plant-icon bounce" />
        </div>

        <div v-if="plot.status === 'locked'" class="locked">🔒</div>

        <!-- Golden Effect Overlay -->
        <div v-if="goldenEffect && goldenEffect.plotId === plot.id" class="golden-effect">
          <div class="golden-glow"></div>
          <div class="golden-text">
            <span class="star">⭐</span>
            <span class="exp-text">+{{ goldenEffect.exp }} EXP</span>
            <span class="golden-label">金牌作物!</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Next Day Button -->
    <button class="next-day-btn" @click="handleNextDay">
      <span class="next-day-icon">🌅</span>
      <span class="next-day-text">下一天</span>
    </button>

    <!-- Seed Selection Modal -->
    <div v-if="showSeedMenu" class="modal-overlay" @click.self="showSeedMenu = false">
      <div class="modal-content">
        <h3>选择种子</h3>
        <div class="seed-list">
          <div 
            v-for="(count, id) in store.inventory" 
            :key="id"
          >
            <!-- Check if it is a seed and has count > 0 -->
            <div v-if="store.itemDefs[id]?.type === 'seed' && count > 0" class="seed-item" @click="selectSeed(id)">
              <img src="/assets/seed_bag.png" width="40" />
              <span>{{ store.itemDefs[id].name }}</span>
              <span class="count">x{{ count }}</span>
            </div>
          </div>
        </div>
        <button class="close-btn" @click="showSeedMenu = false">取消</button>
      </div>
    </div>

    <!-- Help Modal -->
    <HelpModal v-if="showHelp" @close="showHelp = false" />

    <!-- Day/Night Transition Overlay -->
    <div v-if="showDayTransition" class="day-transition-overlay">
      <div class="transition-content">
        <span class="moon-icon">🌙</span>
        <span class="sun-icon">☀️</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.garden-view {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.top-bar {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 10px;
  z-index: 10;
}

.day-info {
  background: linear-gradient(135deg, #ff9d66, #ff7043);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 2px;
  box-shadow: 0 2px 8px rgba(255, 112, 67, 0.4);
}

.day-label {
  font-size: 12px;
}

.day-number {
  font-size: 18px;
  margin: 0 2px;
}

.farming-counter {
  background: rgba(255, 255, 255, 0.9);
  padding: 6px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.farming-icon {
  font-size: 16px;
}

.farming-text {
  font-size: 13px;
  font-weight: bold;
  color: #5a4a42;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.buff-tag {
  background: linear-gradient(135deg, #ffd700, #ffaa00);
  padding: 6px 10px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(255, 170, 0, 0.3);
}

.buff-emoji {
  font-size: 14px;
}

.buff-name {
  font-size: 11px;
  font-weight: bold;
  color: #8b4513;
  white-space: nowrap;
}

.help-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 20px;
  padding: 6px 12px;
  cursor: pointer;
  z-index: 10;
  font-size: 12px;
  color: #5a4a42;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.plot-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  width: 80%;
  margin-top: 20%;
}

.plot {
  aspect-ratio: 1;
  background: rgba(255, 255, 255, 0.3);
  border: 2px dashed rgba(139, 69, 19, 0.5);
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  cursor: pointer;
  backdrop-filter: blur(2px);
  transition: transform 0.1s;
}

.plot:active { transform: scale(0.95); }
.plot.locked { background: rgba(0, 0, 0, 0.2); border: none; }
.plot.no-farming { 
  background: rgba(100, 100, 100, 0.2); 
  border-color: rgba(100, 100, 100, 0.3);
}

.indicator { font-size: 30px; color: #fff; text-shadow: 0 0 5px rgba(0,0,0,0.5); }
.indicator .exhausted { opacity: 0.7; }

.plant-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.plant-icon { width: 70%; height: 70%; object-fit: contain; }
.plant-icon.small { width: 50%; height: 50%; }

.timer-bar {
  position: absolute;
  bottom: 10px;
  left: 10%;
  width: 80%;
  height: 6px;
  background: rgba(0,0,0,0.3);
  border-radius: 3px;
  overflow: hidden;
}

.timer-fill {
  height: 100%;
  background: #76c7c0;
  transition: width 0.2s linear;
}

.water-hint {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  animation: float 1s infinite alternate;
}

.water-emoji {
  font-size: 18px;
  animation: droplet 1.5s infinite;
}

@keyframes droplet {
  0%, 100% { 
    transform: translateY(0) scale(1); 
    opacity: 1;
  }
  50% { 
    transform: translateY(-3px) scale(1.1); 
    opacity: 0.8;
  }
}

.next-day-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(135deg, #ffb347, #ff9d66);
  border: none;
  border-radius: 25px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(255, 157, 102, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 10;
}

.next-day-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 157, 102, 0.5);
}

.next-day-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(255, 157, 102, 0.4);
}

.next-day-icon {
  font-size: 20px;
}

.next-day-text {
  font-size: 14px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background: #fff;
  padding: 20px;
  border-radius: 16px;
  width: 80%;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.seed-list { display: flex; flex-direction: column; gap: 10px; margin: 15px 0; }

.seed-item {
  display: flex;
  align-items: center;
  background: #f9f9f9;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #eee;
  cursor: pointer;
}

.seed-item img { margin-right: 10px; }
.seed-item .count { margin-left: auto; font-weight: bold; color: #666; }

.close-btn {
  background: #e6d5b8;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  color: #5a4a42;
  font-weight: bold;
  cursor: pointer;
}

/* Golden Effect Styles */
.golden-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
  pointer-events: none;
}

.golden-glow {
  position: absolute;
  width: 120%;
  height: 120%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, rgba(255, 215, 0, 0) 70%);
  animation: goldenPulse 0.5s ease-out;
}

.golden-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  animation: goldenFloat 2s ease-out forwards;
}

.golden-text .star {
  font-size: 30px;
  animation: starSpin 1s ease-out;
}

.golden-text .exp-text {
  font-size: 16px;
  font-weight: bold;
  color: #ff9800;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.8), 0 2px 4px rgba(0,0,0,0.3);
}

.golden-text .golden-label {
  font-size: 12px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 8px rgba(255, 215, 0, 0.8), 0 1px 2px rgba(0,0,0,0.5);
}

@keyframes goldenPulse {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

@keyframes goldenFloat {
  0% { transform: translateY(0); opacity: 1; }
  70% { opacity: 1; }
  100% { transform: translateY(-30px); opacity: 0; }
}

@keyframes starSpin {
  0% { transform: rotate(0deg) scale(0.5); }
  50% { transform: rotate(180deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
@keyframes float {
  from { transform: translateY(0); }
  to { transform: translateY(-5px); }
}
.pulse { animation: pulse 2s infinite; }
.bounce { animation: bounce 1s infinite; }

/* Day/Night Transition */
.day-transition-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  pointer-events: none;
  animation: dayNightCycle 1.6s ease-in-out forwards;
}

.transition-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.moon-icon {
  font-size: 50px;
  opacity: 0;
  animation: moonAppear 1.6s ease-in-out forwards;
}

.sun-icon {
  font-size: 50px;
  opacity: 0;
  animation: sunAppear 1.6s ease-in-out forwards;
}

@keyframes dayNightCycle {
  0% {
    background: rgba(0, 0, 0, 0);
  }
  30% {
    background: rgba(10, 15, 40, 0.95);
  }
  50% {
    background: rgba(10, 15, 40, 0.95);
  }
  70% {
    background: rgba(255, 200, 100, 0.3);
  }
  100% {
    background: rgba(0, 0, 0, 0);
  }
}

@keyframes moonAppear {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.5);
  }
  20% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  60% {
    opacity: 0;
    transform: translateY(-20px) scale(0.5);
  }
  100% {
    opacity: 0;
  }
}

@keyframes sunAppear {
  0%, 50% {
    opacity: 0;
    transform: translateY(20px) scale(0.5);
  }
  70% {
    opacity: 1;
    transform: translateY(0) scale(1.2);
  }
  85% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px) scale(0.8);
  }
}
</style>
