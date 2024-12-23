let me;
function startChat() {
  document.addEventListener("DOMContentLoaded", async (event) => {
    const online = await onlineAgent;
    const socket = online.socket;
    me = online.user;
    socket.on("message", function (data) {
      if (data.type == "global") {
        handleMessage(data.message);
      }
    });
    document
      .getElementById("send-message")
      .addEventListener("click", (event) => {
        const message = document.getElementById("messageField").value;
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
      });
  });
}

function handleMessage(message) {
  const container = document.getElementsByClassName("message-container")[0];
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
