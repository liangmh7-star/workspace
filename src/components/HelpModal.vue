<template>
  <div class="help-modal">
    <div class="help-content">
      <div class="help-header">
        <h3>📖 玩法指引</h3>
        <button class="btn-close" @click="$emit('close')">×</button>
      </div>

      <div class="help-body">
        <transition name="fade" mode="out-in">
          <div v-if="page === 1" key="1" class="help-page">
            <h4>🌱 种植基础</h4>
            <div class="page-content">
              <p>1. <strong>耕种</strong>：点击荒地开垦。</p>
              <p>2. <strong>播种</strong>：拖拽种子袋到耕地上。</p>
              <p>3. <strong>浇水</strong>：土地干燥时，拖拽水壶进行浇水。</p>
              <p>4. <strong>收获</strong>：作物成熟后，点击即可收获。</p>
            </div>
            <div class="icon-row">
                <span class="emoji">🪣</span> ➡️ <span class="emoji">🌱</span> ➡️ <span class="emoji">🥕</span>
            </div>
          </div>

          <div v-else-if="page === 2" key="2" class="help-page">
            <h4>🛒 市集系统</h4>
            <div class="page-content">
              <p>1. <strong>行情波动</strong>：每天作物价格都会变化。</p>
              <p>2. <strong>涨跌指示</strong>：红色↑涨价，绿色↓跌价。</p>
              <p>3. <strong>行情图表</strong>：查看近7日走势，高抛低吸！</p>
            </div>
             <div class="icon-row">
                <span class="emoji">📈</span> ➡️ <span class="emoji">💰</span>
            </div>
          </div>

          <div v-else-if="page === 3" key="3" class="help-page">
            <h4>📦 仓库系统</h4>
            <div class="page-content">
              <p>1. <strong>自动入库</strong>：收获的作物自动存入仓库。</p>
              <p>2. <strong>容量限制</strong>：仓库最多存放30个作物。</p>
              <p>3. <strong>出售作物</strong>：在市集出售仓库中的作物。</p>
            </div>
             <div class="icon-row">
                <span class="emoji">🌾</span> ➡️ <span class="emoji">📦</span> ➡️ <span class="emoji">💰</span>
            </div>
          </div>

          <div v-else-if="page === 4" key="4" class="help-page">
            <h4>👥 社交与剧情</h4>
            <div class="page-content">
              <p>1. <strong>提升好感</strong>：与伙伴互动增加好感度。</p>
              <p>2. <strong>解锁档案</strong>：好感度提升解锁更多信息。</p>
              <p>3. <strong>连贯剧情</strong>：Lv.10/20/30 解锁"时光胶囊"系列剧情。</p>
            </div>
             <div class="icon-row">
                <span class="emoji">❤️</span> ➡️ <span class="emoji">📖</span>
            </div>
          </div>

          <div v-else-if="page === 5" key="5" class="help-page">
            <h4>🏠 温馨小屋</h4>
            <div class="page-content">
              <p>1. <strong>购买家具</strong>：使用金币购买喜欢的家具。</p>
              <p>2. <strong>自由装修</strong>：拖拽摆放，打造梦想小屋。</p>
              <p>3. <strong>缩放操作</strong>：双指捏合或滚轮可调整家具大小。</p>
            </div>
             <div class="icon-row">
                <span class="emoji">🛋️</span> ➡️ <span class="emoji">✨</span>
            </div>
          </div>
        </transition>
      </div>

      <div class="help-footer">
        <button class="btn-nav" :disabled="page === 1" @click="page--">上一页</button>
        <div class="dots">
            <span v-for="i in 5" :key="i" class="dot" :class="{ active: page === i }"></span>
        </div>
        <button class="btn-nav" :disabled="page === 5" @click="page++">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const page = ref(1)
</script>

<style scoped>
.help-modal {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 300;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.help-content {
  background: #fff;
  width: 90%;
  max-width: 400px;
  border-radius: 20px;
  padding: 20px;
  border: 4px solid #8b4513;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  height: 400px; /* Fixed height for consistency */
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.help-header h3 {
  margin: 0;
  color: #8b4513;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #8b4513;
  cursor: pointer;
}

.help-body {
  flex: 1;
  overflow: hidden; /* For transitions */
  position: relative;
}

.help-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 10px 0;
}

.help-page h4 {
  color: #d84315;
  margin-bottom: 15px;
  font-size: 20px;
  text-align: center;
}

.page-content {
    flex: 1;
}

.help-page p {
  color: #555;
  line-height: 1.6;
  margin-bottom: 12px;
  font-size: 15px;
  background: #f9f9f9;
  padding: 8px;
  border-radius: 8px;
}

.help-page p strong {
    color: #8b4513;
}

.icon-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  font-size: 24px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px dashed #eee;
}

.emoji {
    font-size: 32px;
}

.help-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 2px solid #eee;
}

.btn-nav {
  background: #8b4513;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  min-width: 80px;
}

.btn-nav:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.dots {
    display: flex;
    gap: 6px;
}

.dot {
    width: 8px;
    height: 8px;
    background: #ddd;
    border-radius: 50%;
    transition: background 0.3s;
}

.dot.active {
    background: #ff9d66;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
