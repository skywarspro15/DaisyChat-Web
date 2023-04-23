import * as THREE from "https://unpkg.com/three@0.127.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.127.0/examples/jsm/loaders/GLTFLoader";
import { VRMLoaderPlugin, VRMUtils } from "./three-vrm.module.js";

// renderer
const loadStatus = document.getElementById("loadStatus");
const progressBar = document.getElementById("progressBar");
const canvas = document.getElementById("charCanvas");
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.shadowMap.enabled = true;
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

// scene
const scene = new THREE.Scene();
// light
async function getLightColor() {
  let night = 0x4a72f5;
  let rise = 0xc38631;
  let set = 0xb26b0f;
  let day = 0x9eaee2;
  let lat = 34.6937569;
  let lng = 135.5014539;

  // Get sunrise and sunset times from API
  let response = await fetch(
    `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&formatted=0`
  );
  let data = await response.json();
  let sunrise = new Date(data.results.sunrise);
  let sunset = new Date(data.results.sunset);

  // Calculate current time and color
  let now = new Date();
  let color;
  if (now < sunrise || now > sunset) {
    console.log("night");
    color = night;
  } else if (now < sunset) {
    if (now < sunrise.getTime() + (sunset.getTime() - sunrise.getTime()) / 2) {
      console.log("sunrise");
      color = rise;
    } else {
      console.log("day");
      color = day;
    }
  } else {
    console.log("sunset");
    color = set;
  }

  return color;
}
let color = await getLightColor();
const light = new THREE.DirectionalLight(color);
light.position.set(1.0, 1.0, 1.0).normalize();
light.castShadow = true;
scene.add(light);

// gltf and vrm
console.log("Character initializing");
let currentVrm = undefined;
let currentMixer = undefined;
let armL = -1;
let armR = 1;
let prevProg = 0;
let totalProg = 0;
let curProgress = 0;
const loader = new GLTFLoader();
const roomLoader = new GLTFLoader();
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
    roomLoader.load(
      // resource URL
      "models/room.glb",
      // called when the resource is loaded
      (gltf) => {
        scene.add(gltf.scene);
        gltf.scene.position.x = 0.6;
        gltf.scene.position.y = 0.2;
        const params = new URLSearchParams(window.location.search);
        let extScript = document.createElement("script");
        if (!params.has("r")) {
          extScript.setAttribute("src", "ai.js");
          extScript.setAttribute("type", "module");
        } else {
          extScript.setAttribute("src", "replay.js");
          extScript.setAttribute("type", "module");
        }
        document.body.appendChild(extScript);
        blink(currentVrm);
      },
      // called while loading is progressing
      (xhr) => {
        prevProg = totalProg;
        totalProg = prevProg + (xhr.loaded / xhr.total) * 100;
        anime({
          targets: "#progressBar",
          value: [prevProg, totalProg],
          easing: "easeInOutCubic",
        });
        prevProg = totalProg;
      },
      // called when loading has errors
      (error) => {
        console.error(error);
        loadStatus.innerText = error;
      }
    );
  },

  // called while loading is progressing
  (progress) => {
    totalProg = 100.0 * (progress.loaded / progress.total);
    console.log("Loading model...", curProgress, "%");
    anime({
      targets: "#progressBar",
      value: [prevProg, totalProg],
      easing: "easeInOutCubic",
    });
    prevProg = totalProg;
  },

  // called when loading has errors
  (error) => {
    console.error(error);
    loadStatus.innerText = error;
  }
);

// animate
const clock = new THREE.Clock();
clock.start();

// set the minimum and maximum time between blinks in milliseconds
const minTimeBetweenBlinks = 3000;
const maxTimeBetweenBlinks = 5000;

function blink(vrm) {
  // trigger the blink animation on the character
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
