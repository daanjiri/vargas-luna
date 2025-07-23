import { NextRequest, NextResponse } from 'next/server';
import { getFlowFromDynamoDB, getUserFlowsFromDynamoDB } from '@/lib/aws/dynamodb';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const flowId = searchParams.get('flow_id');

    if (flowId) {
      // Load specific flow
      const flow = await getFlowFromDynamoDB(user.id, flowId);
      
      if (!flow) {
        return NextResponse.json(
          { error: 'Flow not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        flow,
      });
    } else {
      // Load all flows for user
      const flows = await getUserFlowsFromDynamoDB(user.id);
      
      return NextResponse.json({
        success: true,
        flows,
      });
    }

  } catch (error) {
    console.error('Error loading flow(s):', error);
    return NextResponse.json(
      { error: 'Failed to load flow(s)' },
      { status: 500 }
    );
  }
} 