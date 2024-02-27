require("dotenv").config();
const express = require("express");
const app = express();
const socket = require("socket.io")
const cors = require("cors");
const cookieParser = require("cookie-parser");


const port = 8000; 
const db = require("./utils/db.connection");
db.connectDB();

// Middlewares
const corsOptions = {
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// Routes
const user = require("./router/user.rout");
const group = require("./router/groups.rout");
const notes = require("./router/notes.rout");
const demand = require("./router/demand.rout");
const notification = require('./router/notificcation.route')

app.use("/api/v1/user", user);
app.use("/api/v1/group", group);
app.use("/api/v1/notes", notes);
app.use("/api/v1/demand", demand);
app.use("/api/v1/notification", notification);


const server = app.listen(port, () =>
  console.log(`NotesaLelo app listening on port ${port}!`)
);

