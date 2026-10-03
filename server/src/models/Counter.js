import mongoose from 'mongoose';

// Named, atomically-incremented sequences (e.g. the running invoice count).
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.model('Counter', counterSchema);
