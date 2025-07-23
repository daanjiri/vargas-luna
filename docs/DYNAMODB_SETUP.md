# DynamoDB Setup Guide for Vargas Luna App

This guide explains how to set up AWS DynamoDB to store user data when users are created through Supabase authentication.

## Overview

When a user signs up or logs in through Supabase, the app automatically creates or syncs their profile to DynamoDB with the following structure:

- **Primary Key (PK)**: `USER#<supabase_user_id>`
- **Sort Key (SK)**: `PROFILE`

## Prerequisites

1. AWS Account
2. Supabase Project
3. Node.js environment

## Step 1: Create DynamoDB Table

1. Go to AWS Console → DynamoDB
2. Click "Create table"
3. Configure the table:
   ```
   Table name: vargas-luna-app
   Partition key: PK (String)
   Sort key: SK (String)
   ```
4. Table settings:
   - Choose "On-demand" for billing mode (recommended for starting)
   - Or "Provisioned" with 5 RCU and 5 WCU for predictable costs

5. Under "Table settings", expand "Secondary indexes"
6. Click "Create global secondary index"
7. Configure GSI1:
   ```
   Partition key: GSI1PK (String)
   Sort key: GSI1SK (String)
   Index name: GSI1
   ```
8. Create the table

## Step 2: Create IAM User for DynamoDB Access

1. Go to AWS Console → IAM → Users
2. Click "Add users"
3. User name: `vargas-luna-dynamodb-user`
4. Select "Programmatic access"
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Create a custom policy with this JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/vargas-luna-app",
        "arn:aws:dynamodb:*:*:table/vargas-luna-app/index/*"
      ]
    }
  ]
}
```

8. Attach the policy to the user
9. Complete user creation and save the Access Key ID and Secret Access Key

## Step 3: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# AWS DynamoDB Configuration
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1  # or your preferred region
DYNAMODB_TABLE_NAME=vargas-luna-app

# Supabase Service Role Key (from Supabase dashboard → Settings → API)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 4: How It Works

### Automatic User Creation

1. **New User Signup**: When a user signs up via the auth modal, the app automatically creates their profile in DynamoDB
2. **Existing User Login**: When an existing Supabase user logs in, the app checks if they exist in DynamoDB and creates them if not

### Data Structure

Each user is stored with:
```javascript
{
  PK: "USER#<supabase_user_id>",
  SK: "PROFILE",
  email: "user@example.com",
  supabaseUserId: "uuid",
  name: "",
  description: "",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  entityType: "USER"
}
```

### API Endpoints

- **POST `/api/auth/create-user`**: Creates a new user in DynamoDB (called after signup)
- **POST `/api/auth/sync-user`**: Syncs existing Supabase users to DynamoDB (called on login)

## Step 5: Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Sign up a new user through the auth modal
3. Check the browser console for success messages
4. Verify in AWS DynamoDB console that the user was created

## Step 6: Storing React Flow Data

The app automatically saves React Flow exhibit data when nodes are created or modified. Each flow is stored with:

```javascript
{
  PK: "USER#<supabase_user_id>",
  SK: "FLOW#<flow_id>",
  GSI1PK: "FLOW#<flow_id>",
  GSI1SK: "<updated_timestamp>",
  flow_id: "flow-1234567890",
  user_id: "<supabase_user_id>",
  title: "My Art Exhibit",
  description: "Description of the exhibit",
  nodes: [...],  // React Flow nodes array
  edges: [...],  // React Flow edges array
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  version: 1
}
```

### Auto-Save Features

- **Automatic Saving**: The app auto-saves your flow every time you create, update, or delete nodes
- **Debounced Saving**: Changes are saved 2 seconds after you stop making modifications
- **Version Control**: Each save increments the version number
- **Visual Feedback**: The UI shows saving status and last saved time

### API Endpoints

- **POST `/api/flows/save`**: Saves flow data to DynamoDB
- **GET `/api/flows/load?flow_id=<id>`**: Loads a specific flow
- **GET `/api/flows/load`**: Lists all flows for the authenticated user

## Troubleshooting

1. **"User not found in Supabase" error**: Ensure SUPABASE_SERVICE_ROLE_KEY is set correctly
2. **"Failed to create user in DynamoDB" error**: Check AWS credentials and table name
3. **"supabaseKey is required" error**: Make sure SUPABASE_SERVICE_ROLE_KEY is set in your `.env.local` file

## Next Steps

1. Implement exhibit saving functionality
2. Add user profile editing
3. Set up real-time synchronization
4. Implement data backup strategies 