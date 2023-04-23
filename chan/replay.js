import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

const loadStatus = document.getElementById("loadStatus");
const loadScreen = document.getElementById("loadScreen");
const charResponse = document.getElementById("charResponse");
const uInput = document.getElementById("uInput");
let frame = 0;
let arrIndex = 0;
let shown = true;

console.log("Replay script initialized");
loadStatus.innerText = "Fetching replay...";
const socket = io("https://daisy-character.tranch-research.repl.co");
const params = new URLSearchParams(window.location.search);

socket.on("connect", () => {
  console.log("Connected to server");
  loadStatus.innerText = "Click anywhere to continue";
  document.addEventListener(
    "click",
    () => {
      loadScreen.style.opacity = 0;
      loadScreen.style.zIndex = -100;
      if (params.has("r")) {
        socket.emit("ongoing", params.get("r"));
      }
    },
    { once: true }
  );
});

socket.on("ongoing", (data) => {
  if (data["id"] != params.get("r")) {
    return;
  }
  console.log("Currently live: " + data["ongoing"]);
  if (!data["ongoing"]) {
    if (params.has("r")) {
      socket.emit("replay", params.get("r"));
    }
  }
});

socket.on("replayData", (data) => {
  let first = true;
  let shown = true;
  let replayTick = null;
  let duration = parseInt(data["duration"]);
  let actionsLength = data["actions"].length;
  console.log("Replay loaded");
  console.log("Replay duration: " + duration);
  console.log("Action count: " + actionsLength);
  replayTick = setInterval(() => {
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
      if (data["actions"][arrIndex]["type"] == "end") {
        alert("Conversation ended");
        clearInterval(replayTick);
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

socket.on("update", (data) => {
  console.log("Recieved update");
  if (data["id"] != params.get("r")) {
    return;
  }
  if (data["type"] == "begin") {
    uInput.value = "";
    shown = true;
  }
  if (data["type"] == "recv") {
    if (shown) {
      charResponse.innerText = "";
      shown = false;
    }
    charResponse.innerText = charResponse.innerText + data["content"]["data"];
  }
  if (data["type"] == "type") {
    uInput.value = data["content"];
  }
  if (data["type"] == "end") {
    alert(
      "Conversation ended. Thanks for tuning in! Refresh this page to watch the replay."
    );
  }
});
