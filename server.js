const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());

const http = require("http").Server(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


const MONGODB_URI = process.env.MONGODB_URI;
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName:'user_database'
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

const messageSchema = new mongoose.Schema({
  group_id: String,
  user_email: String,
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("joinGroup", (data) => {
    const groupId = data.groupId;
    const userEmail = data.userEmail;
    socket.join(groupId);
    io.to(groupId).emit("userJoined", { userEmail: userEmail });
  });

  socket.on("message", (data) => {
    const groupId = data.groupId;
    const userEmail = data.userEmail;
    const username = data.username;
    const messageText = data.message;

    const messageData = new Message({
      group_id: groupId,
      user_email: userEmail,
      username: username,
      message: messageText,
    });

    messageData
      .save()
      .then(() => {
        io.to(groupId).emit("newMessage", {
          userEmail: userEmail,
          username: username,
          message: messageText,
        });
      })
      .catch((err) => {
        console.error("Error saving message:", err);
      });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const PORT = process.env.PORT || 5001;

http.listen(PORT, () => { 
    const address = http.address();
    console.log(`App listening on ${address.address}:${address.port}`);
});