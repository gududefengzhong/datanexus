import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DataNexus AI Agent API',
      version: '1.0.0',
      description: `
# DataNexus AI Agent API

RESTful API for AI Agents to autonomously search, purchase, and download datasets.

## Features

- 🔍 **Search & Discovery**: Find datasets by query, category, price range
- 💰 **x402 Payments**: Automatic micropayments using Solana blockchain
- 📥 **Secure Downloads**: Encrypted dataset delivery after purchase
- 🤖 **EigenAI Analysis**: Verifiable AI inference with cryptographic proofs
- 🔐 **API Key Authentication**: Secure access with Bearer tokens

## x402 Payment Protocol

This API implements the **x402 Payment Protocol** for autonomous AI Agent payments.

### How it works:

1. **Agent requests a protected resource** (e.g., dataset download)
2. **Server returns HTTP 402 Payment Required** with payment headers:
   - \`x-payment-amount\`: Price in USDC
   - \`x-payment-currency\`: Currency (USDC)
   - \`x-payment-recipient\`: Solana wallet address
   - \`x-payment-network\`: Network (solana-devnet or solana)
   - \`x-payment-facilitator\`: PayAI Facilitator URL

3. **Agent makes Solana payment** to the recipient address
4. **Agent retries request** with \`x-payment-token\` header (transaction signature)
5. **Server verifies payment** with PayAI Facilitator
6. **Server returns the protected resource**

### Example:

\`\`\`bash
# 1. Request dataset (returns 402)
curl -i "https://api.datanexus.app/api/agent/datasets/{id}/download" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Response: HTTP 402 Payment Required
# x-payment-amount: 0.5
# x-payment-recipient: 3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC1prcxcN8BD

# 2. Make Solana payment (get transaction signature)

# 3. Retry with payment token
curl "https://api.datanexus.app/api/agent/datasets/{id}/download" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "x-payment-token: YOUR_TRANSACTION_SIGNATURE" \\
  -o dataset.csv
\`\`\`

## Getting Started

1. **Get an API Key**: Visit [/dashboard/api-keys](/dashboard/api-keys)
2. **Fund your Solana wallet**: Get USDC on Solana devnet
3. **Use the Python SDK**: See examples below

## Python SDK Example

\`\`\`python
from datanexus_client import DataNexusClient

# Initialize client
client = DataNexusClient(
    api_key="your-api-key",
    solana_private_key="your-solana-private-key"
)

# Search datasets
results = client.search_datasets(query="solana", max_price=1.0)

# Download dataset (automatically handles x402 payment)
client.download_dataset(
    dataset_id="dataset-id",
    output_path="./output.csv",
    auto_pay=True
)

# Analyze dataset with EigenAI (verifiable inference)
analysis = client.analyze_dataset(
    dataset_id="dataset-id",
    prompt="Analyze market sentiment and predict price trends",
    model="gpt-4"
)

print(f"Analysis: {analysis['data']['analysis']}")
print(f"Verified: {analysis['data']['verified']}")
print(f"Proof TX: {analysis['data']['txHash']}")
\`\`\`

## Rate Limits

- 100 requests per minute per API key
- 1000 requests per hour per API key

## Support

- Documentation: https://docs.datanexus.app
- Discord: https://discord.gg/datanexus
- Email: support@datanexus.app
      `,
      contact: {
        name: 'DataNexus Team',
        url: 'https://datanexus.app',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://datanexus.app',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API Key',
          description: 'Enter your API key (get it from /dashboard/api-keys)',
        },
      },
      schemas: {
        Dataset: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Dataset ID',
            },
            name: {
              type: 'string',
              description: 'Dataset name',
            },
            description: {
              type: 'string',
              description: 'Dataset description',
            },
            category: {
              type: 'string',
              description: 'Dataset category',
            },
            price: {
              type: 'number',
              description: 'Price in USD',
            },
            fileType: {
              type: 'string',
              description: 'File type (csv, json, parquet)',
            },
            fileSize: {
              type: 'integer',
              description: 'File size in bytes',
            },
            isEncrypted: {
              type: 'boolean',
              description: 'Whether the dataset is encrypted',
            },
            views: {
              type: 'integer',
              description: 'Number of views',
            },
            purchases: {
              type: 'integer',
              description: 'Number of purchases',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            provider: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                },
                walletAddress: {
                  type: 'string',
                },
              },
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Order ID',
            },
            productId: {
              type: 'string',
              format: 'uuid',
              description: 'Product ID',
            },
            amount: {
              type: 'number',
              description: 'Order amount in USD',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed'],
              description: 'Order status',
            },
            paymentTxHash: {
              type: 'string',
              nullable: true,
              description: 'Payment transaction hash',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp',
            },
          },
        },
        Purchase: {
          type: 'object',
          properties: {
            orderId: {
              type: 'string',
              format: 'uuid',
            },
            product: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                category: { type: 'string' },
              },
            },
            amount: {
              type: 'number',
            },
            status: {
              type: 'string',
            },
            downloadCount: {
              type: 'integer',
            },
            lastDownloadAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code',
                },
                message: {
                  type: 'string',
                  description: 'Error message',
                },
                details: {
                  type: 'object',
                  description: 'Additional error details',
                },
              },
            },
          },
        },
        PaymentRequired: {
          type: 'object',
          description: 'HTTP 402 Payment Required response with x402 payment headers',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'PAYMENT_REQUIRED',
                  description: 'Error code indicating payment is required',
                },
                message: {
                  type: 'string',
                  example: 'Payment required to access this resource',
                  description: 'Human-readable error message',
                },
                details: {
                  type: 'object',
                  properties: {
                    price: {
                      type: 'string',
                      example: '0.5',
                      description: 'Price in USDC',
                    },
                    currency: {
                      type: 'string',
                      example: 'USDC',
                      description: 'Payment currency',
                    },
                    network: {
                      type: 'string',
                      example: 'solana-devnet',
                      description: 'Blockchain network',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  },
  apis: ['./app/api/agent/**/*.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)

