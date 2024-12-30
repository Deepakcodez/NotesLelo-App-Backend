const { Server } = require("socket.io");
const { Chat } = require("../model/chat.model");

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
      // console.log("a user connected", socket.id);

      socket.on("join:room", ({ userEmail, roomId }) => {
        emailToSocketMap.set(userEmail, socket.id);
        socketToEmailMap.set(socket.id, userEmail);
        socket.join(roomId);
        socket.emit("joined:room", { roomId, userEmail });
        socket.broadcast
          .to(roomId)
          .emit("newUser:joined", { roomId, userEmail });
      });

      socket.on(
        "send:message",
        async ({ roomId, senderId, senderName, senderEmail, message, id }) => {
          console.log(`Message from ${senderId} in ${roomId}: ${message}`);

          try {
            if (message.trim() === "") return;
            const newChat = new Chat({
              message,
              from: senderId,
              to: roomId,
            });
            await newChat.save();
          } catch (error) {
            console.log("error in storing chat in db");
          } 

          io.to(roomId).emit("receive:message", {
            id,
            senderName,
            senderId,
            senderEmail,
            message,
          });
        }
      );
      socket.on("disconnect", () => {
        console.log("user disconnected");
      });

      // Add your custom Socket.IO event listeners and logic here
    });
  },
};
