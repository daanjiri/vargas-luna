import { NextRequest, NextResponse } from 'next/server';
import { dynamoDb } from '@/lib/aws/dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'vargas-luna-app';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const cursor = searchParams.get('cursor');

    let exclusiveStartKey;
    if (cursor) {
      try {
        exclusiveStartKey = JSON.parse(Buffer.from(cursor, 'base64').toString());
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid cursor' },
          { status: 400 }
        );
      }
    }

    // We need to scan all flows since they're distributed across different user partitions
    // In a production app, you might want to use a GSI with a common partition key for all flows
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'begins_with(SK, :sk_prefix)',
      ExpressionAttributeValues: {
        ':sk_prefix': 'FLOW#',
      },
      // Get more items to ensure we have enough after sorting
      Limit: limit * 3,
      ExclusiveStartKey: exclusiveStartKey,
    });

    const result = await dynamoDb.send(command);
    
    // Collect all flows and sort by created_at in descending order
    let allFlows = result.Items || [];
    
    // If we need more items and there are more to fetch, continue scanning
    while (allFlows.length < limit && result.LastEvaluatedKey && !exclusiveStartKey) {
      const nextCommand = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'begins_with(SK, :sk_prefix)',
        ExpressionAttributeValues: {
          ':sk_prefix': 'FLOW#',
        },
        Limit: limit * 2,
        ExclusiveStartKey: result.LastEvaluatedKey,
      });
      
      const nextResult = await dynamoDb.send(nextCommand);
      allFlows = [...allFlows, ...(nextResult.Items || [])];
      result.LastEvaluatedKey = nextResult.LastEvaluatedKey;
    }
    
    // Sort all flows by created_at in descending order
    allFlows.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
    
    // Take only the requested limit
    const paginatedFlows = allFlows.slice(0, limit);
    const hasMore = allFlows.length > limit || !!result.LastEvaluatedKey;

    let nextCursor;
    if (hasMore && result.LastEvaluatedKey) {
      nextCursor = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
    }

    return NextResponse.json({
      success: true,
      flows: paginatedFlows.map(flow => ({
        flow_id: flow.flow_id,
        title: flow.title,
        description: flow.description,
        event_type: flow.event_type,
        start_date: flow.start_date,
        end_date: flow.end_date,
        created_at: flow.created_at,
        updated_at: flow.updated_at,
        nodes: flow.nodes || [],
        edges: flow.edges || [],
      })),
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    });

  } catch (error) {
    console.error('Error loading public events:', error);
    return NextResponse.json(
      { error: 'Failed to load events' },
      { status: 500 }
    );
  }
} 