import mongoose, { Schema } from 'mongoose';

const schema = new Schema({
  name: String,
  public_key: String,
});

export default mongoose.model('Application', schema);
