const groupdb = require("../model/groups.model");
const { notification } = require("../model/notification.model");
const groupModel = groupdb.Group;
const userdb = require("../model/user.model");
const userModel = userdb.User;
const db = require("../utils/db.connection");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
var Mailgen = require("mailgen");
const responseSender = require("../utils/responseSender");

const demo = async (req, resp) => {
  try {
    resp.send({
      status: 200,
      message: "ready to use",
    });
  } catch (err) {
    resp.send({
      err,
    });
  }
};

// create group API

const createGroup = async (req, resp) => {
  const { title, description } = req.body;
  try {
    if (!title) {
      return resp.status(422).json({
        status: 422,
        success: false,
        error: "Enter tittle of the group ",
      });
    }
    const existingGroup = await groupModel.findOne({ title });

    if (existingGroup) {
      return resp.status(400).json({
        status: 400,
        success: false,
        message: "Group already exist",
      });
    } else {
      const group = new groupModel({
        title,
        description,
        owner: [{ owner: req.userId }],
        members: [{ members: req.userId }],
      });

      const storedGroup = await group.save();

      const userId = req.userId; //authenticate middleware sets user information in req.user

      if (userId) {
        const user = await userModel.findById(userId);
        if (user) {
          user.group.push(storedGroup._id);
          user.memberOf.push(storedGroup._id);
          await user.save();
        }
      }
      console.log(storedGroup.title);
      const newNotification = new notification({
        user: req.userId,
        message: `, you successfully created a ${storedGroup.title} Group`,
      });
      const savedNotification = await newNotification.save();
      console.log(savedNotification);

      return resp.status(200).json({
        status: 200,
        success: true,
        Message: "Group Created Successfullly,",
        data: storedGroup,
      });
    }
  } catch (error) {
    return resp.status(400).json({
      status: 400,
      success: false,
      Message: "internal server error",
      error,
    });
  }
};

// join Group API

const joinGroup = async (req, resp) => {
  const { id } = req.body;
  // console.log(">>>>>>>>>>>id", id);
  try {
    if (!id) {
      resp.status(404).json({
        status: 404,
        success: false,
        message: "Require ID",
      });
    }
    const Group = await groupModel.findById(id);
    console.log(">>>>>>>>>>>g id", Group._id);
    const userId = req.userId;
    const user = await userModel.findById(userId)
    user.memberOf.push(Group._id);
    Group.members.push(userId);
    await user.save();
    await Group.save();

    const newNotification = new notification({
      user: req.userId,
      message: `,you successfully joined in ${Group.title} Group`,
    });
    const savedNotification = await newNotification.save();
    console.log(savedNotification);
    console.log(">>>>>>>>>>> GROUP JOINED SUCCESSFULLY");
    resp.status(200).json({
      status: 200,
      success: true,
      message: "group joined successfully",
      data: Group,
    });
  } catch (error) {
    console.log(">>>>>>>>>>>", error);
  }
};

//all groups API
const allGroups = async (req, resp) => {
  const Groups = await groupModel.find({});
  // console.log(Groups)
  try {
    if (!Groups) {
      resp.status(404).json({
        status: 404,
        success: false,
        message: "not found",
      });
    } else {
      resp.status(200).json({
        status: 200,
        success: true,
        message: "fetching all groups",
        Groups: Groups,
      });
    }
  } catch (err) {
    console.log(">>>>>>>>>>>", err);
  }
};

//all groups that user join and create
const allJoinAndCreated = async (req, resp) => {
  const user = req.user;
  const { id } = req.params;
  // console.log('>>>>>>>>>>>user mem', user.memberOf)
  const memberOf = user.memberOf;

  const Groups = await groupModel.find({ _id: memberOf });

  // console.log("all groups",Groups)
  try {
    if (!Groups) {
      resp.status(404).json({
        status: 404,
        success: false,
        message: "not found",
      });
    } else {
      resp.status(200).json({
        status: 200,
        success: true,
        message: "fetching all groups",
        Groups: Groups,
      });
    }
  } catch (err) {
    console.log(">>>>>>>>>>>", err);
  }
};

//getting group by id
//all groups that user join and create
const groupById = async (req, resp) => {
  const { id } = req.params;

  const Group = await groupModel.findById(id);

  // console.log("all groups",Groups)
  try {
    if (!Group) {
      resp.status(404).json({
        status: 404,
        success: false,
        message: "not found",
      });
    } else {
      resp.status(200).json({
        status: 200,
        success: true,
        message: "fetching all groups",
        data: Group,
      });
    }
  } catch (err) {
    console.log(">>>>>>>>>>>", err);
  }
};

// update group  title and description  api

const updateGroup = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  // console.log(id);
  // console.log(title);

  try {
    // Check for empty title and description
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Title and description are required for the update.",
      });
    }

    const group = await groupModel.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Group Not Found",
      });
    }

    const groupOwnerId = group.owner[0].owner;
    const userId = req.userId;
    // console.log('>>>>>>>>>>>', groupOwnerId,userId)

    if (groupOwnerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: "Access denied.",
      });
    }

    const updated = await groupModel.findOneAndUpdate(
      { _id: id },
      { title, description },
      { new: true, runValidators: true } // Return the modified document and run validators
    );

    // console.log(updated);
    if (!updated) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Data Not Found",
      });
    }

    res.status(200).json({
      success: true,
      status: 200,
      message: "Data Updated Successfully",
      data: updated,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      status: 500,
      message: "Internal Server Error",
    });
  }
};

// delete api for group
const deleteGroup = async (req, res) => {
  const { id } = req.params;

  try {
    const group = await groupModel.findById(id);

    if (!group) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Group Not Found",
      });
    }

    const groupOwnerId = group.owner[0].owner;
    const userId = req.userId;

    if (groupOwnerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: "Access denied.",
      });
    }

    const deleted = await groupModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Data Not Found",
      });
    }

    // req.userId got from middleware
    const user = await userModel.findById(req.userId);
    const index = user.memberOf.indexOf(id);
    user.memberOf.splice(index, 1); // deleting ref of group in user model also
    await user.save();

    res.status(200).json({
      success: true,
      status: 200,
      message: "Group Deleted Successfully",
      data: deleted,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      status: 500,
      message: "Internal Server Error",
    });
  }
};

// invite user

const invite = async (req, resp) => {
  const { email, groupId } = req.body;
  const from = req.user.name;
  try {
    if (!email) {
      return resp
        .status(400)
        .send({ success: false, message: "Email not provided" });
    }

    // Code for sending email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "noteslelo.app@gmail.com",
        pass: "lplj hjxv hmjx lrnw",
      },
    });

    const mailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "NotesLelo",
        link: "https://notes-lelo-web-app.vercel.app/", // Change this URL to your app's URL
      },
    });

    // Email template
    const emailToSend = {
      subject: "Invitation to Join NotesLelo Group",
      body: {
        greeting: `Dear ${email},`,
        intro: `You have been invited by ${from} to join the NotesLelo group.`,
        action: {
          instructions: `To join, please click the button below and follow the instructions, Alternatively, you can copy the group code <strong style="color: yellow">"${groupId}"</strong> and apply it to join the group manually.`,
          button: {
            color: "#22BC66",
            text: "Join Group",
            link: "https://notes-lelo-web-app.vercel.app/", // Replace with the actual confirmation link
          },
        },

        outro:
          "If you have any questions or need further assistance, feel free to contact us.",
        closing: "Best regards,",
        signature: "The NotesLelo Team",
      },
    };

    // Generate an HTML email with the provided contents
    const emailBody = mailGenerator.generate(emailToSend);

    const message = {
      from: "noteslelo.app@gmail.com",
      to: email,
      subject: "Welcome to NotesLelo",
      html: emailBody,
    };

    await transporter.sendMail(message);

    return resp
      .status(200)
      .send({ success: true, message: "User invited successfully" });
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return resp
      .status(500)
      .send({ success: false, message: "Internal server error" });
  }
};

const leftGroup = async (req, resp) => {
  const { id } = req.params;

  if (!id) {
    resp.status(400).send(responseSender(false, 400, "id did not found", null));
  }
  try {
    const group = await groupModel.findById(id);
    console.log(">>>>>>>>>>>", group);
    const userId = req.userId;
    console.log('>>>>>>>>>>>user id', userId)
    // Remove the user from the group members array
    const updatedMembers = group.members.filter((obj) => obj._id != userId);
    console.log('>>>>>>>>>>>', updatedMembers)

    // Update the group with the modified members array
    const updateGroup =  await groupModel.findByIdAndUpdate(id, { members: updatedMembers });
    console.log('>>>>>>>>>>>lefted')
    resp
    .status(200)
    .send(responseSender(true, 200, "successfully group lefted",updateGroup ));

  } catch (error) {
    console.log(">>>>>>>>>>>", error);
    resp
      .status(500)
      .send(responseSender(false, 500, "internal server error", null));
  }
};

module.exports = {
  demo,
  createGroup,
  allGroups,
  joinGroup,
  allJoinAndCreated,
  updateGroup,
  deleteGroup,
  groupById,
  invite,
  leftGroup,
};
