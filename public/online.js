async function goOnline() {
  const url = "/user-info";
  const response = await fetch(url);
  const user = await response.json();
  return {
    socket: io({
      query: { id: user.id, name: user.name, email: user.email, dob: user.dob },
    }),
    user: user,
  };
}
let onlineAgent = goOnline();
