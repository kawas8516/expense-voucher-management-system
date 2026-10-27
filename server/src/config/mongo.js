import mongoose from "mongoose";

// MongoDB is used only for the audit / activity log.
// It is optional: without MONGO_URL (or if it is down) the app works the same,
// audit events are just not saved.
export async function connectMongo() {
  if (!process.env.MONGO_URL) {
    console.log("MONGO_URL not set, audit log disabled");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log("Could not connect to MongoDB, audit log disabled:", err.message);
  }
}

export function mongoReady() {
  return mongoose.connection.readyState === 1;
}
