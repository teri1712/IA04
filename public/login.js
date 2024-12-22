function performOauth(auth_uri) {
  const authWindow = window.open(
    auth_uri,
    "OAuth2 Login",
    "width=500,height=500"
  );
  window.addEventListener(
    "message",
    function (event) {
      if (event.origin === window.location.origin) {
        if (event.data == "oauth2 accepted") {
          window.location.href = "/";
          authWindow.close();
        }
      }
    },
    false
  );
}
