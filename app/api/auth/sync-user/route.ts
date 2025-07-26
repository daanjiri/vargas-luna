import { NextRequest, NextResponse } from 'next/server';
import { createUserInDynamoDB, getUserFromDynamoDB } from '@/lib/aws/dynamodb';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    // Verify the user's token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user already exists in DynamoDB
    try {
      const existingUser = await getUserFromDynamoDB(user.id);
      
      if (existingUser) {
        return NextResponse.json({ 
          success: true, 
          message: 'User already exists in DynamoDB',
          userId: user.id,
          alreadyExists: true
        });
      }
    } catch (error) {
      // User doesn't exist, continue to create
    }

    // Create user in DynamoDB
    await createUserInDynamoDB({
      user_id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || '',
      description: user.user_metadata?.description || '',
    });

    return NextResponse.json({ 
      success: true, 
      message: 'User synced to DynamoDB',
      userId: user.id,
      alreadyExists: false
    });

  } catch (error) {
    console.error('Error syncing user to DynamoDB:', error);
    return NextResponse.json(
      { error: 'Failed to sync user to DynamoDB' },
      { status: 500 }
    );
  }
} 