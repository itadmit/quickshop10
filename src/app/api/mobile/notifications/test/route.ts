// Test endpoint for push notifications (development only)
import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotifications, type ExpoPushMessage } from '@/lib/push-notifications';
import { db } from '@/lib/db';
import { mobileDevices, users, stores } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/mobile/notifications/test
// Body: { email: string, token?: string }
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }
  
  try {
    const body = await request.json();
    const { email, token } = body;
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // If token provided, update the device
    if (token) {
      await db
        .update(mobileDevices)
        .set({ pushToken: token, updatedAt: new Date() })
        .where(eq(mobileDevices.userId, user.id));
    }
    
    // Get device with push token
    const [device] = await db
      .select()
      .from(mobileDevices)
      .where(eq(mobileDevices.userId, user.id))
      .limit(1);
    
    if (!device) {
      return NextResponse.json({
        success: false,
        error: 'No device registered for this user',
        help: 'User needs to login from the mobile app first'
      }, { status: 404 });
    }
    
    if (!device.pushToken || device.pushToken === 'TEST_TOKEN_PLACEHOLDER') {
      return NextResponse.json({
        success: false,
        error: 'No push token registered',
        device: {
          id: device.id,
          platform: device.platform,
          hasToken: !!device.pushToken,
        },
        help: 'To get the push token, in your React Native app call: await Notifications.getExpoPushTokenAsync() and send it to POST /api/mobile/notifications { pushToken: "..." }'
      }, { status: 400 });
    }
    
    // Get user's store for context
    const [store] = await db
      .select()
      .from(stores)
      .where(eq(stores.ownerId, user.id))
      .limit(1);
    
    // Send test notification!
    const message: ExpoPushMessage = {
      to: device.pushToken,
      sound: 'default',
      title: '🧪 בדיקת Push!',
      body: `שלום ${user.name || 'משתמש'}! זו הודעת בדיקה מ-${store?.name || 'QuickShop'}`,
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
      priority: 'high',
    };
    
    const tickets = await sendPushNotifications([message]);
    const result = tickets[0];
    
    return NextResponse.json({
      success: true,
      message: 'Push notification sent!',
      result,
      device: {
        id: device.id,
        platform: device.platform,
        tokenPreview: device.pushToken.substring(0, 30) + '...',
      }
    });
    
  } catch (error) {
    console.error('Test push notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

// GET /api/mobile/notifications/test?email=xxx
// Check device status
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'This endpoint is only available in development' },
      { status: 403 }
    );
  }
  
  const email = request.nextUrl.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({
      success: false,
      error: 'Email query param is required',
      usage: 'GET /api/mobile/notifications/test?email=admin@admin.com'
    }, { status: 400 });
  }
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  
  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }
  
  const devices = await db
    .select({
      id: mobileDevices.id,
      platform: mobileDevices.platform,
      pushToken: mobileDevices.pushToken,
      notifyNewOrders: mobileDevices.notifyNewOrders,
      lastActiveAt: mobileDevices.lastActiveAt,
    })
    .from(mobileDevices)
    .where(eq(mobileDevices.userId, user.id));
  
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    devices: devices.map(d => ({
      id: d.id,
      platform: d.platform,
      hasPushToken: !!d.pushToken && d.pushToken !== 'TEST_TOKEN_PLACEHOLDER',
      tokenPreview: d.pushToken ? d.pushToken.substring(0, 30) + '...' : null,
      notifyNewOrders: d.notifyNewOrders,
      lastActiveAt: d.lastActiveAt,
    })),
    help: devices.some(d => d.pushToken && d.pushToken !== 'TEST_TOKEN_PLACEHOLDER')
      ? 'Ready to send! POST to this endpoint with { "email": "..." }'
      : 'No push token yet. From the mobile app, call the /api/mobile/notifications endpoint with the pushToken from Expo.',
  });
}

