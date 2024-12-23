function showNotification(message) {}
function showStartRequest(owner, user) {
  window.location = "/game?user=" + owner.id;
  const confirm = document.getElementById("confirm-toast");
  confirm.userRequest = user;
  confirm.childNodes[0].nodeValue = "Yêu cầu bắt đầu game từ " + user.name;
  confirm.classList.add("show");
}
let match;
let socket;
let match_state;
function countDown() {
  const cd = document.getElementById("count-down");
  if (cd.interval) {
    clearInterval(cd.interval);
  }
  cd.current_time = match.max_time;
  cd.interval = setInterval(() => {
    cd.current_time--;
    if (cd.current_time == 0) {
      clearInterval(cd.interval);
      delete cd.interval;
    }
    cd.textContent = cd.current_time;
  }, 1000);
}
function handleCell(e) {
  if (match_state == "end") {
    return;
  }
  const board = document.getElementById("board");
  const cell = e.target;
  let index;
  for (let i = 0; i < board.children.length; i++) {
    if (board.children[i] === cell) {
      index = i;
      break;
    }
  }
  const i = index / 3;
  const j = index % 3;
  socket.emit("game", {
    type: "move",
    move: {
      i: i,
      j: j,
    },
  });
}
function init(_user, _match) {
  document.addEventListener("DOMContentLoaded", (event) => {
    const board = document.getElementById("board");
    match = _match;
    socket = io({ query: { user: _user } });
    if (_match.state == "waiting") {
      socket.on("game", function (data) {
        if (match.id == data.id) {
          showStartRequest(_user, data.user);
        }
      });
      const confirm = document.getElementById("confirm-toast");
      const confirmButton = document.getElementById("confirm-button");
      const confirmClose = document.getElementById("confirm-close");
      confirmButton.addEventListener("click", (e) => {
        const request = confirm.userRequest;
        window.location.href = "/start?user=" + request.id;
      });
      confirmButton.addEventListener("click", (e) => {
        confirm.classList.remove("show");
      });
      return;
    }
    socket.on("game", function (data) {
      if (match.id == data.id) {
        if (type == "move") {
          const i = data.i;
          const j = data.j;
          cell_states[i][j] = data.value;
          const index = i * 3 + j;
          board.children[index].textContent = data.value;
        } else if (type == "end") {
          match_state = "end";
          document.getElementById("count-down").style.display = "none";
          const winner = data.winner;
          if (!winner) {
            showNotification("Game draw");
          } else {
            if (winner == _user.id) {
              showNotification("The winner is" + winner);
            } else {
              showNotification("You lost");
            }
          }
        }
      }
    });

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
    board.addEventListener("click", (e) => handleCell(e));
  });
}
