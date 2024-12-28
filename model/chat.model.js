const mongoose = require("mongoose");
const chatSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
  },

  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);
module.exports = { Chat };
