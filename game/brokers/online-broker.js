const online_users = new Map();
const online_broker = {
  onOnline: (user, socket) => {
    user.socket = socket;
    online_users.set(user.id, user);
  },
  onOffline: (user) => {
    online_users.delete(user.id);
  },
  getAllUser: () => {
    return Array.from(online_users.values()).map((value) => value.user);
  },

  getUser: (id) => {
    const user = online_users.get(id);
    return user ? user.socket : undefined;
  },
};

export default online_broker;
