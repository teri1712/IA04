let match;
let socket;

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
function matchInit(_viewer, _match) {
  document.addEventListener("DOMContentLoaded", (event) => {
    const board = document.getElementById("board");
    match = _match;
    match.player = _viewer;
    socket = io({ query: { user: _viewer } });

    countDown(Math.floor(new Date().getTime() - match.move_time));
    socket.on("game", function (data) {
      if (match.id == data.id) {
        if (type == "move") {
          const i = data.i;
          const j = data.j;
          const value = data.value;

          match.cells[i][j] = value;
          match.current_move = data.current_move;

          updateCells();
          countDown();
        } else if (type == "end") {
          match.state = "end";

          const cd = document.getElementById("count-down");
          cd.style.display = "none";
          if (cd.interval) {
            clearInterval(cd.interval);
          }

          const winner = data.winner;

          if (!winner) {
            showResult("Game draw");
          } else {
            if (winner) {
              showResult("You won!!!");
            } else {
              showResult("You lost!!!");
            }
          }
        }
      }
    });
    initMessaging(socket, match);
  });
}
