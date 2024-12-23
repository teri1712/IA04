let match;
let socket;

function handleCell(e) {
  if (match.state == "end") {
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
  if (!index) return;
  const i = Math.floor(index / 3);
  const j = index % 3;

  if (match.cells[i][j] != "") {
    return;
  }
  socket.emit("game", {
    type: "move",
    move: {
      player_id: match.player.id,
      match_id: match.id,
      i: i,
      j: j,
    },
  });
}
function updateCells() {
  const board = document.getElementById("board");
  for (let i = 0; i < board.children.length; i++) {
    board.children[i].style.cursor =
      match.cells[i / 3][i % 3] == "" && match.current_move == match.player.id
        ? "none"
        : "pointer";

    board.children[i].textContent = match.cells[i / 3][i % 3] == 1 ? "X" : "O";
  }
}
function matchInit(_player, _match) {
  document.addEventListener("DOMContentLoaded", async (event) => {
    const board = document.getElementById("board");
    match = _match;
    match.player = _player;
    const online = await onlineAgent;
    socket = online.socket;
    console.log(new Date().getTime());
    console.log(match.move_time);
    console.log(match.max_time);
    countDown(
      match.current_move,
      Math.floor(
        parseInt(match.move_time) + match.max_time - new Date().getTime()
      )
    );
    socket.on("game", function (data) {
      if (match.id == data.id) {
        if (type == "move") {
          const i = data.i;
          const j = data.j;
          const value = data.value;
          match.cells[i][j] = value;
          match.current_move = data.current_move;

          updateCells();
          countDown(match.current_move, match.move_time);
        } else if (type == "end") {
          match.state = "end";
          console.log("helllo");

          const cd = document.getElementById("count-down");
          cd.style.display = "none";
          if (cd.interval) {
            clearInterval(cd.interval);
          }

          const winner = data.winner;

          if (!winner) {
            showResult("Game draw");
          } else {
            if (winner == _player.id) {
              showResult("You won!!!");
            } else {
              showResult("You lost!!!");
            }
          }
        }
      }
    });
    board.addEventListener("click", (e) => handleCell(e));
    initMessaging(socket, match);
  });
}
