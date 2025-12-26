// ---------------------- Load ENV Variables ----------------------
require("dotenv").config();

console.log("=== ENVIRONMENT VARIABLES DEBUG ===");
console.log("TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID ? "✓ Loaded" : "❌ NOT FOUND");
console.log("TWILIO_AUTH_TOKEN:", process.env.TWILIO_AUTH_TOKEN ? "✓ Loaded" : "❌ NOT FOUND");
console.log("TWILIO_VERIFY_SERVICE_SID:", process.env.TWILIO_VERIFY_SERVICE_SID ? "✓ Loaded" : "❌ NOT FOUND");
console.log("MQTT_BROKER:", process.env.MQTT_BROKER ? "✓ Loaded" : "❌ NOT FOUND");
console.log("MONGO_URI:", process.env.MONGO_URI ? "✓ Loaded" : "❌ NOT FOUND");
console.log("PORT:", process.env.PORT || 5001);
console.log("===================================");

// ---------------------- Core Imports ----------------------
const express = require("express");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

// MQTT import
const { initMQTT } = require("./services/mqttservice");

// User model
const User = require("./models/user");

// ---------------------- ENV Config ----------------------
const PORT = process.env.PORT || 5001;  // Must match frontend socket connection
const MONGO_URI = process.env.MONGO_URI;

// ---------------------- App Initialization ----------------------
const app = express();
const server = http.createServer(app);

app.use(cors({
    origin: "http://localhost:3000", // React frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

// ---------------------- MongoDB Connect ----------------------
mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB error:", err));

// ---------------------- Socket.IO Setup ----------------------
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // React frontend
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("register_user", (userId) => {
        socket.join(userId);
        console.log(`User joined room: ${userId}`);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// Make io globally accessible in routes if needed
app.set("io", io);

// ---------------------- Helper: Send New Reading ----------------------
const sendNewReading = async (userId, readingData = {}) => {
    try {
        const user = await User.findOne({ user_id: userId });
        if (!user) return;

        io.to(userId).emit("new_reading", {
            wallet_balance: user.wallet_balance,
            token_balance: user.token_balance,
            energy_balance: readingData.energy_balance ?? user.energy_balance,
            reserved_tokens: user.reserved_tokens,
            reserved_energy: user.reserved_energy,
            total_energy_sold: readingData.total_energy_sold ?? user.total_energy_sold,
            total_energy_bought: readingData.total_energy_bought ?? user.total_energy_bought,
            last_import_reading: readingData.last_import_reading ?? user.last_import_reading,
            last_export_reading: readingData.last_export_reading ?? user.last_export_reading,
        });
    } catch (err) {
        console.error("Error sending new reading:", err);
    }
};

// ---------------------- Initialize MQTT ----------------------
initMQTT(
    process.env.MQTT_BROKER,
    process.env.MQTT_TOPIC,
    io,
    sendNewReading
);

// ---------------------- Routes ----------------------
app.use("/api/auth", require("./routes/authroutes"));
app.use("/api/offers", require("./routes/offerroutes"));
app.use("/api/ganache", require("./routes/ganacheroute"));
app.use("/api/users", require("./routes/userroutes"));

app.get("/", (req, res) => {
    res.send("P2P Energy Trading API running.");
});

// ---------------------- Start Server ----------------------
server.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});
