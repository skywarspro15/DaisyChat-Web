import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

const loadStatus = document.getElementById("loadStatus");
const loadScreen = document.getElementById("loadScreen");
const charResponse = document.getElementById("charResponse");
const sendButton = document.getElementById("sendButton");
let messageHistory = [];
let fullData = "";
let typingEnabled = false;

function encodeHTML(html) {
  let encodedStr = html.replace(/[\u00A0-\u9999<>\&]/g, function (i) {
    return "&#" + i.charCodeAt(0) + ";";
  });

  return encodedStr;
}

function decodeHTML(html) {
  let txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

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
    "content": "*Someone joins in the conversation*",
  });
  socket.emit("begin", {
    "prompt": "*Someone joins in the conversation*",
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
  charResponse.innerText = decodeHTML(fullData);
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
