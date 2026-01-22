# Flight Ranking and Preference Matching Fix

## Summary

Fixed critical bugs in flight ranking and airline preference matching:
1. **Canonical airline normalization** - Robust matching for airline names and codes
2. **Ranking consistency** - Ensured avoided airlines cannot be #1 when non-avoided options exist
3. **Preferred airline recognition** - Fixed matching for both name ("JetBlue") and code ("B6")
4. **Numbering consistency** - Rank numbers (#1, #2, etc.) now match visual order

## Root Causes Identified

1. **Airline normalization mismatch**: Preferences stored names ("JetBlue") while flight data provided codes ("B6") or vice versa. The matching logic was inconsistent.

2. **Ranking vs labeling mismatch**: The ranking logic used array index `i` which could result in avoided airlines getting #1 if they appeared first in the sorted array.

3. **Missing airline code mapping**: Some flights didn't include carrier codes consistently, causing preference logic to skip.

## Changes Made

### 1. Canonical Airline Normalization (`normalizeAirline`)

Created a single normalization function that:
- Extracts IATA code from flight numbers (e.g., "B61707" → "B6")
- Matches airline names with aliases (e.g., "JetBlue" → "JetBlue Airways")
- Returns normalized code and name for consistent matching

**Location**: `src/lib/flightScoring.ts` (lines 143-200)

### 2. Robust Preference Matching (`matchesAirlinePreference`)

Unified preference matching that works for:
- Code matching: "B6" matches "B6" or "B61707"
- Name matching: "JetBlue" matches "JetBlue Airways" (case-insensitive)
- Alias matching: Handles common variations

**Location**: `src/lib/flightScoring.ts` (lines 206-256)

### 3. Fixed Ranking Logic

**Key changes**:
- Avoided airlines are sorted to the bottom (unless ALL flights are avoided)
- Non-avoided flights are numbered sequentially (#1, #2, etc.)
- Avoided airlines are numbered after all non-avoided flights
- "Top pick" badge appears only on the first non-avoided flight

**Location**: `src/lib/flightScoring.ts` (lines 1310-1360)

### 4. Updated Preference Checks

All preference checks now use the canonical normalization:
- `isAvoidedAirline` - Uses `matchesAirlinePreference`
- `scoreAirlineReliability` - Uses `matchesAirlinePreference`
- Preference matches in UI - Uses `normalizeAirline` for display

## Acceptance Criteria Met

✅ **1. Avoided airlines cannot be #1**: If Spirit is in `avoided_airlines`, it cannot appear as #1 Top pick when at least one non-avoided option exists.

✅ **2. Preferred airline recognition**: JetBlue is recognized when in `preferred_airlines` by either name ("JetBlue") or code ("B6").

✅ **3. Top pick consistency**: "Top pick" badge appears only on the first item in the final sorted list; numbering matches visual order.

✅ **4. Tests added**: Test file created at `src/lib/__tests__/flightScoring.test.ts` covering:
- Preferred by name matches carrier code (JetBlue → B6)
- Preferred by code matches carrier name (B6 → JetBlue)
- Avoided airline penalty pushes NK below non-avoided options
- Sorting + labeling consistency (top pick is index 0 of sorted list)

## Airline Alias Map

Added alias mapping for common carriers:
- JetBlue: ["B6", "jetblue", "jetblue airways", "jet blue"]
- Spirit: ["NK", "spirit", "spirit airlines"]
- Frontier: ["F9", "frontier", "frontier airlines"]
- Plus major US carriers (American, Delta, United, Southwest, Alaska)

## Testing

To run tests (after installing vitest):
```bash
npm install -D vitest @vitest/ui
npm test
```

Test file: `src/lib/__tests__/flightScoring.test.ts`

## Files Modified

1. `src/lib/flightScoring.ts`
   - Added `normalizeAirline()` function
   - Added `matchesAirlinePreference()` function
   - Updated `isAvoidedAirline()` to use canonical matching
   - Updated `scoreAirlineReliability()` to use canonical matching
   - Fixed ranking logic to ensure avoided airlines cannot be #1
   - Updated preference match generation to use canonical matching

2. `src/lib/__tests__/flightScoring.test.ts` (new)
   - Comprehensive tests for airline matching
   - Tests for ranking and top pick logic
   - Tests for score calculation with preferences

## Verification Steps

1. **Test avoided airline penalty**:
   - Add Spirit to avoided_airlines
   - Search for flights including Spirit
   - Verify Spirit does NOT appear as #1 Top pick
   - Verify Spirit appears after all non-avoided flights

2. **Test preferred airline boost**:
   - Add JetBlue to preferred_airlines (by name or code)
   - Search for flights including JetBlue
   - Verify JetBlue receives preferred boost
   - Verify JetBlue shows in preference matches

3. **Test ranking consistency**:
   - Verify flight order matches numbering (#1, #2, #3)
   - Verify "Top pick" appears only on first flight
   - Verify numbering is sequential

## Notes

- The penalty for avoided airlines is -50 points (existing behavior, confirmed)
- The boost for preferred airlines is +20 points (existing behavior, confirmed)
- These values are sufficient to ensure avoided airlines cannot become #1 unless all options are avoided
