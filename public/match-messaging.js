function initMessaging(socket, match) {
  socket.on("message", function (data) {
    if (data.type == "match" && data.match_id == match.id) {
      const messageContiner = document.getElementById("message-container");
      const name = document.createElement("strong");
      name.textContent = data.message.user_name;
      const message = document.createElement("p");
      message.textContent = data.message.content;

      messageContiner.append(name);
      messageContiner.append(message);
    }
  });
}
