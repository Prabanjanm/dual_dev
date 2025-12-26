const Offer = require("../models/offers");
const User = require("../models/user");
const mongoose = require("mongoose");
const {get_balance, send_transaction } = require("./ganachecontroller");

//generate unique offer_id
async function generateOfferId() {
  const count = await Offer.countDocuments();
  return "OFF" + String(1000 + count + 1);
}


const N = v => (typeof v === "number" ? v : Number(v || 0));


const getTokenBalance = async (wallet_address) => {
  if (!wallet_address) throw new Error("Wallet address required");
  const tokenContract = new web3.eth.Contract(ERC20_ABI, TOKEN_ADDRESS);
  const balance = await tokenContract.methods.balanceOf(wallet_address).call();
  return Number(web3.utils.fromWei(balance, "ether")); // assuming token has 18 decimals
};

const {
  createSellerOfferOnChain,
  buyerConfirmOnChain
} = require("../blockchain/energyContract");

// Create offer
exports.createoffer = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
   console.log("Create offer request:", req.body);
    const { creator_id, units, token_per_unit } = req.body;
     
    const creator = await User.findOne({ user_id: creator_id }).session(session);

    if (!creator) throw new Error("Creator not found");

    if (creator.energy_balance < units)
      return res.status(400).json({ msg: "Not enough energy" });

    creator.energy_balance -= units;
    creator.reserved_energy += units;
   console.log("Creator energy balance after reservation:", creator.energy_balance);
   
    const offer = new Offer({
      offer_id: "OFF" + Date.now(),
      creator_id: creator.user_id,
      transformer_id: creator.transformer_id,
      units,
      remaining_units: units,
      token_per_unit,
      total_tokens: units * token_per_unit,
      status: "open",
      created_at: new Date()
    });
   console.log("New offer created:", offer.offer_id, "Units:", units, "Price per unit:", token_per_unit); 
    await creator.save({ session });
    console.log("Creator saved to DB");
    await offer.save({ session });
    console.log("Offer and creator saved to DB");
    // 🔗 ON-CHAIN CREATE
    const chainRes = await createSellerOfferOnChain(
      creator.wallet_address,
      units,
      token_per_unit
    );

  console.log("On-chain create offer result:", chainRes);
    if (!chainRes.success) throw new Error(chainRes.error);
  console.log("On-chain offer created with txHash:", chainRes.txHash);
    await session.commitTransaction();
    console.log("Transaction committed");
    session.endSession();
    console.log("Session ended");

    res.json({ success: true, offer });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ msg: err.message });
  }
};

exports.canceloffer = async (req, res) => {
  const io = req.app.get("io");
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { user, offer_id } = req.body;

    console.log("Cancel offer request:", user.u, offer_id);


    if(!user_id )
      console.log("user_id missing");
    if(!offer_id )
      console.log("offer_id missing");

    if (!user_id || !offer_id) { 
      console.log("Cancel offer request:", user_id, offer_id);
      await session.abortTransaction(); session.endSession(); return res.status(400).json({ msg: "Missing fields" });
     }

    
    const offer = await Offer.findOne({ offer_id }).session(session);

    if (!offer) { 
      console.log("Offer not found for ID:", offer_id);
      await session.abortTransaction(); session.endSession(); 
      return res.status(404).json({ msg: "Offer not found" }); 
    }
  // console.log("Offer found:", offer.offer_id, "Status:", offer.status);
    if (offer.creator_id !== user_id) {
      console.log("User is not creator:", user_id, "Creator:", offer.creator_id);
      await session.abortTransaction(); session.endSession(); 
      return res.status(403).json({ msg: "Only creator can cancel" });
     }
  // console.log("User is creator");

    if (offer.status !== "open")
       { await session.abortTransaction(); session.endSession(); 
         return res.status(400).json({ msg: "Cannot cancel in current status" });
       }

    const creator = await User.findOne({ user_id: offer.creator_id }).session(session);

    if (!creator) { 
       console.log("Creator not found");
      await session.abortTransaction(); session.endSession(); return res.status(404).json({ msg: "Creator not found" }); }
    
  
      // restore seller reserved energy
      console.log("Restoring reserved energy to creator");
      creator.reserved_energy = Math.max(0, N(creator.reserved_energy) - N(offer.remaining_units));
      
      creator.energy_balance = N(creator.energy_balance) + N(offer.units);
      console.log("Creator energy balance after restore:", creator.energy_balance);
   

    offer.status = "cancelled";
   
    offer.completed_at = new Date();
    await creator.save({ session });
    await offer.save({ session });

    await session.commitTransaction(); session.endSession();

     //  REAL-TIME SOCKET UPDATES
    const users = await User.find({ transformerid: offer.transformerid }).select("user_id");
    users.forEach(u => {
      io.to(u.user_id.toString()).emit("offer_cancelled", {
        msg: "Offer cancelled",
        offer
      });
    });

    return res.json({ success: true, msg: "Offer cancelled and reservations released", offer });

  } catch (err) {
    try { await session.abortTransaction(); } catch (_) { }
    session.endSession();
    console.error("cancelOffer error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

//--accept offer function--exports.acceptoffer = async (req, res) => {
  exports.acceptoffer = async (req, res) => {

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { offer_id, user_id, unit } = req.body;

    const offer = await Offer.findOne({ offer_id }).session(session);
    if (!offer || offer.status !== "open")
      return res.status(400).json({ msg: "Invalid offer" });

    const seller = await User.findOne({ user_id: offer.creator_id }).session(session);
    const buyer = await User.findOne({ user_id }).session(session);

    if (unit > offer.remaining_units)
      return res.status(400).json({ msg: "Units exceed offer" });

    // 🔗 ON-CHAIN CONFIRM
    const chainRes = await buyerConfirmOnChain(
      buyer.wallet_address,
      seller.wallet_address,
      unit
    );

    if (!chainRes.success) throw new Error(chainRes.error);

    // 🔁 DB MIRROR
    seller.reserved_energy -= unit;
    buyer.energy_balance += unit;
    offer.remaining_units -= unit;

    if (offer.remaining_units === 0) {
      offer.status = "completed";
      offer.completed_at = new Date();
    }

    await seller.save({ session });
    await buyer.save({ session });
    await offer.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ success: true, offer });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ msg: err.message });
  }
};

 // adjust the path

exports.getAllOffers = async(req, res) => {
  try {
    const offers = await Offer.find();  // fetch all documents
    console.log('All Offers:', offers);
    return res.json(offers);
  } catch (err) {
    console.error('Error fetching offers:', err);
    throw err;
  }
};

