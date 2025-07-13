# BTW Warehouse Server

A Node.js/Express server with TypeScript for warehouse management.

## Testing with Vitest

This project uses Vitest for testing with a comprehensive setup for unit and integration tests.

### Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create test environment file:**
   Create a `.env.test` file in the root directory:

   ```env
   NODE_ENV=test
   PORT=3001
   TEST_MONGODB_URI=mongodb://localhost:27017/btw-wh-test
   JWT_SECRET=test-jwt-secret-key
   CLERK_SECRET_KEY=test-clerk-secret
   ```

3. **Start test database:**
   Make sure MongoDB is running locally or update the `TEST_MONGODB_URI` in `.env.test`

### Running Tests

```bash
# Run tests in watch mode (default)
npm test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure

```
src/
├── test/
│   ├── setup.ts          # Global test setup
│   └── utils/
│       └── testHelpers.ts # Test utilities
└── modules/
    ├── auth/
    │   └── controllers/
    │       └── __tests__/
    │           └── loginUser.test.ts
    └── arts/
        └── controllers/
            └── __tests__/
                └── getAllArts.test.ts
```

### Writing Tests

#### Example: Testing a Controller

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { yourController } from "../yourController";
import { createTestUser } from "../../../../test/setup";

const app = express();
app.use(express.json());
app.post("/your-endpoint", yourController);

describe("yourController", () => {
  it("should handle valid request", async () => {
    const response = await request(app)
      .post("/your-endpoint")
      .send({
        /* test data */
      })
      .expect(200);

    expect(response.body).toHaveProperty("expectedProperty");
  });
});
```

#### Example: Testing with Authentication

```typescript
import {
  createTestToken,
  createAuthHeaders,
} from "../../../../test/utils/testHelpers";

describe("Protected Endpoint", () => {
  it("should require authentication", async () => {
    const token = createTestToken("user-id", "user");
    const headers = createAuthHeaders(token);

    const response = await request(app)
      .get("/protected-endpoint")
      .set(headers)
      .expect(200);
  });
});
```

### Test Utilities

The project includes several utility functions in `src/test/utils/testHelpers.ts`:

- `createTestToken()` - Generate JWT tokens for testing
- `createAuthHeaders()` - Create headers with authentication
- `generateTestData` - Generate random test data
- `createMockRequest()` - Mock Express request objects
- `createMockResponse()` - Mock Express response objects

### Best Practices

1. **Use descriptive test names** that explain the expected behavior
2. **Test both success and failure cases**
3. **Use beforeEach/afterEach** for setup and cleanup
4. **Mock external dependencies** when appropriate
5. **Test edge cases** and error conditions
6. **Keep tests isolated** - each test should be independent
7. **Use test utilities** for common operations

### Coverage

Run coverage reports to see test coverage:

```bash
npm run test:coverage
```

This will generate coverage reports in multiple formats (text, JSON, HTML) in the `coverage/` directory.

### Continuous Integration

The test setup is ready for CI/CD pipelines. The tests will run automatically and provide coverage reports for quality assurance.
