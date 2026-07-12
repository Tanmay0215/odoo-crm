import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// Load environmental variables directly for the drizzle-kit CLI execution
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required for drizzle-kit",
  );
}

export default defineConfig({
  schema: "./src/db/schema/users.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
