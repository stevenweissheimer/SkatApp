import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skat-turnierbuch';

// Frühzeitige Warnung wenn die URI nicht aufgelöste Platzhalter enthält
if (MONGODB_URI.includes('${') || MONGODB_URI.includes('${{')) {
  console.error(
    '⚠️  MONGODB_URI enthält nicht aufgelöste Platzhalter:',
    MONGODB_URI,
    '\n→ Prüfe deine Umgebungsvariablen (Railway: ${{ServiceName.RAILWAY_PRIVATE_DOMAIN}})'
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB-Verbindung fehlgeschlagen:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));
    throw e;
  }

  return cached.conn;
}
