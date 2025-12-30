<template>
  <div class="home-view" ref="sceneRef" 
       @touchmove.prevent="handleTouchMove" 
       @mousemove.prevent="handleDragMove" 
       @touchend="handleDragEnd" 
       @mouseup="handleDragEnd"
       @mouseleave="handleDragEnd">
    <!-- Background -->
    <img src="/assets/treehouse_scene.png" class="background" alt="Home" draggable="false" />

    <!-- Placed Furniture -->
    <div 
      v-for="item in gameStore.homeLayout" 
      :key="item.id"
      class="furniture-item"
      :class="{ 'is-dragging': draggingItem?.id === item.id }"
      :style="{ 
        left: item.x + 'px', 
        top: item.y + 'px',
        transform: `scale(${item.scale || 1})`
      }"
      @touchstart.stop="handleTouchStart(item, $event)"
      @mousedown.stop="handleDragStart(item, $event)"
      @wheel.stop.prevent="handleWheel(item, $event)"
    >
      <img :src="getImgPath(item.itemId)" draggable="false" />
    </div>

    <!-- UI Overlay -->
    <div class="ui-overlay" v-if="!isEditing">
      <div class="header">
        <h1>我的家园</h1>
        <div class="header-buttons">
          <button class="btn-edit" @click="isEditing = true">🎨 装修</button>
          <button class="btn-cook" @click="showCooking = true">🍳 烹饪</button>
        </div>
      </div>
    </div>

    <!-- Cooking View -->
    <CookingView v-if="showCooking" @close="showCooking = false" />

    <!-- Edit Mode UI -->
    <div class="edit-ui" v-if="isEditing">
      <div class="top-bar">
        <span class="mode-label">装修模式</span>
        <button class="btn-save" @click="saveAndExit">保存</button>
      </div>

      <div class="trash-zone" :class="{ 'active': isHoveringTrash }">
        <span>拖拽至此处回收</span>
      </div>

      <div class="inventory-drawer">
        <div class="drawer-content">
          <div 
            v-for="(count, itemId) in furnitureInventory" 
            :key="itemId" 
            class="drawer-item"
            @touchstart.stop="handleNewItemDrag(itemId, $event)"
            @mousedown.stop="handleNewItemDrag(itemId, $event)"
          >
            <div class="item-icon">
              <!-- Ensure draggable=false to prevent browser native drag showing filename -->
              <img :src="getImgPath(itemId)" draggable="false" />
              <span class="count">x{{ count }}</span>
            </div>
          </div>
          <div v-if="Object.keys(furnitureInventory).length === 0" class="empty-msg">
            暂无家具，去商店看看吧
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/game'
import CookingView from './CookingView.vue'

const gameStore = useGameStore()
const showCooking = ref(false)
const sceneRef = ref(null)

const isEditing = ref(false)
const draggingItem = ref(null)
const dragOffset = ref({ x: 0, y: 0 })
const isHoveringTrash = ref(false)
const isNewItem = ref(false) 

// Pinch Zoom State
const isPinching = ref(false)
const initialPinchDist = ref(0)
const initialScale = ref(1)

// Filter inventory for furniture only
const furnitureInventory = computed(() => {
  const result = {}
  for (const [key, count] of Object.entries(gameStore.inventory)) {
    if (gameStore.itemDefs[key]?.type === 'furniture' && count > 0) {
      result[key] = count
    }
  }
  return result
})

function getImgPath(itemId) {
  const img = gameStore.itemDefs[itemId]?.img
  // Fallback to avoid empty src
  return img ? img : '/assets/furniture_chair.png'
}

function getClientCoords(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  return { x: e.clientX, y: e.clientY }
}

function getPinchDistance(e) {
    return Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
    )
}

function handleTouchStart(item, e) {
  if (!isEditing.value) return
  
  if (e.touches.length === 2) {
    // Pinch Start
    e.preventDefault()
    isPinching.value = true
    draggingItem.value = item
    initialPinchDist.value = getPinchDistance(e)
    initialScale.value = item.scale || 1
  } else {
    // Drag Start
    handleDragStart(item, e)
  }
}

function handleDragStart(item, e) {
  if (!isEditing.value || isPinching.value) return
  
  const coords = getClientCoords(e)
  const rect = e.target.closest('.furniture-item').getBoundingClientRect()
  
  draggingItem.value = item
  isNewItem.value = false
  
  // Calculate offset from the top-left of the item
  dragOffset.value = {
    x: coords.x - rect.left,
    y: coords.y - rect.top
  }
}

function handleNewItemDrag(itemId, e) {
  if (!isEditing.value) return
  
  const coords = getClientCoords(e)
  const sceneRect = sceneRef.value.getBoundingClientRect()
  
  // Create item near the touch/mouse point
  // We place it at center of interaction (50x50 offset approx for 100px item)
  const x = coords.x - sceneRect.left - 50 
  const y = coords.y - sceneRect.top - 50
  
  gameStore.placeFurniture(itemId, x, y)
  
  const newItem = gameStore.homeLayout[gameStore.homeLayout.length - 1]
  draggingItem.value = newItem
  isNewItem.value = true
  
  dragOffset.value = { x: 50, y: 50 } 
}

function handleTouchMove(e) {
  if (!isEditing.value || !draggingItem.value) return

  if (e.touches.length === 2 && isPinching.value) {
    // Pinch Scaling
    e.preventDefault()
    const dist = getPinchDistance(e)
    const scaleFactor = dist / initialPinchDist.value
    let newScale = initialScale.value * scaleFactor
    
    newScale = Math.max(0.5, Math.min(3.0, newScale))
    
    const item = gameStore.homeLayout.find(i => i.id === draggingItem.value.id)
    if (item) {
      item.scale = newScale
    }
  } else {
    // Dragging
    handleDragMove(e)
  }
}

function handleDragMove(e) {
  if (!draggingItem.value || isPinching.value) return
  
  const coords = getClientCoords(e)
  const sceneRect = sceneRef.value.getBoundingClientRect()
  
  let newX = coords.x - sceneRect.left - dragOffset.value.x
  let newY = coords.y - sceneRect.top - dragOffset.value.y
  
  const item = gameStore.homeLayout.find(i => i.id === draggingItem.value.id)
  if (item) {
    item.x = newX
    item.y = newY
  }
  
  const screenHeight = window.innerHeight
  if (coords.y > screenHeight - 150) {
    isHoveringTrash.value = true
  } else {
    isHoveringTrash.value = false
  }
}

function handleWheel(item, e) {
  if (!isEditing.value) return
  
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  let newScale = (item.scale || 1) + delta
  newScale = Math.max(0.5, Math.min(3.0, newScale))
  
  const storeItem = gameStore.homeLayout.find(i => i.id === item.id)
  if (storeItem) {
      storeItem.scale = newScale
      // We don't save immediately here to avoid too many writes, 
      // but saveAndExit handles it.
  }
}

function handleDragEnd() {
  if (draggingItem.value) {
    if (isHoveringTrash.value && !isPinching.value) {
      gameStore.removeFurniture(draggingItem.value.id)
    } else {
      // Save position/scale
      const item = gameStore.homeLayout.find(i => i.id === draggingItem.value.id)
      if (item) {
          gameStore.moveFurniture(item.id, item.x, item.y, item.scale)
      }
    }
  }
  
  draggingItem.value = null
  isHoveringTrash.value = false
  isNewItem.value = false
  isPinching.value = false
}

function saveAndExit() {
  isEditing.value = false
  gameStore.saveGame()
}
</script>

<style scoped>
.home-view {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #f0f0f0;
  user-select: none; /* Prevent text selection during drag */
  -webkit-user-select: none;
}

.background {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.furniture-item {
  position: absolute;
  width: 100px;
  z-index: 10;
  touch-action: none;
  transform-origin: center center;
  user-select: none;
  -webkit-user-select: none;
}

.furniture-item img {
  width: 100%;
  height: auto;
  pointer-events: none; /* Ensure no native drag */
  display: block; 
}

.is-dragging {
  z-index: 100;
  opacity: 0.9;
  pointer-events: none; /* Let clicks pass through to background for move events */
}

.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 20px;
  pointer-events: none;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: auto;
}

.header h1 {
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  font-size: 24px;
}

.header-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-edit, .btn-save, .btn-cook {
  background: #ff9d66;
  border: 2px solid #fff;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
}

.btn-cook {
  background: #8b5a2b;
}

.edit-ui {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 50;
  pointer-events: none;
}

.top-bar {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
  pointer-events: auto;
}

.mode-label {
  background: rgba(0,0,0,0.5);
  color: white;
  padding: 4px 10px;
  border-radius: 10px;
}

.trash-zone {
  position: absolute;
  bottom: 120px; 
  left: 0;
  width: 100%;
  height: 60px;
  background: rgba(255, 0, 0, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none; 
}

.trash-zone.active {
  opacity: 1;
  background: rgba(255, 0, 0, 0.5);
}

.inventory-drawer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 120px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px 20px 0 0;
  padding: 10px;
  box-shadow: 0 -4px 10px rgba(0,0,0,0.1);
  pointer-events: auto;
  overflow-x: auto;
}

.drawer-content {
  display: flex;
  gap: 15px;
  padding: 0 10px;
}

.drawer-item {
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  background: #f8f8f8;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: 1px solid #ddd;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}

.drawer-item:active {
  cursor: grabbing;
}

.drawer-item img {
  max-width: 80%;
  max-height: 80%;
  pointer-events: none; /* Critical for custom drag */
}

.count {
  position: absolute;
  bottom: 2px;
  right: 5px;
  font-size: 12px;
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
}

.empty-msg {
  width: 100%;
  text-align: center;
  color: #888;
  line-height: 100px;
}
</style>
