<template>
  <div
    v-if="visible"
    class="right-click-menu"
    :style="{ top: y + 'px', left: x + 'px' }"
    @click.stop
  >
    <ul>
      <li
        v-for="(item, idx) in menuItems"
        :key="idx"
        @click="handleClick(item)"
      >
        <img :src="item.icon" class="menu-icon" />
        <div class="menu-label">{{ item.label }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useFileStore } from "../../store/file";
const fileStore = useFileStore();

const props = defineProps({
  menuItems: {
    type: Array,
    required: true,
  },
  onSelect: {
    type: Function,
    required: true,
  },
  targetNode: { type: Object, required: false },
});

const visible = ref(false);
const x = ref(0);
const y = ref(0);

function showMenu(event) {
  event.preventDefault();
  visible.value = true;
  x.value = event.clientX;
  y.value = event.clientY;

  // 设置当前选中的目录（仅当 targetNode 是文件夹）
  if (props.targetNode?.isDirectory) {
    directoryStore.setSelectedDirectory(props.targetNode.path);
  }
}

function hideMenu() {
  visible.value = false;
  fileStore.currentRightSelectedItem = null;
}

function handleClick(item) {
  console.log("点击：", item);
  props.onSelect(item);
  hideMenu();
}

// 点击页面空白处关闭菜单
function onClickOutside(e) {
  if (visible.value) {
    hideMenu();
  }
}

onMounted(() => {
  window.addEventListener("click", onClickOutside);
});

onBeforeUnmount(() => {
  window.removeEventListener("click", onClickOutside);
});

defineExpose({
  showMenu,
  hideMenu,
});
</script>

<style scoped>
.menu-icon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  margin-left: 4px;
}
.menu-label {
  font-size: 14px;
  color: #333;

  text-align: left;
  overflow: hidden;
}
.right-click-menu {
  position: fixed;
  z-index: 9999;
  background: #F6F6F6;
  border: 1px solid #ccc;
  border-radius: 8px;
  min-width: 200px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  display: flex;
  flex-direction: column;
  align-items: center;

  gap: 2px;
}

.right-click-menu ul {
  list-style: none;
  padding: 8px 0;
  margin: 0;
  width: 90%;
  height: 100%;
}

.right-click-menu li {
  cursor: pointer;

  display: flex;
  align-items: center;

  width: 100%;
  height: 24px;

  border-radius: 4px;
}

.right-click-menu li:hover {
  background-color: #e4e4e4;
}
</style>
