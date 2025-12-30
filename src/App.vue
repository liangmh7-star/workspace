<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameStore } from './stores/game'
import { useNpcStore } from './stores/npc'
import GardenView from './views/GardenView.vue'
import MarketView from './views/MarketView.vue'
import HomeView from './views/HomeView.vue'
import ProfileView from './views/ProfileView.vue'
import StoryView from './views/StoryView.vue'
import WarehouseView from './views/WarehouseView.vue'
import BuffSelectModal from './components/BuffSelectModal.vue'

const store = useGameStore()
const npcStore = useNpcStore()
const currentTab = ref('garden')
const showStory = ref(false)
const showDebug = ref(false)

// Debug input refs
const debugCoins = ref(0)
const debugLevel = ref(1)
const debugHearts = ref({})

const activeComponent = computed(() => {
  switch (currentTab.value) {
    case 'garden': return GardenView
    case 'market': return MarketView
    case 'warehouse': return WarehouseView
    case 'home': return HomeView
    case 'profile': return ProfileView
    default: return GardenView
  }
})

function handleKeydown(e) {
    if (e.key === '9') {
        showDebug.value = !showDebug.value
        // Sync initial values
        if (showDebug.value) {
            debugCoins.value = store.coins
            debugLevel.value = store.level
            Object.keys(npcStore.npcs).forEach(key => {
                debugHearts.value[key] = npcStore.npcs[key].heart
            })
        }
    }
}

function applyDebug() {
    store.coins = parseInt(debugCoins.value)
    store.level = parseInt(debugLevel.value)
    
    Object.keys(debugHearts.value).forEach(key => {
        npcStore.setHeart(key, parseInt(debugHearts.value[key]))
    })

    // Check unlocks after level AND hearts change
    // This ensures any level-based or potential future heart-based unlocks are triggered
    store.checkUnlocks()
    
    showDebug.value = false
}

onMounted(() => {
  store.initGame()
  window.addEventListener('keydown', handleKeydown)
  
  setInterval(() => {
    store.tick()
  }, 1000)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
})

const expPercentage = computed(() => {
    const needed = store.level * 100
    return Math.min(100, (store.exp / needed) * 100)
})
</script>

<template>
  <div class="game-container">
    <header class="game-header">
      <div class="level-box">
          <div class="level-badge-container">
            <div class="badge-shape">
                <span class="lvl-text">Lv</span>
                <span class="lvl-num">{{ store.level }}</span>
            </div>
          </div>
          <div class="exp-bar-container">
            <div class="exp-bar">
                <div class="exp-fill" :style="{ width: expPercentage + '%' }"></div>
            </div>
            <div class="exp-text">{{ Math.floor(store.exp) }} / {{ store.level * 100 }}</div>
          </div>
      </div>
      <div class="stat-group">
          <div class="stat-box">
            <span class="icon">💰</span>
            <span class="value">{{ store.coins }}</span>
          </div>
          <div class="stat-box">
            <span class="icon">💧</span>
            <span class="value">{{ store.water }}/{{ store.maxWater }}</span>
          </div>
      </div>
    </header>

    <main class="game-viewport">
      <component :is="activeComponent" />
      
      <!-- Story View Overlay -->
      <div v-if="showStory" class="story-overlay">
        <StoryView @close="showStory = false" />
      </div>

      <!-- Level Up Modal -->
      <div v-if="store.showLevelUpModal" class="levelup-overlay">
        <div class="levelup-card">
            <div class="levelup-header">
                <h2>✨ 升级啦! ✨</h2>
            </div>
            <div class="levelup-content">
                <div class="new-level-badge">
                    <span>Lv.{{ store.level }}</span>
                </div>
                <p>恭喜你达到了新的等级！</p>
                <div class="unlocks-list" v-if="store.level === 2">
                    <p>解锁：红番茄 🍅</p>
                    <p>解锁：居民档案 📖</p>
                </div>
                <div class="unlocks-list" v-if="store.level === 3">
                    <p>解锁：书架 📚</p>
                    <p>解锁：地毯 🧶</p>
                </div>
                <div class="unlocks-list" v-if="store.level === 4">
                    <p>解锁：大型绿植 🌿</p>
                    <p>解锁：第三章剧情 📖</p>
                </div>
                 <div class="unlocks-list" v-if="store.level === 5">
                    <p>解锁：舒适沙发 🛋️</p>
                    <p>解锁：炼金桌 ⚗️</p>
                    <p>解锁：甜玉米 🌽</p>
                </div>
                 <div class="unlocks-list" v-if="store.level === 6">
                    <p>解锁：魔法灯 💡</p>
                    <p>解锁：风景挂画 🖼️</p>
                </div>
                 <div class="unlocks-list" v-if="store.level === 7">
                    <p>解锁：复古壁炉 🔥</p>
                    <p>解锁：大南瓜 🎃</p>
                </div>
                 <div class="unlocks-list" v-if="store.level === 8">
                    <p>解锁：落地摆钟 🕰️</p>
                    <p>解锁：电视机 📺</p>
                </div>
                 <div class="unlocks-list" v-if="store.level === 9">
                    <p>解锁：魔镜 🪞</p>
                </div>
                <div class="unlocks-list" v-if="store.level === 10">
                    <p>解锁：舒适大床 🛏️</p>
                </div>
            </div>
            <button class="btn-claim" @click="store.closeLevelUpModal">太棒了！</button>
        </div>
      </div>

      <!-- Debug Panel -->
      <div v-if="showDebug" class="debug-overlay">
          <div class="debug-panel">
              <h3>🔧 调试模式 (Debug Mode)</h3>
              <div class="debug-row">
                  <label>金币:</label>
                  <input type="number" v-model="debugCoins" />
              </div>
              <div class="debug-row">
                  <label>等级:</label>
                  <input type="number" v-model="debugLevel" />
              </div>
              <h4>好感度修改:</h4>
              <div v-for="(val, key) in debugHearts" :key="key" class="debug-row">
                  <label>{{ npcStore.npcs[key].name }}:</label>
                  <input type="number" v-model="debugHearts[key]" max="30" />
              </div>
              <div class="debug-actions">
                  <button @click="applyDebug" class="btn-apply">应用并关闭</button>
                  <button @click="showDebug = false" class="btn-cancel">取消</button>
              </div>
          </div>
      </div>
      
      <!-- Buff Select Modal (Roguelike) -->
      <BuffSelectModal />
    </main>

    <!-- Story Entry Button -->
    <button class="btn-story" @click="showStory = true">
      📖
    </button>

    <nav class="game-nav">
      <button 
        :class="{ active: currentTab === 'garden' }"
        @click="currentTab = 'garden'"
      >
        <span class="nav-icon">🌱</span>
        <span class="nav-label">农场</span>
      </button>
      <button 
        :class="{ active: currentTab === 'market' }"
        @click="currentTab = 'market'"
      >
        <span class="nav-icon">🛒</span>
        <span class="nav-label">市集</span>
      </button>
      <button 
        :class="{ active: currentTab === 'warehouse' }"
        @click="currentTab = 'warehouse'"
      >
        <span class="nav-icon">📦</span>
        <span class="nav-label">仓库</span>
      </button>
      <button 
        :class="{ active: currentTab === 'home' }"
        @click="currentTab = 'home'"
      >
        <span class="nav-icon">🏠</span>
        <span class="nav-label">小屋</span>
      </button>
       <button 
        :class="{ active: currentTab === 'profile' }"
        @click="currentTab = 'profile'"
      >
        <span class="nav-icon">👥</span>
        <span class="nav-label">档案</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.game-container {
  width: 100%;
  height: 100%;
  aspect-ratio: 9/16;
  max-height: 100vh;
  background-color: #fff9f0;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
}

@media (min-width: 500px) {
  .game-container {
    height: 90vh;
    border-radius: 20px;
  }
}

.game-header {
  height: 70px;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
  border-bottom: 2px solid #e6d5b8;
  padding: 0 15px;
}

.level-box {
    display: flex;
    align-items: center;
    gap: 10px;
}

.level-badge-container {
    position: relative;
    width: 50px;
    height: 50px;
}

.badge-shape {
    width: 100%;
    height: 100%;
    background: #ff9d66;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
}

.lvl-text {
    font-size: 10px;
    text-transform: uppercase;
    opacity: 0.8;
}

.lvl-num {
    font-size: 20px;
    font-weight: 900;
    line-height: 1;
}

.exp-bar-container {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100px;
}

.exp-bar {
    width: 100%;
    height: 8px;
    background: #eee;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid #ddd;
}

.exp-fill {
    height: 100%;
    background: linear-gradient(90deg, #9c27b0, #ba68c8);
    transition: width 0.3s;
}

.exp-text {
    font-size: 10px;
    color: #888;
    text-align: right;
}

.stat-group {
    display: flex;
    gap: 8px;
}

.stat-box {
  background: #fff;
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid #e6d5b8;
  font-weight: bold;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #5a4a42;
}


.game-viewport {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.story-overlay, .levelup-overlay, .debug-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 200;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.debug-overlay {
    z-index: 500; /* Highest priority */
}

.debug-panel {
    background: white;
    padding: 20px;
    border-radius: 15px;
    width: 80%;
    max-width: 300px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.debug-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.debug-row input {
    width: 60px;
    padding: 5px;
    text-align: right;
    border: 1px solid #ccc;
    border-radius: 5px;
}

.debug-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;
}

.btn-apply {
    flex: 1;
    background: #4caf50;
    color: white;
    border: none;
    padding: 8px;
    border-radius: 5px;
    cursor: pointer;
}

.btn-cancel {
    flex: 1;
    background: #f44336;
    color: white;
    border: none;
    padding: 8px;
    border-radius: 5px;
    cursor: pointer;
}

.levelup-card {
    background: white;
    width: 80%;
    border-radius: 20px;
    padding: 20px;
    text-align: center;
    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 4px solid #ff9d66;
}

@keyframes popIn {
    from { transform: scale(0.5); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

.levelup-header h2 {
    color: #ff9d66;
    margin: 0 0 10px 0;
}

.new-level-badge {
    font-size: 40px;
    font-weight: bold;
    color: #9c27b0;
    margin: 10px 0;
}

.unlocks-list {
    margin: 15px 0;
    background: #fff9f0;
    padding: 10px;
    border-radius: 10px;
}

.unlocks-list p {
    margin: 5px 0;
    color: #5a4a42;
    font-weight: bold;
}

.btn-claim {
    background: #ff9d66;
    color: white;
    border: none;
    padding: 10px 30px;
    border-radius: 20px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    margin-top: 10px;
    box-shadow: 0 4px 0 #e68a55;
}

.btn-claim:active {
    transform: translateY(4px);
    box-shadow: none;
}

.btn-story {
  position: absolute;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  color: white;
  border: 2px solid #e6d5b8;
  font-size: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  z-index: 50;
  cursor: pointer;
  transition: transform 0.2s;
  bottom: 80px; 
  left: 20px;
  background: #8b4513;
}

.btn-story:active {
  transform: scale(0.9);
}

.game-nav {
  height: 70px;
  background: #fff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 2px solid #e6d5b8;
  z-index: 10;
}

.game-nav button {
  background: none;
  border: none;
  font-size: 16px;
  font-weight: bold;
  color: #8b7d71;
  padding: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 20%;
}

.game-nav button.active {
  color: #e87a90;
}

.nav-icon {
    font-size: 20px;
    margin-bottom: 2px;
}

.nav-label {
    font-size: 10px;
}

.game-nav button.active .nav-icon {
     transform: scale(1.2);
     transition: transform 0.2s;
}
</style>
