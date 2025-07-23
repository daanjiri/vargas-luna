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

// Helper function to create user in DynamoDB
export async function createUserInDynamoDB(supabaseUserId: string, email: string, metadata?: any) {
  const timestamp = new Date().toISOString();
  
  const params = {
    TableName: TABLE_NAME,
    Item: {
      PK: `USER#${supabaseUserId}`,
      SK: `PROFILE`,
      email,
      supabaseUserId,
      createdAt: timestamp,
      updatedAt: timestamp,
      entityType: 'USER',
      // Add any additional metadata from Supabase
      ...metadata,
    },
  };

  try {
    await dynamoDb.send(new PutCommand(params));
    return { success: true, userId: supabaseUserId };
  } catch (error) {
    console.error('Error creating user in DynamoDB:', error);
    throw error;
  }
}

// Helper function to get user from DynamoDB
export async function getUserFromDynamoDB(supabaseUserId: string) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${supabaseUserId}`,
      SK: 'PROFILE',
    },
  };

  try {
    const result = await dynamoDb.send(new GetCommand(params));
    return result.Item;
  } catch (error) {
    console.error('Error getting user from DynamoDB:', error);
    throw error;
  }
}

// Helper function to update user in DynamoDB
export async function updateUserInDynamoDB(supabaseUserId: string, updates: Record<string, any>) {
  const timestamp = new Date().toISOString();
  
  // Build update expression
  const updateExpressionParts: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};
  
  Object.entries(updates).forEach(([key, value], index) => {
    const placeholder = `#attr${index}`;
    const valuePlaceholder = `:val${index}`;
    
    updateExpressionParts.push(`${placeholder} = ${valuePlaceholder}`);
    expressionAttributeNames[placeholder] = key;
    expressionAttributeValues[valuePlaceholder] = value;
  });
  
  // Always update the updatedAt timestamp
  updateExpressionParts.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = timestamp;
  
  const params = {
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${supabaseUserId}`,
      SK: 'PROFILE',
    },
    UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  try {
    await dynamoDb.send(new UpdateCommand(params));
    return { success: true };
  } catch (error) {
    console.error('Error updating user in DynamoDB:', error);
    throw error;
  }
} 