# API Documentation - Historical Timeline Explorer

## Overview

This document describes the updated API endpoints for the Historical Timeline Explorer, including support for multilingual content, period events, and geographic areas.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Events API

### GET /api/events

Retrieve events with optional filtering.

#### Query Parameters

| Parameter          | Type    | Description                                               | Example                               |
| ------------------ | ------- | --------------------------------------------------------- | ------------------------------------- |
| `period_id`        | String  | Filter by period (MongoDB ObjectId)                       | `?period_id=507f1f77bcf86cd799439011` |
| `year`             | Integer | Filter by exact year (point events only)                  | `?year=1947`                          |
| `start_year`       | Integer | Filter events starting from this year                     | `?start_year=1960`                    |
| `end_year`         | Integer | Filter events up to this year                             | `?end_year=1970`                      |
| `date`             | Date    | Filter by exact date (ISO 8601)                           | `?date=2024-01-15`                    |
| `event_type`       | String  | Filter by event type: `point` or `period`                 | `?event_type=period`                  |
| `location_type`    | String  | Filter by location type: `point` or `area`                | `?location_type=area`                 |
| `geographic_scope` | String  | Filter by scope: `country`, `state`, `district`, `region` | `?geographic_scope=country`           |
| `limit`            | Integer | Maximum number of results (default: 500)                  | `?limit=1000`                         |
| `skip`             | Integer | Number of results to skip (pagination)                    | `?skip=100`                           |

#### Year Range Filtering Behavior

- For **point events**: Filters by the `year` field
- For **period events**: Includes events that overlap with the specified range
  - An event overlaps if: `event.end_year >= start_year AND event.start_year <= end_year`

#### Response

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "id": "507f1f77bcf86cd799439011",
    "title": "Independence Day of India",
    "description": "India gained independence from British rule",
    "summary": "India's independence",
    "description_hindi": "भारत ने ब्रिटिश शासन से स्वतंत्रता प्राप्त की",
    "description_hinglish": "Bharat ne British shasan se swatantrata prapt ki",
    "event_type": "point",
    "year": 1947,
    "date": "1947-08-15T00:00:00.000Z",
    "location_type": "point",
    "latitude": 28.6139,
    "longitude": 77.209,
    "place_name": "Red Fort, Delhi",
    "period_id": "507f1f77bcf86cd799439012",
    "tags": ["independence", "political"],
    "media_ids": [],
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "id": "507f1f77bcf86cd799439013",
    "title": "Green Revolution in India",
    "description": "Agricultural transformation through high-yielding varieties",
    "summary": "India's Green Revolution",
    "description_hindi": "उच्च उपज देने वाली किस्मों के माध्यम से कृषि परिवर्तन",
    "description_hinglish": "Uchch upaj dene wali kismon ke madhyam se krishi parivartan",
    "event_type": "period",
    "start_year": 1960,
    "end_year": 1970,
    "start_date": "1960-01-01T00:00:00.000Z",
    "end_date": "1970-12-31T00:00:00.000Z",
    "location_type": "area",
    "geographic_scope": "country",
    "area_name": "India",
    "latitude": 28.6139,
    "longitude": 77.209,
    "period_id": "507f1f77bcf86cd799439012",
    "tags": ["agriculture", "economic"],
    "media_ids": [],
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Example Requests

```bash
# Get all events in the modern period
curl "http://localhost:5000/api/events?period_id=507f1f77bcf86cd799439012"

# Get all period events
curl "http://localhost:5000/api/events?event_type=period"

# Get events between 1947 and 2000
curl "http://localhost:5000/api/events?start_year=1947&end_year=2000"

# Get country-level area events
curl "http://localhost:5000/api/events?location_type=area&geographic_scope=country"

# Combine multiple filters
curl "http://localhost:5000/api/events?period_id=507f1f77bcf86cd799439012&event_type=period&start_year=1960"
```

---

### GET /api/events/:id

Retrieve a single event by ID.

#### Path Parameters

| Parameter | Type   | Description                 |
| --------- | ------ | --------------------------- |
| `id`      | String | Event ID (MongoDB ObjectId) |

#### Response

Same format as individual event in GET /api/events response.

#### Error Responses

- `400 Bad Request` - Invalid event ID
- `404 Not Found` - Event not found
- `402 Payment Required` - Subscription required (if period requires subscription)

---

### POST /api/admin/events

Create a new event (admin only).

#### Headers

```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

#### Request Body

##### For Point Events

```json
{
  "title": "Independence Day of India",
  "description": "India gained independence from British rule",
  "summary": "India's independence",
  "description_hindi": "भारत ने ब्रिटिश शासन से स्वतंत्रता प्राप्त की",
  "description_hinglish": "Bharat ne British shasan se swatantrata prapt ki",
  "event_type": "point",
  "year": 1947,
  "date": "1947-08-15",
  "location_type": "point",
  "latitude": 28.6139,
  "longitude": 77.209,
  "place_name": "Red Fort, Delhi",
  "period_id": "507f1f77bcf86cd799439012",
  "tags": ["independence", "political"],
  "media_ids": []
}
```

##### For Period Events with Point Location

```json
{
  "title": "Battle of Panipat",
  "description": "Series of battles fought near Panipat",
  "summary": "Historic battles at Panipat",
  "event_type": "period",
  "start_year": 1526,
  "end_year": 1761,
  "location_type": "point",
  "latitude": 29.3909,
  "longitude": 76.9635,
  "place_name": "Panipat",
  "period_id": "507f1f77bcf86cd799439014",
  "tags": ["battle", "military"]
}
```

##### For Period Events with Area Location

```json
{
  "title": "Green Revolution in India",
  "description": "Agricultural transformation",
  "summary": "India's Green Revolution",
  "event_type": "period",
  "start_year": 1960,
  "end_year": 1970,
  "start_date": "1960-01-01",
  "end_date": "1970-12-31",
  "location_type": "area",
  "geographic_scope": "country",
  "area_name": "India",
  "latitude": 28.6139,
  "longitude": 77.209,
  "period_id": "507f1f77bcf86cd799439012",
  "tags": ["agriculture", "economic"]
}
```

##### For State-Level Area Event

```json
{
  "title": "Chipko Movement",
  "description": "Forest conservation movement",
  "summary": "Environmental movement in Uttarakhand",
  "event_type": "period",
  "start_year": 1973,
  "end_year": 1981,
  "start_date": "1973-04-01",
  "end_date": "1981-12-31",
  "location_type": "area",
  "geographic_scope": "state",
  "area_name": "Uttarakhand",
  "latitude": 30.0668,
  "longitude": 79.0193,
  "period_id": "507f1f77bcf86cd799439012",
  "tags": ["environmental", "social movement"]
}
```

#### Field Requirements

##### Always Required

- `title` (String)
- `summary` (String)
- `period_id` (String, valid ObjectId)

##### For Point Events (`event_type: "point"`)

- `year` (Integer) - required
- `date` (Date, ISO 8601) - required if `year >= 1947`

##### For Period Events (`event_type: "period"`)

- `start_year` (Integer) - required
- `end_year` (Integer) - required, must be >= start_year
- `start_date` (Date, ISO 8601) - required if `start_year >= 1947`
- `end_date` (Date, ISO 8601) - required if `end_year >= 1947`

##### For Point Locations (`location_type: "point"`)

- `latitude` (Float, -90 to 90) - required
- `longitude` (Float, -180 to 180) - required
- `place_name` (String) - optional

##### For Area Locations (`location_type: "area"`)

- `geographic_scope` (String: 'country', 'state', 'district', 'region') - required
- `area_name` (String) - required
- `latitude`, `longitude` (Float) - optional, for area center point

##### Optional for All Events

- `description` (String)
- `description_hindi` (String)
- `description_hinglish` (String)
- `tags` (Array of Strings)
- `media_ids` (Array of ObjectIds)

#### Response

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "id": "507f1f77bcf86cd799439011",
  "title": "Independence Day of India",
  "description": "India gained independence from British rule",
  "summary": "India's independence",
  "description_hindi": "भारत ने ब्रिटिश शासन से स्वतंत्रता प्राप्त की",
  "description_hinglish": "Bharat ne British shasan se swatantrata prapt ki",
  "event_type": "point",
  "year": 1947,
  "date": "1947-08-15T00:00:00.000Z",
  "location_type": "point",
  "latitude": 28.6139,
  "longitude": 77.209,
  "place_name": "Red Fort, Delhi",
  "period_id": "507f1f77bcf86cd799439012",
  "tags": ["independence", "political"],
  "media_ids": [],
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z",
  "created_by": "507f1f77bcf86cd799439015"
}
```

#### Error Responses

- `400 Bad Request` - Missing required fields or validation error
- `401 Unauthorized` - No authentication token
- `403 Forbidden` - Not admin user
- `500 Internal Server Error` - Server error

---

### PUT /api/admin/events/:id

Update an existing event (admin only).

#### Headers

```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

#### Path Parameters

| Parameter | Type   | Description                 |
| --------- | ------ | --------------------------- |
| `id`      | String | Event ID (MongoDB ObjectId) |

#### Request Body

Same format as POST /api/admin/events. All fields should be provided (not a partial update).

#### Response

Same format as POST response.

#### Error Responses

- `400 Bad Request` - Invalid ID or validation error
- `401 Unauthorized` - No authentication token
- `403 Forbidden` - Not admin user
- `404 Not Found` - Event not found
- `500 Internal Server Error` - Server error

---

### DELETE /api/admin/events/:id

Delete an event (admin only).

#### Headers

```
Authorization: Bearer <admin_jwt_token>
```

#### Path Parameters

| Parameter | Type   | Description                 |
| --------- | ------ | --------------------------- |
| `id`      | String | Event ID (MongoDB ObjectId) |

#### Response

```json
{
  "message": "Event deleted successfully"
}
```

#### Error Responses

- `400 Bad Request` - Invalid event ID
- `401 Unauthorized` - No authentication token
- `403 Forbidden` - Not admin user
- `404 Not Found` - Event not found
- `500 Internal Server Error` - Server error

---

## Data Validation Rules

### Event Type Validation

The API enforces strict validation based on `event_type`:

#### Point Events

- **Must have:** `year`
- **Must have (if year >= 1947):** `date`
- **Cannot have:** `start_year`, `end_year`, `start_date`, `end_date`

#### Period Events

- **Must have:** `start_year`, `end_year`
- **Must have (if start_year >= 1947):** `start_date`
- **Must have (if end_year >= 1947):** `end_date`
- **Constraint:** `end_year >= start_year`
- **Constraint (if both dates provided):** `end_date >= start_date`
- **Cannot have:** `year`, `date`

### Location Type Validation

The API enforces strict validation based on `location_type`:

#### Point Locations

- **Must have:** `latitude`, `longitude`
- **Optional:** `place_name`
- **Cannot have:** `geographic_scope`, `area_name`

#### Area Locations

- **Must have:** `geographic_scope`, `area_name`
- **Optional:** `latitude`, `longitude` (for area center)
- **Geographic scope values:** 'country', 'state', 'district', 'region'

### Auto-Clearing Fields

When you switch event types or location types, incompatible fields are automatically cleared:

- Switching from period to point: Clears `start_year`, `end_year`, `start_date`, `end_date`
- Switching from point to period: Clears `year`, `date`
- Switching from area to point location: Clears `geographic_scope`, `area_name`

---

## Common Use Cases

### 1. Create a Historical Point Event (Before 1947)

```bash
curl -X POST http://localhost:5000/api/admin/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Foundation of Maurya Empire",
    "summary": "Chandragupta Maurya established the empire",
    "description": "The Maurya Empire was founded by Chandragupta Maurya",
    "event_type": "point",
    "year": -321,
    "location_type": "point",
    "latitude": 25.5941,
    "longitude": 85.1376,
    "place_name": "Pataliputra",
    "period_id": "YOUR_PERIOD_ID"
  }'
```

### 2. Create a Modern Event with Full Details

```bash
curl -X POST http://localhost:5000/api/admin/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Independence Day of India",
    "summary": "India gained independence",
    "description": "India gained independence from British rule",
    "description_hindi": "भारत ने ब्रिटिश शासन से स्वतंत्रता प्राप्त की",
    "description_hinglish": "Bharat ne British shasan se swatantrata prapt ki",
    "event_type": "point",
    "year": 1947,
    "date": "1947-08-15",
    "location_type": "point",
    "latitude": 28.6139,
    "longitude": 77.209,
    "place_name": "Red Fort, Delhi",
    "period_id": "YOUR_PERIOD_ID",
    "tags": ["independence", "political"]
  }'
```

### 3. Create a Period Event Spanning Decades

```bash
curl -X POST http://localhost:5000/api/admin/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Green Revolution in India",
    "summary": "Agricultural transformation",
    "description": "Introduction of high-yielding varieties and modern techniques",
    "event_type": "period",
    "start_year": 1960,
    "end_year": 1970,
    "start_date": "1960-01-01",
    "end_date": "1970-12-31",
    "location_type": "area",
    "geographic_scope": "country",
    "area_name": "India",
    "period_id": "YOUR_PERIOD_ID",
    "tags": ["agriculture", "economic"]
  }'
```

### 4. Update Event from Point to Period

```bash
curl -X PUT http://localhost:5000/api/admin/events/EVENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Updated Title",
    "summary": "Updated summary",
    "description": "Updated description",
    "event_type": "period",
    "start_year": 1960,
    "end_year": 1970,
    "location_type": "point",
    "latitude": 28.6139,
    "longitude": 77.209,
    "period_id": "YOUR_PERIOD_ID"
  }'
```

### 5. Query Events by Multiple Filters

```bash
# Get all period events in modern India (1947-2000) at country level
curl "http://localhost:5000/api/events?event_type=period&start_year=1947&end_year=2000&location_type=area&geographic_scope=country"
```

---

## Notes

1. **Backward Compatibility:** All existing events continue to work with default values (`event_type: "point"`, `location_type: "point"`)

2. **Automatic Field Clearing:** When switching types, incompatible fields are automatically cleared by the model validation

3. **Year Range Queries:** When filtering by year range, period events are included if they overlap with the range

4. **Multilingual Fields:** All multilingual fields (`description_hindi`, `description_hinglish`) are optional

5. **Coordinates for Areas:** Area locations can optionally include `latitude` and `longitude` to represent the center point of the region

6. **Date Requirements:** Events from 1947 onwards require specific dates for better accuracy

7. **Sorting:** Events are sorted by `year` (for point events) or `start_year` (for period events) in ascending order
