import mongoose from "mongoose";
import { NextResponse } from "next/server";

class DatabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseConfigurationError";
  }
}

type MongooseCache = {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache = global.mongooseCache ?? { connection: null, promise: null };
global.mongooseCache = cache;

export async function connectToDatabase() {
  if (cache.connection) return cache.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new DatabaseConfigurationError(
      "MONGODB_URI is missing. Add your MongoDB connection string to .env.local.",
    );
  }

  if (/[<>]/.test(uri) || /your-|placeholder|example\.com/i.test(uri)) {
    throw new DatabaseConfigurationError(
      "MONGODB_URI still contains example placeholders. Replace them with your real MongoDB connection string in .env.local.",
    );
  }

  if (!/^mongodb(?:\+srv)?:\/\//i.test(uri)) {
    throw new DatabaseConfigurationError(
      "MONGODB_URI must start with mongodb:// or mongodb+srv://.",
    );
  }

  try {
    const parsedUri = new URL(uri);
    if (!parsedUri.hostname) {
      throw new Error("MongoDB hostname is missing.");
    }
  } catch {
    throw new DatabaseConfigurationError(
      "MONGODB_URI is not a valid MongoDB connection string. Copy a fresh Node.js driver URI from your MongoDB cluster.",
    );
  }

  cache.promise ??= mongoose.connect(uri, { bufferCommands: false });

  try {
    cache.connection = await cache.promise;
    return cache.connection;
  } catch (error) {
    cache.promise = null;
    throw error;
  }
}

export function databaseErrorResponse(error: unknown, operation: string) {
  if (error instanceof DatabaseConfigurationError) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : undefined;
  const details =
    typeof error === "object" && error !== null
      ? {
          name: "name" in error && typeof error.name === "string" ? error.name : "Error",
          code,
        }
      : { name: "Error" };
  console.error(operation, details);

  if (code === 8000) {
    return NextResponse.json(
      {
        error:
          "MongoDB Atlas rejected the connection. Check the database user's username and password (not your Atlas login), URL-encode special password characters, and allow your current IP in Atlas Network Access.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      error:
        "MongoDB is unavailable. Check your connection string, database credentials, and MongoDB Atlas network access, then try again.",
    },
    { status: 503 },
  );
}
