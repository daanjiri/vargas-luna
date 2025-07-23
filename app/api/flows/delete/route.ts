import { NextRequest, NextResponse } from 'next/server';
import { deleteFlowFromDynamoDB } from '@/lib/aws/dynamodb';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
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
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { flow_id } = await request.json();

    // Validate required fields
    if (!flow_id) {
      return NextResponse.json(
        { error: 'Missing required field: flow_id' },
        { status: 400 }
      );
    }

    // Delete flow from DynamoDB
    await deleteFlowFromDynamoDB(user.id, flow_id);

    return NextResponse.json({
      success: true,
      message: 'Flow deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting flow:', error);
    return NextResponse.json(
      { error: 'Failed to delete flow' },
      { status: 500 }
    );
  }
} 