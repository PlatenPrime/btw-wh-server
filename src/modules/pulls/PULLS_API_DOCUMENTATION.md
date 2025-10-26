# Pulls Module API Documentation

## Overview

The Pulls module provides an optimized system for managing warehouse operations by grouping positions by pallets and sorting them by sectors. This eliminates the need for solvers to repeatedly access the same pallets for different requests, significantly improving efficiency.

### Key Concepts

- **Pull**: A virtual representation of a pallet containing all positions that need to be processed
- **Dynamic Calculation**: Pulls are calculated on-demand based on all "new" asks and are not stored in the database
- **Sector-based Sorting**: Positions are prioritized by pallet sector (lower sector numbers have higher priority)
- **Ask Integration**: Maintains full compatibility with the existing asks system

## Data Models

### IPullPosition Interface

Represents a single position within a pull that needs to be processed.

```typescript
interface IPullPosition {
  posId: ObjectId; // Unique identifier of the position
  artikul: string; // Article number/identifier
  nameukr?: string; // Ukrainian name of the product
  currentQuant: number; // Current quantity available on the pallet
  requestedQuant: number; // Requested quantity to be pulled from this position
  askId: ObjectId; // ID of the ask that requests this position
  askerData: AskUserData; // Data of the user who made the ask
}
```

### IPull Interface

Represents a virtual pallet with all positions that need to be processed.

```typescript
interface IPull {
  palletId: ObjectId; // Unique identifier of the pallet
  palletTitle: string; // Title/name of the pallet
  sector: number; // Sector number for sorting priority (0 if sector is null/undefined)
  rowTitle: string; // Title/name of the row containing this pallet
  positions: IPullPosition[]; // Array of positions to be processed on this pallet
  totalAsks: number; // Total number of unique asks involved in this pull
}
```

### IPullsResponse Interface

Response format for pulls API endpoints.

```typescript
interface IPullsResponse {
  pulls: IPull[]; // Array of calculated pulls
  totalPulls: number; // Total number of pulls
  totalAsks: number; // Total number of asks being processed
}
```

## API Endpoints

### 1. Get All Pulls

**Endpoint**: `GET /api/pulls`

**Description**: Calculates and returns current pulls based on all "new" asks. Groups positions by pallet and sorts by sector for optimal processing.

**Access**: ADMIN, PRIME roles only

**Response**:

```json
{
  "success": true,
  "message": "Pulls calculated successfully",
  "data": {
    "pulls": [
      {
        "palletId": "64a1b2c3d4e5f6789abcdef0",
        "palletTitle": "Pallet A",
        "sector": 1,
        "rowTitle": "Row 1",
        "positions": [
          {
            "posId": "64a1b2c3d4e5f6789abcdef1",
            "artikul": "ART001",
            "nameukr": "Test Product",
            "currentQuant": 15,
            "requestedQuant": 10,
            "askId": "64a1b2c3d4e5f6789abcdef2",
            "askerData": {
              "_id": "64a1b2c3d4e5f6789abcdef3",
              "fullname": "John Doe",
              "telegram": "@johndoe",
              "photo": "photo.jpg"
            }
          }
        ],
        "totalAsks": 1
      }
    ],
    "totalPulls": 1,
    "totalAsks": 1
  }
}
```

**Error Responses**:

- `500`: Server error during calculation

```json
{
  "success": false,
  "message": "Failed to calculate pulls",
  "error": "Database connection failed"
}
```

### 2. Get Pull by Pallet ID

**Endpoint**: `GET /api/pulls/:palletId`

**Description**: Calculates and returns pull for the specified pallet.

**Access**: ADMIN, PRIME roles only

**Parameters**:

- `palletId` (string): Valid MongoDB ObjectId of the pallet

**Response**:

```json
{
  "success": true,
  "message": "Pull retrieved successfully",
  "data": {
    "palletId": "64a1b2c3d4e5f6789abcdef0",
    "palletTitle": "Pallet A",
    "sector": 1,
    "rowTitle": "Row 1",
    "positions": [...],
    "totalAsks": 1
  }
}
```

**Error Responses**:

- `400`: Invalid pallet ID format

```json
{
  "success": false,
  "message": "Invalid pallet ID format"
}
```

- `404`: Pull not found

```json
{
  "success": false,
  "message": "Pull not found for the specified pallet",
  "data": null
}
```

### 3. Process Pull Position

**Endpoint**: `PATCH /api/pulls/:palletId/positions/:posId`

**Description**: Processes the actual pulling of goods from a specific position. This is the core operation that:

1. Updates position quantity (decreases quant, removes if 0)
2. Updates pallet (removes position if necessary)
3. Adds action to corresponding ask
4. Checks if ask is fully completed → transitions to "completed" + sends notification
5. Returns updated state

**Access**: ADMIN, PRIME roles only

**Parameters**:

- `palletId` (string): Valid MongoDB ObjectId of the pallet
- `posId` (string): Valid MongoDB ObjectId of the position

**Request Body**:

```json
{
  "actualQuant": 5,
  "solverId": "64a1b2c3d4e5f6789abcdef4"
}
```

**Request Body Schema**:

- `actualQuant` (number, required): Non-negative number representing actual quantity to be pulled
- `solverId` (string, required): Valid MongoDB ObjectId of the solver processing this position

**Response**:

```json
{
  "success": true,
  "message": "Position processed successfully",
  "data": {
    "positionId": "64a1b2c3d4e5f6789abcdef1",
    "palletId": "64a1b2c3d4e5f6789abcdef0",
    "actualQuant": 5,
    "remainingQuant": 10,
    "askCompleted": false,
    "solverName": "Solver User"
  }
}
```

**Error Responses**:

- `400`: Invalid request data

```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": [
    {
      "code": "too_small",
      "minimum": 0,
      "type": "number",
      "inclusive": true,
      "exact": false,
      "message": "Actual quantity must be non-negative",
      "path": ["actualQuant"]
    }
  ]
}
```

- `400`: Invalid ObjectId format

```json
{
  "success": false,
  "message": "Invalid pallet ID or position ID format"
}
```

- `400`: Quantity validation error

```json
{
  "success": false,
  "message": "Actual quantity cannot exceed available quantity"
}
```

- `404`: Position not found

```json
{
  "success": false,
  "message": "Position not found"
}
```

- `404`: Solver user not found

```json
{
  "success": false,
  "message": "Solver user not found"
}
```

- `404`: No active asks found

```json
{
  "success": false,
  "message": "No active asks found for this position"
}
```

## Business Logic

### Pull Calculation Algorithm

1. **Fetch New Asks**: Retrieve all asks with status "new"
2. **Group by Artikul**: Group asks by article number
3. **Find Positions**: For each artikul, find all available positions
4. **Sort by Sector**: Sort positions by pallet sector (ASC, null → 0)
5. **Distribute Requests**: Use greedy algorithm to distribute asks across positions
6. **Group by Pallet**: Group positions by pallet ID
7. **Create Pulls**: Generate IPull objects with metadata
8. **Sort Pulls**: Sort pulls by sector (ASC)

### Sector Priority Rules

- Positions with lower sector numbers have higher priority
- Positions with null/undefined sectors are treated as sector 0
- Pulls are sorted by sector in ascending order

### Ask Completion Logic

- When a position is processed, the system checks if the ask is fully satisfied
- If the remaining requested quantity ≤ 0, the ask transitions to "completed"
- Completed asks trigger Telegram notifications to the asker
- Actions are logged in the ask's actions array

### Position Management

- If `actualQuant` equals the position's current quantity, the position is removed
- If `actualQuant` is less than the position's quantity, the position quantity is updated
- When a position is removed, it's also removed from the pallet's poses array

## Integration with Existing Systems

### Ask System Integration

- Maintains full compatibility with existing ask functionality
- Adds actions to asks when positions are processed
- Automatically transitions asks to "completed" status
- Preserves all existing ask fields and relationships

### Telegram Notifications

- Sends completion notifications to askers when asks are completed
- Uses existing `sendMessageToTGUser` utility
- Notification failures don't break the transaction

### User Management

- Integrates with existing user authentication and authorization
- Uses existing role-based access control (ADMIN, PRIME)
- Maintains user data consistency across systems

## Error Handling

### Validation Errors

- Request body validation using Zod schemas
- ObjectId format validation
- Quantity range validation
- Business rule validation (e.g., actual quantity cannot exceed available)

### Database Errors

- Transaction-based operations ensure data consistency
- Graceful error handling with appropriate HTTP status codes
- Detailed error messages for debugging

### Edge Cases

- Handles positions with null/undefined sectors
- Manages asks with no matching positions
- Processes asks that exceed available quantities
- Handles concurrent access scenarios

## Performance Considerations

### Dynamic Calculation

- Pulls are calculated on-demand, ensuring always up-to-date information
- No database storage overhead for pull data
- Automatic recalculation after each position processing

### Database Optimization

- Uses MongoDB transactions for data consistency
- Efficient queries with proper indexing
- Lean queries where possible to reduce memory usage

### Caching Strategy

- Consider implementing caching for frequently accessed pulls
- Cache invalidation on position updates
- Monitor performance metrics for optimization opportunities

## Usage Examples

### Frontend Integration

```typescript
// Fetch all pulls
const response = await fetch("/api/pulls", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
const { data } = await response.json();

// Process a position
const processResponse = await fetch(
  `/api/pulls/${palletId}/positions/${posId}`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      actualQuant: 5,
      solverId: solverId,
    }),
  }
);
```

### Real-time Updates

- Consider implementing WebSocket connections for real-time pull updates
- Use polling for pull recalculation after position processing
- Implement optimistic UI updates for better user experience

## Security Considerations

### Access Control

- All endpoints require authentication
- Role-based access control (ADMIN, PRIME only)
- Input validation and sanitization

### Data Integrity

- Transaction-based operations prevent data corruption
- Validation at multiple levels (request, business logic, database)
- Audit trail through ask actions

### Error Information

- Detailed error messages for debugging
- No sensitive information exposure in error responses
- Proper HTTP status codes for different error types

## Monitoring and Logging

### Key Metrics

- Pull calculation performance
- Position processing success rate
- Ask completion rate
- Error frequency and types

### Logging Strategy

- Log all position processing operations
- Track ask completion events
- Monitor system performance metrics
- Error logging with context information

## Future Enhancements

### Potential Improvements

- Batch position processing for multiple positions
- Advanced sorting algorithms beyond sector-based
- Integration with inventory management systems
- Real-time collaboration features
- Mobile app optimization

### Scalability Considerations

- Database sharding strategies
- Microservices architecture
- Caching layer implementation
- Load balancing for high availability
