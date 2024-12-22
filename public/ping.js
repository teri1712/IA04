const interval = setInterval(() => {
  fetch(`/ping`, {
    method: "POST",
  })
    .then((response) => {
      if (response.status() == 401) {
        window.alert("Un-authorized");
        console.log("vcc");
        clearInterval(interval);
        return;
      }
    })
    .catch((error) => {
      console.log("vcc");
      clearInterval(interval);
      console.error(error);
    });
}, 3000);
