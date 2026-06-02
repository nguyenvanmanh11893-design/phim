import app from "./app.js";
import { connectDB } from "./Infrastructure/Config/database.js";
import { env } from "./Infrastructure/Config/env.js";

const start = async () => {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

start();
