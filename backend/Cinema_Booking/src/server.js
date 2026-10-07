import app from "./app.js";
import { startPaymentRecovery } from "./Infrastructure/Config/container.js";
import { connectDB } from "./Infrastructure/Config/database.js";
import { env } from "./Infrastructure/Config/env.js";

const start = async () => {
  await connectDB();
  startPaymentRecovery();
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

start();
