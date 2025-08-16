<!-- TooltipWrapper.vue -->
<template>
  <transition name="pop">
    <div v-if="visible" class="tooltip">
      {{ text }}
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  text: String,
  show: Boolean
})

const visible = ref(false)
let timer = null

watch(
  () => props.show,
  (val) => {
    if (timer) clearTimeout(timer)

    if (val) {
      // 父组件要求显示，延迟 0.5s
      timer = setTimeout(() => {
        visible.value = true
      }, 500)
    } else {
      // 父组件隐藏，立即隐藏
      visible.value = false
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.tooltip {
  position: absolute;
  bottom: -30px; /* 定位在父容器底部 */
  left: 50%; /* 水平居中 */
  transform: translateX(-50%); /* 精准水平居中 */
  background-color: #333;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 999;
  white-space: nowrap;
}

/* 弹出动画 */
.pop-enter-from {
  transform: translateX(-50%) translateY(10px) scale(0.8);
  opacity: 0;
}
.pop-enter-to {
  transform: translateX(-50%) translateY(0) scale(1);
  opacity: 1;
}
.pop-enter-active {
  transition: all 0.3s ease;
}

.pop-leave-from {
  transform: translateX(-50%) translateY(0) scale(1);
  opacity: 1;
}
.pop-leave-to {
  transform: translateX(-50%) translateY(10px) scale(0.8);
  opacity: 0;
}
.pop-leave-active {
  transition: all 0.2s ease;
}
</style>
