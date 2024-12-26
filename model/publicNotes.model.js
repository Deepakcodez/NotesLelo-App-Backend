const mongoose = require("mongoose");
const { model, Schema } = mongoose;

const publicPostSchema = new Schema(
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
      public_id: String,
      url: String,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const PublicPost = mongoose.model("PublicPost", publicPostSchema);
module.exports = { PublicPost };
