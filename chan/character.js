import * as THREE from "https://unpkg.com/three@0.127.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.127.0/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js";
import { VRMLoaderPlugin, VRMUtils } from "./three-vrm.module.js";

// renderer
const loadStatus = document.getElementById("loadStatus");
const progressBar = document.getElementById("progressBar");
const canvas = document.getElementById("charCanvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize(window.innerWidth - 20, window.innerHeight - 20);

loadStatus.innerText = "Loading model...";

// camera
const camera = new THREE.PerspectiveCamera(
  30.0,
  window.innerWidth / window.innerHeight,
  0.1,
  20.0
);
camera.position.set(0.0, 1.0, 2);

// camera controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = true;
controls.target.set(0.0, 1.0, 0.0);
controls.update();

// scene
const scene = new THREE.Scene();

// light
const light = new THREE.DirectionalLight(0xffffff);
light.position.set(1.0, 1.0, 1.0).normalize();
scene.add(light);

// gltf and vrm
console.log("3d loader initialized");
let currentVrm = undefined;
let armL = -1;
let armR = 1;
const loader = new GLTFLoader();
loader.crossOrigin = "anonymous";

loader.register((parser) => {
  return new VRMLoaderPlugin(parser);
});


loader.load(
  // URL of the VRM you want to load
  "./models/Daisy.vrm",

  // called when the resource is loaded
  (gltf) => {
    const vrm = gltf.userData.vrm;

    // calling these functions greatly improves the performance
    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.removeUnnecessaryJoints(gltf.scene);

    // Disable frustum culling
    vrm.scene.traverse((obj) => {
      obj.frustumCulled = false;
    });

    currentVrm = vrm;
    console.log(vrm);
    scene.add(vrm.scene);
    currentVrm.humanoid.getNormalizedBoneNode("leftUpperArm").rotation.z = armL;
    currentVrm.humanoid.getNormalizedBoneNode("rightUpperArm").rotation.z =
      armR;
    currentVrm.humanoid.getNormalizedBoneNode("hips").position.set(0, 0.5, 0.0);
    let gptScript = document.createElement("script");
    gptScript.setAttribute("src", "ai.js");
    gptScript.setAttribute("type", "module");
    document.body.appendChild(gptScript);
    blink();
  },

  // called while loading is progressing
  (progress) => {
    let curProgress = 100.0 * (progress.loaded / progress.total);
    console.log("Loading model...", curProgress, "%");
    progressBar.setAttribute("value", curProgress);
  },

  // called when loading has errors
  (error) => console.error(error)
);

// animate
const clock = new THREE.Clock();
clock.start();

// set the minimum and maximum time between blinks in milliseconds
const minTimeBetweenBlinks = 3000;

const maxTimeBetweenBlinks = 5000;

function blink() {
  // trigger the blink animation on the character
  // this will depend on how you have implemented the character and the blink animation
  console.log("blinked");

  currentVrm.expressionManager.setValue("blinkLeft", 1);
  currentVrm.expressionManager.setValue("blinkRight", 1);
  setTimeout(() => {
    currentVrm.expressionManager.setValue("blinkLeft", 0);
    currentVrm.expressionManager.setValue("blinkRight", 0);
  }, 200);

  currentVrm.update(clock.getDelta());
  // schedule the next blink at a random time in the future
  setTimeout(() => {
    const timeUntilNextBlink =
      Math.random() * (maxTimeBetweenBlinks - minTimeBetweenBlinks) +
      minTimeBetweenBlinks;
    setTimeout(blink, timeUntilNextBlink);
  }, 300);
}

function animate() {
  requestAnimationFrame(animate);

  // update vrm components
  if (currentVrm) {
    const s = Math.sin(Math.PI * clock.elapsedTime);

    currentVrm.humanoid.getNormalizedBoneNode("leftUpperArm").rotation.z = armL;
    currentVrm.humanoid.getNormalizedBoneNode("rightUpperArm").rotation.z =
      armR;
    currentVrm.humanoid
      .getNormalizedBoneNode("hips")
      .position.set(0, 0.02 - 0.02 * s + 0.4, 0.0);
    currentVrm.update(clock.getDelta());
  }

  // render
  renderer.render(scene, camera);
}

animate();
