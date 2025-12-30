<template>
  <div class="story-view">
    <!-- Chapter List -->
    <div v-if="!readingChapter" class="chapter-list">
      <div class="list-header">
        <h2>星露日记</h2>
        <button class="btn-close-list" @click="$emit('close')">×</button>
      </div>
      
      <div class="scroll-area">
        <div 
          v-for="chapter in gameStore.storyChapters" 
          :key="chapter.id"
          class="chapter-card"
          :class="{ 
            locked: !isUnlocked(chapter.id),
            read: isRead(chapter.id)
          }"
          @click="startReading(chapter)"
        >
          <div class="card-content">
            <span class="chapter-num">第 {{ chapter.id }} 章</span>
            <span class="chapter-title">{{ isUnlocked(chapter.id) ? chapter.title : '未解锁' }}</span>
            <span v-if="!isUnlocked(chapter.id)" class="lock-hint">解锁条件: Lv.{{ chapter.unlockLevel }}</span>
          </div>
          <div class="status-icon" v-if="isRead(chapter.id)">✓</div>
        </div>
      </div>
    </div>

    <!-- Reading Interface -->
    <div v-else class="reading-interface" @click="nextDialogue">
      <img src="/assets/treehouse_scene.png" class="bg-blur" />
      
      <!-- NPC Portrait -->
      <div class="npc-container" v-if="currentPortrait">
        <img :src="currentPortrait" alt="NPC" />
      </div>

      <!-- Dialogue Box -->
      <div class="dialogue-box">
        <div class="speaker-name">{{ currentDialogue?.speaker || '???' }}</div>
        <p class="text">{{ currentDialogue?.text }}</p>
        <span class="tap-hint">点击屏幕继续 ▶</span>
      </div>
      
      <button class="btn-quit" @click.stop="stopReading">跳过</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'
import { useNpcStore } from '../stores/npc'

const emit = defineEmits(['close'])
const gameStore = useGameStore()
const npcStore = useNpcStore()

const readingChapter = ref(null)
const dialogueIndex = ref(0)

const currentDialogue = computed(() => {
  if (!readingChapter.value) return null
  return readingChapter.value.content[dialogueIndex.value]
})

const currentPortrait = computed(() => {
  if (!currentDialogue.value) return null
  const speaker = currentDialogue.value.speaker
  
  // Try to find matching NPC
  // Speaker might be "Alex", "Sebastian", "Haley"
  const npcKey = Object.keys(npcStore.npcs).find(key => npcStore.npcs[key].name === speaker)
  if (npcKey) {
      return `/assets/${npcStore.npcs[npcKey].portrait}`
  }
  
  // Grandpa?
  if (speaker === '爷爷') {
      return null // No image for grandpa yet, or maybe a generic one?
  }
  
  return null
})

function isUnlocked(chapterId) {
  return gameStore.story.unlockedChapters.includes(chapterId)
}

function isRead(chapterId) {
  return gameStore.story.readChapters.includes(chapterId)
}

function startReading(chapter) {
  if (!isUnlocked(chapter.id)) return
  readingChapter.value = chapter
  dialogueIndex.value = 0
}

function nextDialogue() {
  if (!readingChapter.value) return
  
  if (dialogueIndex.value < readingChapter.value.content.length - 1) {
    dialogueIndex.value++
  } else {
    finishReading()
  }
}

function stopReading() {
  readingChapter.value = null
}

function finishReading() {
  if (readingChapter.value) {
    gameStore.markChapterRead(readingChapter.value.id)
    readingChapter.value = null
  }
}
</script>

<style scoped>
.story-view {
  width: 100%;
  height: 100%;
  background: #fdf6e3;
  position: relative;
  overflow: hidden;
  z-index: 200; /* High z-index to overlay everything */
}

.chapter-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-image: linear-gradient(#fdf6e3 2px, transparent 2px), linear-gradient(90deg, #fdf6e3 2px, transparent 2px);
  background-size: 20px 20px;
  background-color: #fffaf0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h2 {
  color: #8b4513;
  font-family: 'Times New Roman', serif;
}

.btn-close-list {
  font-size: 30px;
  background: none;
  border: none;
  color: #8b4513;
  cursor: pointer;
}

.scroll-area {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.chapter-card {
  background: white;
  padding: 15px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.chapter-card:active {
  transform: scale(0.98);
}

.chapter-card.locked {
  background: #f0f0f0;
  color: #999;
  cursor: not-allowed;
}

.chapter-num {
  font-size: 12px;
  color: #888;
  display: block;
}

.chapter-title {
  font-size: 18px;
  font-weight: bold;
  color: #555;
  display: block;
  margin: 4px 0;
}

.lock-hint {
  font-size: 12px;
  color: #e74c3c;
}

.status-icon {
  color: #27ae60;
  font-weight: bold;
  font-size: 20px;
}

/* Reading Interface */
.reading-interface {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
}

.bg-blur {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(3px);
}

.npc-container {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  max-height: 85%; /* Adjusted for thigh-up portraits */
  height: auto;
  z-index: 101;
  pointer-events: none;
  display: flex;
  align-items: flex-end;
}

.npc-container img {
  max-height: 75vh; /* Ensure they fit on screen */
  width: auto;
  max-width: 100vw;
  filter: drop-shadow(0 0 10px rgba(0,0,0,0.3));
}

.dialogue-box {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  height: 150px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 20px;
  z-index: 102;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  border: 2px solid #8b4513;
}

.speaker-name {
  font-weight: bold;
  color: #8b4513;
  margin-bottom: 8px;
  font-size: 16px;
}

.text {
  color: #333;
  font-size: 15px;
  line-height: 1.5;
}

.tap-hint {
  position: absolute;
  bottom: 10px;
  right: 15px;
  font-size: 12px;
  color: #999;
  animation: blink 1s infinite;
}

.btn-quit {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  padding: 5px 12px;
  border-radius: 15px;
  z-index: 103;
}

@keyframes blink {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
</style>
