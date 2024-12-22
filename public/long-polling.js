function sendMessage() {
  const message = document.getElementById("messageField").value;
  if (message.length == 0) {
    return;
  }

  const container = document.getElementsByClassName("message-container")[0];

  const rightMessage = document.createElement("div");
  rightMessage.className = "right-message m-2";

  const rightMessageHeader = document.createElement("h4");
  rightMessageHeader.textContent = window.userName;
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
let myId;
let current_time = -1;
function poll() {
  const next_time = new Date().getTime();
  const queryParams = new URLSearchParams({
    from: current_time,
    to: next_time,
  });
  current_time = next_time;
  fetch(`/message?` + queryParams.toString(), {
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      const type = data.type;
      if (type == "message") {
        for (let message of data.messages) {
          handleMessage(message);
        }
      }
      poll();
    })
    .catch((error) => {
      console.error(error);
    });
}
function startPolling(me, time) {
  myId = me;
  current_time = time;
  document.addEventListener("DOMContentLoaded", (event) => {
    poll();
  });
}

function handleMessage(message) {
  const container = document.getElementsByClassName("message-container")[0];
  if (message.from.id == myId) {
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
