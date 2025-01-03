import mongoose, { Schema, Document } from 'mongoose';

interface User extends Document {
  username: string;
  email: string;
  password?: string;
  role: string;
  provider?: string;
  links?: { 
    url: string; 
    createdAt: Date; 
    winningVote?: string; 
  }[];
}

const userSchema = new Schema<User>({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
  },
  role: {
    type: String,
    default: 'user', 
  },
  provider: {
    type: String,  
    default: 'credentials',  
  },
  links: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      url: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      winningVote: { 
        type: String,
        required: false,
      },
    },
  ],
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model<User>('User', userSchema);
export default User;
