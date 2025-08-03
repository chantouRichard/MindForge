<!-- TooltipWrapper.vue -->
<template>
  <div v-if="show" class="tooltip">
    {{ text }}
  </div>
</template>

<script setup>
defineProps({
  text: String,
  show: Boolean
})
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

</style>
