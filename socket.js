import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

var button = document.getElementById("sendButton");
var messages = document.getElementById("messages");
var fullData = "";
var bubbleCreated = false;
var typingEnabled = false;
var respBubble;
var messageHistory = [];
var socket;
var uInput = document.getElementById("uInput");
var objDiv = document.getElementById("messages");

function encodeHTML(html) {
  let encodedStr = html.replace(/[\u00A0-\u9999<>\&]/g, function(i) {
    return "&#" + i.charCodeAt(0) + ";";
  });

  return encodedStr;
}

function sendMessage() {
  let inputText = uInput.value;
  inputText = encodeHTML(inputText);

  if (inputText.trim() == "" || typingEnabled == false) {
    return;
  }

  uInput.value = "";

  let sendBubble = document.createElement("div");
  sendBubble.className = "message user";
  sendBubble.innerText = inputText;
  messages.appendChild(sendBubble);

  objDiv.scrollTop = objDiv.scrollHeight;
  let status = document.createElement("div");
  status.className = "status";
  status.innerHTML = "🤔 Reading the page...";
  messages.appendChild(status);
  objDiv.scrollTop = objDiv.scrollHeight;
  socket.emit("ground", {
    "site": document.referrer,
    "prompt": inputText,
  });
}

button.addEventListener("click", sendMessage);
uInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});
socket = io("wss://DaisyGPT-Realtime.tranch-research.repl.co");

socket.on("connect", () => {
  let status = document.createElement("div");
  status.className = "status";
  status.innerHTML = "🤔 Reading the page...";
  messages.appendChild(status);
  socket.emit("ground", {
    "site": document.referrer,
    "prompt":
      "You're now in a conversation with a user. Greet them and introduce yourself.",
  });
});

socket.on("groundingPrompt", (prompt) => {
  let status = document.createElement("div");
  status.className = "status";
  status.innerHTML = "✅ Generating a response...";
  messages.appendChild(status);
  objDiv.scrollTop = objDiv.scrollHeight;
  messageHistory.push({
    "role": "user",
    "content": prompt,
  });
  socket.emit("begin", {
    "site": document.referrer,
    "prompt": prompt,
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
  console.log(data);
  fullData = fullData + data["data"];
  fullData = encodeHTML(fullData);
  if (!bubbleCreated) {
    respBubble = document.createElement("div");
    respBubble.className = "message gpt";
    respBubble.innerText = fullData;
    messages.appendChild(respBubble);
    bubbleCreated = true;
  } else {
    respBubble.innerText = fullData;
    objDiv.scrollTop = objDiv.scrollHeight;
  }
});

socket.on("done", () => {
  typingEnabled = true;
  bubbleCreated = false;
  messageHistory.push({
    "role": "assistant",
    "type": "custom",
    "content": fullData,
  });
  fullData = "";
  objDiv.scrollTop = objDiv.scrollHeight;
});
