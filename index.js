require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");

const port = 8000;
const db = require("./utils/db.connection");
db.connectDB();

// Middlewares
const corsOptions = {
  origin: ["http://localhost:5173", "https://notes-lelo-web-app.vercel.app"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Create HTTP server (required for Socket.IO)
const server = http.createServer(app);

// Import and Initialize Socket.IO logic from separate file
const socketLogic = require("./socket/socket");
socketLogic.init(server); // Assuming your socket file exports an `init` function for initialization

// Routes
const user = require("./router/user.rout");
const group = require("./router/groups.rout");
const notes = require("./router/notes.rout");
const demand = require("./router/demand.rout");
const notification = require("./router/notificcation.route");

app.use("/api/v1/user", user);
app.use("/api/v1/group", group);
app.use("/api/v1/notes", notes);
app.use("/api/v1/demand", demand);
app.use("/api/v1/notification", notification);

server.listen(port, () =>
  console.log(`NotesaLelo app listening on port ${port}!`)
);
