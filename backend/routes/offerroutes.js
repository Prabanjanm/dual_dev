const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offercontroller");

router.post("/create", offerController.createoffer);
router.post("/accept", offerController.acceptoffer);
router.post("/negotiate", offerController.negotiateoffer);
router.post("/cancelnegotiation", offerController.cancelnegotiation);
router.post("/cancel", offerController.canceloffer);
module.exports = router;
