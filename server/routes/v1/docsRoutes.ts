import { Router, Request, Response } from 'express';

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Juba News REST API',
    description: 'Production-ready, secure REST API backend for Juba News with RBAC and 2FA.',
    version: '1.0.0',
    contact: {
      name: 'Juba News Engineering Desk',
      email: 'media@juba-news.com',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Production / Local API Gateway',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token retrieved from POST /auth/admin/login',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'FORBIDDEN' },
              message: { type: 'string', example: 'You do not have permission to perform this action.' },
            },
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'System health check',
        responses: {
          '200': { description: 'Service is healthy' },
        },
      },
    },
    '/auth/admin/login': {
      post: {
        summary: 'Administrator Login',
        description: 'Authenticates administrator via email and password, issuing access and refresh tokens or 2FA challenge.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'anwar.youal@jubanews.org' },
                  password: { type: 'string', example: 'Lucky#2021.super' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Authenticated or 2FA required' },
          '401': { description: 'Invalid credentials' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/auth/admin/2fa/verify': {
      post: {
        summary: 'Verify 2FA TOTP code',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tempToken'],
                properties: {
                  tempToken: { type: 'string' },
                  code: { type: 'string', example: '123456' },
                  backupCode: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: '2FA verified and session created' },
          '401': { description: 'Invalid 2FA code' },
        },
      },
    },
    '/admin/articles': {
      get: {
        security: [{ BearerAuth: [] }],
        summary: 'List articles (Admin, paginated)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Paginated articles' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
      },
      post: {
        security: [{ BearerAuth: [] }],
        summary: 'Create article',
        responses: {
          '201': { description: 'Article created' },
          '403': { description: 'Missing articles.create permission' },
        },
      },
    },
    '/admin/articles/{id}/publish': {
      post: {
        security: [{ BearerAuth: [] }],
        summary: 'Publish article',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Article published' },
          '403': { description: 'Missing articles.publish permission' },
        },
      },
    },
    '/admin/admins': {
      get: {
        security: [{ BearerAuth: [] }],
        summary: 'List platform administrators (SUPER_ADMIN)',
        responses: {
          '200': { description: 'List of administrators' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/admin/audit-logs': {
      get: {
        security: [{ BearerAuth: [] }],
        summary: 'Retrieve immutable audit trail',
        responses: {
          '200': { description: 'Audit logs' },
          '403': { description: 'Forbidden' },
        },
      },
    },
  },
};

const router = Router();

router.get('/openapi.json', (req: Request, res: Response) => {
  res.json(openApiSpec);
});

router.get('/docs', (req: Request, res: Response) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Juba News API Documentation | Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #060b18; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '/api/v1/openapi.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis],
        layout: 'BaseLayout'
      });
    };
  </script>
</body>
</html>`);
});

export default router;
