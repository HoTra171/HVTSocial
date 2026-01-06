import fs from 'fs';
import { swaggerSpec } from './config/swagger.js';

// Convert OpenAPI to Postman Collection v2.1
const collection = {
  info: {
    name: 'HVTSocial API',
    description: swaggerSpec.info.description,
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth: {
    type: 'bearer',
    bearer: [
      {
        key: 'token',
        value: '{{auth_token}}',
        type: 'string',
      },
    ],
  },
  item: [],
  variable: [
    {
      key: 'base_url',
      value: 'http://localhost:5000',
      type: 'string',
    },
    {
      key: 'auth_token',
      value: '',
      type: 'string',
    },
  ],
};

// Group endpoints by tags
const folders = {};

// Parse OpenAPI paths
Object.entries(swaggerSpec.paths).forEach(([path, methods]) => {
  Object.entries(methods).forEach(([method, spec]) => {
    const tag = spec.tags?.[0] || 'Other';

    if (!folders[tag]) {
      folders[tag] = {
        name: tag,
        item: [],
      };
    }

    const request = {
      name: spec.summary || path,
      request: {
        method: method.toUpperCase(),
        header: [],
        url: {
          raw: `{{base_url}}${path}`,
          host: ['{{base_url}}'],
          path: path.split('/').filter(Boolean),
        },
      },
    };

    // Add auth if required
    if (spec.security && spec.security.some(s => s.bearerAuth)) {
      request.request.auth = {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{auth_token}}',
            type: 'string',
          },
        ],
      };
    }

    // Add request body
    if (spec.requestBody) {
      const content = spec.requestBody.content;
      if (content['application/json']) {
        request.request.header.push({
          key: 'Content-Type',
          value: 'application/json',
        });

        // Generate example body from schema
        const schema = content['application/json'].schema;
        const body = {};

        if (schema.properties) {
          Object.entries(schema.properties).forEach(([key, prop]) => {
            body[key] = prop.example || (prop.type === 'integer' ? 1 : prop.type === 'boolean' ? true : '');
          });
        }

        request.request.body = {
          mode: 'raw',
          raw: JSON.stringify(body, null, 2),
        };
      }
    }

    folders[tag].item.push(request);
  });
});

// Add folders to collection
collection.item = Object.values(folders);

// Write to file
fs.writeFileSync(
  './HVTSocial-API.postman_collection.json',
  JSON.stringify(collection, null, 2)
);

console.log('✅ Exported Postman collection: HVTSocial-API.postman_collection.json');
console.log('📝 Import file này vào Postman để test API');
console.log('💡 Nhớ set biến auth_token sau khi login');
