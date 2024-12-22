const online_users = new Map();
const online_broker = {
  onOnline: (user) => {
    if (!online_users.has(user.id)) {
      online_users.set(user.id, {
        user: user,
        last_online: new Date().getTime(),
      });
    } else {
      online_users.get(user.id).last_online = new Date().getTime();
    }
  },
  onListening: (user, connection) => {
    if (!online_users.has(user.id)) {
      online_users.set(user.id, {
        user: user,
        connection: connection,
        last_online: new Date().getTime(),
      });
    } else {
      const old = online_users.get(user.id);
      if (old.connection) {
        old.connection.status(200).json({
          type: "timeout",
        });
      }
      old.connection = connection;
      old.last_online = new Date().getTime();
    }
  },
  onTimeout: (user, connection) => {
    const old = online_users.get(user.id);
    if (old && old.connection && connection === old.connection) {
      old.connection.status(200).json({
        type: "timeout",
      });
      delete old.connection;
    }
  },
  getAllUser: () => {
    return Array.from(online_users.values()).map((value) => value.user);
  },
  notifyMessage: (message) => {
    for (let user of online_users.values()) {
      if (user.connection) {
        user.connection.status(200).json({
          type: "message",
          messages: [message],
        });
        delete user.connection;
      }
    }
  },
};

setInterval(() => {
  const current_time = new Date().getTime();
  const delete_set = [];
  for (let [key, value] of online_users) {
    if (current_time - value.last_online > 5000) {
      delete_set.push(key);
    }
  }
  for (let id of delete_set) {
    online_users.delete(id);
  }
}, 5000);
export default online_broker;
