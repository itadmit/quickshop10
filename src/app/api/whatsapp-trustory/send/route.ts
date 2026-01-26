import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp-trustory/send';

/**
 * API Route for sending individual WhatsApp messages
 * Used by CRM and other parts of the app
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storeId, phoneNumber, message, imageUrl, videoUrl, audioUrl, docUrl } = body;

    if (!storeId) {
      return NextResponse.json(
        { success: false, error: 'Store ID is required' },
        { status: 400 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!message && !imageUrl && !videoUrl && !audioUrl && !docUrl) {
      return NextResponse.json(
        { success: false, error: 'Message content is required (text, image, video, audio, or document)' },
        { status: 400 }
      );
    }

    // Determine media type
    let mediaType: 'text' | 'image' | 'video' | 'audio' | 'document' = 'text';
    let mediaUrl: string | undefined;
    
    if (imageUrl) {
      mediaType = 'image';
      mediaUrl = imageUrl;
    } else if (videoUrl) {
      mediaType = 'video';
      mediaUrl = videoUrl;
    } else if (audioUrl) {
      mediaType = 'audio';
      mediaUrl = audioUrl;
    } else if (docUrl) {
      mediaType = 'document';
      mediaUrl = docUrl;
    }

    const result = await sendWhatsAppMessage({
      storeId,
      phone: phoneNumber,
      message: message || '',
      mediaType,
      mediaUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error('WhatsApp send API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

