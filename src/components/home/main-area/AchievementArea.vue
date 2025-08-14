<template>
  <div class="container">
    <ProgressArea v-if="mode === 'progress'" :item="selectedItem"></ProgressArea>
    <MedalArea v-else-if="mode === 'achievement'" :item="selectedItem"></MedalArea>
    <AnnoArea v-else-if="mode === 'imageannotation'" :item="selectedItem"></AnnoArea>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'


import { useFileStore } from '../../../store/file';
const fileStore = useFileStore();
const mode = computed(() => fileStore.AchievementMode);
const selectedItem = computed(() => fileStore.AchievementSelected);

import ProgressArea from './achievement/ProgressArea.vue';
import MedalArea from './achievement/MedalArea.vue';
import AnnoArea from './achievement/AnnoArea.vue';
</script>

<style scoped>
.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    width: 100%;

    position: relative;
}
</style>