import { NextRequest, NextResponse } from 'next/server';
import { createUserInDynamoDB } from '@/lib/aws/dynamodb';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const { userId, email, name, description } = await request.json();

    // Verify the user exists in Supabase
    const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (error || !userData || !userData.user) {
      return NextResponse.json(
        { error: 'User not found in Supabase' },
        { status: 404 }
      );
    }

    const user = userData.user;

    // Create user in DynamoDB
    const result = await createUserInDynamoDB({
      user_id: userId,
      email: email || user.email!,
      name: name || '',
      description: description || '',
    });

    return NextResponse.json({ 
      success: true, 
      message: 'User created in DynamoDB',
      userId: userId 
    });

  } catch (error) {
    console.error('Error creating user in DynamoDB:', error);
    return NextResponse.json(
      { error: 'Failed to create user in DynamoDB' },
      { status: 500 }
    );
  }
} 