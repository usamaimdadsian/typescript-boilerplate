import { DynamoDB } from '@aws-sdk/client-dynamodb';
import config from "./config"

// Configure AWS credentials
const credentials = {
  accessKeyId: config.aws.key,
  secretAccessKey: config.aws.secret,
};
const region = config.aws.region; // Change to your desired AWS region

// Create a DynamoDB client
const dynamoDB = new DynamoDB({ credentials, region });
export default dynamoDB