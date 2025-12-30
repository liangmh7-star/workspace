<template>
  <div class="cooking-view">
    <!-- Header -->
    <div class="cooking-header">
      <div class="title-row">
        <span class="title-icon">🍳</span>
        <h2>烹饪台</h2>
      </div>
      <button class="btn-close" @click="$emit('close')">×</button>
    </div>

    <!-- Main Content -->
    <div class="cooking-content" v-if="!isCooking">
      <div class="recipe-sidebar">
        <div 
          v-for="recipe in recipeList" 
          :key="recipe.id"
          class="recipe-item"
          :class="{ active: selectedRecipe?.id === recipe.id }"
          @click="selectRecipe(recipe)"
        >
          <img :src="recipe.img" class="recipe-thumb" />
          <span class="recipe-name-vertical">{{ recipe.name }}</span>
        </div>
      </div>

      <div class="recipe-detail">
        <div v-if="selectedRecipe" class="detail-content">
          <div class="dish-preview">
            <img :src="selectedRecipe.img" class="dish-image" />
          </div>
          <h3 class="dish-name">{{ selectedRecipe.name }}</h3>
          
          <div class="ingredients-section">
            <span class="section-label">所需食材:</span>
            <div class="ingredients-list">
              <div 
                v-for="ing in selectedRecipe.ingredients" 
                :key="ing.id"
                class="ingredient-item"
              >
                <div class="ing-icon-wrap">
                  <img :src="getImgPath(ing.id)" class="ing-icon" />
                  <span class="ing-need">1</span>
                </div>
                <span class="ing-count" :class="{ enough: hasIngredient(ing.id) }">
                  拥有: {{ store.getWarehouseItemCount(ing.id) }}
                </span>
              </div>
            </div>
          </div>

          <button 
            class="btn-cook"
            :disabled="!canCookSelected"
            @click="startCooking"
          >
            <span>开始</span>
            <span>烹饪</span>
          </button>
        </div>
        <div v-else class="no-selection">
          <p>← 选择一道菜谱</p>
        </div>
      </div>
    </div>

    <!-- Cooking Mini-game -->
    <div class="cooking-game" v-if="isCooking">
      <div class="game-header">
        <h3>{{ cookingPhase === 1 ? '🔥 火候控制' : '🥄 搅拌时机' }}</h3>
        <p class="game-hint">在绿色区域内点击停止!</p>
      </div>

      <div class="progress-game">
        <div class="progress-track">
          <div class="sweet-spot"></div>
          <div class="progress-indicator" :style="{ left: indicatorPos + '%' }"></div>
        </div>
        <button class="btn-stop" @click="stopIndicator">停!</button>
      </div>

      <div class="phase-dots">
        <span class="dot" :class="{ done: cookingPhase > 1, current: cookingPhase === 1 }">1</span>
        <span class="dot" :class="{ current: cookingPhase === 2 }">2</span>
      </div>
    </div>

    <!-- Result Screen -->
    <div class="cooking-result" v-if="cookingResult">
      <div class="result-content">
        <div class="result-dish">
          <img :src="selectedRecipe?.img" class="result-dish-img" :class="cookingResult.quality" />
        </div>
        <h3 class="result-title" :class="cookingResult.quality">
          {{ getResultTitle(cookingResult.quality) }}
        </h3>
        <p class="result-desc">{{ getResultDesc(cookingResult.quality) }}</p>
        <div class="result-dish-name">
          {{ store.itemDefs[cookingResult.dishId]?.name }}
          <span class="quality-badge" :class="cookingResult.quality">
            {{ getQualityLabel(cookingResult.quality) }}
          </span>
        </div>
        <button class="btn-confirm" @click="finishCooking">好的!</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useGameStore } from '../stores/game'

const emit = defineEmits(['close'])
const store = useGameStore()

// Recipe data
const recipeList = [
  {
    id: 'dish_tomato_radish',
    name: '茄汁萝卜',
    img: '/assets/dish_tomato_radish.png',
    ingredients: [
      { id: 'crop_turnip' },
      { id: 'crop_tomato' }
    ]
  },
  {
    id: 'dish_potato_shreds',
    name: '酸甜土豆丝',
    img: '/assets/dish_potato_shreds.png',
    ingredients: [
      { id: 'crop_potato' },
      { id: 'crop_tomato' }
    ]
  },
  {
    id: 'dish_chili_corn',
    name: '红油玉米',
    img: '/assets/dish_chili_corn.png',
    ingredients: [
      { id: 'crop_tomato' },
      { id: 'crop_corn' }
    ]
  },
  {
    id: 'dish_pumpkin_paste',
    name: '甜甜南瓜泥',
    img: '/assets/dish_pumpkin_paste.png',
    ingredients: [
      { id: 'crop_tomato' },
      { id: 'crop_pumpkin' }
    ]
  }
]

const selectedRecipe = ref(null)
const isCooking = ref(false)
const cookingPhase = ref(1)
const indicatorPos = ref(0)
const animationId = ref(null)
const phaseResults = ref([])
const cookingResult = ref(null)

// Indicator movement
let direction = 1
const speed = 1.5

const canCookSelected = computed(() => {
  if (!selectedRecipe.value) return false
  const ings = selectedRecipe.value.ingredients
  return ings.every(ing => store.getWarehouseItemCount(ing.id) >= 1)
})

function selectRecipe(recipe) {
  selectedRecipe.value = recipe
}

function getImgPath(itemId) {
  const def = store.itemDefs[itemId]
  if (!def) return ''
  return def.img || `/assets/${itemId}.png`
}

function hasIngredient(itemId) {
  return store.getWarehouseItemCount(itemId) >= 1
}

function startCooking() {
  if (!canCookSelected.value) return
  isCooking.value = true
  cookingPhase.value = 1
  phaseResults.value = []
  indicatorPos.value = 0
  startIndicatorAnimation()
}

function startIndicatorAnimation() {
  const animate = () => {
    indicatorPos.value += direction * speed
    if (indicatorPos.value >= 100) {
      indicatorPos.value = 100
      direction = -1
    } else if (indicatorPos.value <= 0) {
      indicatorPos.value = 0
      direction = 1
    }
    animationId.value = requestAnimationFrame(animate)
  }
  animationId.value = requestAnimationFrame(animate)
}

function stopIndicator() {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
    animationId.value = null
  }
  
  // Check if in sweet spot (35% - 65%)
  const inSweetSpot = indicatorPos.value >= 35 && indicatorPos.value <= 65
  phaseResults.value.push(inSweetSpot)
  
  if (cookingPhase.value === 1) {
    // Go to phase 2
    cookingPhase.value = 2
    indicatorPos.value = 0
    direction = 1
    setTimeout(() => {
      startIndicatorAnimation()
    }, 500)
  } else {
    // Finish cooking
    finalizeCooking()
  }
}

function finalizeCooking() {
  isCooking.value = false
  
  // Determine quality based on phase results
  const successCount = phaseResults.value.filter(r => r).length
  let quality = 'disaster'
  if (successCount === 2) {
    quality = 'delicious'
  } else if (successCount === 1) {
    quality = 'normal'
  }
  
  // Actually cook the dish
  const ings = selectedRecipe.value.ingredients
  const result = store.cookDish(ings[0].id, ings[1].id, quality)
  
  cookingResult.value = {
    dishId: result.dishId,
    quality: quality
  }
}

function getResultTitle(quality) {
  switch (quality) {
    case 'delicious': return '✨ 完美! ✨'
    case 'normal': return '👍 还不错!'
    case 'disaster': return '💥 失败了...'
    default: return ''
  }
}

function getResultDesc(quality) {
  switch (quality) {
    case 'delicious': return '火候刚好，味道绝佳!'
    case 'normal': return '虽然普通，但也能吃。'
    case 'disaster': return '这...还是别送人了吧...'
    default: return ''
  }
}

function getQualityLabel(quality) {
  switch (quality) {
    case 'delicious': return '美味'
    case 'normal': return '普通'
    case 'disaster': return '灾难'
    default: return ''
  }
}

function finishCooking() {
  cookingResult.value = null
  selectedRecipe.value = null
}

onUnmounted(() => {
  if (animationId.value) {
    cancelAnimationFrame(animationId.value)
  }
})
</script>

<style scoped>
.cooking-view {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fdf6e3;
  z-index: 200;
  display: flex;
  flex-direction: column;
}

.cooking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #8b5a2b;
  color: white;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  font-size: 24px;
}

.cooking-header h2 {
  margin: 0;
  font-size: 20px;
}

.btn-close {
  background: none;
  border: none;
  color: white;
  font-size: 28px;
  cursor: pointer;
}

.cooking-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.recipe-sidebar {
  width: 90px;
  background: #f5e6d3;
  border-right: 2px dashed #d4c4a8;
  overflow-y: auto;
  padding: 10px 5px;
}

.recipe-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 5px;
  margin-bottom: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.recipe-item:hover {
  background: rgba(255,255,255,0.5);
}

.recipe-item.active {
  background: white;
  border-color: #ff9d66;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.recipe-thumb {
  width: 50px;
  height: 50px;
  object-fit: contain;
  margin-bottom: 5px;
  animation: dishFloat 2s ease-in-out infinite;
}

@keyframes dishFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.recipe-name-vertical {
  writing-mode: vertical-rl;
  font-size: 12px;
  color: #5a4a42;
  font-weight: bold;
}

.recipe-detail {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
}

.detail-content {
  width: 100%;
  max-width: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.dish-preview {
  width: 150px;
  height: 150px;
  background: #fff;
  border-radius: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  margin-bottom: 15px;
}

.dish-image {
  max-width: 130px;
  max-height: 130px;
  object-fit: contain;
  animation: dishFloatLarge 2.5s ease-in-out infinite;
}

@keyframes dishFloatLarge {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-8px) rotate(2deg); }
}

.dish-name {
  color: #5a4a42;
  margin: 0 0 20px 0;
  font-size: 20px;
}

.ingredients-section {
  width: 100%;
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.section-label {
  font-size: 14px;
  color: #888;
  display: block;
  margin-bottom: 10px;
}

.ingredients-list {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.ingredient-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.ing-icon-wrap {
  position: relative;
  width: 50px;
  height: 50px;
  background: #f8f8f8;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.ing-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.ing-need {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff9d66;
  color: white;
  font-size: 11px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
}

.ing-count {
  font-size: 12px;
  color: #e53935;
}

.ing-count.enough {
  color: #43a047;
}

.btn-cook {
  background: linear-gradient(135deg, #ff9d66, #ff7043);
  color: white;
  border: none;
  padding: 15px 40px;
  border-radius: 25px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  box-shadow: 0 4px 15px rgba(255, 112, 67, 0.4);
  transition: all 0.2s;
}

.btn-cook:disabled {
  background: #ccc;
  box-shadow: none;
  cursor: not-allowed;
}

.btn-cook:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 112, 67, 0.5);
}

.no-selection {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
}

/* Cooking Game */
.cooking-game {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
}

.game-header {
  text-align: center;
  margin-bottom: 40px;
}

.game-header h3 {
  color: #5a4a42;
  font-size: 24px;
  margin: 0 0 10px 0;
}

.game-hint {
  color: #888;
  font-size: 14px;
}

.progress-game {
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.progress-track {
  width: 100%;
  height: 40px;
  background: #e0e0e0;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
}

.sweet-spot {
  position: absolute;
  left: 35%;
  width: 30%;
  height: 100%;
  background: linear-gradient(90deg, #81c784, #4caf50, #81c784);
  border-radius: 0;
}

.progress-indicator {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 50px;
  background: #ff5722;
  border-radius: 4px;
  box-shadow: 0 0 10px rgba(255, 87, 34, 0.5);
}

.btn-stop {
  background: #f44336;
  color: white;
  border: none;
  padding: 15px 50px;
  border-radius: 30px;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4);
}

.btn-stop:active {
  transform: scale(0.95);
}

.phase-dots {
  display: flex;
  gap: 20px;
  margin-top: 30px;
}

.dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  color: #999;
}

.dot.current {
  background: #ff9d66;
  color: white;
}

.dot.done {
  background: #4caf50;
  color: white;
}

/* Result Screen */
.cooking-result {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 210;
}

.result-content {
  background: white;
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  width: 80%;
  max-width: 300px;
}

.result-dish {
  margin-bottom: 15px;
}

.result-dish-img {
  width: 100px;
  height: 100px;
  object-fit: contain;
}

.result-dish-img.delicious {
  filter: drop-shadow(0 0 10px gold);
}

.result-dish-img.disaster {
  filter: grayscale(0.5) opacity(0.7);
}

.result-title {
  font-size: 24px;
  margin: 0 0 10px 0;
}

.result-title.delicious { color: #ff9800; }
.result-title.normal { color: #4caf50; }
.result-title.disaster { color: #9e9e9e; }

.result-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
}

.result-dish-name {
  font-size: 16px;
  font-weight: bold;
  color: #5a4a42;
  margin-bottom: 20px;
}

.quality-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 5px;
}

.quality-badge.delicious {
  background: #fff3e0;
  color: #ff9800;
}

.quality-badge.normal {
  background: #e8f5e9;
  color: #4caf50;
}

.quality-badge.disaster {
  background: #f5f5f5;
  color: #9e9e9e;
}

.btn-confirm {
  background: #ff9d66;
  color: white;
  border: none;
  padding: 12px 40px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}
</style>

