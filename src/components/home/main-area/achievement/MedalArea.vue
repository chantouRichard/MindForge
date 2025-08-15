<template>
  <div class="container">
    <div class="top-part">
      <div ref="container" class="three-container"></div>
    </div>
    <div class="bottom-part">
      <div class="info-title">徽章信息</div>
      <div class="info-container">
        <div class="badge-detail">
          <img src="https://img.icons8.com/color/48/000000/medal.png" class="badge-icon"/>
          <div class="badge-text">
            <div class="badge-name">旅行达人</div>
            <div class="badge-desc">累计完成 10 个旅行影记</div>
            <div class="badge-meta">
              <span>获得时间：2025-08-15</span>
              <span>稀有度：⭐⭐⭐</span>
            </div>
            <div class="progress-bar">
              <div class="progress" :style="{ width: '75%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, defineProps, watch } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// 传参
const props = defineProps({
  item: {
    type: Object,
    required: true, // 根据需要可选
  },
});

// 根据文本形成图片纹理图
function createTextImage(
  text,
  width = 256,
  height = 256,
  font = "bold 18px sans-serif",
  fillStyle = "#000"
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, width, height);

  // 背景白色（可改）
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);

  // 文本样式
  ctx.fillStyle = fillStyle;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(text, width / 2, height / 2);

  return canvas;
}

function create2x2TextureWithFlip(text, singleWidth = 256, singleHeight = 256) {
  // 先生成单张文本图
  const singleCanvas = createTextImage(text, singleWidth, singleHeight);

  // 生成2x2拼接canvas
  const canvas = document.createElement("canvas");
  canvas.width = singleWidth * 2;
  canvas.height = singleHeight * 2;

  const ctx = canvas.getContext("2d");

  // 先绘制4张文本图
  ctx.drawImage(singleCanvas, 0, 0);
  ctx.drawImage(singleCanvas, singleWidth, 0);
  ctx.drawImage(singleCanvas, 0, singleHeight);
  ctx.drawImage(singleCanvas, singleWidth, singleHeight);

  // 创建一个新的canvas来做水平翻转
  const flippedCanvas = document.createElement("canvas");
  flippedCanvas.width = canvas.width;
  flippedCanvas.height = canvas.height;
  const flippedCtx = flippedCanvas.getContext("2d");

  // 水平翻转绘制
  flippedCtx.translate(flippedCanvas.width, 0);
  flippedCtx.scale(-1, 1);
  flippedCtx.drawImage(canvas, 0, 0);

  return flippedCanvas;
}

// 使用示例
const finalCanvas = ref(create2x2TextureWithFlip(props.item.name, 256, 256));
// 如果你想下载这个图片
// const dataUrl = finalCanvas.toDataURL("image/png");
// const a = document.createElement("a");
// a.href = dataUrl;
// a.download = "test.png";
// a.click();
const container = ref(null);

let scene, camera, renderer, controls, model, animationId;

onMounted(() => {
  // helper: 归一化角度到 [0, 2PI)
  function normAngleRad(a) {
    const TWO_PI = Math.PI * 2;
    return ((a % TWO_PI) + TWO_PI) % TWO_PI;
  }

  // 平滑把相机移动到指定 azimuth（弧度）
  // duration 毫秒，0 表示立刻跳转
  function setCameraAzimuth(angleRad, duration = 0) {
    if (!camera || !controls) return;

    const target = controls.target.clone();
    const radius = camera.position.distanceTo(target);
    const startAzimuth = controls.getAzimuthalAngle();
    const polar = controls.getPolarAngle();

    // 计算最短路径差值
    const shortestAngleDiff = (a, b) => {
      let diff = b - a;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      return diff;
    };
    const deltaAzimuth = shortestAngleDiff(startAzimuth, angleRad);

    if (!duration) {
      const x = target.x + radius * Math.sin(polar) * Math.sin(angleRad);
      const y = target.y + radius * Math.cos(polar);
      const z = target.z + radius * Math.sin(polar) * Math.cos(angleRad);
      camera.position.set(x, y, z);
      camera.lookAt(target);
      controls.update();
      return;
    }

    controls.enabled = false;
    const t0 = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const ease = 1 - (1 - t) * (1 - t); // easeOutQuad
      const currentAzimuth = startAzimuth + deltaAzimuth * ease;

      const x = target.x + radius * Math.sin(polar) * Math.sin(currentAzimuth);
      const y = target.y + radius * Math.cos(polar);
      const z = target.z + radius * Math.sin(polar) * Math.cos(currentAzimuth);
      camera.position.set(x, y, z);
      camera.lookAt(target);
      controls.update();

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        controls.enabled = true;
      }
    };

    requestAnimationFrame(tick);
  }

  // 创建场景
  scene = new THREE.Scene();

  // 设置相机
  const width = container.value.clientWidth;
  const height = container.value.clientHeight;
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 1.5, 3);

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  container.value.appendChild(renderer.domElement);

  // 环境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // 方向光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  const frontLight = new THREE.PointLight(0xffffff, 1);

  frontLight.position.set(
    camera.position.x - 2 * 16,
    camera.position.y,
    camera.position.z + 8
  );

  // 新增：相机背后点光源，制造用户背后光照效果
  const backLight = new THREE.PointLight(0xffffff, 1);
  backLight.position.set(
    camera.position.x,
    camera.position.y,
    camera.position.z + 8
  ); // 相机后面稍偏后
  scene.add(backLight);

  // 控制器（鼠标旋转缩放）
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;
  controls.enableZoom = false; // 禁止缩放

  // 水平旋转
  controls.minPolarAngle = Math.PI / 2;
  controls.maxPolarAngle = Math.PI / 2;

  const onControlsStart = () => {
    console.log("开始移动");
  };
  const onControlsEnd = () => {
    if (model) {
      console.log("相机水平角度 (弧度):", controls.getAzimuthalAngle());
      console.log(
        "相机水平角度 (角度):",
        THREE.MathUtils.radToDeg(controls.getAzimuthalAngle())
      );
      // 取当前 azimuth（可能是负值）
      const az = controls.getAzimuthalAngle();
      const azNorm = normAngleRad(az); // 0..2PI

      // 距离 0 和 PI 的更近者
      const distTo0 = Math.min(
        Math.abs(azNorm - 0),
        Math.abs(azNorm - Math.PI * 2)
      );
      const distToPi = Math.abs(azNorm - Math.PI);

      const target = distTo0 < distToPi ? 0 : Math.PI;
      // 平滑过渡 400ms
      setCameraAzimuth(target, 400);
    }
  };
  controls.addEventListener("start", onControlsStart);
  controls.addEventListener("end", onControlsEnd);

  // 加载模型
  const loader = new GLTFLoader();
  loader.load(
    // "/phone/45dc5362ec114f12a0f07d2a7bf92b4d.gltf",
    // "/medal/test.glb",
    props.item.model,
    (gltf) => {
      model = gltf.scene;
      // 计算包围盒
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // 把模型移动到原点居中
      model.position.x += model.position.x - center.x;
      // model.position.y += (model.position.y - center.y)
      model.position.z += model.position.z - center.z;

      // 计算缩放比例，使模型大小合适（比如最大边长缩放到1.5单位）
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.5 / maxDim;
      model.scale.set(scale, scale, scale);

      // 创建纹理加载器，加载你的新图片纹理
      const texture = new THREE.CanvasTexture(finalCanvas.value);

      model.traverse((child) => {
        if (child.isMesh) {
          if (child.name === "柱体_2") {
            child.material.map = texture;
            child.material.needsUpdate = true;
          }
        }
      });

      scene.add(model);
    },
    undefined,
    (error) => {
      console.error("模型加载错误", error);
    }
  );

  // 动画循环
  function animate() {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
});

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer) {
    renderer.dispose();
    if (container.value) container.value.removeChild(renderer.domElement);
  }
  if (controls) controls.dispose();
});

watch(
  () => props.item,
  (value) => {
    const newCanvas = create2x2TextureWithFlip(props.item.name, 256, 256);
    if (!newCanvas) return;

    const newTexture = new THREE.CanvasTexture(newCanvas);

    model.traverse((child) => {
      if (child.isMesh) {
        if (child.name === "柱体_2") {
          // 先释放旧纹理（可选）
          if (child.material.map) {
            child.material.map.dispose();
          }

          child.material.map = newTexture;
          child.material.needsUpdate = true;
        }
      }
    });
    scene.add(model);
  }
);
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
}
.top-part {
  width: 100%;
  height: 50%;
  background-color: #111;

  display: flex;
  justify-content: center;
  align-items: center;
}
.three-container {
  min-width: 600px;
  width: 600px;
  height: 100%;
  border-radius: 12px;
}

.bottom-part {
  padding: 20px;
  background-color: #000000;

  width: 100%;
  height: 100%;
}

.info-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;

  color: #ffd500;

}

.info-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.badge-detail {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #000000;
}

.badge-icon {
  width: 48px;
  height: 48px;
}

.badge-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;

  color: #fff;
}

.badge-name {
  font-weight: bold;
  font-size: 16px;
}

.badge-desc {
  font-size: 14px;
  color: #ffffff;
}

.badge-meta {
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 12px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: #eee;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;
}

.progress {
  height: 100%;
  background-color: #4caf50;
  border-radius: 3px;
}
</style>
