const { Server } = require("socket.io");

module.exports = {
  init(server) {
    const io = new Server(server, {
      cors: {
        origin: [
          "http://localhost:5173",
          "https://notes-lelo-web-app.vercel.app",
        ],
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    const emailToSocketMap = new Map();
    const socketToEmailMap = new Map();

    io.on("connection", (socket) => {
      console.log("a user connected", socket.id);

      socket.on("join:room", ({ userEmail, roomId }) => {
        console.log(">>>>>>>>>>>user join in : ", roomId, userEmail);
        emailToSocketMap.set(userEmail, socket.id);
        socketToEmailMap.set(socket.id, userEmail);
        socket.join(roomId);
        socket.emit("joined:room", { roomId, userEmail });
        socket.broadcast
          .to(roomId)
          .emit("newUser:joined", { roomId, userEmail });
      });

      socket.on("send:message", ({ roomId, sender, message }) => {
        console.log(`Message from ${sender} in ${roomId}: ${message}`);
        socket.broadcast
          .to(roomId)
          .emit("receive:message", { sender, message });
      });

      socket.on("disconnect", () => {
        console.log("user disconnected");
      });

      // Add your custom Socket.IO event listeners and logic here
    });
  },
};
