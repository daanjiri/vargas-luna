import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Create DynamoDB Document client for easier JSON handling
export const dynamoDb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Table name from environment variable
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'vargas-luna-app';

// Types for our data structures
interface UserProfile {
  user_id: string;
  name: string;
  description: string;
  email: string;
  created_at: string;
  updated_at: string;
}

interface FlowData {
  flow_id: string;
  user_id: string;
  title: string;
  description?: string;
  nodes: any[];
  edges: any[];
  created_at: string;
  updated_at: string;
  version: number;
}

// Helper function to create user in DynamoDB
export async function createUserInDynamoDB(userData: {
  user_id: string;
  email: string;
  name?: string;
  description?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  
  const userProfile: UserProfile = {
    user_id: userData.user_id,
    name: userData.name || 'Anonymous User',
    description: userData.description || '',
    email: userData.email,
    created_at: now,
    updated_at: now,
  };

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: `USER#${userData.user_id}`,
      SK: 'PROFILE',
      ...userProfile,
    },
  });

  await dynamoDb.send(command);
}

// Helper function to get user from DynamoDB
export async function getUserFromDynamoDB(userId: string): Promise<UserProfile | null> {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
    },
  });

  const result = await dynamoDb.send(command);
  return result.Item as UserProfile | null;
}

// Helper function to update user in DynamoDB
export async function updateUserInDynamoDB(
  userId: string,
  updates: Partial<Omit<UserProfile, 'user_id' | 'created_at'>>
): Promise<void> {
  const now = new Date().toISOString();
  
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
    },
    UpdateExpression: 'SET updated_at = :updated_at',
    ExpressionAttributeValues: {
      ':updated_at': now,
    },
  });

  // Add other fields to update
  const updateFields = Object.keys(updates).filter(key => key !== 'updated_at');
  if (updateFields.length > 0) {
    const setExpressions = updateFields.map(field => `${field} = :${field}`);
    command.input.UpdateExpression = `SET ${setExpressions.join(', ')}, updated_at = :updated_at`;
    
    updateFields.forEach(field => {
      command.input.ExpressionAttributeValues![`:${field}`] = updates[field as keyof typeof updates];
    });
  }

  await dynamoDb.send(command);
}

// Helper function to save/update flow in DynamoDB
export async function saveFlowToDynamoDB(flowData: {
  flow_id: string;
  user_id: string;
  title: string;
  description?: string;
  nodes: any[];
  edges: any[];
}): Promise<void> {
  const now = new Date().toISOString();
  
  // First, check if flow exists to get current version
  const existingFlow = await getFlowFromDynamoDB(flowData.user_id, flowData.flow_id);
  const version = existingFlow ? existingFlow.version + 1 : 1;
  
  const flow: FlowData = {
    ...flowData,
    created_at: existingFlow?.created_at || now,
    updated_at: now,
    version,
  };

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: `USER#${flowData.user_id}`,
      SK: `FLOW#${flowData.flow_id}`,
      GSI1PK: `FLOW#${flowData.flow_id}`,
      GSI1SK: now,
      ...flow,
    },
  });

  await dynamoDb.send(command);
}

// Helper function to get flow from DynamoDB
export async function getFlowFromDynamoDB(userId: string, flowId: string): Promise<FlowData | null> {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: `FLOW#${flowId}`,
    },
  });

  const result = await dynamoDb.send(command);
  return result.Item as FlowData | null;
}

// Helper function to get all flows for a user with pagination
export async function getUserFlowsFromDynamoDB(
  userId: string, 
  limit: number = 10, 
  lastEvaluatedKey?: Record<string, any>
): Promise<{
  flows: FlowData[];
  lastEvaluatedKey?: Record<string, any>;
  hasMore: boolean;
}> {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk_prefix)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':sk_prefix': 'FLOW#',
    },
    Limit: limit,
    ScanIndexForward: false, // Sort by SK in descending order (newest first)
    ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey }),
  });

  const result = await dynamoDb.send(command);
  
  return {
    flows: (result.Items as FlowData[]) || [],
    lastEvaluatedKey: result.LastEvaluatedKey,
    hasMore: !!result.LastEvaluatedKey,
  };
}

// Helper function to delete flow from DynamoDB
export async function deleteFlowFromDynamoDB(userId: string, flowId: string): Promise<void> {
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: `FLOW#${flowId}`,
    },
  });

  await dynamoDb.send(command);
} 