function showStartRequest(user) {
  const confirm = document.getElementById("confirm-toast");
  confirm.userRequest = user;
  confirm.childNodes[0].nodeValue = "Yêu cầu bắt đầu game từ " + user.name;
  confirm.classList.add("show");
}
let match;
let socket;
function initMatch(_match) {
  document.addEventListener("DOMContentLoaded", async (event) => {
    match = _match;
    const online = await onlineAgent;
    socket = online.socket;
    socket.on("game", function (data) {
      if (match.id == data.id && data.type == "start") {
        showStartRequest(data.user);
      }
    });
    const confirm = document.getElementById("confirm-toast");
    const confirmButton = document.getElementById("confirm-button");
    const confirmClose = document.getElementById("confirm-close");
    confirmClose.addEventListener("click", (e) => {
      fetch("/match/decline", {
        method: "POST",
      })
        .then((response) => {})
        .catch((error) => {
          console.error(error);
        });
      confirm.classList.remove("show");
    });
  });
}
