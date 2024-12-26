const groupdb = require("../model/groups.model");
const groupModel = groupdb.Group;
const demanddb = require("../model/demand.model");
const demandModel = demanddb.Demand;
const userdb = require("../model/user.model");
const userModel = userdb.User;
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

const addDemand = async (req, resp) => {
  const { textInput, groupId } = req.body;
  const userId = req.userId;

  try {
    const currentGroup = await groupModel.findById(groupId);

    if (!currentGroup) {
      return resp.send(responseSender(false, 404, "Group not found", null));
    }

    const newDemand = await demandModel.create({
      message: textInput,
      from: userId,
      to: groupId,
    });

    // Add the new demand to the group's demands array
    currentGroup.demands.push(newDemand._id);
    await currentGroup.save();

    resp.send(
      responseSender(true, 200, "Demand added successfully", newDemand)
    );
  } catch (error) {
    resp.send(responseSender(false, 500, "Internal server error", null));
  }
};

const addDislikeToDemand = async (req, resp) => {
  const { demandId } = req.body;
  const userId = req.userId;

  try {
    if (!demandId) {
      return resp.send(responseSender(false, 400, "Demand ID not provided", null));
    }

    const demand = await demandModel.findOne({ _id: demandId });

    if (!demand) {
      return resp.send(responseSender(false, 400, "Demand not found", null));
    }

    // Check if the user has already disliked the demand
    const hasDisliked = demand.dislike.includes(userId);
    // Check if the user has liked the demand
    const hasLiked = demand.like.includes(userId);

    // If the user already disliked the demand, remove the dislike and don't add to like
    if (hasDisliked) {
      demand.dislike = demand.dislike.filter((id) => id.toString() !== userId.toString());
    } 
    // If the user had liked the demand, remove the like and add to dislike
    else if (hasLiked) {
      demand.like = demand.like.filter((id) => id.toString() !== userId.toString());
      demand.dislike.push(userId);
    } 
    // If the user has neither liked nor disliked, add the dislike
    else {
      demand.dislike.push(userId);
    }

    await demand.save();
    return resp.send(responseSender(true, 200, "Dislike action updated", demand));

  } catch (error) {
    console.error("Error in addDislikeToDemand:", error);
    return resp.send(responseSender(false, 500, "Internal server error", null));
  }
};

const addLikeToDemand = async (req, resp) => {
  const { demandId } = req.body;
  const userId = req.userId; 
 console.log('>>>>>>>>>>>demand id user id', demandId, userId)
  try {
    if (!demandId) {
      return resp.send(responseSender(false, 400, "Demand ID not provided", null));
    }

    const demand = await demandModel.findOne({ _id: demandId });
    

    if (!demand) {
      return resp.send(responseSender(false, 400, "Demand not found", null));
    }

    // Check if the user has already liked the demand
    const hasLiked = demand.like.includes(userId);
    // Check if the user has disliked the demand
    const hasDisliked = demand.dislike.includes(userId);

    // If the user already liked the demand, remove the like and don't add to dislike
    if (hasLiked) {
      demand.like = demand.like.filter((id) => id.toString() !== userId.toString());
    } 
    // If the user had disliked the demand, remove the dislike and add to like
    else if (hasDisliked) {
      demand.dislike = demand.dislike.filter((id) => id.toString() !== userId.toString());
      demand.like.push(userId);
    } 
    // If the user has neither liked nor disliked, add the like
    else {
      demand.like.push(userId);
    }

    await demand.save();
    return resp.send(responseSender(true, 200, "Like action updated", demand));

  } catch (error) {
    console.error("Error in addLikeToDemand:", error);
    return resp.send(responseSender(false, 500, "Internal server error", null));
  }
};

const demands = async (req, resp) => {
  const { groupId } = req.params;
  try {
    if (!groupId) {
      return resp.send(
        responseSender(false, 400, "group id not provided", null)
      );
    }

    const demands = await demandModel.find({ to: groupId });

    // Fetch user data for each demand
    const demandsWithUserData = await Promise.all(
      demands.map(async (demand) => {
        const user = await userModel.findById(demand.from);
        return {
          demand,
          user,
        };
      })
    );
    console.log(">>>>>>>>>>>", demandsWithUserData);

    resp.send(
      responseSender(true, 200, "demands find succesfully", demandsWithUserData)
    );
  } catch (error) {
    resp.send(responseSender(false, 500, "internal server error", null));
  }
};

const deleteDemand = async (req, resp) => {
  const { demandId, groupId } = req.body;
  console.log('>>>>>>>>>>>', demandId, groupId)
  try {
    if (!demandId || !groupId) {
      return resp.send(
        responseSender(false, 400, "credentials not provided", null)
      );
    }
    const group = await groupModel.findById(groupId);
    if (!group) {
      return resp.send(
        responseSender(false, 400, "group not found", null)
      );
    }

    const demand = await demandModel.findByIdAndDelete(demandId);

    if (!demand) {
      return resp.send(
        responseSender(false, 400, "demand not found", null)
      );
    }
        group.demands = group.demands.filter((id) => id.toString() !== demandId.toString());

        await group.save();
        await demand.save();

    resp.send(
      responseSender(true, 200, "demand deleted succesfully", demand)
    );
  
  } catch (error) {
    resp.send(responseSender(false, 500, "internal server error", null));
  }
};



module.exports = {
  demo,
  addDemand,
  demands,
  addLikeToDemand,
  addDislikeToDemand,
  deleteDemand
};
