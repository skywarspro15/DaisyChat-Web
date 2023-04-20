import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

const loadStatus = document.getElementById("loadStatus");
const loadScreen = document.getElementById("loadScreen");
const charResponse = document.getElementById("charResponse");
const sendButton = document.getElementById("sendButton");
let messageHistory = [];
let fullData = "";
let typingEnabled = false;

console.log("GPT script initialized");
loadStatus.innerText = "Connecting...";
const socket = io("https://daisy-character.tranch-research.repl.co");

function sendMessage() {
  if (!typingEnabled) {
    return;
  }
  typingEnabled = false;
  let uInput = document.getElementById("uInput");
  messageHistory.push({
    "role": "user",
    "content": uInput.value,
  });
  socket.emit("begin", {
    "prompt": uInput.value,
    "context": messageHistory,
  });
  uInput.value = "";
}

sendButton.addEventListener("click", () => {
  sendMessage();
});

socket.on("connect", () => {
  console.log("connected to server");
  loadScreen.style.opacity = 0;
  loadScreen.style.zIndex = -100;
  messageHistory.push({
    "role": "user",
    "content": "*Someone joined in the conversation. Greet them!*",
  });
  socket.emit("begin", {
    "prompt": "*Someone joined in the conversation. Greet them!*",
    "context": messageHistory,
  });
});

socket.on("state", (state) => {
  console.log(state);
});

socket.on("error", (err) => {
  console.error(err);
});

socket.on("recv", (data) => {
  fullData = fullData + data["data"];
  charResponse.innerText = fullData;
});

socket.on("done", () => {
  typingEnabled = true;
  messageHistory.push({
    "role": "assistant",
    "type": "custom",
    "content": fullData,
  });
  fullData = "";
});

socket.on("disconnect", () => {
  alert("Connection closed");
  window.location.reload();
});
