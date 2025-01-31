import mongoose, { Schema, Document } from 'mongoose';

interface Comment {
  text: string;
  sentiment: string;
  author: string;
  likeCount: number;
  publishedAt: string;
}

interface User extends Document {
  username: string;
  email: string;
  password?: string;
  role: string;
  provider?: string;
  links?: { 
    url: string; 
    createdAt: Date; 
    comments?: Comment[];
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
      comments: [
        {
          text: {
            type: String,
            required: true,
          },
          sentiment: {
            type: String,
            required: true,
          },
          author: {
            type: String,
            required: true,
          },
          likeCount: {
            type: Number,
            required: true,
          },
          publishedAt: {
            type: String,
            required: true,
          },
          isReply: {
            type: Boolean,
            required: true,
          },
        },
      ],
    },
  ],
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model<User>('User', userSchema);
export default User;
