import mongoose, { Schema } from 'mongoose';

const schema = new Schema({
  device: { type: Schema.Types.ObjectId, ref: 'Device' },
  longitude: Number,
  latitude: Number,
  timestamp: Number,
});

export default mongoose.model('Location', schema);
