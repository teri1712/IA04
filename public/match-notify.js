function showResult(message) {
  const cd = document.getElementById("match-result");
  cd.textContent = message;
}

function countDown(who, at_time) {
  const cd = document.getElementById("count-down");
  const turn = document.getElementById("turn-of");
  turn.textContent = "Turn of " + who;
  if (cd.interval) {
    clearInterval(cd.interval);
  }
  cd.current_time = Math.floor(
    (at_time ? parseInt(at_time) : parseInt(match.max_time)) / 1000
  );
  cd.textContent = Math.max(0, cd.current_time);
  cd.style.visibility = "visible";

  cd.interval = setInterval(() => {
    cd.current_time--;
    if (cd.current_time <= 0) {
      clearInterval(cd.interval);
      delete cd.interval;
      return;
    }
    cd.textContent = cd.current_time;
  }, 1000);
}
