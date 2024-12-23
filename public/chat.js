function sendMessage(message, from) {
  if (message.length == 0) {
    return;
  }

  const container = document.getElementsByClassName("message-container")[0];

  const rightMessage = document.createElement("div");
  rightMessage.className = "right-message m-2";

  const rightMessageHeader = document.createElement("h4");
  rightMessageHeader.textContent = from;
  rightMessage.appendChild(rightMessageHeader);

  const rightMessageParagraph = document.createElement("p");
  rightMessageParagraph.className = "bg-white border rounded p-3";
  rightMessageParagraph.textContent = message;
  rightMessage.appendChild(rightMessageParagraph);

  container.appendChild(rightMessage);
  fetch("/message", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: message,
  })
    .then((response) => {
      if (!response.ok()) {
        window.alert("Can't send message");
      }
    })
    .catch((error) => {
      window.alert("Network error" + error);
    });
}
function startChat() {
  me = user;
  current_time = time;
  document.addEventListener("DOMContentLoaded", async (event) => {
    const online = await onlineAgent;
    const socket = online.socket;
    socket.on("message", function (data) {
      if (data.type == "global") {
        handleMessage(data.message);
      }
    });
    document
      .getElementById("send-message")
      .addEventListener("click", (event) => {
        const message = document.getElementById("messageField").value;
        sendMessage(message, user.name);
      });
  });
}

function handleMessage(message) {
  const container = document.getElementsByClassName("message-container")[0];
  if (message.from.id == me) {
    return;
  }

  const leftMessage = document.createElement("div");
  leftMessage.className = "left-message m-2";

  const leftMessageHeader = document.createElement("h4");
  leftMessageHeader.textContent = message.from.name;
  leftMessage.appendChild(leftMessageHeader);

  const leftMessageParagraph = document.createElement("p");
  leftMessageParagraph.className = "bg-white border rounded p-3";
  leftMessageParagraph.textContent = message.content;
  leftMessage.appendChild(leftMessageParagraph);

  container.appendChild(leftMessage);
}

startChat();
