# Event Connections and External Links - Backend Implementation

## Overview

This document describes the backend implementation for the Event Connections and External Links feature. This feature allows events to be linked to related events and include external resource links.

## Implementation Date

March 13, 2026

## Database Schema (MongoDB)

### New Fields in Event Model

```javascript
{
  // ... existing fields ...

  // Event Connections
  related_events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],

  // External Resources
  external_links: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048
    }
  }]
}
```

### Field Descriptions

#### `related_events`

- **Type**: Array of ObjectIds referencing Event documents
- **Purpose**: Link related historical events together
- **Optional**: Yes (defaults to empty array)
- **Example**: `["507f1f77bcf86cd799439011", "507f191e810c19729de860ea"]`

#### `external_links`

- **Type**: Array of embedded documents
- **Purpose**: Store external resource links and references
- **Optional**: Yes (defaults to empty array)
- **Schema**:
  - `title` (String, required, max 255 chars): Display name for the link
  - `url` (String, required, max 2048 chars): Full URL including protocol

## Validation

### Related Events Validation

Implemented in `validateRelatedEvents(relatedEvents, currentEventId)`:

✓ Checks if input is an array  
✓ Validates each ID is a valid MongoDB ObjectId  
✓ Prevents self-reference (event cannot link to itself)  
✓ Returns helpful error messages

### External Links Validation

Implemented in `validateExternalLinks(externalLinks)`:

✓ Checks if input is an array  
✓ Validates title exists and is a string (max 255 chars)  
✓ Validates URL exists and is a string (max 2048 chars)  
✓ Validates URL format using JavaScript URL constructor  
✓ Enforces HTTP/HTTPS protocol requirement  
✓ Returns helpful error messages

## API Endpoints

### Create Event (POST /api/admin/events)

**New Request Body Fields:**

```json
{
  "title": "Event Title",
  "summary": "Event summary",
  // ... other existing fields ...
  "related_events": ["507f1f77bcf86cd799439011"],
  "external_links": [
    {
      "title": "Wikipedia Article",
      "url": "https://en.wikipedia.org/wiki/Example"
    }
  ]
}
```

**Features:**

- Validates both new fields before creating event
- Logs activity with connection metadata
- Returns 400 Bad Request if validation fails
- Returns 201 Created with full event data on success

### Update Event (PUT /api/admin/events/:id)

**New Request Body Fields:**
Same as POST endpoint

**Features:**

- Validates both new fields (prevents self-reference in updates)
- Updates existing event with new connections
- Logs activity with connection metadata
- Returns 400 Bad Request if validation fails
- Returns 404 Not Found if event doesn't exist
- Returns 200 OK with updated event data on success

### Get Event (GET /api/events/:id)

**Response includes new fields:**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Event Title",
  // ... other fields ...
  "related_events": ["507f191e810c19729de860ea"],
  "external_links": [
    {
      "title": "Wikipedia",
      "url": "https://en.wikipedia.org/wiki/Example"
    }
  ]
}
```

**Populating Related Events:**

To fetch related event details, use `.populate()`:

```javascript
const event = await Event.findById(id).populate(
  "related_events",
  "title year summary",
);
```

### List Events (GET /api/events)

**Response includes new fields** for all events in the list.

## Activity Logging

### Create Event Activity

```javascript
{
  activity_type: 'admin_create_event',
  action: 'Created event: {title}',
  resource_type: 'event',
  resource_id: event._id,
  metadata: {
    event_id: event._id,
    title: event.title,
    has_related_events: true/false,
    has_external_links: true/false,
    related_events_count: 2,
    external_links_count: 3
  }
}
```

### Update Event Activity

```javascript
{
  activity_type: 'admin_update_event',
  action: 'Updated event: {title}',
  resource_type: 'event',
  resource_id: event._id,
  metadata: {
    // Same as create
  }
}
```

### Error Activity

```javascript
{
  activity_type: 'api_error',
  action: 'Failed to create/update event',
  error_message: 'Validation error details',
  resource_type: 'event'
}
```

## Usage Examples

### Frontend JavaScript (Admin)

```javascript
// Create event with connections
const eventData = {
  title: "Independence Day",
  summary: "India gained independence",
  // ... other required fields ...
  related_events: [
    "507f1f77bcf86cd799439011", // Republic Day event ID
    "507f191e810c19729de860ea", // Constitution event ID
  ],
  external_links: [
    {
      title: "Wikipedia - Independence Day",
      url: "https://en.wikipedia.org/wiki/Independence_Day_(India)",
    },
    {
      title: "Official Government Archive",
      url: "https://archive.gov.in/independence-documents",
    },
  ],
};

const response = await fetch("/api/admin/events", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(eventData),
});

const newEvent = await response.json();
```

### Backend Queries

```javascript
// Find events with related events
const connectedEvents = await Event.find({
  "related_events.0": { $exists: true },
});

// Find events with external links
const eventsWithLinks = await Event.find({
  "external_links.0": { $exists: true },
});

// Get event with populated related events
const event = await Event.findById(eventId)
  .populate("related_events", "title year summary")
  .populate("period_id", "name");

// Count links per event
const linkStats = await Event.aggregate([
  {
    $project: {
      title: 1,
      linkCount: { $size: "$external_links" },
      relationCount: { $size: "$related_events" },
    },
  },
  { $sort: { linkCount: -1 } },
]);
```

## Error Handling

### Common Validation Errors

| Error Message                                        | Cause                        | HTTP Code |
| ---------------------------------------------------- | ---------------------------- | --------- |
| `related_events must be an array`                    | Wrong data type              | 400       |
| `related_events must contain valid event ObjectIds`  | Invalid ObjectId format      | 400       |
| `An event cannot be related to itself`               | Self-reference detected      | 400       |
| `external_links must be an array`                    | Wrong data type              | 400       |
| `Each external link must have a title string`        | Missing or invalid title     | 400       |
| `Each external link must have a url string`          | Missing or invalid URL       | 400       |
| `Invalid URL: {url}`                                 | URL format validation failed | 400       |
| `URLs must start with http:// or https://`           | Missing protocol             | 400       |
| `External link title must be 255 characters or less` | Title too long               | 400       |
| `External link URL must be 2048 characters or less`  | URL too long                 | 400       |

## Testing

### Run Test Script

```bash
node testEventConnections.js
```

### Test Coverage

✓ Create event with external links  
✓ Create event with related events  
✓ Update event to add connections  
✓ Populate related events on fetch  
✓ Validate invalid URLs (should fail)  
✓ Validate self-reference prevention  
✓ Query events with links  
✓ Query events with relations

## Performance Considerations

### Indexing

No additional indexes required. The existing `_id` index handles related_events lookups efficiently.

For advanced usage, consider:

```javascript
// Index for querying events with links
db.events.createIndex({ "external_links.0": 1 });

// Index for querying events with relations
db.events.createIndex({ "related_events.0": 1 });
```

### Population

When populating related_events, use field selection to limit data:

```javascript
.populate('related_events', 'title year summary') // Good
.populate('related_events') // Loads all fields (slower)
```

### Circular References

The validation prevents direct self-reference, but circular chains are possible:

- Event A → Event B → Event C → Event A

This is allowed and may be desired for historical event networks. Handle in frontend with visited tracking if needed.

## Security

### Authentication

Both POST and PUT endpoints require:

- Valid JWT token (authenticateToken middleware)
- Admin role (checkAdmin middleware)

### Input Sanitization

- All string fields are trimmed
- ObjectIds are validated
- URLs are validated for format and protocol
- Field lengths are enforced

### Activity Logging

All create and update operations are logged with:

- User ID
- Timestamp
- Success/failure status
- Connection counts
- Error messages (if failed)

## Migration Notes

### Backward Compatibility

✓ **No migration required**  
✓ Existing events automatically have empty arrays for new fields  
✓ Frontend can handle events with or without connections  
✓ No breaking changes to existing API responses

### Data Integrity

The MongoDB schema automatically:

- Initializes `related_events` as `[]` for new documents
- Initializes `external_links` as `[]` for new documents
- Maintains references even if related events are deleted (orphaned references possible)

### Cleanup for Orphaned References

To find and clean orphaned related_events:

```javascript
const events = await Event.find({ "related_events.0": { $exists: true } });
for (const event of events) {
  const validIds = [];
  for (const relatedId of event.related_events) {
    const exists = await Event.exists({ _id: relatedId });
    if (exists) validIds.push(relatedId);
  }
  if (validIds.length !== event.related_events.length) {
    event.related_events = validIds;
    await event.save();
    console.log(`Cleaned ${event.title}`);
  }
}
```

## Frontend Integration

The frontend is fully implemented and includes:

✓ Admin interface for adding connections  
✓ Search and select related events  
✓ Add/remove external links  
✓ Display connections in event details  
✓ Clickable navigation between related events  
✓ External links open in new tab

Frontend code is in:

- `/client/admin.html` - Admin interface
- `/client/js/admin.js` - Admin logic
- `/client/js/app.js` - Display logic
- `/client/css/admin.css` - Styling

## Support

For questions or issues:

1. Check validation error messages in API responses
2. Review server logs for detailed error information
3. Run test script to verify functionality
4. Check activity logs for debugging admin operations

## Changelog

### Version 1.0 (March 13, 2026)

- ✅ Added `related_events` field to Event model
- ✅ Added `external_links` field to Event model
- ✅ Implemented validation functions
- ✅ Updated POST /api/admin/events endpoint
- ✅ Updated PUT /api/admin/events/:id endpoint
- ✅ Added activity logging for connections
- ✅ Created test script
- ✅ Full backward compatibility maintained

## Files Modified

1. `/server/models/Event.js` - Added schema fields
2. `/server/server.js` - Added validation and updated endpoints

## Files Created

1. `/server/testEventConnections.js` - Test script
2. `/server/EVENT_CONNECTIONS_BACKEND.md` - This documentation
