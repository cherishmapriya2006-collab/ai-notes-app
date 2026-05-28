import http from "http";
import { randomUUID } from "crypto";
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import formidable from 'formidable';
import User from './models/User.js';

dotenv.config();

const port = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

// notes, tokens and (fallback) users maps remain in-memory; auth persistence
// will use MongoDB only if MONGO_URI is provided.
const users = new Map();
const notesByUserId = new Map();
const tokens = new Map();

// Connect to MongoDB if MONGO_URI is provided
const mongoUri = process.env.MONGO_URI;
let isMongoReady = false;
if (mongoUri) {
  mongoose.connect(mongoUri, { dbName: process.env.MONGO_DB_NAME || undefined })
    .then(() => {
      isMongoReady = true;
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      isMongoReady = false;
      console.error('MongoDB connection error:', err);
      console.warn('Falling back to in-memory auth storage');
    });
} else {
  console.warn('MONGO_URI not set — auth persistence to MongoDB disabled');
}

const createDemoNote = (userId) => ({
  _id: randomUUID(),
  userId,
  title: "Welcome note",
  content: "<p>Your notes are ready.</p>",
  fontFamily: "inter",
  tags: ["demo"],
  trashed: false,
  archived: false,
  pinned: false,
  favorite: false,
  images: [],
  color: "default",
  updatedAt: new Date().toISOString(),
});

const responseHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": clientUrl,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, responseHeaders);
  res.end(JSON.stringify(payload));
};

const getBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const getUserFromRequest = (req) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token || !tokens.has(token)) return null;
  return { token, user: tokens.get(token) };
};

const getNotesForUser = (userId) => {
  if (!notesByUserId.has(userId)) notesByUserId.set(userId, [createDemoNote(userId)]);
  return notesByUserId.get(userId);
};

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, responseHeaders);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  if (req.method === "GET" && pathname === "/") {
    return sendJson(res, 200, { ok: true, message: "Glow Pad API is running", health: "/api/health" });
  }

  if (req.method === "GET" && pathname === "/api/health") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "POST" && pathname === "/api/auth/signup") {
    const body = await getBody(req);
    const { name, email, password } = body || {};
    if (!name || !email || !password || password.length < 6) {
      return sendJson(res, 400, { message: "Invalid signup details" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    // If Mongo is not ready, fallback to in-memory users map
    if (!isMongoReady) {
      const existingUser = Array.from(users.values()).find((u) => u.email === normalizedEmail);
      if (existingUser) return sendJson(res, 409, { message: "Email already registered" });
      const user = { id: randomUUID(), name: String(name).trim(), email: normalizedEmail };
      users.set(user.id, { ...user, password });
      const token = randomUUID();
      tokens.set(token, user);
      getNotesForUser(user.id);
      return sendJson(res, 200, { token, user });
    }

    // Using MongoDB persistence
    try {
      const existing = await User.findOne({ email: normalizedEmail }).lean();
      if (existing) return sendJson(res, 409, { message: "Email already registered" });
      const hashed = await bcrypt.hash(password, 10);
      const doc = await User.create({ name: String(name).trim(), email: normalizedEmail, password: hashed });
      const user = { id: doc._id.toString(), name: doc.name, email: doc.email };
      const token = randomUUID();
      tokens.set(token, user);
      getNotesForUser(user.id);
      return sendJson(res, 200, { token, user });
    } catch (err) {
      console.error('signup error', err);
      return sendJson(res, 500, { message: 'Signup failed' });
    }
  }

  if (req.method === "POST" && pathname === "/api/auth/login") {
    const body = await getBody(req);
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return sendJson(res, 400, { message: "Email and password are required" });
    }

    // If Mongo is not ready, check in-memory users
    if (!isMongoReady) {
      const matchedUser = Array.from(users.values()).find(
        (user) => user.email === email && user.password === password,
      );
      if (!matchedUser) return sendJson(res, 401, { message: 'Invalid email or password' });
      const user = { id: matchedUser.id, name: matchedUser.name, email: matchedUser.email };
      const token = randomUUID();
      tokens.set(token, user);
      return sendJson(res, 200, { token, user });
    }

    // Using MongoDB
    try {
      const matched = await User.findOne({ email }).lean();
      if (!matched) {
        return sendJson(res, 401, { message: "Invalid email or password" });
      }
      const valid = await bcrypt.compare(password, matched.password);
      if (!valid) return sendJson(res, 401, { message: "Invalid email or password" });
      const user = { id: matched._id.toString(), name: matched.name, email: matched.email };
      const token = randomUUID();
      tokens.set(token, user);
      return sendJson(res, 200, { token, user });
    } catch (err) {
      console.error('login error', err);
      return sendJson(res, 500, { message: 'Login failed' });
    }
  }

  if (req.method === "GET" && pathname === "/api/notes") {
    const auth = getUserFromRequest(req);
    if (!auth) return sendJson(res, 401, { message: "Unauthorized" });
    const notes = getNotesForUser(auth.user.id).filter((note) => !note.trashed);
    return sendJson(res, 200, notes);
  }

  if (req.method === "POST" && pathname === "/api/notes") {
    const auth = getUserFromRequest(req);
    if (!auth) return sendJson(res, 401, { message: "Unauthorized" });
    const body = await getBody(req);

    const note = {
      _id: randomUUID(),
      userId: auth.user.id,
      title: body?.title || "Untitled",
      content: body?.content || "",
      fontFamily: body?.fontFamily || "inter",
      tags: body?.tags || [],
      trashed: false,
      archived: false,
      pinned: false,
      favorite: false,
      images: [],
      color: body?.color || "default",
      updatedAt: new Date().toISOString(),
    };

    const notes = getNotesForUser(auth.user.id);
    notes.unshift(note);
    return sendJson(res, 200, note);
  }

  if (req.method === "PUT" && pathname.startsWith("/api/notes/")) {
    const auth = getUserFromRequest(req);
    if (!auth) return sendJson(res, 401, { message: "Unauthorized" });
    const body = await getBody(req);
    const id = pathname.slice("/api/notes/".length);

    const notes = getNotesForUser(auth.user.id);
    const note = notes.find((item) => item._id === id);
    if (!note) {
      return sendJson(res, 404, { message: "Note not found" });
    }

    Object.assign(note, body || {}, { updatedAt: new Date().toISOString() });
    return sendJson(res, 200, note);
  }

  if (req.method === "DELETE" && pathname.startsWith("/api/notes/")) {
    const auth = getUserFromRequest(req);
    if (!auth) return sendJson(res, 401, { message: "Unauthorized" });
    const id = pathname.slice("/api/notes/".length);

    const notes = getNotesForUser(auth.user.id);
    const index = notes.findIndex((item) => item._id === id);
    if (index === -1) {
      return sendJson(res, 404, { message: "Note not found" });
    }

    const query = new URLSearchParams(url.search);
    if (query.get("permanent") === "true") {
      notes.splice(index, 1);
    } else {
      notes[index].trashed = true;
      notes[index].updatedAt = new Date().toISOString();
    }

    res.writeHead(204, responseHeaders);
    return res.end();
  }

  if (req.method === "POST" && pathname === "/api/upload") {
    const auth = getUserFromRequest(req);
    if (!auth) return sendJson(res, 401, { message: "Unauthorized" });

    // ensure uploads dir exists
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const form = formidable({ multiples: true, uploadDir: uploadsDir, keepExtensions: true });

    return form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('upload parse error', err);
        return sendJson(res, 500, { message: 'Upload failed' });
      }

      const saved = [];
      const baseUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host || `localhost:${port}`}`;
      const normalize = (f) => {
        // formidable v2+ returns file object with filepath
        const filepath = f.filepath || f.path || f.file; // defensive
        const name = path.basename(filepath);
        saved.push(`${baseUrl}/uploads/${name}`);
      };

      if (Array.isArray(files.images)) files.images.forEach(normalize);
      else if (files.images) normalize(files.images);

      return sendJson(res, 200, { urls: saved });
    });
  }

  // Serve uploaded files
  if (req.method === 'GET' && pathname.startsWith('/uploads/')) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const filePath = path.join(__dirname, pathname.replace('/uploads/', 'uploads/'));
    if (!fs.existsSync(filePath)) return sendJson(res, 404, { message: 'Not found' });
    const stream = fs.createReadStream(filePath);
    const ext = path.extname(filePath).slice(1);
    const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': clientUrl });
    return stream.pipe(res);
  }

  if (req.method === "POST" && pathname.startsWith("/api/ai/")) {
    const auth = getUserFromRequest(req);
    if (!auth) return sendJson(res, 401, { message: "Unauthorized" });
    const body = await getBody(req);
    const kind = pathname.slice("/api/ai/".length);
    const content = String(body?.content || "");

    if (kind === "title") {
      return sendJson(res, 200, { title: content.replace(/<[^>]+>/g, "").trim().slice(0, 48) || "Untitled note" });
    }

    if (kind === "summarize") {
      return sendJson(res, 200, { summary: "Demo summary: this note is available in local mode." });
    }

    if (kind === "keywords") {
      return sendJson(res, 200, { keywords: ["demo", "local", "notes"] });
    }

    return sendJson(res, 404, { message: "Unknown AI action" });
  }

  return sendJson(res, 404, { message: "Not found" });
});

server.listen(port, () => {
  console.log(`Glow Pad API listening on http://localhost:${port}`);
});