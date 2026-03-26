try {
    console.log("Testing Chat Model...");
    require('./realtime-module/models/chat.model');
    console.log("Testing Message Model...");
    require('./realtime-module/models/message.model');
    console.log("Testing Call Model...");
    require('./realtime-module/models/call.model');
    console.log("Testing Controller...");
    require('./realtime-module/controllers/chat.controller');
    console.log("Testing Routes...");
    require('./realtime-module/routes/chat.routes');
    console.log("Testing Socket...");
    require('./realtime-module/socket');
    console.log("All requires successful!");
} catch (err) {
    console.error("Require failed:", err);
}
