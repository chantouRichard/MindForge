<template>
  <div class="container" @dragover.prevent @drop="handleDrop">
    <div class="toolbar-column">
      <div
        class="tool-container"
        v-for="(tool, index) in tools"
        :key="tool"
        @click="handleClick(index)"
      >
        <img :src="tool.image" class="tool-image" />
      </div>
    </div>
    <v-stage
      ref="stageRef"
      :config="stageSize"
      @mousedown="handleStageMouseDown"
      @touchstart="handleStageMouseDown"
      :draggable="true"
    >
      <v-layer ref="layer">
        <template v-if="safeImages.length || texts.length">
          <v-image
            v-for="item in safeImages"
            :key="item.id"
            :config="item"
            @transformend="handleImgTransformEnd"
            @dragend="handleImgDragEnd"
          />
          <v-text
            v-for="textItem in texts"
            :key="textItem.id"
            :config="textItem"
            @transformend="handleTextTransformEnd"
            @dragend="handleTextDragEnd"
          />
          <v-transformer ref="transformer" />
        </template>

        <template v-else>
          <v-image v-for="(welcomeImage, index) in welcomeImages" :key="index" :config="welcomeImage" />
          <v-text v-for="(welcomeText, index) in welcomeTexts" :key="index" :config="welcomeText" />
          <v-transformer ref="transformer" />
        </template>
      </v-layer>
    </v-stage>
    <el-dialog v-model="isDialogVisible" title="编辑文本">
      <el-input
        type="textarea"
        v-model="editedContent"
        rows="4"
        placeholder="请输入文本内容"
      />
      <template #footer>
        <el-button @click="isDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEdit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  defineProps,
  watch,
  computed,
} from "vue";

const stageRef = ref(null);
const safeImages = computed(() =>
  images.value.map((img) => ({
    ...img,
    // Konva 需要的 image 实例，可以为空
    image: img.image instanceof Image ? img.image : null,
  }))
);
// 欢迎页面的文本和图片配置
const welcomeTexts = ref([]);
const welcomeImages = ref([]);

// 存储图片
const blobURLToDataURL = async (blobUrl) => {
  const response = await fetch(blobUrl); // 把 blob URL fetch 成 Response
  const blob = await response.blob(); // 转成 Blob 对象
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result); // 转成 DataURL
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

import { useRepositoryStore } from "../../../../store/repository";
const repositoryStore = useRepositoryStore();
const saveImage = async (src, index) => {
  // 从 images.value 里找到 id == index 的对象
  const image = images.value.find((img) => img.id === index);
  if (!image) {
    console.error("未找到对应 image");
    return;
  }

  // memoryId 从 props 里取
  const memoryId = props.item.memoryId;

  try {
    // 调用 IPC 保存图片
    let srcToSend = src; // 原来可能是 dataURL 或 file://

    if (src.startsWith("blob")) {
      srcToSend = await blobURLToDataURL(src);
    }

    const res = await window.electronAPI.saveAnnoImage({
      memoryId: String(memoryId),
      id: String(image.id),
      src: srcToSend,
    });

    if (res.success) {
      console.log("图片保存成功:", res);
    } else {
      console.error("图片保存失败:", res.error);
    }
  } catch (err) {
    console.error("保存图片时发生异常:", err);
  }
};

// 处理拖拽放下事件
const handleDrop = (event) => {
  const stage = stageRef.value.getNode();
  event.preventDefault();

  const dt = event.dataTransfer;
  if (!dt || !dt.files || dt.files.length === 0) return;

  const file = dt.files[0];
  if (!file.type.startsWith("image/")) return; // 只处理图片文件

  const reader = new FileReader();
  reader.onload = (e) => {
    const url = e.target.result;

    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      // 获取鼠标相对于舞台的坐标
      const stage = stageRef.value.getNode();
      const pointerPos = stage.getPointerPosition();

      // 限制最大宽度，比如 300px
      const maxWidth = 300;
      let newWidth = img.width;
      let newHeight = img.height;
      if (img.width > maxWidth) {
        const scale = maxWidth / img.width;
        newWidth = img.width * scale;
        newHeight = img.height * scale;
      }
      const imageId = Date.now();

      // 添加到images数组
      images.value.push({
        id: imageId,
        name: "img" + imageId,
        x: pointerPos.x - stage.x(),
        y: pointerPos.y - stage.y(),
        width: newWidth,
        height: newHeight,
        image: img,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        draggable: true,
        src: url,
      });
      saveImage(img.src, imageId);
    };
  };
  reader.readAsDataURL(file);
  saveCanvasDebounced();
};
// 工具栏数组
import newtextIcon from "../../../../assets/home/newtext.svg";
import newimageIcon from "../../../../assets/home/newimage.svg";
import editIcon from "../../../../assets/home/edit.svg";
import deleteIcon from "../../../../assets/home/delete.svg";
import outputIcon from "../../../../assets/home/output.svg";
const tools = ref([
  { name: "添加文本", image: newtextIcon },
  { name: "添加图片", image: newimageIcon },
  { name: "编辑", image: editIcon },
  { name: "删除", image: deleteIcon },
  { name: "导出", image: outputIcon },
]);
const handleClick = (index) => {
  switch (index) {
    case 0: {
      addText();
      break;
    }
    case 1: {
      addImage();
      break;
    }
    case 2: {
      editText(selectedId.value);
      break;
    }
    case 3: {
      deleteSelected();
      break;
    }
    case 4: {
      ElMessage.info("导出功能尚未实现");
      break;
    }
  }
};
// 舞台大小
const stageSize = ref({ width: 0, height: 0 });

const initStage = () => {
  const updateSize = () => {
    stageSize.value.width = window.innerWidth;
    stageSize.value.height = window.innerHeight;
  };
  window.addEventListener("resize", updateSize);
  window.addEventListener("paste", handlePaste);
  updateSize();
  const stage = stageRef.value.getNode();
  stage.position({ x: props.item.stageX || 600, y: props.item.stageY || 300 });

  welcomeTexts.value = [{
    x: stageSize.value.width / 2 - stage.x() - 150,
    y: stageSize.value.height / 2 - stage.y() - 50,
    text: "点击左上角可以添加你的影记~\n",
    fontSize: 24,
    fontFamily: "文悦孙小松春物语体 (须授权)",
    fill: "#888",
    align: "center",
  },
  {
    x: stageSize.value.width / 2 - stage.x() - 350,
    y: stageSize.value.height / 2 - stage.y() + 50,
    text: "在这里，你可以：\n1. 添加文本和图片 ( 支持粘贴和拖拽)\n2. 编辑文本内容",
    fontSize: 24,
    fontFamily: "文悦孙小松春物语体 (须授权)",
    fill: "#888",
    align: "left",
  },
    {
    x: stageSize.value.width / 2 - stage.x() + 90,
    y: stageSize.value.height / 2 - stage.y() + 150,
    text: "3. 删除不需要的元素\n4. 导出你的影记\n5. 分享给你的朋友",
    fontSize: 24,
    fontFamily: "文悦孙小松春物语体 (须授权)",
    fill: "#888",
    align: "left",
  },
  {
    x: stageSize.value.width / 2 - stage.x() - 150,
    y: stageSize.value.height / 2 - stage.y() + 250,
    text: "开始你的影记之旅吧！",
    fontSize: 24,
    fontFamily: "文悦孙小松春物语体 (须授权)",
    fill: "#888",
    align: "center",
  }];
  welcomeImages.value = [];
  let img1 = new Image();
  img1.src = "/introdirection.jpg";
  img1.onload = () => {
    welcomeImages.value.push({
      width: 260,
      height: 200,
      x: stageSize.value.width / 2 - stage.x() - 300,
      y: stageSize.value.height / 2 - stage.y() - 300,
      image: img1,
      draggable: true,
    });
  };
  let img2 = new Image();
  img2.src = "/circle1.png";
  img2.onload = () => {
    welcomeImages.value.push({
      width: 450,
      height: 200,
      x: stageSize.value.width / 2 - stage.x() - 400,
      y: stageSize.value.height / 2 - stage.y() - 20,
      image: img2,
      draggable: true,
    });
  };
  let img3 = new Image();
  img3.src = "/circle1.png";
  img3.onload = () => {
    welcomeImages.value.push({
      width: 260,
      height: 200,
      x: stageSize.value.width / 2 - stage.x() + 60,
      y: stageSize.value.height / 2 - stage.y() + 80,
      image: img3,
      draggable: true,
    });
  };

  const maxWidth = 300;

  if (props.item && props.item.images && props.item.texts) {
    images.value = props.item.images.map((item) => ({ ...item }));
    texts.value = props.item.texts.map((item) => ({ ...item }));
  } else {
    images.value = [];
    texts.value = [];
  }

  images.value.forEach(async (imgItem) => {
    try {
      // 调用 IPC 获取 Base64
      const res = await window.electronAPI.readAnnoImage({
        memoryId: String(props.item.memoryId), // 你要保证 imgItem 有 memoryId
        id: String(imgItem.id), // imgItem 的唯一 id
      });

      if (!res.success) return;

      const img = new window.Image();
      img.src = res.base64; // 直接用返回的 Base64
      img.onload = () => {
        imgItem.image = img;

        // 按需缩放
        if (img.width > maxWidth) {
          const scale = maxWidth / img.width;
          imgItem.width = img.width * scale;
          imgItem.height = img.height * scale;
        } else {
          imgItem.width = img.width;
          imgItem.height = img.height;
        }
      };
    } catch (err) {
      console.error("加载图片失败:", err);
    }
  });
};
onMounted(() => {
  initStage();
});
onBeforeUnmount(() => {
  window.removeEventListener("paste", handlePaste);
});
// 图片数组（替代原来的矩形）

const props = defineProps({
  item: Object,
});
const images = ref([]);
const texts = ref([]);
// 选中和变换逻辑
const selectedShapeName = ref("");
const selectedId = ref("");
const transformer = ref(null);

const handleImgDragEnd = (e) => {
  const img = images.value.find((r) => r.name === selectedShapeName.value);
  if (!img) return;

  img.x = e.target.x();
  img.y = e.target.y();
  saveCanvasDebounced();
};
const handleImgTransformEnd = (e) => {
  const img = images.value.find((r) => r.name === selectedShapeName.value);
  if (!img) return;

  img.x = e.target.x();
  img.y = e.target.y();
  img.rotation = e.target.rotation();
  img.scaleX = e.target.scaleX();
  img.scaleY = e.target.scaleY();
  saveCanvasDebounced();
};
const handleTextDragEnd = (e) => {
  const textItem = texts.value.find((t) => t.name === selectedShapeName.value);
  if (!textItem) return;

  textItem.x = e.target.x();
  textItem.y = e.target.y();
  saveCanvasDebounced();
};
const handleTextTransformEnd = (e) => {
  const textItem = texts.value.find((t) => t.name === selectedShapeName.value);
  if (!textItem) return;

  textItem.x = e.target.x();
  textItem.y = e.target.y();
  textItem.rotation = e.target.rotation();
  textItem.scaleX = e.target.scaleX();
  textItem.scaleY = e.target.scaleY();
  saveCanvasDebounced();
};

const updateTransformer = () => {
  const transformerNode = transformer.value.getNode();
  const stage = transformerNode.getStage();
  const selectedNode = stage.findOne("." + selectedShapeName.value);

  if (selectedNode) {
    transformerNode.nodes([selectedNode]);
  } else {
    transformerNode.nodes([]);
  }
};

const handleStageMouseDown = (e) => {
  if (e.target === e.target.getStage()) {
    selectedShapeName.value = "";
    updateTransformer();
    return;
  }

  const clickedOnTransformer = e.target.getParent().className === "Transformer";
  if (clickedOnTransformer) return;

  const name = e.target.name();
  // 先找图片
  let item = images.value.find((img) => img.name === name);
  if (!item) {
    // 再找文字
    item = texts.value.find((text) => text.name === name);
  }

  selectedShapeName.value = item ? item.name : "";
  selectedId.value = item ? item.id : "";
  updateTransformer();
};

// 编辑文本
const isDialogVisible = ref(false);
const editingText = ref(null);
const editedContent = ref("");

const editText = (textId) => {
  const textItem = texts.value.find((t) => t.id === textId);
  if (textItem) {
    editingText.value = textItem;
    editedContent.value = textItem.text; // 预填当前文本内容
    isDialogVisible.value = true;
  }
};

const confirmEdit = () => {
  if (editingText.value) {
    const target = texts.value.find((t) => t.id === editingText.value.id);
    if (target) {
      target.text = editedContent.value;
    }
  }
  isDialogVisible.value = false;
  saveCanvasDebounced();
};
function addText() {
  const stage = stageRef.value.getNode();
  const newId = Date.now(); // 简单用时间戳作为id
  const centerX = stageSize.value.width / 2;
  const centerY = stageSize.value.height / 2;

  texts.value.push({
    id: newId,
    name: `text_${newId}`,
    x: centerX - stage.x(),
    y: centerY - stage.y(),
    text: "新文本",
    fontSize: 20,
    fontFamily: "文悦孙小松春物语体 (须授权)",
    fill: "#000",
    draggable: true,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  });
  saveCanvasDebounced();
}
function addImage() {
  const stage = stageRef.value.getNode();
  const centerX = stageSize.value.width / 2;
  const centerY = stageSize.value.height / 2;

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.src = url;

    img.onload = () => {
      const maxWidth = 300;
      let newWidth = 300;
      let newHeight = 300;
      if (img.width > maxWidth) {
        const scale = maxWidth / img.width;
        newWidth = img.width * scale;
        newHeight = img.height * scale;
      } else {
        newWidth = img.width;
        newHeight = img.height;
      }
      const imageId = Date.now();
      images.value.push({
        id: imageId,
        name: "img" + imageId,
        x: centerX - stage.x() - newWidth / 2,
        y: centerY - stage.y() - newHeight / 2,
        width: newWidth,
        height: newHeight,
        image: img,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        draggable: true,
        src: url, // 也可以用src保存URL
      });
      saveImage(img.src, imageId);
    };
  };
  input.click();
  saveCanvasDebounced();
}

function deleteSelected() {
  console.log("selected: ", images.value);
  if (!selectedShapeName.value) return;

  const imgIndex = images.value.findIndex(
    (img) => img.name === selectedShapeName.value
  );
  console.log("imgIndex: ", imgIndex);
  if (imgIndex !== -1) {
    images.value.splice(imgIndex, 1);
    return;
  }

  const textIndex = texts.value.findIndex(
    (text) => text.name === selectedShapeName.value
  );
  if (textIndex !== -1) {
    texts.value.splice(textIndex, 1);
  }
  saveCanvasDebounced();
}
import { useFileStore } from "../../../../store/file";
import { startsWith } from "lodash";
import { ElMessage } from "element-plus";
const fileStore = useFileStore();
function saveCanvas() {
  // 先创建临时数组，image 置空
  const tempImages = images.value.map((img) => ({
    ...img,
    image: null, // 置空，保证可序列化
    src: null,
  }));

  // 更新 fileStore
  fileStore.albums.forEach((album) => {
    if (!Array.isArray(album.memories)) return;

    const targetMemory = album.memories.find(
      (m) => m.memoryId === props.item.memoryId
    );
    if (targetMemory) {
      targetMemory.stageX = stageRef.value.getNode().x(); // 保存舞台的X坐标
      targetMemory.stageY = stageRef.value.getNode().y();

      targetMemory.images = tempImages; // 使用临时数组
      targetMemory.texts = texts.value;
    }
  });

  const repoPath = repositoryStore.recentRepositories[0].path;
  const preload = {
    path: `${repoPath}\\.mindforge\\我的影记.achieve`,
    saveContent: JSON.stringify({ albums: fileStore.albums }),
  };

  window.electronAPI.saveAnno(preload).then((res) => {
    if (res.success) {
      console.log("保存成功");
    }
  });
}
// 防抖保存画布
import { debounce } from "lodash";
const saveCanvasDebounced = debounce(() => {
  saveCanvas();
}, 1000); // 用户停止操作 1 秒后保存

// 剪贴板粘贴
const handlePaste = (event) => {
  const clipboardItems = event.clipboardData.items;

  for (let i = 0; i < clipboardItems.length; i++) {
    const item = clipboardItems[i];
    if (item.type.indexOf("image") !== -1) {
      const file = item.getAsFile();
      const reader = new FileReader();

      reader.onload = (e) => {
        const url = e.target.result;
        const img = new Image();
        img.src = url;

        img.onload = () => {
          const maxWidth = 300;
          let newWidth = img.width;
          let newHeight = img.height;

          if (img.width > maxWidth) {
            const scale = maxWidth / img.width;
            newWidth = img.width * scale;
            newHeight = img.height * scale;
          }

          // 获取画布中心坐标
          const stage = stageRef.value.getNode();
          const center = {
            x: stage.width() / 2,
            y: stage.height() / 2,
          };
          const imageId = Date.now();

          images.value.push({
            id: imageId,
            name: "img" + imageId,
            x: center.x - stage.x() - newWidth / 2,
            y: center.y - stage.y() - newHeight / 2,
            width: newWidth,
            height: newHeight,
            image: img,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            draggable: true,
            src: url,
          });
          saveImage(img.src, imageId);
        };
      };

      reader.readAsDataURL(file);
    }
  }
  saveCanvasDebounced();
};

// 监听
watch(
  () => props.item,
  (newVal) => {
    initStage();
  }
);
</script>

<style scoped>
.toolbar-column {
  position: absolute;
  top: 36px;
  left: 36px;

  width: 36px;
  height: auto;

  background-color: #ffffff;

  display: flex;
  flex-direction: column;

  justify-content: center;
  align-items: center;

  gap: 8px;

  padding-top: 8px;
  padding-bottom: 8px;

  z-index: 9999;
}

.tool-container {
  width: 30px;
  height: 30px;

  border-radius: 8px;

  background-color: #f6f6f6;

  transition: all 0.2s ease-in-out;

  display: flex;
  justify-content: center;
  align-items: center;
}
.tool-container:hover {
  background-color: #e4e4e4;
}
.tool-image {
  width: 27px;
  height: 27px;
  object-fit: cover;
}
</style>
