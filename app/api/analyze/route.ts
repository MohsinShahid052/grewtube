
import { NextRequest, NextResponse } from 'next/server';
import * as tf from '@tensorflow/tfjs';

const sentimentModelUrl = 'https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/model.json';
let model: tf.LayersModel | null = null;

interface Comment {
  text: string;
  sentiment: string;
  author: string;
  likeCount: number;
  publishedAt: string;
  isReply: boolean;
}

const loadModel = async () => {
  if (!model) {
    console.log('Loading sentiment model...');
    try {
      await tf.ready();
      tf.disposeVariables();
      
      model = await tf.loadLayersModel(sentimentModelUrl);
      console.log('Model loaded successfully');
    } catch (error) {
      console.error('Error loading model:', error);
      model = null;
    }
  }
  return model;
};

const apiKey = process.env.YOUTUBE_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl } = body;

    console.log('Received video URL:', videoUrl);

    if (!videoUrl) {
      return NextResponse.json({ error: 'Missing video URL' }, { status: 400 });
    }

    const videoId = extractYoutubeVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL. Please provide a valid YouTube video URL.' }, { status: 400 });
    }

    console.log('Extracted video ID:', videoId);

    const loadedModel = await loadModel();
    if (!loadedModel) {
      console.error('Failed to load sentiment model');
      return NextResponse.json({ error: 'Failed to load sentiment model' }, { status: 500 });
    }

    const videoDetails = await fetchVideoDetails(videoId);
    if (!videoDetails) {
      return NextResponse.json({ error: 'Failed to fetch video details' }, { status: 500 });
    }
    // console.log('Video Title:', videoDetails.title);
    // console.log('Video Description:', videoDetails.description);
    // console.log('Views:', videoDetails.views);
    // console.log('Likes:', videoDetails.likes);
    // console.log('Comments:', videoDetails.commentCount);
    // console.log('comments:--------------------------',)

    const descriptionSentiment = await analyzeSentiment(loadedModel, videoDetails.description);

    const { positiveCommentCount, negativeCommentCount, voteCounts, comments } = await analyzeCommentsSentimentAndVotes(loadedModel, videoId);

    return NextResponse.json({
      title: videoDetails.title,
      views: videoDetails.views,
      likes: videoDetails.likes,
      sentiment: descriptionSentiment,
      commentCount:videoDetails.commentCount,
      positiveCommentCount,
      negativeCommentCount,
      voteCounts, // This will contain counts for A1, B2, C*3
      comments
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}



function extractYoutubeVideoId(url: string): string | null {
  const patterns = [
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:&.*)?$/,
    
    /^(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
    
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

async function fetchVideoDetails(videoId: string) {
  try {
    const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,statistics&key=${apiKey}`;
    const response = await fetch(youtubeApiUrl);
    const data = await response.json();

    if (data.items.length === 0) {
      return null;
    }

    const video = data.items[0];

    return {
      title: video.snippet.title,
      description: video.snippet.description,
      views: video.statistics.viewCount,
      likes: video.statistics.likeCount,
      commentCount: video.statistics.commentCount,
      comments:video.statistics.comments
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    return null;
  }
}


async function fetchRepliesForComment(parentId: string, model: tf.LayersModel): Promise<Comment[]> {
  let replies: Comment[] = [];
  let nextPageToken: string | undefined = undefined;

  do {
    const pageUrl = `https://www.googleapis.com/youtube/v3/comments?parentId=${parentId}&part=snippet&maxResults=100&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    const response = await fetch(pageUrl);
    const data = await response.json();

    if (data.items) {
      for (const item of data.items) {
        const replySnippet = item.snippet;
        const replyComment: Comment = {
          text: replySnippet.textDisplay,
          sentiment: await analyzeSentiment(model, replySnippet.textDisplay),
          author: replySnippet.authorDisplayName,
          likeCount: replySnippet.likeCount,
          publishedAt: replySnippet.publishedAt,
          isReply: true,
        };
        replies.push(replyComment);
      }
    }

    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return replies;
}

async function analyzeCommentsSentimentAndVotes(model: tf.LayersModel, videoId: string) {
  try {
    let allComments: Comment[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
      const pageUrl = `https://www.googleapis.com/youtube/v3/commentThreads?videoId=${videoId}&part=snippet,replies&maxResults=100&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      const response = await fetch(pageUrl);
      const data = await response.json();

      if (data.items) {
        for (const item of data.items) {
          const topLevelCommentSnippet = item.snippet.topLevelComment.snippet;
          const topLevelComment: Comment = {
            text: topLevelCommentSnippet.textDisplay,
            sentiment: await analyzeSentiment(model, topLevelCommentSnippet.textDisplay),
            author: topLevelCommentSnippet.authorDisplayName,
            likeCount: topLevelCommentSnippet.likeCount,
            publishedAt: topLevelCommentSnippet.publishedAt,
            isReply: false,
          };
          allComments.push(topLevelComment);

          // Fetch replies if present
          if (item.snippet.totalReplyCount > 0) {
            const replies = await fetchRepliesForComment(item.snippet.topLevelComment.id, model);
            allComments.push(...replies);
          }
        }
      }

      nextPageToken = data.nextPageToken;

    } while (nextPageToken);

    return {
      positiveCommentCount: allComments.filter(c => c.sentiment === 'positive').length,
      negativeCommentCount: allComments.filter(c => c.sentiment === 'negative').length,
      voteCounts: {
        A1: allComments.reduce((count, c) => count + (c.text.match(/\bA1\b/gi) || []).length, 0),
        B2: allComments.reduce((count, c) => count + (c.text.match(/\bB2\b/gi) || []).length, 0),
        C3: allComments.reduce((count, c) => count + (c.text.match(/\bC\*3\b/gi) || []).length, 0),
      },
      comments: allComments,
    };
  } catch (error) {
    console.error("Error fetching or analyzing comments:", error);
    return {
      positiveCommentCount: 0,
      negativeCommentCount: 0,
      voteCounts: { A1: 0, B2: 0, C3: 0 },
      comments: [],
    };
  }
}


async function analyzeSentiment(model: tf.LayersModel, text: string) {
  try {
    const processedInput = preprocessTextForSentiment(text);
    const prediction = model.predict(processedInput) as tf.Tensor;
    const sentimentScore = prediction.dataSync()[0];
    return sentimentScore > 0.5 ? 'positive' : 'negative';
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return 'unknown';
  }
}

function preprocessTextForSentiment(text: string): tf.Tensor {
  const tokens = text.split(' ').map(word => word.length); 

  const MAX_TOKENS = 100;
  if (tokens.length < MAX_TOKENS) {
    while (tokens.length < MAX_TOKENS) {
      tokens.push(0);
    }
  } else if (tokens.length > MAX_TOKENS) {
    tokens.length = MAX_TOKENS;
  }

  return tf.tensor2d([tokens], [1, MAX_TOKENS]);
}

