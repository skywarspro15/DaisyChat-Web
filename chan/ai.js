import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";

const loadStatus = document.getElementById("loadStatus");
const loadScreen = document.getElementById("loadScreen");
const charResponse = document.getElementById("charResponse");
const sendButton = document.getElementById("sendButton");
const enableSpeech = document.getElementById("toggleSpeech");
const aboutButton = document.getElementById("aboutButton");
const speech = document.getElementById("speech");
let messageHistory = [];
let fullData = "";
let typingEnabled = false;

console.log("Intelligence script initialized");
loadStatus.innerText = "Connecting...";
const socket = io("https://daisy-character.tranch-research.repl.co");

async function apiAuthCheck() {
  let key = localStorage.getItem("xi_key");

  const url = "https://api.elevenlabs.io/v1/user";

  const headers = {
    "Accept": "application/json",
    "xi-api-key": key,
  };

  try {
    const response = await fetch(url, { headers });
    if (response.status === 200) {
      console.log("API key authorized");
    } else {
      console.error("API key unauthorized");
      alert("Unable to enable TTS. Please try again with an another API key.");
      localStorage.setItem("ttsEnabled", "false");
      enableSpeech.innerText = "Enable speech";
    }
  } catch (error) {
    alert("Unable to reach TTS.\n" + error);
  }
}

async function enableTTS() {
  if (localStorage.getItem("ttsEnabled") == "true") {
    localStorage.setItem("ttsEnabled", "false");
    enableSpeech.innerText = "Enable speech";
    alert("TTS disabled");
    return;
  }
  let key = prompt(
    "Due to financial limitations, we're unable to provide our users access to TTS out of the box. Please sign up for an ElevenLabs account and enter in your API key by clicking in your profile image, then Profile."
  );

  const url = "https://api.elevenlabs.io/v1/user";

  const headers = {
    "Accept": "application/json",
    "xi-api-key": key,
  };

  try {
    const response = await fetch(url, { headers });
    if (response.status === 200) {
      localStorage.setItem("xi_key", key);
      localStorage.setItem("ttsEnabled", "true");
      enableSpeech.innerText = "Disable speech";
      alert("Successfully enabled TTS.");
    } else {
      alert("Unable to enable TTS. Please try again with an another API key.");
    }
  } catch (error) {
    alert("Unable to enable TTS.\n" + error);
  }
}

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

enableSpeech.addEventListener("click", () => {
  enableTTS();
});

aboutButton.addEventListener("click", () => {
  window.location.href = "/about.html";
});

if (localStorage.getItem("ttsEnabled") == "true") {
  enableSpeech.innerText = "Disable speech";
  apiAuthCheck();
} else {
  enableSpeech.innerText = "Enable speech";
}

socket.on("connect", () => {
  console.log("connected to server");
  loadStatus.innerText = "Click anywhere to continue";
  document.addEventListener(
    "click",
    () => {
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
    },
    { once: true }
  );
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
  if (localStorage.getItem("ttsEnabled") == "true") {
    socket.emit("say", {
      "message": fullData,
      "api_key": localStorage.getItem("xi_key"),
    });
  }
  fullData = "";
});

socket.on("speech", (soundBuffer) => {
  const blob = new Blob([soundBuffer], { type: "audio/mp3" });
  speech.src = window.URL.createObjectURL(blob);
  speech.play();
});

socket.on("disconnect", () => {
  alert("Connection closed");
  window.location.reload();
});

setInterval(async () => {
  if (localStorage.getItem("ttsEnabled") == "true") {
    await apiAuthCheck();
  }
}, 2000);
