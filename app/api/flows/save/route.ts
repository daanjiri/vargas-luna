import { NextRequest, NextResponse } from 'next/server';
import { saveFlowToDynamoDB } from '@/lib/aws/dynamodb';
import { supabase } from '@/lib/supabase';

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
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { flow_id, title, description, nodes, edges } = await request.json();

    // Validate required fields
    if (!flow_id || !title || !nodes || !edges) {
      return NextResponse.json(
        { error: 'Missing required fields: flow_id, title, nodes, edges' },
        { status: 400 }
      );
    }

    // Save flow to DynamoDB
    await saveFlowToDynamoDB({
      flow_id,
      user_id: user.id,
      title,
      description,
      nodes,
      edges,
    });

    return NextResponse.json({
      success: true,
      flow_id,
      message: 'Flow saved successfully',
    });

  } catch (error) {
    console.error('Error saving flow:', error);
    return NextResponse.json(
      { error: 'Failed to save flow' },
      { status: 500 }
    );
  }
} 