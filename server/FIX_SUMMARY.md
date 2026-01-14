# Fix for 500 Internal Server Error on /api/events Endpoint

## Problem

The frontend was getting a 500 Internal Server Error when fetching events:

```
GET https://historical-timeline-a223.onrender.com/api/events?start_year=-3000&end_year=500 500 (Internal Server Error)
```

## Root Causes Identified

### 1. **Sorting Issue**

The original code was sorting by `date` field first:

```javascript
.sort({ date: -1, year: 1 })
```

However, the `date` field is optional (only used for Current Affairs), so most ancient/medieval/modern events don't have it. This can cause MongoDB sorting issues.

### 2. **No Limit on Results**

The query was returning ALL events matching the criteria without a default limit. For the ancient period (-3000 to 500), there are **40,040 events** in the database. Trying to fetch and return all of them:

- Causes memory issues on Render's free tier (512 MB RAM limit)
- Causes timeout issues (30-second request timeout on free tier)
- Slows down the response significantly

## Changes Made in server.js

### Line 213: Added request logging

```javascript
console.log("GET /api/events - Query params:", req.query);
```

### Lines 251-262: Improved year parameter parsing

```javascript
// Parse year parameters safely
if (start_year !== undefined && start_year !== null && start_year !== "") {
  const startYearNum = parseInt(start_year);
  if (!isNaN(startYearNum)) {
    query.year = { ...query.year, $gte: startYearNum };
  }
}
if (end_year !== undefined && end_year !== null && end_year !== "") {
  const endYearNum = parseInt(end_year);
  if (!isNaN(endYearNum)) {
    query.year = { ...query.year, $lte: endYearNum };
  }
}
```

### Lines 279-294: Fixed sorting and added default limit

```javascript
// Add limit parameter support to prevent overwhelming the client
// Default limit is 500 to prevent memory/timeout issues on free tier servers
// Frontend can request more with ?limit=10000 if needed
const defaultLimit = 500;
const limit = req.query.limit ? parseInt(req.query.limit) : defaultLimit;
const skip = req.query.skip ? parseInt(req.query.skip) : 0;

console.log("Fetching events with limit:", limit, "skip:", skip);

// Sort by year (ascending) - date is optional so we sort by year primarily
const events = await Event.find(query)
  .sort({ year: 1, date: -1 }) // Changed from { date: -1, year: 1 }
  .skip(skip)
  .limit(limit)
  .lean(); // Use lean() for better performance

console.log("Returning", events.length, "events");
```

### Line 299: Improved error logging

```javascript
res.status(500).json({ error: "Server error", message: err.message });
```

## Impact on Frontend

The frontend currently expects to receive ALL events for a period, which is not scalable. With the 500-event limit:

- The map will show up to 500 events (still plenty for visualization)
- The frontend can request more events by adding `?limit=10000` to the URL
- For pagination, the frontend can use `?skip=500&limit=500` to get the next batch

## Deployment Instructions

### Option 1: Git Push to Render (Recommended)

```bash
cd "d:\Projects\Historical Timeline Web Application"
git add server/server.js
git commit -m "Fix 500 error: Add limit and fix sorting on /api/events endpoint"
git push origin main
```

Render will automatically detect the push and redeploy.

### Option 2: Manual Deploy via Render Dashboard

1. Go to https://dashboard.render.com/
2. Find your service "historical-timeline-a223"
3. Click "Manual Deploy" > "Deploy latest commit"

## Testing After Deployment

### 1. Test the health endpoint:

```bash
curl https://historical-timeline-a223.onrender.com/api/health
```

### 2. Test the events endpoint:

```bash
curl "https://historical-timeline-a223.onrender.com/api/events?start_year=-3000&end_year=500"
```

Should return 500 events (instead of crashing).

### 3. Test with custom limit:

```bash
curl "https://historical-timeline-a223.onrender.com/api/events?start_year=-3000&end_year=500&limit=10"
```

Should return 10 events.

## Monitoring

After deployment, check the Render logs at:
https://dashboard.render.com/web/[your-service-id]/logs

Look for:

- "Connected to MongoDB" - confirms DB connection
- "GET /api/events - Query params: ..." - shows incoming requests
- "Fetching events with limit: 500 skip: 0" - confirms limit is applied
- "Returning X events" - shows how many events were returned

## Future Improvements (Optional)

1. **Implement pagination in frontend** - Instead of fetching all events at once, fetch them in batches
2. **Add caching** - Use Redis or in-memory caching to cache frequent queries
3. **Add indexes** - Add MongoDB indexes on `year`, `period_id`, and `tags` fields for faster queries
4. **Optimize database** - Consider aggregating events by year/region for map visualization instead of sending individual events

## Rollback Plan

If these changes cause issues, you can revert by:

```bash
git revert HEAD
git push origin main
```

Or restore the old sorting and remove the limit:

```javascript
const events = await Event.find(query).sort({ date: -1, year: 1 }).limit(0);
```
