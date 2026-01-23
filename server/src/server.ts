// FILE: server/src/server.ts
import "dotenv/config";
import app from "./app";
import { connectDB } from "./db/connect";
import { env } from "./config/env";

async function startServer(): Promise<void> {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });
}

startServer().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("❌ Server failed to start:", message);
  process.exit(1);
});
