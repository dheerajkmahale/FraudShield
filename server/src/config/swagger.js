const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const {
  ROLES,
  ROLE_VALUES,
  TRANSACTION_TYPES,
  PAYMENT_METHODS,
  TRANSACTION_STATUS,
  FRAUD_STATUS_VALUES,
  RISK_LEVELS,
  INVESTIGATION_STATUS,
  INVESTIGATION_PRIORITY,
  NOTIFICATION_TYPES,
} = require('./constants');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'FraudShield API',
    version: '1.0.0',
    description:
      'Financial Fraud Detection & Investigation Platform REST API. Provides automated transaction risk scoring, relationship topology graphs, case management, real-time alerts, and comprehensive audit logs.',
    contact: {
      name: 'FraudShield Security Engineering',
      email: 'security@fraudshield.dev',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development Server',
    },
    {
      url: '/',
      description: 'Current Host',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token obtained from `/api/auth/login` or `/api/auth/register`',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object', nullable: true },
        },
      },
      ApiErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Resource not found' },
          details: { type: 'array', items: { type: 'string' }, nullable: true },
        },
      },
      ValidationErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'amount' },
                message: { type: 'string', example: 'Amount must be a positive number' },
              },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 125 },
          totalPages: { type: 'integer', example: 7 },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6aae9a2e63a6134841ea17b9' },
          name: { type: 'string', example: 'Ava Admin' },
          email: { type: 'string', format: 'email', example: 'admin@fraudshield.dev' },
          role: { type: 'string', enum: ROLE_VALUES, example: 'admin' },
          isActive: { type: 'boolean', example: true },
          lastLogin: { type: 'string', format: 'date-time', nullable: true, example: '2026-09-23T08:34:10.339Z' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-09-19T14:20:30.086Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-09-23T08:34:10.342Z' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66eb4b1234567890abcdef12' },
          transactionRef: { type: 'string', example: 'TXN-1727042000-48291' },
          senderAccount: { type: 'string', example: 'ACC-0012' },
          receiverAccount: { type: 'string', example: 'ACC-0045' },
          amount: { type: 'number', example: 45000 },
          currency: { type: 'string', example: 'INR' },
          transactionType: { type: 'string', enum: TRANSACTION_TYPES, example: 'transfer' },
          paymentMethod: { type: 'string', enum: PAYMENT_METHODS, example: 'upi' },
          status: { type: 'string', enum: TRANSACTION_STATUS, example: 'completed' },
          location: { type: 'string', example: 'Mumbai, IN' },
          ipAddress: { type: 'string', example: '103.21.244.0' },
          deviceInfo: { type: 'string', example: 'Mobile / Android 14' },
          occurredAt: { type: 'string', format: 'date-time', example: '2026-09-22T10:14:00.000Z' },
          riskScore: { type: 'number', minimum: 0, maximum: 100, example: 84 },
          riskLevel: { type: 'string', enum: Object.values(RISK_LEVELS), example: 'critical' },
          fraudStatus: { type: 'string', enum: FRAUD_STATUS_VALUES, example: 'flagged' },
          suspicionReasons: {
            type: 'array',
            items: { type: 'string' },
            example: ['Velocity anomaly: 4 transactions within 10 minutes', 'High-risk recipient account hash'],
          },
          detectedAt: { type: 'string', format: 'date-time', nullable: true },
          investigation: { type: 'string', nullable: true, example: null },
          createdBy: { type: 'string', nullable: true, example: '6aae9a2e63a6134841ea17b9' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      InvestigationNote: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66eb4b9876543210abcdef99' },
          author: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string' },
            },
          },
          text: { type: 'string', example: 'Subpoena issued for recipient KYC verification.' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Investigation: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66eb4b8899aabbccddeeff00' },
          caseId: { type: 'string', example: 'INV-1727042000-8421' },
          title: { type: 'string', example: 'Mule Ring Velocity Burst in Delhi Region' },
          description: { type: 'string', example: 'Coordinated withdrawals across 6 linked accounts within 30 minutes.' },
          assignedTo: {
            type: 'object',
            nullable: true,
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string' },
            },
          },
          createdBy: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string' },
            },
          },
          relatedTransactions: {
            type: 'array',
            items: { $ref: '#/components/schemas/Transaction' },
          },
          priority: { type: 'string', enum: INVESTIGATION_PRIORITY, example: 'urgent' },
          status: { type: 'string', enum: INVESTIGATION_STATUS, example: 'under_investigation' },
          notes: {
            type: 'array',
            items: { $ref: '#/components/schemas/InvestigationNote' },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66eb4b112233445566778899' },
          user: { type: 'string', example: '6aae9a2e63a6134841ea17b9' },
          type: { type: 'string', enum: NOTIFICATION_TYPES, example: 'critical_transaction' },
          message: { type: 'string', example: 'Critical risk transaction flagged: TXN-1727042000-48291 (Risk Score: 84)' },
          relatedTransaction: { type: 'string', nullable: true },
          relatedInvestigation: { type: 'string', nullable: true },
          isRead: { type: 'boolean', example: false },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '66eb4baa11bb22cc33dd44ee' },
          user: {
            type: 'object',
            nullable: true,
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string' },
            },
          },
          action: { type: 'string', example: 'TRANSACTION_CREATE' },
          resource: { type: 'string', example: 'Transaction' },
          resourceId: { type: 'string', nullable: true, example: '66eb4b1234567890abcdef12' },
          metadata: { type: 'object', example: { riskScore: 84, riskLevel: 'critical' } },
          ipAddress: { type: 'string', example: '127.0.0.1' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DashboardStatistics: {
        type: 'object',
        properties: {
          totalTransactions: { type: 'integer', example: 238 },
          totalTransactionValue: { type: 'number', example: 14258900.5 },
          suspiciousTransactions: { type: 'integer', example: 16 },
          criticalRiskTransactions: { type: 'integer', example: 2 },
          activeInvestigations: { type: 'integer', example: 5 },
          totalUsers: { type: 'integer', example: 3 },
          fraudRate: { type: 'number', example: 6.72 },
          avgRiskScore: { type: 'number', example: 24.35 },
        },
      },
      NetworkNode: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'ACC-0012' },
          transactionCount: { type: 'integer', example: 18 },
          suspiciousCount: { type: 'integer', example: 4 },
        },
      },
      NetworkEdge: {
        type: 'object',
        properties: {
          source: { type: 'string', example: 'ACC-0012' },
          target: { type: 'string', example: 'ACC-0045' },
          amount: { type: 'number', example: 45000 },
          transactionRef: { type: 'string', example: 'TXN-1727042000-48291' },
          suspicious: { type: 'boolean', example: true },
          riskLevel: { type: 'string', enum: Object.values(RISK_LEVELS), example: 'critical' },
        },
      },
      NetworkGraph: {
        type: 'object',
        properties: {
          nodes: { type: 'array', items: { $ref: '#/components/schemas/NetworkNode' } },
          edges: { type: 'array', items: { $ref: '#/components/schemas/NetworkEdge' } },
        },
      },
    },
  },
  paths: {
    // --- System / Health ---
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health Check',
        description: 'Verify that the FraudShield Express backend is online and running.',
        responses: {
          200: {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'FraudShield API is running' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // --- Authentication ---
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register new platform user',
        description: 'Create a new user account with initial role and receive a JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', minLength: 2, maxLength: 80, example: 'Sarah Investigator' },
                  email: { type: 'string', format: 'email', example: 'sarah@fraudshield.dev' },
                  password: { type: 'string', minLength: 8, example: 'SecurePass123' },
                  role: { type: 'string', enum: ROLE_VALUES, default: 'analyst', example: 'investigator' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Registration successful' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                      },
                    },
                  },
                },
              },
            },
          },
          409: { description: 'Email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorResponse' } } } },
          422: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate and log in user',
        description: 'Validates user credentials, records a login audit event, and returns a JWT token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@fraudshield.dev' },
                  password: { type: 'string', example: 'Admin@1234' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Authentication successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Login successful' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid email or password', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorResponse' } } } },
          403: { description: 'Account deactivated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorResponse' } } } },
          422: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } } },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user object retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Current user retrieved' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Not authorized or invalid token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorResponse' } } } },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out current user',
        security: [{ bearerAuth: [] }],
        description: 'Records an audit log entry for user sign-out.',
        responses: {
          200: {
            description: 'Logged out successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Logged out successfully' },
                    data: { type: 'object', nullable: true },
                  },
                },
              },
            },
          },
          401: { description: 'Not authorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorResponse' } } } },
        },
      },
    },

    // --- Users ---
    '/api/users/profile': {
      put: {
        tags: ['Users'],
        summary: 'Update own user profile name',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 2, maxLength: 80, example: 'Ava Admin (Updated)' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Profile updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Profile updated' },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorResponse' } } } },
        },
      },
    },
    '/api/users/change-password': {
      put: {
        tags: ['Users'],
        summary: 'Change account password',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string', example: 'Admin@1234' },
                  newPassword: { type: 'string', minLength: 8, example: 'Admin@5678' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Password changed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Password changed successfully' },
                    data: { type: 'object', nullable: true },
                  },
                },
              },
            },
          },
          400: { description: 'Current password is incorrect', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiErrorResponse' } } } },
          422: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } } },
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ROLE_VALUES } },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'List of users with pagination',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Users retrieved' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    meta: { properties: { pagination: { $ref: '#/components/schemas/PaginationMeta' } } },
                  },
                },
              },
            },
          },
          403: { description: 'Admin privilege required' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'User details retrieved',
            content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { $ref: '#/components/schemas/User' } } } } },
          },
          404: { description: 'User not found' },
        },
      },
    },
    '/api/users/{id}/role': {
      put: {
        tags: ['Users'],
        summary: 'Update user role (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: { role: { type: 'string', enum: ROLE_VALUES } },
              },
            },
          },
        },
        responses: {
          200: { description: 'User role updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { $ref: '#/components/schemas/User' } } } } } },
          404: { description: 'User not found' },
        },
      },
    },
    '/api/users/{id}/status': {
      put: {
        tags: ['Users'],
        summary: 'Activate or deactivate user account (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isActive'],
                properties: { isActive: { type: 'boolean' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'User status updated', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { $ref: '#/components/schemas/User' } } } } } },
          404: { description: 'User not found' },
        },
      },
    },

    // --- Transactions ---
    '/api/transactions': {
      get: {
        tags: ['Transactions'],
        summary: 'Search and filter transactions',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'minAmount', in: 'query', schema: { type: 'number' } },
          { name: 'maxAmount', in: 'query', schema: { type: 'number' } },
          { name: 'riskLevel', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: TRANSACTION_STATUS } },
          { name: 'fraudStatus', in: 'query', schema: { type: 'string', enum: FRAUD_STATUS_VALUES } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'occurredAt' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
        ],
        responses: {
          200: {
            description: 'Paginated transactions list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Transactions retrieved' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
                    meta: { properties: { pagination: { $ref: '#/components/schemas/PaginationMeta' } } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Transactions'],
        summary: 'Create and analyze new transaction',
        security: [{ bearerAuth: [] }],
        description: 'Analyzes the transaction against multi-factor fraud detection heuristics (amount, velocity, geography, device, time) and assigns an automated risk score.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['senderAccount', 'receiverAccount', 'amount', 'transactionType', 'paymentMethod'],
                properties: {
                  senderAccount: { type: 'string', example: 'ACC-1002' },
                  receiverAccount: { type: 'string', example: 'ACC-8091' },
                  amount: { type: 'number', minimum: 0.01, example: 55000 },
                  currency: { type: 'string', default: 'INR', example: 'INR' },
                  transactionType: { type: 'string', enum: TRANSACTION_TYPES, example: 'transfer' },
                  paymentMethod: { type: 'string', enum: PAYMENT_METHODS, example: 'upi' },
                  status: { type: 'string', enum: TRANSACTION_STATUS, default: 'completed' },
                  location: { type: 'string', example: 'Bengaluru, IN' },
                  ipAddress: { type: 'string', example: '49.207.200.12' },
                  deviceInfo: { type: 'string', example: 'Web / Chrome 129' },
                  occurredAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Transaction created and analyzed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Transaction created and analyzed' },
                    data: { $ref: '#/components/schemas/Transaction' },
                  },
                },
              },
            },
          },
          422: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } } },
        },
      },
    },
    '/api/transactions/statistics': {
      get: {
        tags: ['Transactions'],
        summary: 'Get transaction statistical breakdown',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Aggregated analytics and distribution metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Statistics retrieved' },
                    data: {
                      type: 'object',
                      properties: {
                        summary: {
                          type: 'object',
                          properties: {
                            totalTransactions: { type: 'integer' },
                            totalValue: { type: 'number' },
                            avgRiskScore: { type: 'number' },
                            suspiciousCount: { type: 'integer' },
                            criticalCount: { type: 'integer' },
                            fraudRate: { type: 'number' },
                          },
                        },
                        riskDistribution: { type: 'array', items: { type: 'object', properties: { _id: { type: 'string' }, count: { type: 'integer' } } } },
                        typeDistribution: { type: 'array', items: { type: 'object', properties: { _id: { type: 'string' }, count: { type: 'integer' } } } },
                        timeSeries: { type: 'array', items: { type: 'object', properties: { _id: { type: 'string' }, count: { type: 'integer' }, suspiciousCount: { type: 'integer' }, totalAmount: { type: 'number' } } } },
                        topSuspiciousAccounts: { type: 'array', items: { type: 'object', properties: { _id: { type: 'string' }, suspiciousCount: { type: 'integer' }, totalAmount: { type: 'number' }, maxRiskScore: { type: 'number' } } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/transactions/suspicious': {
      get: {
        tags: ['Transactions'],
        summary: 'List suspicious and flagged transactions',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'minAmount', in: 'query', schema: { type: 'number' } },
          { name: 'maxAmount', in: 'query', schema: { type: 'number' } },
          { name: 'riskLevel', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] } },
        ],
        responses: {
          200: {
            description: 'List of suspicious transactions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Suspicious transactions retrieved' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
                    meta: { properties: { pagination: { $ref: '#/components/schemas/PaginationMeta' } } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/transactions/network': {
      get: {
        tags: ['Transactions'],
        summary: 'Get account relationship topology network graph',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 300, maximum: 1000 }, description: 'Max transactions to process for relationship nodes/edges' },
        ],
        responses: {
          200: {
            description: 'Graph data containing account nodes and transaction flow edges',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Network data retrieved' },
                    data: { $ref: '#/components/schemas/NetworkGraph' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/transactions/{id}': {
      get: {
        tags: ['Transactions'],
        summary: 'Get single transaction by ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Transaction details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Transaction retrieved' },
                    data: { $ref: '#/components/schemas/Transaction' },
                  },
                },
              },
            },
          },
          404: { description: 'Transaction not found' },
        },
      },
      put: {
        tags: ['Transactions'],
        summary: 'Update transaction status or fraud classification',
        security: [{ bearerAuth: [] }],
        description: 'Allowed for Admin and Investigator roles. Automatically re-evaluates risk score when status or fraud status changes.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  amount: { type: 'number' },
                  transactionType: { type: 'string', enum: TRANSACTION_TYPES },
                  paymentMethod: { type: 'string', enum: PAYMENT_METHODS },
                  status: { type: 'string', enum: TRANSACTION_STATUS },
                  location: { type: 'string' },
                  fraudStatus: { type: 'string', enum: FRAUD_STATUS_VALUES },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Transaction updated successfully', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { $ref: '#/components/schemas/Transaction' } } } } } },
          404: { description: 'Transaction not found' },
        },
      },
      delete: {
        tags: ['Transactions'],
        summary: 'Delete transaction (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Transaction deleted successfully', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } } } } },
          404: { description: 'Transaction not found' },
        },
      },
    },

    // --- Investigations ---
    '/api/investigations': {
      get: {
        tags: ['Investigations'],
        summary: 'List investigations with filters',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: INVESTIGATION_STATUS } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: INVESTIGATION_PRIORITY } },
          { name: 'assignedTo', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Paginated investigations list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Investigations retrieved' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Investigation' } },
                    meta: { properties: { pagination: { $ref: '#/components/schemas/PaginationMeta' } } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Investigations'],
        summary: 'Create new investigation case',
        security: [{ bearerAuth: [] }],
        description: 'Allowed for Admin and Investigator roles. Links suspicious transactions and notifies assigned investigator.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', minLength: 3, maxLength: 150, example: 'Syndicate Velocity Transfer Analysis' },
                  description: { type: 'string', maxLength: 3000, example: 'Multi-account layering detected from Delhi nodes.' },
                  assignedTo: { type: 'string', example: '6aae9a2e63a6134841ea17b9' },
                  relatedTransactions: { type: 'array', items: { type: 'string' } },
                  priority: { type: 'string', enum: INVESTIGATION_PRIORITY, default: 'medium' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Investigation case created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Investigation created' },
                    data: { $ref: '#/components/schemas/Investigation' },
                  },
                },
              },
            },
          },
          422: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } } },
        },
      },
    },
    '/api/investigations/{id}': {
      get: {
        tags: ['Investigations'],
        summary: 'Get investigation case details',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Case details with notes, creator, and related transactions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Investigation retrieved' },
                    data: { $ref: '#/components/schemas/Investigation' },
                  },
                },
              },
            },
          },
          404: { description: 'Investigation not found' },
        },
      },
      put: {
        tags: ['Investigations'],
        summary: 'Update investigation case status or priority',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', minLength: 3, maxLength: 150 },
                  status: { type: 'string', enum: INVESTIGATION_STATUS },
                  priority: { type: 'string', enum: INVESTIGATION_PRIORITY },
                  assignedTo: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Investigation updated successfully', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { $ref: '#/components/schemas/Investigation' } } } } } },
          404: { description: 'Investigation not found' },
        },
      },
    },
    '/api/investigations/{id}/notes': {
      post: {
        tags: ['Investigations'],
        summary: 'Add investigator case note',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: { type: 'string', minLength: 1, maxLength: 2000, example: 'Verified destination account. Freezing funds pending police inquiry.' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Note added to investigation', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { $ref: '#/components/schemas/Investigation' } } } } } },
          404: { description: 'Investigation not found' },
        },
      },
    },
    '/api/investigations/{id}/link-transaction': {
      post: {
        tags: ['Investigations'],
        summary: 'Link transaction to investigation case',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['transactionId'],
                properties: { transactionId: { type: 'string', example: '66eb4b1234567890abcdef12' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Transaction linked to investigation', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { $ref: '#/components/schemas/Investigation' } } } } } },
          404: { description: 'Investigation or transaction not found' },
        },
      },
    },

    // --- Notifications ---
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'List notifications for current user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'isRead', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: {
            description: 'User notification inbox',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Notifications retrieved' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
                    meta: {
                      properties: {
                        unreadCount: { type: 'integer', example: 3 },
                        pagination: { $ref: '#/components/schemas/PaginationMeta' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/notifications/read-all': {
      put: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'All notifications marked as read', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/api/notifications/{id}/read': {
      put: {
        tags: ['Notifications'],
        summary: 'Mark single notification as read',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Notification marked as read', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: { $ref: '#/components/schemas/Notification' } } } } } },
          404: { description: 'Notification not found' },
        },
      },
    },

    // --- Audit Logs ---
    '/api/audit-logs': {
      get: {
        tags: ['Audit Logs'],
        summary: 'List audit trail logs (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 30 } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'resource', in: 'query', schema: { type: 'string' } },
          { name: 'user', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          200: {
            description: 'Audit trail records with actor details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Audit logs retrieved' },
                    data: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } },
                    meta: { properties: { pagination: { $ref: '#/components/schemas/PaginationMeta' } } },
                  },
                },
              },
            },
          },
          403: { description: 'Admin privilege required' },
        },
      },
    },

    // --- Dashboard ---
    '/api/dashboard/statistics': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get consolidated platform KPI statistics',
        security: [{ bearerAuth: [] }],
        description: 'Aggregates threat counters, operational transaction value, fraud rate, and active investigation counts in a single payload.',
        responses: {
          200: {
            description: 'Dashboard aggregated metrics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Dashboard statistics retrieved' },
                    data: { $ref: '#/components/schemas/DashboardStatistics' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const swaggerOptions = {
  swaggerDefinition,
  apis: [], // All endpoints explicitly defined above for complete accuracy
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const customUiOptions = {
  customSiteTitle: 'FraudShield API Documentation',
  customCss: `
    .swagger-ui .topbar { background-color: #0A0E0C; border-bottom: 1px solid rgba(57, 255, 158, 0.2); }
    .swagger-ui .topbar-wrapper img { content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2339FF9E"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.67-3.13 9.03-7 10.18-3.87-1.15-7-5.51-7-10.18V6.3l7-3.12z"/></svg>'); height: 32px; }
    .swagger-ui .info .title { font-family: monospace; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
  },
};

module.exports = {
  swaggerUi,
  swaggerSpec,
  customUiOptions,
};
