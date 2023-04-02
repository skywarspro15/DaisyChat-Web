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

function linkify(inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}

function encodeHTML(html) {
  let encodedStr = html.replace(/[\u00A0-\u9999<>\&]/g, function(i) {
    return "&#" + i.charCodeAt(0) + ";";
  });

  return encodedStr;
}

function decodeHTML(html) {
  let txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
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
  sendBubble.innerHTML = linkify(decodeHTML(inputText));
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
      "You're now in a conversation with a user. Greet them and introduce the site.",
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
    respBubble.innerHTML = linkify(decodeHTML(fullData));
    messages.appendChild(respBubble);
    bubbleCreated = true;
  } else {
    respBubble.innerText = decodeHTML(fullData);
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
