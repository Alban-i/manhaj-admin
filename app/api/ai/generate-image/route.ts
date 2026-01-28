import { NextResponse } from 'next/server';
import { generateImage, ImageGenerationModel, IMAGE_GENERATION_MODELS } from '@/lib/google-genai';

interface GenerateImageRequest {
  prompt: string;
  model: ImageGenerationModel;
  width: number;
  height: number;
}

// Upload base64 image to Cloudinary
async function uploadToCloudinary(base64: string, mimeType: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = 'markazshaafii';

  if (!cloudName) {
    throw new Error('Cloudinary cloud name not configured');
  }

  const dataUri = `data:${mimeType};base64,${base64}`;

  const formData = new FormData();
  formData.append('file', dataUri);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'image-generator');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as GenerateImageRequest;
    const { prompt, model, width, height } = body;

    // Validate input
    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!model || !IMAGE_GENERATION_MODELS[model]) {
      return NextResponse.json(
        { error: 'Invalid model specified' },
        { status: 400 }
      );
    }

    if (!width || !height || width < 1 || height < 1) {
      return NextResponse.json(
        { error: 'Valid width and height are required' },
        { status: 400 }
      );
    }

    // Check API key
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Google AI API key not configured' },
        { status: 500 }
      );
    }

    // Generate the image
    const result = await generateImage(prompt, model, width, height);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(result.base64, result.mimeType);

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error in generate-image route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
