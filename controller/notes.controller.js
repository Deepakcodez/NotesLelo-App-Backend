const { Schema } = require("mongoose");
const notesDb = require("../model/notes.model");
const notesModel = notesDb.Post;
const groupdb = require("../model/groups.model");
const groupModel = groupdb.Group;
const userdb = require("../model/user.model");
const userModel = userdb.User;
const cloud = require("../utils/cloudinary");
const responseSender = require("../utils/responseSender");
const { PublicPost } = require("../model/publicNotes.model");

const uploadFile = async (req, res) => {
  const { caption, description, groupId } = req.body;
  const userId = req.userId;

  try {
    // Validate file and perform file upload to Cloudinary
    const result = await cloud.uploadOncloudinary(req.file.path);

    // Check if the upload was successful
    if (!result) {
      throw new Error("File upload to Cloudinary failed.");
    }

    // Create a new notes record with the Cloudinary URL
    const notesSchema = new notesModel({
      caption,
      description,
      to: groupId,
      owner: userId,
      pdf: {
        url: result.secure_url,
      },
    });

    // Save the record to the database
    const record = await notesSchema.save();
    // Update the Group document with the new notes _id
    await groupModel.findByIdAndUpdate(groupId, {
      $push: { notes: record._id },
    });
    await userModel.findByIdAndUpdate(userId, {
      $push: { posts: record._id },
    });
    // Return a success response
    res.status(200).json({
      success: true,
      status: 200,
      message: "File uploaded successfully!",
      url: record,
    });
  } catch (error) {
    // Handle errors and return an appropriate response
    res.status(400).json({
      success: false,
      status: 400,
      message: error.message,
    });
  }
};

const uploadPublicNotes = async (req, res) => {
  const { caption, description } = req.body;
  const userId = req.userId;

  try {
    // Validate file and perform file upload to Cloudinary
    const result = await cloud.uploadOncloudinary(req.file.path);

    // Check if the upload was successful
    if (!result) {
      throw new Error("File upload to Cloudinary failed.");
    }

    // Create a new notes record with the Cloudinary URL
    const notesSchema = new PublicPost({
      caption,
      description,
      owner: userId,
      pdf: {
        url: result.secure_url,
      },
    });

    // Save the record to the database
    const record = await notesSchema.save();
    // Update the Group document with the new notes _id
    await userModel.findByIdAndUpdate(userId, {
      $push: { posts: record._id },
    });

    // Return a success response
    res.status(200).json({
      success: true,
      status: 200,
      message: "File uploaded successfully!",
      url: record,
    });
  } catch (error) {
    // Handle errors and return an appropriate response
    res.status(400).json({
      success: false,
      status: 400,
      message: error.message,
    });
  }
};

const groupNotes = async (req, resp) => {
  const { groupId } = req.params;
  const userId = req.userId;

  if (!groupId) {
    resp.send(responseSender(false, 402, "group Id not provided", null));
    return;
  }

  try {
    const currentGroupNotes = await notesModel.find({ to: groupId });
    const notesWithUserData = await Promise.all(
      currentGroupNotes.map(async (notes) => {
        // const user = await userModel.findById(userId);
        console.log(">>>>>>>>>>>notes owner", notes.owner);
        const user = await userModel.findById(notes.owner);
        return {
          notes,
          user,
        };
      })
    );

    if (!currentGroupNotes.length) {
      return resp.send(responseSender(false, 402, "notes not available", null));
    }

    console.log(">>>>>>>>>>currentGroupNotes>", notesWithUserData);
    return resp.send(
      responseSender(
        true,
        200,
        "Notes retrieved successfully",
        notesWithUserData
      )
    );
  } catch (error) {
    return resp.send(responseSender(false, 500, "internal server error", null));
  }
};

const getPublicNotes = async (req, res) => {
  try {
    console.log(">>>>>>>>>>>getting public notes");
    const publicNotes = await PublicPost.find().populate("owner", "name email");
    console.log(">>>>>>>>>>>", publicNotes);
    // Check if any public notes exist
    if (!publicNotes.length) {
      return res.status(404).json({
        success: false,
        message: "No public notes available",
      });
    }

    // Return the public notes
    res.status(200).json({
      success: true,
      message: "Public notes retrieved successfully",
      notes: publicNotes,
    });
  } catch (error) {
    // Handle errors and return an appropriate response
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const addLikeOrDislike = async (req, resp) => {
  const { notesId } = req.params;
  const userId = req.userId;

  try {
    // Check if the notes exist
    const notes = await notesModel.findById(notesId);

    if (!notes) {
      return resp
        .status(404)
        .send(responseSender(false, 404, "Notes not found", null));
    }

    // Check if the user has already liked the notes
    const userLiked = notes.likes.some((id) => id.equals(userId));

    // Find the user by userId
    const user = await userModel.findById(notes.owner);
    console.log("notes owner user", user);

    if (userLiked) {
      // User has already liked, remove the like (dislike)

      notes.likes.pull(userId);

      // Remove the note from user's likesOnOwnNotes
      user.likesOnOwnNotes.pull(userId);
    } else {
      // User has not liked, add the like
      notes.likes.push(userId);
      // Add the note to user's likesOnOwnNotes
      user.likesOnOwnNotes.push(userId);
    }

    await notes.save();
    await user.save(); // Save the changes to the user

    // Fetch the updated notes with user data
    const updatedNotes = await notesModel.findById(notesId).populate({
      path: "owner",
      populate: { path: "likesOnOwnNotes" },
    });

    return resp
      .status(200)
      .send(
        responseSender(true, 200, "Operation successful", updatedNotes.likes)
      );
  } catch (error) {
    return resp
      .status(500)
      .send(responseSender(false, 500, "Internal server error", null));
  }
};

const saveNotes = async (req, resp) => {
  const { notesId } = req.params;
  const userId = req.userId;

  try {
    let notes;

    // Attempt to find the notes in both models
    try {
      notes = await notesModel.findById(notesId);
    } catch (error) {
      console.error("Error finding notes in notesModel:", error.message);
    }

    if (!notes) {
      try {
        notes = await PublicPost.findById(notesId);
      } catch (error) {
        console.error(
          "Error finding notes in PublicPost model:",
          error.message
        );
      }
    }

    if (!notes) {
      return resp
        .status(404)
        .send(
          responseSender(false, 404, "Notes not found in any schema", null)
        );
    }

    // Check if the user has already saved the notes
    const userSaved = notes.saved.some((id) => id.equals(userId));

    // Find the owner of the notes
    const user = await userModel.findById(notes.owner);
    if (!user) {
      return resp
        .status(404)
        .send(responseSender(false, 404, "Notes owner not found", null));
    }

    if (userSaved) {
      // If already saved, remove the save
      notes.saved.pull(userId);
      user.savedNotes.pull(notesId);
      user.ownNotesSaves.pull(userId);
    } else {
      // If not saved, add the save
      notes.saved.push(userId);
      user.savedNotes.push(notesId);
      user.ownNotesSaves.push(userId);
    }

    // Save changes to the notes and user
    await Promise.all([notes.save(), user.save()]);

    return resp
      .status(200)
      .send(
        responseSender(
          true,
          200,
          userSaved ? "Note unsaved successfully" : "Note saved successfully"
        )
      );
  } catch (error) {
    console.error("Error in saveNotes function:", error.message);
    return resp
      .status(500)
      .send(responseSender(false, 500, "Internal server error", null));
  }
};

const UserSavedNotes = async (req, resp) => {
  const savedNotesid = req.user.savedNotes;
  try {
    if (!savedNotesid) {
      resp.send(responseSender(true, 200, "not any saved notes", null));
    }

    const savedNotes = await notesModel.find({ _id: savedNotesid });
    resp.send(responseSender(true, 200, " user saved notes", savedNotes));
  } catch (error) {
    resp.send(responseSender(false, 500, "internal server error", null));
  }
};

const userNotes = async (req, resp) => {
  const userNotesArray = req.user.posts;
  console.log(">>>>>>>>>>>notesId", userNotesArray);

  if (!userNotesArray) {
    return resp.send(responseSender(false, 500, "Notes not found", null));
  }

  try {
    const notes = await notesModel.find({ _id: userNotesArray });

    if (!notes || notes.length === 0) {
      return resp.send(responseSender(false, 404, "Notes not found", null));
    }

    console.log(req.user); // Log user information
    return resp.send(
      responseSender(true, 200, "Shared notes fetched successfully", notes)
    );
  } catch (error) {
    console.error("Error fetching user notes:", error);
    return resp.send(responseSender(false, 500, "Internal server error", null));
  }
};

const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    console.log("post id: ", postId);
    // Find the post by ID and populate user details in the comments
    let post;
    try {
      try {
        post = await notesModel
          .findById(postId)
          .populate("comments.user", "name email");
      } catch (error) {
        console.log(">>>>>>>>>>>", error);
      }

      if (!post || post.length===0) {
        try {
          post = await PublicPost.findById(postId).populate(
            "comments.user",
            "name email"
          );
        } catch (error) {
          console.log(">>>>>>>>>>>", error);
        }
      }
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    }

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ comments: post.comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const postComment = async (req, res) => {
  try {
    const { userId, comment, postId } = req.body;

    if (!comment || comment.trim() === "") {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }
    let post;
    // Find the post by ID
    try {
      try {
        post = await notesModel.findById(postId);
      } catch (error) {
        console.log(">>>>>>>>>>>", error);
      }
      if (!post) {
        try {
          post = await PublicPost.findById(postId);
        } catch (error) {
          console.log(">>>>>>>>>>>", error);
        }
      }
    } catch (error) {
      console.log(">>>>>>>>>>>", error);
    }

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Add the new comment
    const newComment = {
      user: userId,
      Comment: comment,
    };

    post.comments.push(newComment);
    await post.save();

    res
      .status(201)
      .json({ message: "Comment added successfully", comments: post.comments });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const addLikeOrDislikeToPublicNotes = async (req, resp) => {
  const { notesId } = req.params;
  const userId = req.userId;
  console.log("user notes id", notesId);
  try {
    // Check if the notes exist
    const notes = await PublicPost.findById(notesId);
    console.log(">>>>>>>>>>>notes", notes);
    if (!notes) {
      return resp
        .status(404)
        .send(responseSender(false, 404, "Notes not found!!", null));
    }

    // Check if the user has already liked the notes
    const userLiked = notes.likes.some((id) => id.equals(userId));
    console.log(">>>>>>>>>>>userliked", userLiked);

    // Find the user by userId
    const user = await userModel.findById(notes.owner);
    console.log("notes owner user", user);

    if (userLiked) {
      // User has already liked, remove the like (dislike)

      notes.likes.pull(userId);

      // Remove the note from user's likesOnOwnNotes
      user.likesOnOwnNotes.pull(userId);
    } else {
      // User has not liked, add the like
      notes.likes.push(userId);
      // Add the note to user's likesOnOwnNotes
      user.likesOnOwnNotes.push(userId);
    }

    await notes.save();
    await user.save(); // Save the changes to the user

    // Fetch the updated notes with user data
    await notesModel.findById(notesId).populate({
      path: "owner",
      populate: { path: "likesOnOwnNotes" },
    });

    return resp
      .status(200)
      .send(responseSender(true, 200, "Operation successful", null));
  } catch (error) {
    console.log(">>>>>>>>>>>last catch", error);
    return resp
      .status(500)
      .send(responseSender(false, 500, "Internal server error!", null));
  }
};

module.exports = {
  uploadFile,
  groupNotes,
  addLikeOrDislike,
  addLikeOrDislikeToPublicNotes,
  saveNotes,
  UserSavedNotes,
  userNotes,
  getPublicNotes,
  uploadPublicNotes,
  getComments,
  postComment,
};
