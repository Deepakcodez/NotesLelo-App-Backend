const mongoose = require("mongoose");
const { model, Schema } = mongoose;

const postSchema = new Schema(
  {
    caption: {
      type: String,
      minlength: 1,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    pdf: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    saved: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        Comment: {
          type: String,
          required: true,
        },
      },
    ],
    access: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);
module.exports = { Post };
