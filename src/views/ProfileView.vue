<template>
  <div class="profile-view">
    <div class="header">
      <h2>居民档案</h2>
      <p class="subtitle">与儿时伙伴重拾羁绊</p>
    </div>

    <div class="npc-list">
      <div v-for="npc in npcStore.npcs" :key="npc.id" class="npc-card">
        <div class="npc-header">
          <div class="avatar-frame">
            <img :src="getImgPath(npc.avatar || npc.image)" :alt="npc.name" class="avatar-img" />
          </div>
          <div class="npc-info">
            <div class="name-row">
              <span class="name">{{ npc.name }}</span>
              <button class="btn-gift" @click="openGiftModal(npc.id)">🎁</button>
              <div class="tags">
                <span v-for="tag in npc.tags" :key="tag" class="tag">{{ tag }}</span>
              </div>
            </div>
            <p class="desc">{{ npc.description }}</p>
          </div>
        </div>

        <div class="npc-stats">
          <div class="stat-row">
            <span class="label">最爱:</span>
            <img :src="getImgPath(gameStore.itemDefs[npc.favCrop]?.img)" class="mini-icon" />
            <span class="value">{{ gameStore.itemDefs[npc.favCrop]?.name }}</span>
          </div>
          <div class="heart-row">
            <span class="heart-icon">❤️</span>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (npc.heart / npc.maxHeart * 100) + '%' }"></div>
            </div>
            <span class="heart-val">{{ npc.heart }}/{{ npc.maxHeart }}</span>
          </div>
        </div>

        <div class="event-actions">
           <button 
             v-if="npc.heart >= 10" 
             class="btn-event"
             @click="triggerEvent(npc.id, 10)"
           >
             💖 Lv.10 剧情
           </button>
           <button 
             v-if="npc.heart >= 20" 
             class="btn-event"
             @click="triggerEvent(npc.id, 20)"
           >
             💖 Lv.20 剧情
           </button>
           <button 
             v-if="npc.heart >= 30" 
             class="btn-event"
             @click="triggerEvent(npc.id, 30)"
           >
             💖 Lv.30 剧情
           </button>
           <span v-if="npc.heart < 10" class="locked-hint">提升好感度解锁剧情</span>
        </div>
      </div>
    </div>

    <!-- Gift Modal -->
    <div v-if="showGiftModal" class="gift-modal">
      <div class="gift-content">
        <div class="gift-header">
          <h3>🎁 送礼给 {{ giftTargetNpc?.name }}</h3>
          <button class="btn-close" @click="showGiftModal = false">×</button>
        </div>
        <div class="gift-body">
          <div v-if="availableDishes.length === 0" class="no-dishes">
            <p>没有可以赠送的菜肴</p>
            <p class="hint">去小屋的烹饪台制作一些吧!</p>
          </div>
          <div v-else class="dish-grid">
            <div 
              v-for="dish in availableDishes" 
              :key="dish.id"
              class="dish-item"
              @click="selectDishToGift(dish.id)"
            >
              <img :src="dish.img" class="dish-img" />
              <span class="dish-name">{{ dish.name }}</span>
              <span class="dish-count">x{{ dish.count }}</span>
              <span v-if="giftTargetNpc?.favDish === dish.id" class="fav-badge">❤️</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Gift Result Modal -->
    <div v-if="giftResult" class="gift-result-modal">
      <div class="gift-result-content">
        <div class="result-portrait">
          <img :src="getImgPath(giftTargetNpc?.avatar)" class="result-avatar" />
        </div>
        <div class="result-bubble">
          <p class="result-text">{{ giftResult.reaction }}</p>
        </div>
        <div class="result-heart" :class="giftResult.heartChange >= 0 ? 'positive' : 'negative'">
          {{ giftResult.heartChange >= 0 ? '+' : '' }}{{ giftResult.heartChange }} ❤️
          <span v-if="giftResult.isFavorite" class="favorite-bonus">最爱x2!</span>
        </div>
        <button class="btn-ok" @click="giftResult = null">好的</button>
      </div>
    </div>

    <!-- Event Modal -->
    <div v-if="activeEvent" class="event-modal">
      <div class="event-content">
        <div class="event-header">
           <h3>{{ activeEvent.title }}</h3>
           <button class="btn-close" @click="activeEvent = null">×</button>
        </div>
        
        <div class="visual-novel">
            <div class="portrait-container">
                <img :src="getImgPath(npcStore.npcs[currentEventNpcId].image)" class="npc-portrait" />
            </div>
            <div class="dialogue-box">
                <div class="speaker-name">{{ currentSpeaker }}</div>
                <p class="dialogue-text">{{ currentDialogueText }}</p>
                <button class="btn-next" @click="nextDialogue">
                    {{ isLastDialogue ? '结束' : '继续' }}
                </button>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useNpcStore } from '../stores/npc'
import { useGameStore } from '../stores/game'

const npcStore = useNpcStore()
const gameStore = useGameStore()

const activeEvent = ref(null)
const currentEventNpcId = ref(null)
const dialogueIndex = ref(0)

// Gift system
const showGiftModal = ref(false)
const giftTargetNpcId = ref(null)
const giftResult = ref(null)
const selectedDishQuality = ref(null) // Store quality from cooking

const giftTargetNpc = computed(() => {
  if (!giftTargetNpcId.value) return null
  return npcStore.npcs[giftTargetNpcId.value]
})

const availableDishes = computed(() => {
  const dishes = []
  const dishIds = ['dish_tomato_radish', 'dish_potato_shreds', 'dish_chili_corn', 'dish_pumpkin_paste']
  dishIds.forEach(id => {
    const count = gameStore.getDishCount(id)
    if (count > 0) {
      dishes.push({
        id,
        name: gameStore.itemDefs[id]?.name,
        img: gameStore.itemDefs[id]?.img,
        count
      })
    }
  })
  return dishes
})

function openGiftModal(npcId) {
  giftTargetNpcId.value = npcId
  showGiftModal.value = true
}

function selectDishToGift(dishId) {
  // Use dish
  if (!gameStore.useDish(dishId)) return
  
  // For simplicity, assign random quality based on cooking result
  // In real game, quality should be tracked per dish
  const qualities = ['disaster', 'normal', 'delicious']
  const weights = [0.1, 0.5, 0.4] // 10% disaster, 50% normal, 40% delicious
  const rand = Math.random()
  let quality = 'normal'
  if (rand < weights[0]) quality = 'disaster'
  else if (rand < weights[0] + weights[1]) quality = 'normal'
  else quality = 'delicious'
  
  // Gift to NPC
  const result = npcStore.giftDish(giftTargetNpcId.value, dishId, quality)
  
  giftResult.value = result
  showGiftModal.value = false
}

function getImgPath(filename) {
  if (!filename) return './assets/icons.png'
  if (filename.startsWith('./assets/')) return filename
  return `./assets/${filename}`
}

function triggerEvent(npcId, level) {
    const event = npcStore.getEvent(npcId, level)
    if (event) {
        activeEvent.value = event
        currentEventNpcId.value = npcId
        dialogueIndex.value = 0
    }
}

const currentDialogue = computed(() => {
    if (!activeEvent.value) return null
    return activeEvent.value.dialogue[dialogueIndex.value]
})

const currentSpeaker = computed(() => {
    return currentDialogue.value ? currentDialogue.value.speaker : ''
})

const currentDialogueText = computed(() => {
    return currentDialogue.value ? currentDialogue.value.text : ''
})

const isLastDialogue = computed(() => {
    if (!activeEvent.value) return true
    return dialogueIndex.value >= activeEvent.value.dialogue.length - 1
})

function nextDialogue() {
    if (isLastDialogue.value) {
        activeEvent.value = null
        currentEventNpcId.value = null
    } else {
        dialogueIndex.value++
    }
}
</script>

<style scoped>
.profile-view {
  width: 100%;
  height: 100%;
  padding: 20px;
  background: #fdf6e3;
  overflow-y: auto;
}

.header h2 {
    color: #5a4a42;
    margin: 0;
}
.subtitle {
    color: #8b7d71;
    font-size: 14px;
    margin-top: 5px;
}

.npc-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-top: 20px;
    padding-bottom: 80px; /* Space for nav */
}

.npc-card {
    background: white;
    border-radius: 15px;
    padding: 15px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    border: 1px solid #e6d5b8;
}

.npc-header {
    display: flex;
    gap: 15px;
}

.avatar-frame {
    width: 70px;
    height: 70px;
    flex-shrink: 0;
    position: relative;
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.npc-info {
    flex: 1;
}

.name-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
}

.name {
    font-size: 18px;
    font-weight: bold;
    color: #5a4a42;
}

.tags {
    display: flex;
    gap: 5px;
}

.tag {
    background: #e0f2f1;
    color: #00796b;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 8px;
}

.desc {
    font-size: 12px;
    color: #888;
    line-height: 1.4;
    margin: 0;
}

.npc-stats {
    margin-top: 15px;
    background: #fafafa;
    padding: 10px;
    border-radius: 10px;
}

.stat-row {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    color: #5a4a42;
    margin-bottom: 8px;
}

.mini-icon {
    width: 20px;
    height: 20px;
}

.heart-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.heart-icon {
    color: #e91e63;
}

.progress-bar {
    flex: 1;
    height: 10px;
    background: #eee;
    border-radius: 5px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: #e91e63;
    transition: width 0.3s;
}

.heart-val {
    font-size: 12px;
    color: #888;
}

.event-actions {
    margin-top: 10px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.btn-event {
    background: #fff0f5;
    border: 1px solid #f8bbd0;
    color: #c2185b;
    padding: 4px 8px;
    border-radius: 10px;
    font-size: 11px;
    cursor: pointer;
}

.locked-hint {
    font-size: 11px;
    color: #aaa;
    font-style: italic;
}

/* Modal */
.event-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 300;
    background: rgba(0,0,0,0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.event-content {
    background: transparent;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.event-header {
    padding: 20px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(0,0,0,0.5);
    z-index: 301;
}

.btn-close {
    background: none;
    border: none;
    color: white;
    font-size: 30px;
}

.visual-novel {
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding-bottom: 20px;
    overflow: hidden;
}

.portrait-container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    overflow: hidden;
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 100%;
    z-index: 300;
    pointer-events: none; /* Let clicks pass through */
}

.npc-portrait {
    max-height: 85vh; /* Increase height for thigh-up images */
    width: auto;
    filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));
}

.dialogue-box {
    background: rgba(0,0,0,0.7); /* Translucent black background */
    margin: 10px 20px;
    margin-bottom: 60px; /* Lift up from bottom */
    padding: 20px;
    border-radius: 15px;
    border: 1px solid rgba(255,255,255,0.3);
    min-height: 140px;
    max-height: 30vh; /* Max height for long text */
    flex-shrink: 0;
    z-index: 310;
    overflow-y: auto; /* Enable scrolling */
    pointer-events: auto;
}

.speaker-name {
    font-weight: bold;
    color: #ff80ab; /* Lighter pink for dark background */
    margin-bottom: 8px;
    font-size: 18px;
}

.dialogue-text {
    color: white; /* White text */
    font-size: 16px;
    line-height: 1.6;
}

.btn-next {
    float: right;
    background: #ff9d66;
    color: white;
    border: none;
    padding: 5px 15px;
    border-radius: 10px;
    font-weight: bold;
    margin-top: 10px;
    cursor: pointer;
}

/* Gift Button */
.btn-gift {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 14px;
  cursor: pointer;
  margin-left: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Gift Modal */
.gift-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.6);
  z-index: 400;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.gift-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 350px;
  max-height: 80%;
  display: flex;
  flex-direction: column;
}

.gift-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.gift-header h3 {
  margin: 0;
  color: #5a4a42;
  font-size: 16px;
}

.gift-header .btn-close {
  background: none;
  border: none;
  color: #999;
  font-size: 24px;
  cursor: pointer;
  padding: 0 5px;
}

.gift-header .btn-close:hover {
  color: #5a4a42;
}

.gift-body {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.no-dishes {
  text-align: center;
  color: #999;
  padding: 30px 0;
}

.no-dishes .hint {
  font-size: 12px;
  color: #bbb;
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.dish-item {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.dish-item:hover {
  border-color: #ff9d66;
  background: #fff;
}

.dish-img {
  width: 60px;
  height: 60px;
  object-fit: contain;
  margin-bottom: 8px;
}

.dish-name {
  font-size: 12px;
  color: #5a4a42;
  font-weight: bold;
  text-align: center;
}

.dish-count {
  font-size: 11px;
  color: #888;
}

.fav-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 14px;
}

/* Gift Result Modal */
.gift-result-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  z-index: 450;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.gift-result-content {
  background: white;
  border-radius: 20px;
  padding: 25px;
  width: 85%;
  max-width: 300px;
  text-align: center;
}

.result-portrait {
  margin-bottom: 15px;
}

.result-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #ff9d66;
  object-fit: cover;
}

.result-bubble {
  background: #f5f5f5;
  border-radius: 15px;
  padding: 15px;
  margin-bottom: 15px;
  position: relative;
}

.result-bubble::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 10px solid #f5f5f5;
}

.result-text {
  margin: 0;
  color: #5a4a42;
  font-size: 14px;
  line-height: 1.5;
}

.result-heart {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
}

.result-heart.positive {
  color: #e91e63;
}

.result-heart.negative {
  color: #9e9e9e;
}

.favorite-bonus {
  display: inline-block;
  background: #fff3e0;
  color: #ff9800;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 5px;
}

.btn-ok {
  background: #ff9d66;
  color: white;
  border: none;
  padding: 10px 30px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}
</style>
