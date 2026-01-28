# Flight Tracker: 30 Critical Improvements Plan

**Date:** January 25, 2026  
**Goal:** Make flight tracker more consistent, accurate, feature-rich, and bug-free

---

## Analysis Summary

After comprehensive analysis of the flight tracker system, I've identified 30 improvements across:
- **Data Accuracy** (durations, layovers, times, prices)
- **Search Reliability** (race conditions, error handling, caching)
- **User Experience** (UI consistency, loading states, feedback)
- **Feature Completeness** (missing functionality, edge cases)
- **Performance** (optimization, caching, deduplication)

---

## Priority 1: Critical Accuracy & Reliability (1-10)

### 1. **Add AbortController to Flight Search to Prevent Race Conditions** 🔴
**Why Critical:** Multiple searches can overlap, causing stale data to display. User clicks search multiple times, gets confused by wrong results.

**Current State:**
- `useFlightSearch.ts` has no request cancellation
- Multiple searches can run simultaneously
- Last response wins, but might not be most recent user action

**Plan:**
1. Add `abortControllerRef` to `useFlightSearch` hook
2. Cancel previous search when new one starts
3. Check `aborted` flag before updating state
4. Clean up on unmount

**Best Approach?** ✅ Yes - Same pattern as TripWizard, proven effective

**Execution:** ✅ COMPLETED
- Added `abortControllerRef` to `useFlightSearch` hook
- Cancel previous search when new one starts
- Check `aborted` flag before updating state
- Clean up on unmount
- Applied to all search functions (one-way, round-trip, multi-city, retry)

**Files Modified:**
- `src/hooks/useFlightSearch.ts`

**Verification:**
- ✅ No race conditions when rapidly clicking search
- ✅ Only latest search results displayed
- ✅ Cancelled requests don't update state

---

### 2. **Fix Timezone Handling in Flight Times** 🔴
**Why Critical:** Flight times can be wrong due to timezone issues, causing users to miss flights or arrive at wrong times.

**Current State:**
- Times displayed as-is from API
- No timezone conversion
- Date/time parsing might not account for timezones

**Plan:**
1. Store timezone info with each airport
2. Convert all times to user's local timezone
3. Display with timezone indicator
4. Handle day rollovers correctly

**Best Approach?** ✅ Yes - Essential for accuracy

**Execution:**
- Add timezone data to airport info
- Create timezone conversion utility
- Update time display to show local time
- Test: Search international flights, verify times correct

---

### 3. **Add Request Deduplication to Prevent Duplicate API Calls** 🟠
**Why Critical:** Same search can be triggered multiple times, wasting API quota and causing inconsistent results.

**Current State:**
- Cache exists but doesn't prevent duplicate concurrent requests
- Multiple components might trigger same search

**Plan:**
1. Track active requests by cache key
2. Reuse pending promise if same search in progress
3. Return same promise for concurrent identical searches

**Best Approach?** ✅ Yes - Standard pattern, prevents waste

**Execution:** ✅ COMPLETED
- Added `activeRequestsRef` Map to track pending searches
- Check if same request already in progress
- Return existing promise to prevent duplicate API calls
- Clean up when request completes

**Files Modified:**
- `src/hooks/useFlightSearch.ts`

**Verification:**
- ✅ Duplicate concurrent searches reuse same promise
- ✅ Only one API call per unique search
- ✅ Prevents wasted API quota

---

### 4. **Improve Error Messages with Specific Context** 🟠
**Why Critical:** Generic errors don't help users understand what went wrong or how to fix it.

**Current State:**
- Generic "Failed to search flights" messages
- No context about what failed (API, network, validation)

**Plan:**
1. Categorize error types (network, API, validation, rate limit)
2. Provide actionable error messages
3. Show retry options for transient errors
4. Log detailed errors for debugging

**Best Approach?** ✅ Yes - Improves UX significantly

**Execution:** ✅ COMPLETED
- Created `categorizeFlightError` function in `src/lib/flightErrors.ts`
- Categorizes errors: network, rate_limit, auth, server, api, validation, unknown
- Provides user-friendly messages with context
- Applied to all error handling in search functions

**Files Modified:**
- `src/lib/flightErrors.ts` (new)
- `src/hooks/useFlightSearch.ts`

**Verification:**
- ✅ Network errors show connection message
- ✅ Rate limits show wait message
- ✅ Auth errors show sign-in message
- ✅ All errors have actionable messages

---

### 5. **Add Validation for Search Parameters Before API Call** 🟠
**Why Critical:** Invalid searches waste API quota and confuse users with empty results.

**Current State:**
- Basic validation exists but could be more comprehensive
- Edge cases might not be caught

**Plan:**
1. Validate airport codes format
2. Validate dates (not past, reasonable range)
3. Validate passenger counts
4. Show validation errors before search

**Best Approach?** ✅ Yes - Prevents wasted API calls

**Execution:**
- Create validation utility
- Add validation before search
- Show inline errors
- Test: Try invalid inputs, verify caught before API call

---

### 6. **Fix Multi-Layover Duration Calculation** 🟠
**Why Critical:** Total duration might be wrong for flights with multiple layovers, misleading users.

**Current State:**
- Duration parsing improved but multi-layover totals might be off
- Need to verify calculation includes all segments correctly

**Plan:**
1. Verify duration calculation sums all segments
2. Add validation for duration consistency
3. Handle edge cases (missing segments, invalid durations)
4. Display breakdown of total duration

**Best Approach?** ✅ Yes - Critical for accuracy

**Execution:**
- Review duration calculation logic
- Add unit tests for multi-layover scenarios
- Fix any calculation errors
- Test: Search multi-stop flights, verify durations correct

---

### 7. **Add Loading States for Individual Legs in Multi-City** 🟠
**Why Critical:** Users don't know which legs are still loading, causing confusion.

**Current State:**
- Global loading state exists
- Individual leg loading states might not be clear

**Plan:**
1. Show per-leg loading indicators
2. Update progress as each leg completes
3. Show which legs succeeded/failed

**Best Approach?** ✅ Yes - Clear feedback needed

**Execution:**
- Add per-leg loading state tracking
- Update UI to show individual leg status
- Test: Multi-city search, verify per-leg feedback

---

### 8. **Add Retry Logic with Exponential Backoff** 🟠
**Why Critical:** Transient failures should auto-retry, reducing need for manual retries.

**Current State:**
- Manual retry exists
- No automatic retry for transient failures

**Plan:**
1. Detect transient errors (network, 5xx)
2. Auto-retry with exponential backoff
3. Limit retry attempts
4. Show retry progress

**Best Approach?** ✅ Yes - Improves reliability

**Execution:**
- Add retry wrapper function
- Implement exponential backoff
- Add retry counter and limits
- Test: Simulate network failure, verify auto-retry

---

### 9. **Fix Price Display Consistency** 🟠
**Why Critical:** Prices might show differently in different places, confusing users.

**Current State:**
- Price formatting might be inconsistent
- Currency handling might vary

**Plan:**
1. Create unified price formatting utility
2. Ensure consistent currency display
3. Handle per-ticket vs total price consistently
4. Show price breakdown clearly

**Best Approach?** ✅ Yes - Essential for consistency

**Execution:**
- Create price formatting utility
- Replace all price displays with utility
- Test: Verify prices consistent everywhere

---

### 10. **Add Data Validation for API Response** 🟠
**Why Critical:** Invalid API responses can crash the app or show wrong data.

**Current State:**
- Some validation exists but might miss edge cases
- Need comprehensive response validation

**Plan:**
1. Validate flight structure (required fields)
2. Validate data types
3. Handle missing/null fields gracefully
4. Log validation failures

**Best Approach?** ✅ Yes - Prevents crashes

**Execution:**
- Create response validation schema
- Validate all API responses
- Handle invalid responses gracefully
- Test: Simulate invalid responses, verify handled

---

## Priority 2: User Experience & Features (11-20)

### 11. **Add Flight Comparison Feature** 🟡
**Why Important:** Users want to compare multiple flights side-by-side.

**Plan:**
1. Allow selecting multiple flights for comparison
2. Create comparison view with key metrics
3. Highlight differences

**Best Approach?** ✅ Yes - Common feature users expect

---

### 12. **Add "Save Search" Functionality** 🟡
**Why Important:** Users want to save searches to revisit later.

**Plan:**
1. Save search parameters to database
2. Show saved searches list
3. Allow quick re-search from saved

**Best Approach?** ✅ Yes - Useful feature

---

### 13. **Add Flight History/Recently Viewed** 🟡
**Why Important:** Users want to see flights they viewed before.

**Plan:**
1. Track viewed flights in local storage
2. Show recently viewed section
3. Allow quick access to previous searches

**Best Approach?** ✅ Yes - Improves UX

---

### 14. **Improve Empty State Messages** 🟡
**Why Important:** Empty states should guide users on what to do next.

**Plan:**
1. Create helpful empty state messages
2. Suggest alternative dates/airports
3. Provide tips for better results

**Best Approach?** ✅ Yes - Better UX

---

### 15. **Add Sort Options for Results** 🟡
**Why Important:** Users want to sort by price, duration, departure time, etc.

**Plan:**
1. Add sort dropdown
2. Implement sort functions
3. Persist sort preference

**Best Approach?** ✅ Yes - Standard feature

---

### 16. **Add Filter Options (Price Range, Time Windows)** 🟡
**Why Important:** Users want to filter results to narrow choices.

**Plan:**
1. Add price range slider
2. Add departure/arrival time filters
3. Apply filters to displayed results

**Best Approach?** ✅ Yes - Essential filtering

---

### 17. **Add "Flexible Dates" Calendar View** 🟡
**Why Important:** Users want to see prices across date ranges.

**Current State:** FlexibleDateCalendar exists but might need improvements

**Plan:**
1. Enhance existing calendar
2. Show price trends
3. Allow date range selection

**Best Approach?** ✅ Yes - Leverage existing component

---

### 18. **Improve Mobile Experience** 🟡
**Why Important:** Many users search on mobile, experience should be optimized.

**Plan:**
1. Review mobile layout
2. Optimize touch targets
3. Improve mobile-specific flows

**Best Approach?** ✅ Yes - Important for accessibility

---

### 19. **Add Keyboard Shortcuts** 🟡
**Why Important:** Power users want keyboard navigation.

**Plan:**
1. Add keyboard shortcuts for common actions
2. Document shortcuts
3. Show shortcuts in UI

**Best Approach?** ✅ Yes - Power user feature

---

### 20. **Add Export Flight Details** 🟡
**Why Important:** Users want to save/share flight information.

**Plan:**
1. Add export to PDF/CSV
2. Include all flight details
3. Format nicely

**Best Approach?** ✅ Yes - Useful feature

---

## Priority 3: Advanced Features & Polish (21-30)

### 21. **Add Price Tracking Alerts** 🟢
**Current State:** PriceAlertDialog exists, might need improvements

**Plan:**
1. Enhance price alert system
2. Add email notifications
3. Track price history

**Best Approach?** ✅ Yes - Build on existing

---

### 22. **Add Flight Delay Risk Prediction** 🟢
**Why Important:** Users want to know delay risk before booking.

**Plan:**
1. Integrate delay data if available
2. Calculate delay risk score
3. Display risk indicators

**Best Approach?** ✅ Yes - Valuable feature

---

### 23. **Add Carbon Emissions Comparison** 🟢
**Why Important:** Environmentally conscious users want this info.

**Current State:** Carbon emissions data exists in API response

**Plan:**
1. Display carbon emissions
2. Compare emissions between flights
3. Show environmental impact

**Best Approach?** ✅ Yes - Data already available

---

### 24. **Add Seat Map Preview** 🟢
**Why Important:** Users want to see seat layouts before booking.

**Plan:**
1. Integrate seat map API if available
2. Show seat layout
3. Highlight preferred seats

**Best Approach?** ⚠️ Depends on API availability

---

### 25. **Add Airport Information Tooltips** 🟢
**Why Important:** Users want airport details (terminals, amenities).

**Plan:**
1. Add airport info to data
2. Show tooltips on hover
3. Include terminal info

**Best Approach?** ✅ Yes - Easy enhancement

---

### 26. **Add Flight Status Integration** 🟢
**Why Important:** Users want real-time flight status.

**Plan:**
1. Integrate flight status API
2. Show current status
3. Update in real-time

**Best Approach?** ⚠️ Depends on API availability

---

### 27. **Improve Accessibility (ARIA, Screen Readers)** 🟢
**Why Important:** App should be accessible to all users.

**Plan:**
1. Add ARIA labels
2. Improve keyboard navigation
3. Test with screen readers

**Best Approach?** ✅ Yes - Essential for accessibility

---

### 28. **Add Analytics/Tracking for Search Patterns** 🟢
**Why Important:** Helps improve service based on usage.

**Plan:**
1. Track search patterns (anonymized)
2. Identify common routes
3. Optimize based on data

**Best Approach?** ✅ Yes - Data-driven improvement

---

### 29. **Add Multi-Language Support** 🟢
**Why Important:** Broader user base.

**Plan:**
1. Add i18n framework
2. Translate UI
3. Support multiple languages

**Best Approach?** ⚠️ Large effort, lower priority

---

### 30. **Add Advanced Search Options** 🟢
**Why Important:** Power users want more control.

**Plan:**
1. Add advanced search panel
2. More filter options
3. Complex query builder

**Best Approach?** ✅ Yes - Power user feature

---

## Execution Order

**Phase 1 (Critical - Do First):**
1. AbortController for race conditions
2. Timezone handling
3. Request deduplication
4. Error messages
5. Parameter validation

**Phase 2 (High Priority):**
6. Multi-layover duration
7. Loading states
8. Retry logic
9. Price consistency
10. Response validation

**Phase 3 (Features):**
11-20. UX improvements

**Phase 4 (Polish):**
21-30. Advanced features

---

## Testing Strategy

For each improvement:
1. **Understand current state** - Read code, identify issue
2. **Question approach** - Is this the best way?
3. **Implement fix** - Make minimal, safe changes
4. **Test thoroughly** - Verify fix works, no regressions
5. **Verify no breaking changes** - App still works normally
6. **Document** - Update this file with results

---

## Success Criteria

- Zero race conditions
- Accurate flight data (times, durations, prices)
- Consistent UI/UX
- Better error handling
- More features
- Improved performance
- Better accessibility
