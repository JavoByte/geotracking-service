import mongoose, { Schema } from 'mongoose';

const schema = new Schema({
  identifier: String,
  application: { type: Schema.Types.ObjectId, ref: 'Application' },
});

export default mongoose.model('Device', schema);
