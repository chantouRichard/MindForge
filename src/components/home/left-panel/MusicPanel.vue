<template>
  <transition name="fade-slide">
    <div v-show="show" class="music-panel" @click.stop>
      <!-- 侧边栏 -->
      <MusicSidebar :visible="true" @button-click="handleSidebarClick" />
      <div class="music-page">
        <!-- 搜索区 -->
        <div class="search-wrapper">
          <input
            v-model="songName"
            @keyup.enter="searchMusic"
            placeholder="输入歌名后回车搜索"
            class="search-input"
          />
          <div class="search-btn" @click="searchMusic">
            <img :src="searchIcon" class="search-icon" />
          </div>
        </div>

        <!-- 播放器区 -->
        <transition name="fade">
          <div v-if="playerOption.src" class="player-wrapper">
            <!-- 背景层 -->
            <div
              class="player-bg"
              :style="{
                backgroundImage: playerOption.coverImage
                  ? `url(${playerOption.coverImage})`
                  : '',
              }"
            ></div>
            <!-- 前景内容 -->
            <div class="player-content">
              <div class="cover-container">
                <img
                  :src="playerOption.coverImage"
                  class="cover-image"
                  :style="{ transform: `rotate(${rotation}deg)` }"
                />
                <div class="play-btn" @click="togglePlay">
                  <img v-if="isPlaying" :src="pauseIcon" class="button-image" />
                  <img v-else :src="playIcon" class="button-image" />
                </div>
              </div>

              <div class="song-title">{{ playerOption.title }}</div>

              <!-- 自定义进度条 -->
              <div class="progress-wrapper">
                <span class="time">{{ formatTime(currentTime) }}</span>
                <input
                  type="range"
                  min="0"
                  :max="duration"
                  step="0.01"
                  v-model="currentTime"
                  @input="seekAudio"
                />
                <span class="time">{{ formatTime(duration) }}</span>
              </div>

              <audio
                ref="audioRef"
                :src="playerOption.src"
                @timeupdate="updateTime"
                @loadedmetadata="updateDuration"
                @ended="handleEnded"
              ></audio>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  show: Boolean, // 控制是否显示
});

import { ref, watch } from "vue";
import pauseIcon from "../../../assets/home/left-panel/pause.svg";
import playIcon from "../../../assets/home/left-panel/play.svg";
import searchIcon from "../../../assets/home/left-panel/search.svg";

import MusicSidebar from "./music-panel/MusicSidebar.vue";

const songName = ref("");
const playerOption = ref({
  src: "",
  title: "",
  coverImage: "",
});

const audioRef = ref(null);
const isPlaying = ref(false);
const isStopping = ref(false);
const duration = ref(0);
const currentTime = ref(0);

const togglePlay = () => {
  if (!audioRef.value) return;
  if (isPlaying.value) {
    audioRef.value.pause();
    isPlaying.value = false;
  } else {
    audioRef.value.play();
    isPlaying.value = true;
  }
};

// 动画结束后停止 stopping 类，避免重复触发
const handleAnimationEnd = () => {
  if (isStopping.value) {
    isStopping.value = false;
  }
};

const updateTime = () => {
  if (!audioRef.value) return;
  currentTime.value = audioRef.value.currentTime;
};

const updateDuration = () => {
  if (!audioRef.value) return;
  duration.value = audioRef.value.duration;
};

const seekAudio = () => {
  if (!audioRef.value) return;
  audioRef.value.currentTime = currentTime.value;
};

const handleEnded = () => {
  isPlaying.value = false;
  currentTime.value = 0;
};

const formatTime = (time) => {
  const m = Math.floor(time / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

const handleSidebarClick = (key) => {
  console.log("音乐播放器点击：",key);
};

const searchMusic = async () => {
  if (!songName.value.trim()) return;

  const url = `/api/music/api/dg_BDbdmusic.php?gm=${encodeURIComponent(
    songName.value
  )}&type=json&n=1&br=2`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 200) {
      playerOption.value = {
        src: data.music_url,
        title: data.title,
        coverImage: data.cover,
      };
      isPlaying.value = false;
      currentTime.value = 0;
      duration.value = 0;
    } else {
      alert("搜索失败，请换个关键词");
    }
  } catch (err) {
    console.error(err);
  }
};

const rotation = ref(0); // 当前角度
let rotationTimer = null;

watch(isPlaying, (playing) => {
  if (playing) {
    startRotation();
  } else {
    stopRotation();
  }
});

const startRotation = () => {
  if (rotationTimer) clearInterval(rotationTimer);
  rotationTimer = setInterval(() => {
    rotation.value += 1; // 每帧旋转角度，可调节速度
  }, 16); // 约60fps
};

const stopRotation = () => {
  if (rotationTimer) {
    clearInterval(rotationTimer);
    rotationTimer = null;
  }
};
</script>

<style scoped>
.music-panel {
  position: absolute;
  left: 60px; /* 按钮右边偏移 */
  top: 0;
  width: 350px;
  height: 400px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  z-index: 999;
}

/* 动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.music-page {
  padding: 16px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #2b1055, #7597de);
  min-height: 100vh;
  color: #fff;
  font-family: "Segoe UI", sans-serif;
}

.search-wrapper {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
  margin-left: auto;

  width: 80%;
}

.search-input {
  padding: 8px 8px;
  border-radius: 8px;
  border: none;
  outline: none;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  backdrop-filter: blur(6px);
  transition: all 0.3s ease;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-input:focus {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.search-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  border: none;
  background: linear-gradient(90deg, #ff512f, #dd2476);
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 81, 63, 0.4);

  display: flex;
  justify-content: center;
  align-items: center;
}
.search-icon {
  width: 24px;
  height: 24px;
  object-fit: cover;
}

.search-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(255, 81, 63, 0.6);
}

.player-wrapper {
  width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, #ffafbd, #ffc3a0);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);

  position: relative;
}

.cover-container {
  position: relative;
  width: 200px;
  height: 200px;
}

.cover-image {
  width: 100%;
  height: 100%;
  border-radius: 100px;
  object-fit: cover;

  transition: transform 1s ease-out; /* 暂停时平滑停止 */
}

.button-image {
  width: 100%;
  height: 100%;

  object-fit: cover;
}
/* 播放时无限旋转 */
.cover-image.playing {
  animation: spin 4s linear infinite;
}

/* 暂停时缓慢停止 */
.cover-image.stopping {
  animation: spin 2s ease-out 1; /* 只旋转一次，缓慢停止 */
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.play-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-size: 20px;
  cursor: pointer;

  display: flex;
  justify-content: center;
  align-items: center;
}

.song-title {
  font-weight: bold;
  font-size: 16px;
  text-align: center;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 进度条样式 */
.progress-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-wrapper .time {
  font-size: 12px;
  width: 40px;
  text-align: center;
}

.progress-wrapper input[type="range"] {
  flex: 1;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}

.progress-wrapper input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ff512f;
  border: 2px solid #fff;
  cursor: pointer;
  margin-top: -4px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.player-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  filter: blur(8px); /* 只作用于背景 */
  z-index: 0;
}

.player-content {
  position: relative;
  z-index: 1; /* 前景内容在上层，不受 blur 影响 */
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
</style>
