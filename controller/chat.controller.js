const { Chat } = require("../model/chat.model");



const getMessages=  async (req, res) => {
    const { groupId } = req.params;
    console.log('>>>>>>>>>>>in get message controller')
    try {
        const messages = await Chat.find({ to: groupId }).populate("from", "email name"); 
        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
}


  module.exports = { getMessages };