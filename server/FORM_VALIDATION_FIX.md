# Fix for "An invalid form control is not focusable" Error

## Problem

When saving an event in the admin edit window, you're getting:

```
An invalid form control with name='' is not focusable
```

This error occurs because HTML5 validation is trying to focus on a `required` field that is either:

1. Hidden (display: none or visibility: hidden)
2. Missing the `name` attribute
3. Not properly initialized

## Solution

The issue is likely related to the new fields added for the enhanced event schema. Here's how to fix it:

### Option 1: Quick Fix - Remove Required Attributes on Hidden Fields

In your `admin.html` or admin interface JavaScript, update the form validation to handle conditional fields:

```javascript
// Before submitting the form, remove 'required' from hidden fields
function prepareFormForSubmission() {
  const form = document.getElementById("eventForm"); // or your form ID

  // Get all required inputs
  const requiredInputs = form.querySelectorAll("[required]");

  requiredInputs.forEach((input) => {
    // If the input is not visible, remove the required attribute temporarily
    if (input.offsetParent === null) {
      input.removeAttribute("required");
    }
  });
}

// Call this before form submission
form.addEventListener("submit", function (e) {
  prepareFormForSubmission();
  // Continue with form submission
});
```

### Option 2: Conditional Required Attributes Based on Event Type

Update your form to dynamically set required attributes based on event type:

```javascript
// Function to update required fields based on event_type
function updateRequiredFieldsForEventType() {
  const eventType = document.querySelector('select[name="event_type"]').value;

  // Fields for point events
  const yearField = document.querySelector('input[name="year"]');
  const dateField = document.querySelector('input[name="date"]');

  // Fields for period events
  const startYearField = document.querySelector('input[name="start_year"]');
  const endYearField = document.querySelector('input[name="end_year"]');
  const startDateField = document.querySelector('input[name="start_date"]');
  const endDateField = document.querySelector('input[name="end_date"]');

  if (eventType === "point") {
    // Point event: year is required
    if (yearField) {
      yearField.required = true;
      yearField.parentElement.style.display = "block";
    }
    // Period fields are not required
    if (startYearField) startYearField.required = false;
    if (endYearField) endYearField.required = false;
    if (startDateField) startDateField.required = false;
    if (endDateField) endDateField.required = false;

    // Hide period fields
    if (startYearField) startYearField.parentElement.style.display = "none";
    if (endYearField) endYearField.parentElement.style.display = "none";
    if (startDateField) startDateField.parentElement.style.display = "none";
    if (endDateField) endDateField.parentElement.style.display = "none";
  } else if (eventType === "period") {
    // Period event: start_year and end_year are required
    if (startYearField) {
      startYearField.required = true;
      startYearField.parentElement.style.display = "block";
    }
    if (endYearField) {
      endYearField.required = true;
      endYearField.parentElement.style.display = "block";
    }

    // Year field is not required
    if (yearField) {
      yearField.required = false;
      yearField.parentElement.style.display = "none";
    }
    if (dateField && yearField) {
      const yearValue = parseInt(yearField.value);
      dateField.required = yearValue >= 1947;
    }
  }
}

// Function to update required fields based on location_type
function updateRequiredFieldsForLocationType() {
  const locationType = document.querySelector(
    'select[name="location_type"]'
  ).value;

  // Fields for point locations
  const latField = document.querySelector('input[name="latitude"]');
  const lonField = document.querySelector('input[name="longitude"]');

  // Fields for area locations
  const geoScopeField = document.querySelector(
    'select[name="geographic_scope"]'
  );
  const areaNameField = document.querySelector('input[name="area_name"]');

  if (locationType === "point") {
    // Point location: lat/lon required
    if (latField) {
      latField.required = true;
      latField.parentElement.style.display = "block";
    }
    if (lonField) {
      lonField.required = true;
      lonField.parentElement.style.display = "block";
    }

    // Area fields not required
    if (geoScopeField) {
      geoScopeField.required = false;
      geoScopeField.parentElement.style.display = "none";
    }
    if (areaNameField) {
      areaNameField.required = false;
      areaNameField.parentElement.style.display = "none";
    }
  } else if (locationType === "area") {
    // Area location: geographic_scope and area_name required
    if (geoScopeField) {
      geoScopeField.required = true;
      geoScopeField.parentElement.style.display = "block";
    }
    if (areaNameField) {
      areaNameField.required = true;
      areaNameField.parentElement.style.display = "block";
    }

    // Lat/lon not required (but can be optional for area center)
    if (latField) latField.required = false;
    if (lonField) lonField.required = false;
  }
}

// Add event listeners
document
  .querySelector('select[name="event_type"]')
  ?.addEventListener("change", updateRequiredFieldsForEventType);
document
  .querySelector('select[name="location_type"]')
  ?.addEventListener("change", updateRequiredFieldsForLocationType);

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  updateRequiredFieldsForEventType();
  updateRequiredFieldsForLocationType();
});
```

### Option 3: Use novalidate and Custom Validation

Disable HTML5 validation and implement custom validation:

```html
<form id="eventForm" novalidate>
  <!-- Your form fields -->
</form>
```

```javascript
form.addEventListener("submit", function (e) {
  e.preventDefault();

  // Custom validation
  const eventType = document.querySelector('select[name="event_type"]').value;
  const errors = [];

  // Always required
  if (!document.querySelector('input[name="title"]').value) {
    errors.push("Title is required");
  }
  if (!document.querySelector('textarea[name="summary"]').value) {
    errors.push("Summary is required");
  }

  // Event type specific validation
  if (eventType === "point") {
    if (!document.querySelector('input[name="year"]').value) {
      errors.push("Year is required for point events");
    }
  } else if (eventType === "period") {
    if (!document.querySelector('input[name="start_year"]').value) {
      errors.push("Start year is required for period events");
    }
    if (!document.querySelector('input[name="end_year"]').value) {
      errors.push("End year is required for period events");
    }
  }

  // Location type specific validation
  const locationType = document.querySelector(
    'select[name="location_type"]'
  ).value;
  if (locationType === "point") {
    if (!document.querySelector('input[name="latitude"]').value) {
      errors.push("Latitude is required for point locations");
    }
    if (!document.querySelector('input[name="longitude"]').value) {
      errors.push("Longitude is required for point locations");
    }
  } else if (locationType === "area") {
    if (!document.querySelector('select[name="geographic_scope"]').value) {
      errors.push("Geographic scope is required for area locations");
    }
    if (!document.querySelector('input[name="area_name"]').value) {
      errors.push("Area name is required for area locations");
    }
  }

  if (errors.length > 0) {
    alert("Please fix the following errors:\n\n" + errors.join("\n"));
    return false;
  }

  // Submit the form
  submitEventForm();
});
```

## Immediate Fix

If you need a quick fix right now, add this to your form initialization:

```javascript
// Remove required from all hidden or display:none fields before submission
document.getElementById("eventForm").addEventListener("submit", function (e) {
  // Find all inputs with display:none or visibility:hidden
  const allInputs = this.querySelectorAll("input, select, textarea");
  allInputs.forEach((input) => {
    if (input.offsetParent === null) {
      // Element is hidden
      input.removeAttribute("required");
    }
  });
});
```

## Check Your Current Form

Look for these issues in your admin form:

1. **Missing name attributes**: Make sure all fields have `name` attributes

   ```html
   <input type="text" name="title" required />
   <!-- Good -->
   <input type="text" required />
   <!-- Bad - missing name -->
   ```

2. **Hidden required fields**: Fields that are `display: none` but still have `required`

   ```html
   <!-- Bad -->
   <input type="text" name="year" required style="display: none;" />

   <!-- Good - remove required when hidden -->
   <input type="text" name="year" />
   ```

3. **Disabled required fields**: Don't use `disabled` on required fields

   ```html
   <!-- Bad -->
   <input type="text" name="year" required disabled />

   <!-- Good - use readonly or just hide it -->
   <input type="text" name="year" readonly />
   ```

## Expected Form Structure

Your event form should have these fields with conditional visibility:

```html
<form id="eventForm">
  <!-- Always visible -->
  <input type="text" name="title" required />
  <textarea name="summary" required></textarea>
  <textarea name="description"></textarea>
  <textarea name="description_hindi"></textarea>
  <textarea name="description_hinglish"></textarea>

  <!-- Event Type -->
  <select name="event_type" required>
    <option value="point">Point Event</option>
    <option value="period">Period Event</option>
  </select>

  <!-- Conditional: Point Event Fields -->
  <div id="pointEventFields">
    <input type="number" name="year" />
    <input type="date" name="date" />
  </div>

  <!-- Conditional: Period Event Fields -->
  <div id="periodEventFields" style="display: none;">
    <input type="number" name="start_year" />
    <input type="number" name="end_year" />
    <input type="date" name="start_date" />
    <input type="date" name="end_date" />
  </div>

  <!-- Location Type -->
  <select name="location_type" required>
    <option value="point">Point Location</option>
    <option value="area">Area Location</option>
  </select>

  <!-- Conditional: Point Location Fields -->
  <div id="pointLocationFields">
    <input type="number" step="any" name="latitude" />
    <input type="number" step="any" name="longitude" />
    <input type="text" name="place_name" />
  </div>

  <!-- Conditional: Area Location Fields -->
  <div id="areaLocationFields" style="display: none;">
    <select name="geographic_scope">
      <option value="country">Country</option>
      <option value="state">State</option>
      <option value="district">District</option>
      <option value="region">Region</option>
    </select>
    <input type="text" name="area_name" />
  </div>

  <select name="period_id" required>
    <!-- Period options -->
  </select>

  <button type="submit">Save Event</button>
</form>
```

Apply one of the solutions above to fix the validation error!
