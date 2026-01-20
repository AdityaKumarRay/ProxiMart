import app from "./app.js";
import connectDB from "./config/db.js";
import { PORT } from "./constants.js";

console.info("[Server] initializing...");

connectDB()
  .then(() => {
    console.info("[Server] database connected");

    app.on("error", (err) => {
      console.error("Express server error:", err);
      throw err;
    });

    app.listen(PORT, () => {
      console.info(`⚙ Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error setting up server:", error);
    process.exit(1);
  });
