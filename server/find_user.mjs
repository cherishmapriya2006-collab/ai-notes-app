import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI not set');
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node find_user.mjs user@example.com');
  process.exit(1);
}

try {
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB_NAME || undefined });
  const user = await User.findOne({ email: String(email).trim().toLowerCase() }).lean();
  if (!user) {
    console.log('NOUSER');
  } else {
    console.log(JSON.stringify(user, null, 2));
  }
  await mongoose.disconnect();
} catch (err) {
  console.error('ERROR', err);
  process.exit(1);
}
