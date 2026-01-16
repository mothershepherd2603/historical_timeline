# Quick Reference Guide - Enhanced Event Schema

## Event Types Quick Reference

### Point Event (Specific Moment)

```javascript
{
  event_type: "point",
  year: 1947,                    // Required
  date: "1947-08-15",           // Required if year >= 1947
  location_type: "point",
  latitude: 28.6139,            // Required for point location
  longitude: 77.209,            // Required for point location
  place_name: "Red Fort, Delhi" // Optional
}
```

### Period Event (Time Span)

```javascript
{
  event_type: "period",
  start_year: 1960,             // Required
  end_year: 1970,               // Required (must be >= start_year)
  start_date: "1960-01-01",     // Required if start_year >= 1947
  end_date: "1970-12-31",       // Required if end_year >= 1947
  location_type: "area",
  geographic_scope: "country",  // Required for area location
  area_name: "India"            // Required for area location
}
```

## Location Types Quick Reference

### Point Location (Specific Coordinates)

```javascript
{
  location_type: "point",
  latitude: 28.6139,            // Required
  longitude: 77.209,            // Required
  place_name: "Delhi"           // Optional
}
```

### Area Location (Geographic Region)

```javascript
{
  location_type: "area",
  geographic_scope: "country",  // Required: 'country', 'state', 'district', 'region'
  area_name: "India",           // Required
  latitude: 28.6139,            // Optional (area center)
  longitude: 77.209             // Optional (area center)
}
```

## Multilingual Fields

```javascript
{
  description: "India gained independence from British rule",
  description_hindi: "भारत ने ब्रिटिश शासन से स्वतंत्रता प्राप्त की",
  description_hinglish: "Bharat ne British shasan se swatantrata prapt ki"
}
```

## API Endpoints Quick Reference

### Create Event

```bash
POST /api/admin/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Event Title",
  "summary": "Brief summary",
  "description": "Detailed description",
  "event_type": "point",
  "year": 1947,
  "date": "1947-08-15",
  "location_type": "point",
  "latitude": 28.6139,
  "longitude": 77.209,
  "period_id": "507f1f77bcf86cd799439012"
}
```

### Update Event

```bash
PUT /api/admin/events/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  // Same fields as POST
}
```

### Get Events with Filters

```bash
# Get all period events
GET /api/events?event_type=period

# Get events in year range
GET /api/events?start_year=1947&end_year=2000

# Get area events at country level
GET /api/events?location_type=area&geographic_scope=country

# Combine filters
GET /api/events?period_id=507f1f77bcf86cd799439012&event_type=period&start_year=1960
```

## Validation Rules Cheat Sheet

| Rule           | Point Event                   | Period Event             |
| -------------- | ----------------------------- | ------------------------ |
| **year**       | ✅ Required                   | ❌ Forbidden             |
| **date**       | ✅ Required (if year >= 1947) | ❌ Forbidden             |
| **start_year** | ❌ Forbidden                  | ✅ Required              |
| **end_year**   | ❌ Forbidden                  | ✅ Required              |
| **start_date** | ❌ Forbidden                  | ✅ Required (if >= 1947) |
| **end_date**   | ❌ Forbidden                  | ✅ Required (if >= 1947) |

| Rule                 | Point Location | Area Location |
| -------------------- | -------------- | ------------- |
| **latitude**         | ✅ Required    | ⚪ Optional   |
| **longitude**        | ✅ Required    | ⚪ Optional   |
| **place_name**       | ⚪ Optional    | ⚪ Optional   |
| **geographic_scope** | ❌ Forbidden   | ✅ Required   |
| **area_name**        | ❌ Forbidden   | ✅ Required   |

## Common Patterns

### 1. Historical Point Event (Before 1947)

```javascript
{
  title: "Battle of Plassey",
  summary: "Decisive battle",
  event_type: "point",
  year: 1757,
  location_type: "point",
  latitude: 23.7957,
  longitude: 88.2545,
  place_name: "Plassey, West Bengal",
  period_id: "..."
}
```

### 2. Modern Point Event (After 1947)

```javascript
{
  title: "Independence Day",
  summary: "India's independence",
  description_hindi: "भारत की स्वतंत्रता",
  event_type: "point",
  year: 1947,
  date: "1947-08-15",
  location_type: "point",
  latitude: 28.6139,
  longitude: 77.209,
  place_name: "Delhi",
  period_id: "..."
}
```

### 3. Historical Period Event

```javascript
{
  title: "Mughal Empire",
  summary: "Mughal rule in India",
  event_type: "period",
  start_year: 1526,
  end_year: 1857,
  location_type: "area",
  geographic_scope: "country",
  area_name: "India",
  period_id: "..."
}
```

### 4. Modern Period Event with Full Details

```javascript
{
  title: "Green Revolution",
  summary: "Agricultural transformation",
  description_hindi: "कृषि परिवर्तन",
  description_hinglish: "Krishi parivartan",
  event_type: "period",
  start_year: 1960,
  end_year: 1970,
  start_date: "1960-01-01",
  end_date: "1970-12-31",
  location_type: "area",
  geographic_scope: "country",
  area_name: "India",
  period_id: "..."
}
```

### 5. State-Level Movement

```javascript
{
  title: "Chipko Movement",
  summary: "Forest conservation",
  event_type: "period",
  start_year: 1973,
  end_year: 1981,
  start_date: "1973-04-01",
  end_date: "1981-12-31",
  location_type: "area",
  geographic_scope: "state",
  area_name: "Uttarakhand",
  latitude: 30.0668,  // Optional center point
  longitude: 79.0193,
  period_id: "..."
}
```

## Error Messages Reference

| Error                                                    | Cause                           | Solution                       |
| -------------------------------------------------------- | ------------------------------- | ------------------------------ |
| "Point events require a year field"                      | Point event without year        | Add `year` field               |
| "Point events from 1947 onwards require a specific date" | Modern point event without date | Add `date` field               |
| "Period events require a start_year field"               | Period event without start_year | Add `start_year` field         |
| "Period events require an end_year field"                | Period event without end_year   | Add `end_year` field           |
| "end_year must be greater than or equal to start_year"   | Invalid year range              | Fix year order                 |
| "Point locations require latitude and longitude"         | Missing coordinates             | Add `latitude` and `longitude` |
| "Area locations require a geographic_scope field"        | Area without scope              | Add `geographic_scope`         |
| "Area locations require an area_name field"              | Area without name               | Add `area_name`                |

## Testing Commands

```bash
# Run automated tests
node testEnhancedEvents.js

# Start server
npm start

# Test creating a point event
curl -X POST http://localhost:5000/api/admin/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @point-event.json

# Test creating a period event
curl -X POST http://localhost:5000/api/admin/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @period-event.json

# Test querying events
curl "http://localhost:5000/api/events?event_type=period"
curl "http://localhost:5000/api/events?start_year=1947&end_year=2000"
curl "http://localhost:5000/api/events?geographic_scope=country"
```

## Geographic Scope Values

| Value      | Description          | Example                       |
| ---------- | -------------------- | ----------------------------- |
| `country`  | National level       | India, Pakistan               |
| `state`    | State/Province level | Maharashtra, Uttarakhand      |
| `district` | District level       | Mumbai District               |
| `region`   | Regional level       | Western India, Deccan Plateau |

## Best Practices

1. **Always specify event_type** - Even though it defaults to "point", be explicit
2. **Use dates for modern events** - Events from 1947 onwards should have specific dates
3. **Provide multilingual content** - Add Hindi/Hinglish for better accessibility
4. **Use area locations for movements** - Social movements, revolutions, etc.
5. **Include center coordinates for areas** - Helps with map visualization
6. **Tag appropriately** - Use consistent tags for better filtering

## Quick Troubleshooting

**Problem:** Event not saving

- Check all required fields for your event_type and location_type
- Verify date format is ISO 8601 (YYYY-MM-DD)
- Ensure period_id is a valid ObjectId

**Problem:** Query returning no results

- Check if filters are too restrictive
- Verify period_id exists in database
- Use ?limit=10000 for large datasets

**Problem:** Validation errors

- Review validation rules table above
- Check error message for specific field causing issue
- Ensure data types match schema (Number for years, Date for dates)

## File Locations

- **Event Model:** `models/Event.js`
- **API Endpoints:** `server.js`
- **Test Script:** `testEnhancedEvents.js`
- **Migration Guide:** `MIGRATION_GUIDE.md`
- **API Docs:** `API_DOCUMENTATION.md`
- **Summary:** `IMPLEMENTATION_SUMMARY.md`
