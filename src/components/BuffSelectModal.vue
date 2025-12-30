<template>
  <div class="buff-modal-overlay" v-if="show">
    <div class="buff-modal">
      <div class="buff-header">
        <h2>🌅 第 {{ gameStore.gameDay }} 天</h2>
        <p class="buff-subtitle">选择今日的加成效果</p>
      </div>
      
      <div class="buff-choices">
        <div
          v-for="buffId in gameStore.buffChoices"
          :key="buffId"
          class="buff-card"
          :class="{ 'selected': selectedBuff === buffId }"
          @click="selectBuff(buffId)"
        >
          <div class="buff-emoji">{{ gameStore.buffDefs[buffId].emoji }}</div>
          <div class="buff-content">
            <div class="buff-name">{{ gameStore.buffDefs[buffId].name }}</div>
            <div class="buff-desc">{{ gameStore.buffDefs[buffId].desc }}</div>
          </div>
        </div>
      </div>
      
      <button 
        class="confirm-btn"
        :disabled="!selectedBuff"
        @click="confirmBuff"
      >
        确认选择
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'

const gameStore = useGameStore()
const selectedBuff = ref(null)

const show = computed(() => {
  return !gameStore.buffSelected && gameStore.buffChoices.length > 0
})

function selectBuff(buffId) {
  selectedBuff.value = buffId
}

function confirmBuff() {
  if (selectedBuff.value) {
    gameStore.selectBuff(selectedBuff.value)
    selectedBuff.value = null
  }
}
</script>

<style scoped>
.buff-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.buff-modal {
  background: linear-gradient(145deg, #2a1810, #3d2820);
  border: 3px solid #8b5a2b;
  border-radius: 20px;
  padding: 25px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(30px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.buff-header {
  text-align: center;
  margin-bottom: 20px;
}

.buff-header h2 {
  color: #ffd700;
  font-size: 24px;
  margin: 0 0 5px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.buff-subtitle {
  color: #d4a574;
  font-size: 14px;
  margin: 0;
}

.buff-choices {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.buff-card {
  background: linear-gradient(135deg, #4a3728, #3a2a1a);
  border: 2px solid #6b4423;
  border-radius: 12px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.buff-card:hover {
  border-color: #8b6914;
  transform: translateX(5px);
  box-shadow: 0 4px 15px rgba(139, 105, 20, 0.3);
}

.buff-card.selected {
  border-color: #ffd700;
  background: linear-gradient(135deg, #5a4728, #4a3a20);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
}

.buff-emoji {
  font-size: 32px;
  flex-shrink: 0;
  animation: buffFloat 3s ease-in-out infinite;
}

@keyframes buffFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.buff-content {
  flex: 1;
  min-width: 0;
}

.buff-name {
  color: #ffd700;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 4px;
  white-space: nowrap;
}

.buff-desc {
  color: #c9a86c;
  font-size: 13px;
  line-height: 1.4;
}

.confirm-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #8b5a2b, #6b4423);
  border: 2px solid #a67c52;
  border-radius: 25px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.confirm-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #a67c52, #8b5a2b);
  transform: scale(1.02);
  box-shadow: 0 4px 15px rgba(166, 124, 82, 0.4);
}

.confirm-btn:disabled {
  background: #4a3728;
  border-color: #5a4738;
  color: #888;
  cursor: not-allowed;
}
</style>

