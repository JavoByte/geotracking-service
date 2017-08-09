import mongoose, { Schema } from 'mongoose';

const schema = new Schema({
  device: String,
  longitude: Number,
  latitude: Number,
  timestamp: Number,
});

export default mongoose.model('Location', schema);
