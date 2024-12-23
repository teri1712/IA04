function showResult(message) {
  const cd = document.getElementById("match-result");
  cd.textContent = message;
}

function countDown(at_time) {
  const cd = document.getElementById("count-down");
  if (cd.interval) {
    clearInterval(cd.interval);
  }
  cd.current_time = at_time ? at_time : parseInt(match.max_time) / 1000;
  cd.textContent = cd.current_time;
  cd.style.visibility = "visible";

  cd.interval = setInterval(() => {
    cd.current_time--;
    if (cd.current_time == 0) {
      clearInterval(cd.interval);
      delete cd.interval;
      return;
    }
    cd.textContent = cd.current_time;
  }, 1000);
}
