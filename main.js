let scene, camera, renderer;
let stack = [];
let movingBlock;

let speed = 0.075;
let direction = 1;
let score = 0;
let combo = 0;
let gameOver = false;

const blockHeight = 1;
const blockDepth = 5;
let blockWidth = 5;

const feedback = document.getElementById("feedback");
const loadingScreen = document.getElementById("loadingScreen");
const hitSound = document.getElementById("hitSound");
const perfectSound = document.getElementById("perfectSound");
const badSound = document.getElementById("badSound");

if (loadingScreen) {
  setTimeout(() => {
    loadingScreen.style.opacity = "0";
    loadingScreen.style.pointerEvents = "none";
    loadingScreen.style.transition = "opacity 0.6s";
    setTimeout(() => loadingScreen.remove(), 600);
  }, 5000);
}

window.addEventListener("load", () => {
  document.body.classList.add("game-bg");
});

document.addEventListener("click", () => {
  hitSound?.play();
  perfectSound?.play();
  badSound?.play();
}, { once: true });

init();
animate();

function init() {
  setupScene();
  setupLights();
  setupBase();
  setupControls();
}

function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(8, 12, 14);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);
}

function setupLights() {
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(10, 20, 10);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
}

function setupBase() {
  const base = createBlock(0, blockWidth);
  stack.push(base);
  movingBlock = createBlock(blockHeight, blockWidth);
}

function setupControls() {
  window.addEventListener("resize", onWindowResize);
  document.addEventListener("keydown", e => {
    if (e.code === "Space") dropBlock();
  });
  document.addEventListener("click", dropBlock);
}

function animate() {
  if (!gameOver) updateMovingBlock();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function updateMovingBlock() {
  movingBlock.position.x += speed * direction;

  if (movingBlock.position.x > 6 || movingBlock.position.x < -6) {
    direction *= -1;
  }
}

function createBlock(y, width) {
  const geometry = new THREE.BoxGeometry(width, blockHeight, blockDepth);
  const material = new THREE.MeshStandardMaterial({ color: randomColor() });
  const block = new THREE.Mesh(geometry, material);
  block.position.y = y;
  scene.add(block);
  return block;
}

function dropBlock() {
  if (!movingBlock) {
    const y = stack.length * blockHeight;
    movingBlock = createBlock(y, blockWidth);
    return; 
  }

  if (gameOver) return;

  const lastBlock = stack[stack.length - 1];
  const delta = movingBlock.position.x - lastBlock.position.x;
  const overlap = blockWidth - Math.abs(delta);

  if (overlap <= 0) {
    endGame();
    return;
  }

  handleHit(delta, overlap);
  updateBlock(overlap, delta);
  spawnNextBlock();
}

function handleHit(delta, overlap) {

  let hitType = "GOOD";

  if (Math.abs(delta) < 0.15) {
    hitType = "PERFECT";
    combo++;
    perfectSound.currentTime = 0;
    perfectSound.play();
  } 
  else if (overlap < blockWidth * 0.4) {
    hitType = "BAD";
    combo = 0;
    badSound.currentTime = 0;
    badSound.play();
  } 
  else {
    combo = 0;
    hitSound.currentTime = 0;
    hitSound.play();
  }

  showFeedback(hitType);
  updateScore();
}

function updateBlock(overlap, delta) {
  blockWidth = overlap;
  movingBlock.scale.x = overlap / movingBlock.geometry.parameters.width;
  movingBlock.position.x -= delta / 2;
  stack.push(movingBlock);
}

function spawnNextBlock() {
  const y = stack.length * blockHeight;
  movingBlock = createBlock(y, blockWidth);
  camera.position.y += blockHeight;
}

function updateScore() {
  score++;
  document.getElementById("scoreValue").textContent = score;
}

function showFeedback(type) {
  feedback.className = "";

  if (type === "PERFECT") {
    feedback.textContent = combo > 1 ? `COMBO x${combo}` : "PERFECT";
    feedback.classList.add(combo > 1 ? "feedback-combo" : "feedback-perfect");
  }

  if (type === "GOOD") {
    feedback.textContent = "GOOD";
    feedback.classList.add("feedback-good");
  }

  if (type === "BAD") {
    feedback.textContent = "BAD";
    feedback.classList.add("feedback-bad");
  }

  feedback.style.transform = "scale(1.3)";
  setTimeout(() => (feedback.style.transform = "scale(1)"), 150);
}

function endGame() {
  gameOver = true;
  document.getElementById("gameOver").classList.remove("hidden");
  document.getElementById("finalScore").textContent = "Your Score: " + score;
}

function randomColor() {
  return new THREE.Color(`hsl(${Math.random() * 360}, 80%, 60%)`);
}

function restartGame() {
  stack.forEach(b => {
    scene.remove(b);
    b.geometry.dispose();
    b.material.dispose();
  });
  stack = [];

  if (movingBlock) {
    scene.remove(movingBlock);
    movingBlock.geometry.dispose();
    movingBlock.material.dispose();
    movingBlock = null;
  }

  score = 0;
  combo = 0;
  gameOver = false;
  blockWidth = 5;
  direction = 1;

  document.getElementById("scoreValue").textContent = 0;
  feedback.textContent = "";
  document.getElementById("gameOver").classList.add("hidden");

  camera.position.set(8, 12, 14);
  camera.lookAt(0, 0, 0);

  const base = createBlock(0, blockWidth);
  stack.push(base);

  movingBlock = null;
}

window.addEventListener("resize", onWindowResize);

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  
  renderer.setPixelRatio(window.devicePixelRatio);
}
