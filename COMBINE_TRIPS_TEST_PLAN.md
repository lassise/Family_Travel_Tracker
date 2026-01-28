# Combine Trips Feature - Comprehensive Test Plan

## Test Scenarios

### ✅ Code-Level Tests (PASSED)

1. **TypeScript Compilation**
   - ✅ Status: PASS
   - ✅ No type errors
   - ✅ All imports resolved

2. **Linting**
   - ✅ Status: PASS
   - ✅ No linting errors
   - ✅ Code style consistent

---

### Integration Test Scenarios

#### Test 1: Detect Trips in Same Month/Year
**Setup:**
- Create 2 completed trips in June 2024
- Create 1 completed trip in July 2024

**Expected:**
- Suggestion appears for June trips only
- No suggestion for July (only 1 trip)

**Test:**
```typescript
// Mock trips
const trips = [
  { id: '1', status: 'completed', start_date: '2024-06-03', destination: 'Switzerland' },
  { id: '2', status: 'completed', start_date: '2024-06-10', destination: 'Germany' },
  { id: '3', status: 'completed', start_date: '2024-07-05', destination: 'France' },
];

// Should group: June = [1, 2], July = [3]
// Should suggest: June only (2+ trips)
```

---

#### Test 2: Combine 2 Trips with Countries
**Setup:**
- Trip 1: Switzerland (has country in trip_countries)
- Trip 2: Germany (has country in trip_countries)

**Expected:**
- Both countries collected
- Dates preserved
- Combined trip dates = min(start) to max(end)
- Trip 2 deleted
- Trip 1 updated

**Test Steps:**
1. Open combine dialog
2. Verify both countries appear
3. Edit dates if needed
4. Click "Combine Trips"
5. Verify database:
   - trip_countries has both countries
   - trip.start_date/end_date updated
   - Trip 2 deleted
   - country_visit_details synced

---

#### Test 3: Combine 2 Trips Without Countries (Destination Only)
**Setup:**
- Trip 1: destination = "Switzerland"
- Trip 2: destination = "Germany"
- No countries in trip_countries

**Expected:**
- Countries inferred from destination using searchCountries
- Countries matched correctly
- Dates from trip dates used

**Test Steps:**
1. Open combine dialog
2. Verify countries inferred from destination
3. Verify country codes found
4. Combine
5. Verify countries saved correctly

---

#### Test 4: Combine 3+ Trips (Up to 15)
**Setup:**
- 5 trips in same month
- Each has 1 country
- Total = 5 countries

**Expected:**
- All 5 countries collected
- All combined successfully
- 4 trips deleted, 1 kept

**Edge Case:**
- 20 trips with countries
- Should limit to 15 countries
- Should show warning

---

#### Test 5: Countries Without Codes
**Setup:**
- Trip 1: destination = "InvalidCountryName"
- Trip 2: destination = "Switzerland"

**Expected:**
- Switzerland matched (has code)
- InvalidCountryName not matched (no code)
- Warning shown
- Only Switzerland saved
- Error if no valid countries

---

#### Test 6: Invalid Dates
**Setup:**
- Country 1: start = 2024-06-10, end = 2024-06-05 (invalid)

**Expected:**
- Validation error shown
- Cannot save
- Error message displayed

---

#### Test 7: Dismiss Suggestion
**Setup:**
- 2 trips in June 2024
- User dismisses suggestion

**Expected:**
- Suggestion hidden
- Stored in localStorage
- Doesn't show again for June 2024
- Still shows for other months

---

#### Test 8: Edit Past Trip
**Setup:**
- Completed trip with 1 country
- User clicks "Edit Countries"

**Expected:**
- EditTripCountriesDialog opens
- Can add countries
- Can add dates
- Saves correctly
- Trip updated

---

#### Test 9: Combine with Overlapping Dates
**Setup:**
- Trip 1: Switzerland 6/3-6/5
- Trip 2: Germany 6/5-6/7

**Expected:**
- Combined trip: 6/3-6/7
- Both countries preserved
- Dates preserved

---

#### Test 10: Combine with Non-Overlapping Dates
**Setup:**
- Trip 1: Switzerland 6/3-6/5
- Trip 2: Germany 6/10-6/12

**Expected:**
- Combined trip: 6/3-6/12
- Both countries preserved
- Dates preserved

---

## Edge Cases to Test

### ✅ Handled in Code:
- [x] Empty countries array → Error message
- [x] Countries without codes → Warning, excluded
- [x] Invalid dates → Validation error
- [x] Max countries (15) → Limit enforced
- [x] Dismissed suggestions → localStorage
- [x] No countries in trips → Helpful message
- [x] Multiple trips same month → Grouped correctly
- [x] Trips without dates → Handled gracefully

---

## Database Verification

### After Combine:
1. ✅ `trip_countries` has all countries
2. ✅ `trip_countries.start_date/end_date` populated
3. ✅ `trips.start_date/end_date` = min/max
4. ✅ Other trips deleted
5. ✅ `country_visit_details` synced
6. ✅ ONE trip with multiple countries

---

## Performance Tests

### Expected Performance:
- Combine 2 trips: < 500ms
- Combine 5 trips: < 1s
- Combine 15 trips: < 2s
- Load countries: < 200ms

---

## UI/UX Tests

### Expected Behavior:
- [ ] Suggestion appears for completed trips only
- [ ] Dialog shows all countries clearly
- [ ] Date pickers work correctly
- [ ] Calculated dates display correctly
- [ ] Loading states show during save
- [ ] Success/error messages clear
- [ ] Dismiss button works
- [ ] Edit button accessible for all trips

---

## Status: ✅ READY FOR UI TESTING

All code-level tests pass. Ready for end-to-end UI testing.
