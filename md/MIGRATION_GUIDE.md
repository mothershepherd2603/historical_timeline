# Database Migration Guide for Historical Timeline Explorer

## Overview

This guide explains how to migrate your existing MongoDB database to support the new features:

- Multilingual support (Hindi and Hinglish)
- Period events (events spanning time ranges)
- Geographic area events (events covering regions/states/districts/country)

## Migration Steps

### Step 1: Backup Your Database

Before running any migration, **always backup your database**:

```bash
# Create a backup
mongodump --uri="mongodb://localhost:27017/historical_timeline" --out=./backup-$(date +%Y%m%d)

# To restore if needed
mongorestore --uri="mongodb://localhost:27017/historical_timeline" ./backup-YYYYMMDD
```

### Step 2: Schema Changes

**Good News:** MongoDB is schema-less, so you don't need to run ALTER TABLE commands. The new fields will be automatically added when you create or update documents with the new Event model.

All existing events will continue to work because:

- New fields default to `undefined` (which is valid for nullable fields)
- `event_type` defaults to `'point'`
- `location_type` defaults to `'point'`
- Existing `year`, `latitude`, and `longitude` fields remain unchanged

### Step 3: Update Your Application

1. **Update the Event model** (already done in `models/Event.js`)
2. **Update API endpoints** (already done in `server.js`)
3. **Restart your server**:

```bash
npm start
```

### Step 4: Verify Backward Compatibility

Test that existing events still work:

```bash
# Get existing events
curl http://localhost:5000/api/events?period_id=YOUR_PERIOD_ID

# All existing events should still be returned with:
# - event_type: "point"
# - location_type: "point"
# - Original year, latitude, longitude fields intact
```

## Optional: Migrate Existing Events

If you have events that should be period events or area events, you can update them using the MongoDB shell or through the API.

### Example: Convert to Period Event via MongoDB Shell

```javascript
// Connect to MongoDB
use historical_timeline

// Update a specific event to be a period event
db.events.updateOne(
  { _id: ObjectId("YOUR_EVENT_ID") },
  {
    $set: {
      event_type: "period",
      start_year: 1960,
      end_year: 1970,
      start_date: ISODate("1960-01-01"),
      end_date: ISODate("1970-12-31")
    },
    $unset: {
      year: "",
      date: ""
    }
  }
)
```

### Example: Convert to Area Event via MongoDB Shell

```javascript
// Update a specific event to be an area event
db.events.updateOne(
  { _id: ObjectId("YOUR_EVENT_ID") },
  {
    $set: {
      location_type: "area",
      geographic_scope: "country",
      area_name: "India",
    },
  }
);
```

### Example: Add Multilingual Descriptions

```javascript
// Add Hindi and Hinglish descriptions
db.events.updateOne(
  { _id: ObjectId("YOUR_EVENT_ID") },
  {
    $set: {
      description_hindi: "भारत ने ब्रिटिश शासन से स्वतंत्रता प्राप्त की",
      description_hinglish: "Bharat ne British shasan se swatantrata prapt ki",
    },
  }
);
```

### Example: Bulk Update via API

You can also use the PUT endpoint to update events:

```bash
curl -X PUT http://localhost:5000/api/admin/events/YOUR_EVENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Green Revolution in India",
    "summary": "Agricultural transformation",
    "description": "Agricultural transformation through high-yielding varieties",
    "event_type": "period",
    "start_year": 1960,
    "end_year": 1970,
    "start_date": "1960-01-01",
    "end_date": "1970-12-31",
    "location_type": "area",
    "geographic_scope": "country",
    "area_name": "India",
    "period_id": "YOUR_PERIOD_ID"
  }'
```

## Indexing for Performance

Add indexes to improve query performance on the new fields:

```javascript
// Connect to MongoDB shell
use historical_timeline

// Create indexes
db.events.createIndex({ event_type: 1 })
db.events.createIndex({ location_type: 1 })
db.events.createIndex({ start_year: 1 })
db.events.createIndex({ end_year: 1 })
db.events.createIndex({ geographic_scope: 1 })
db.events.createIndex({ period_id: 1, year: 1 })
db.events.createIndex({ period_id: 1, start_year: 1 })

// Verify indexes
db.events.getIndexes()
```

## Validation Rules

The Event model now enforces these validation rules:

### For Point Events (`event_type: "point"`)

**Required:**

- `year` - Year of the event
- `title`, `summary`, `description`

**Optional:**

- `date` - Required if `year >= 1947`

**Forbidden:**

- `start_year`, `end_year`, `start_date`, `end_date` (auto-cleared)

### For Period Events (`event_type: "period"`)

**Required:**

- `start_year` - Starting year
- `end_year` - Ending year (must be >= start_year)
- `title`, `summary`, `description`

**Optional:**

- `start_date` - Required if `start_year >= 1947`
- `end_date` - Required if `end_year >= 1947`

**Forbidden:**

- `year`, `date` (auto-cleared)

### For Point Locations (`location_type: "point"`)

**Required:**

- `latitude` - Latitude coordinate (-90 to 90)
- `longitude` - Longitude coordinate (-180 to 180)

**Optional:**

- `place_name` - Name of the location

**Forbidden:**

- `geographic_scope`, `area_name` (auto-cleared)

### For Area Locations (`location_type: "area"`)

**Required:**

- `geographic_scope` - One of: 'country', 'state', 'district', 'region'
- `area_name` - Name of the geographic area

**Optional:**

- `latitude`, `longitude` - Center point of the area
- `place_name`

## Testing the Migration

### 1. Test Creating a Point Event

```bash
curl -X POST http://localhost:5000/api/admin/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Test Point Event",
    "summary": "A test event",
    "description": "Testing point event creation",
    "event_type": "point",
    "year": 2000,
    "date": "2000-01-01",
    "location_type": "point",
    "latitude": 28.6139,
    "longitude": 77.209,
    "place_name": "Delhi",
    "period_id": "YOUR_PERIOD_ID"
  }'
```

### 2. Test Creating a Period Event

```bash
curl -X POST http://localhost:5000/api/admin/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Test Period Event",
    "summary": "A test period",
    "description": "Testing period event creation",
    "event_type": "period",
    "start_year": 1960,
    "end_year": 1970,
    "start_date": "1960-01-01",
    "end_date": "1970-12-31",
    "location_type": "area",
    "geographic_scope": "country",
    "area_name": "India",
    "period_id": "YOUR_PERIOD_ID"
  }'
```

### 3. Test Querying with New Filters

```bash
# Get all period events
curl "http://localhost:5000/api/events?event_type=period"

# Get events in a year range
curl "http://localhost:5000/api/events?start_year=1960&end_year=1970"

# Get area events at country level
curl "http://localhost:5000/api/events?location_type=area&geographic_scope=country"

# Get events by multiple filters
curl "http://localhost:5000/api/events?period_id=YOUR_PERIOD_ID&event_type=period&start_year=1947&end_year=2000"
```

### 4. Test Validation Errors

```bash
# This should fail - point event without year
curl -X POST http://localhost:5000/api/admin/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Test",
    "summary": "Test",
    "event_type": "point",
    "location_type": "point",
    "latitude": 28.6139,
    "longitude": 77.209,
    "period_id": "YOUR_PERIOD_ID"
  }'
# Expected error: "Point events require a year field"

# This should fail - period event with end_year < start_year
curl -X POST http://localhost:5000/api/admin/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Test",
    "summary": "Test",
    "event_type": "period",
    "start_year": 1970,
    "end_year": 1960,
    "location_type": "point",
    "latitude": 28.6139,
    "longitude": 77.209,
    "period_id": "YOUR_PERIOD_ID"
  }'
# Expected error: "end_year must be greater than or equal to start_year"
```

## Rollback Plan

If you need to rollback:

1. **Restore from backup:**

```bash
mongorestore --uri="mongodb://localhost:27017/historical_timeline" ./backup-YYYYMMDD --drop
```

2. **Revert code changes:**

```bash
git checkout HEAD~1 models/Event.js server.js
npm start
```

## Common Issues and Solutions

### Issue: Validation errors on existing events

**Cause:** Existing events might have invalid data combinations.

**Solution:** Update those events to be consistent:

```javascript
// Fix events with both year and start_year
db.events.updateMany(
  { year: { $exists: true }, start_year: { $exists: true } },
  { $unset: { start_year: "", end_year: "", start_date: "", end_date: "" } }
);
```

### Issue: Queries returning unexpected results

**Cause:** Year range queries now work differently for period events.

**Solution:** Period events are included if they overlap with the queried range. This is correct behavior - adjust your expectations or use `event_type` filter to only get point events.

### Issue: Performance degradation

**Cause:** Missing indexes on new fields.

**Solution:** Create the indexes as shown in the "Indexing for Performance" section above.

## Support

If you encounter any issues during migration:

1. Check the server logs for detailed error messages
2. Verify your MongoDB version is compatible (MongoDB 4.0+)
3. Ensure all dependencies are installed (`npm install`)
4. Review validation rules in the Event model

## Next Steps

After successful migration:

1. Update your frontend to use the new fields
2. Add multilingual descriptions to important events
3. Convert historical periods into period events
4. Test all features thoroughly
5. Update your API documentation
6. Train content editors on the new event types
