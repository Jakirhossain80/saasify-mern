// FILE: server/src/server.ts
import "dotenv/config";
import app from "./app";
import { connectDB } from "./db/connect";

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

async function startServer(): Promise<void> {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("❌ Server failed to start:", message);
  process.exit(1);
});
