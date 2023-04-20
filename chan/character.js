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
console.log("Character initializing");
let currentVrm = undefined;
let currentMixer = undefined;
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
    console.log("Character initialized");
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
    blink(currentVrm);
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

function blink(vrm) {
  // trigger the blink animation on the character
  // this will depend on how you have implemented the character and the blink animation
  console.log("blinked");

  if (!currentMixer) {
    currentMixer = new THREE.AnimationMixer(vrm.scene);
  }
  const quatA = new THREE.Quaternion(0.0, 0.0, 0.0, 1.0);
  const quatB = new THREE.Quaternion(0.0, 0.0, 0.0, 1.0);
  quatB.setFromEuler(new THREE.Euler(0.0, 0.0, 0.25 * Math.PI));

  const blinkTrack = new THREE.NumberKeyframeTrack(
    vrm.expressionManager.getExpressionTrackName("blink"), // name
    [0.0, 0.2, 0.5], // times
    [0.0, 1.0, 0.0] // values
  );

  const clip = new THREE.AnimationClip("Animation", 0.5, [blinkTrack]);
  const action = currentMixer.clipAction(clip);
  action.setLoop(THREE.LoopOnce);
  action.reset().play();

  // schedule the next blink at a random time in the future
  const timeUntilNextBlink =
    Math.random() * (maxTimeBetweenBlinks - minTimeBetweenBlinks) +
    minTimeBetweenBlinks;
  setTimeout(() => {
    blink(vrm);
  }, timeUntilNextBlink);
}

function waveAnim(vrm) {
  console.log("waving");
  if (!currentMixer) {
    currentMixer = new THREE.AnimationMixer(vrm.scene);
  }
  const quatA = new THREE.Quaternion(0.0, 0.0, 0.0, 1.0);
  const quatB = new THREE.Quaternion(0.0, 0.0, 0.0, 1.0);
  quatB.setFromEuler(new THREE.Euler(0.0, 0.0, 0.25 * Math.PI));

  // vrm.getNormalizedBoneNode("leftUppperArm")

  const armTrack = new THREE.QuaternionKeyframeTrack(
    vrm.humanoid.getNormalizedBoneNode("leftUpperArm").name + ".quaternion", // name
    [0.0, 0.2, 0.5], // times
    [...quatA.toArray(), ...quatB.toArray(), ...quatA.toArray()] // values
  );

  const clip = new THREE.AnimationClip("Animation", 0.5, [armTrack]);
  const action = currentMixer.clipAction(clip);
  action.play();
}

function animate() {
  requestAnimationFrame(animate);
  let deltaTime = clock.getDelta();

  // update vrm components
  if (currentVrm) {
    const s = Math.sin(Math.PI * clock.elapsedTime);

    currentVrm.humanoid
      .getNormalizedBoneNode("hips")
      .position.set(0, 0.02 - 0.02 * s + 0.4, 0.0);
    currentVrm.update(deltaTime);
  }

  if (currentMixer) {
    currentMixer.update(deltaTime);
  }

  // render
  renderer.render(scene, camera);
}

animate();
