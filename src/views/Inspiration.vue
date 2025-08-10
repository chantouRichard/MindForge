<template>
  <div class="book-note" v-show="visible" :class="{ closing: isClosing }">
    <div class="book" :class="{ open: isOpen }">
      <div
        v-for="n in totalPages"
        :key="n"
        class="page"
        :style="{ '--index': n }"
      ></div>
      <div class="spine"></div>
      <div class="pagebottom">
        <div class="content">
          <h3>记录灵感</h3>
          <div style="position: relative">
            <input
              v-model="query"
              @input="onInput"
              @focus="showDropdown = true"
              @blur="hideDropdown"
              placeholder="标签"
            />
            <ul v-if="showDropdown && filteredOptions.length" class="dropdown">
              <li
                v-for="option in filteredOptions"
                :key="option"
                @mousedown.prevent="selectOption(option)"
              >
                {{ option }}
              </li>
            </ul>
          </div>
          <input v-model="title" placeholder="标题" />
          <textarea v-model="content" placeholder="内容..." />
          <div class="actions">
            <button @click="saveNote">保存</button>
            <button @click="closeBook">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from "element-plus";
import { ref, onMounted, computed } from "vue";

const visible = ref(true);
const isOpen = ref(false);
const isClosing = ref(false);
const totalPages = 5;
const title = ref("");
const content = ref("");
const inspirationPath = ref("");
const options = ref([]);
const recentRepositories = ref([]);

onMounted(() => {
  let called = false;

  window.electronAPI.onWindowShow(async () => {
    called = true;
    if (!isOpen.value) init();
  });
  setTimeout(() => {
    if (!called && !isOpen.value) {
      init();
    }
  }, 100);
});

async function init() {
  isOpen.value = false;
  isClosing.value = false;
  visible.value = true;
  setTimeout(() => {
    isOpen.value = true;
  }, 500);
  try {
    recentRepositories.value = await window.repositoryAPI.getRepositories();
    inspirationPath.value = `${recentRepositories.value[0].path}\\.mindforge\\灵感库.inspire.json`;
    const res = await window.electronAPI.readFileContent(inspirationPath.value);
    if (res.success) {
      const parsed = JSON.parse(res.content);
      const tags = parsed.inspirations.map((item) => item.tag);
      options.value = tags;
    }
  } catch (err) {
    ElMessage.error(err);
  }
}

async function saveNote() {
  const tag = query.value;
  const saveContent = {
    tag: tag,
    inspiration: {
      title: title.value,
      content: content.value,
    },
  };

  const preload = {
    path:inspirationPath.value,
    saveContent: saveContent
  }
  let res = await window.electronAPI.saveInspiration(preload);
  console.log(res);

  ElMessage.success("保存成功");
  closeBook();
}

function closeBook() {
  isOpen.value = false;
  isClosing.value = true;
  setTimeout(() => {
    visible.value = false;
    query.value = "";
    title.value = "";
    content.value = "";
    setTimeout(() => {
      window.electronAPI.hideInspiration();
    }, 100);
  }, 1200); // 合上动画 + 消失
}

// 输入搜索框
const query = ref("");
const showDropdown = ref(false);

const filteredOptions = computed(() =>
  options.value.filter((opt) =>
    opt.toLowerCase().includes(query.value.toLowerCase())
  )
);

function onInput() {
  showDropdown.value = true;
}

function hideDropdown() {
  // 延迟隐藏，保证点击事件触发
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
}

function selectOption(option) {
  query.value = option;
  showDropdown.value = false;
}
</script>

<style scoped>
.book-note {
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  display: flex;
  opacity: 1;
  transition: opacity 1s ease;
}
.book-note.closing {
  opacity: 0;
}

.book {
  width: 270px;
  height: 420px;
  top: 48px;
  right: 10px;
  position: absolute;
  transform-style: preserve-3d;
  perspective: 1000px;
  transition: transform 1s ease;
}

.page {
  width: 270px;
  height: 400px;
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: left;
  background-color: white;
  transition: transform 0.6s ease, z-index 0.6s ease;
  z-index: 1;
  border: solid 16px #576574;
  border-left: none;
  border-radius: 0 20px 20px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: sans-serif;
  box-sizing: border-box;
}
.spine {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px; /* 夹缝宽度 */
  height: 100%;
  background: linear-gradient(90deg, #4a4a4a 0%, #6c6c6c 50%, #7c7c7c 100%);
  border-radius: 2px;
  transform: translateX(-50%);
  z-index: 1000;
}
.pagebottom {
  width: 270px;
  height: 400px;
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: left;
  background-color: white;
  transition: transform 0.6s ease, z-index 0.6s ease;
  z-index: 1;
  border: solid 16px #576574;
  border-left: none;
  border-radius: 0 20px 20px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: sans-serif;
  box-sizing: border-box;
}
.pagebottom .content {
  padding: 20px;
  text-align: center;
  width: 100%;
}

.pagebottom .content input,
.pagebottom .content textarea {
  width: 100%;
  margin: 8px 0;
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #aaa;
}

.pagebottom .content textarea {
  height: 80px;
  resize: none;
}

.actions {
  display: flex;
  justify-content: space-around;
  margin-top: 12px;
}

.actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: #6c5ce7;
  color: white;
  cursor: pointer;
}

.book.open .page {
  transform: rotateY(-180deg);
  z-index: calc(var(--index) * -1);
  transition-delay: calc(var(--index) * 0.2s);
}

.book:not(.open) .page {
  transform: rotateY(0deg);
  z-index: calc(var(--index));
}

/* 输入搜索框 */
.search-select {
  position: relative;
  width: 200px;
}

input {
  width: 100%;
  padding: 6px;
  box-sizing: border-box;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  border: 1px solid #ccc;
  background: white;
  max-height: 160px;
  overflow-y: auto;
  z-index: 1000;
  list-style: none;
  padding: 0;
  margin: 2px 0 0 0;

  border-radius: 8px;
}

.dropdown li {
  margin: 4px;
  height: 24px;
  cursor: pointer;

  border-radius: 6px;
  text-align: center;
}

.dropdown li:hover {
  background-color: #f0f0f0;
}
</style>
