import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

const loadStatus = document.getElementById("loadStatus");
const loadScreen = document.getElementById("loadScreen");
const charResponse = document.getElementById("charResponse");
const sendButton = document.getElementById("sendButton");
const enableSpeech = document.getElementById("toggleSpeech");
const aboutButton = document.getElementById("aboutButton");
const speech = document.getElementById("speech");
const uInput = document.getElementById("uInput");
let messageHistory = [];
let fullData = "";
let typingEnabled = false;

console.log("Replay script initialized");
loadStatus.innerText = "Fetching replay...";
const socket = io("https://daisy-character.tranch-research.repl.co");

socket.on("connect", () => {
  console.log("Connected to server");
  loadStatus.innerText = "Click anywhere to continue";
  document.addEventListener(
    "click",
    () => {
      loadScreen.style.opacity = 0;
      loadScreen.style.zIndex = -100;
      const params = new URLSearchParams(window.location.search);
      if (params.has("r")) {
        socket.emit("replay", params.get("r"));
      }
    },
    { once: true }
  );
});

socket.on("replayData", (data) => {
  let frame = 0;
  let arrIndex = 0;
  let first = true;
  let shown = true;
  let replayTick = null;
  console.log("Replay loaded");
  console.log("Replay duration: " + data["duration"]);
  replayTick = setInterval(() => {
    if (frame >= data["duration"]) {
      alert("Conversation ended");
      clearInterval(replayTick);
    }
    if (first) {
      frame = data["actions"][arrIndex]["frame"];
      first = false;
    }
    if (frame == data["actions"][arrIndex]["frame"]) {
      if (data["actions"][arrIndex]["type"] == "begin") {
        uInput.value = "";
        shown = true;
      }
      if (data["actions"][arrIndex]["type"] == "recv") {
        if (shown) {
          charResponse.innerText = "";
          shown = false;
        }
        charResponse.innerText =
          charResponse.innerText + data["actions"][arrIndex]["content"]["data"];
      }
      if (data["actions"][arrIndex]["type"] == "type") {
        uInput.value = data["actions"][arrIndex]["content"];
      }
      console.log(data["actions"][arrIndex]["type"]);
      arrIndex += 1;
    } else {
      frame += 1;
    }
  }, 16);
});

socket.on("error", (err) => {
  alert(err);
});
