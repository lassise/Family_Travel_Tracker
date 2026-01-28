# Top 10 Critical Bug Fixes for Zero-Bug Operation

**Date:** January 25, 2026  
**Goal:** Make the app run smoothly with zero bugs through systematic, safe fixes

---

## 1. **Fix Memory Leaks from Realtime Subscriptions** 🔴
**Priority: CRITICAL | Impact: Memory & Performance**

### Why It's Critical
- Multiple hooks (`useFamilyData`, `useVisitDetails`, `useStateVisits`) create Supabase realtime subscriptions
- If cleanup fails or component unmounts unexpectedly, subscriptions continue running
- Causes memory leaks, unnecessary network traffic, and potential state corruption
- Can lead to "zombie" subscriptions that update state after unmount

### Current Issues Found
- `useFamilyData.ts`: Debounce timer cleanup in dependency array could cause re-subscriptions
- `useVisitDetails.ts`: Similar debounce pattern with potential cleanup issues
- `useStateVisits.ts`: Subscription cleanup depends on `fetchStateVisits` in deps, causing re-subscriptions

### Step-by-Step Action Plan

1. **Audit all realtime subscriptions**
   - Search for all `supabase.channel()` calls
   - Identify cleanup patterns
   - Check dependency arrays in useEffect

2. **Fix useFamilyData subscription**
   - Move debounce timer to ref instead of closure
   - Ensure `fetchData` is stable (use useCallback properly)
   - Remove `fetchData` from dependency array if it causes re-subscriptions
   - Add cleanup guard to prevent state updates after unmount

3. **Fix useVisitDetails subscription**
   - Same pattern as useFamilyData
   - Ensure debounce timer is properly cleaned up
   - Add unmount guard

4. **Fix useStateVisits subscription**
   - Stabilize `fetchStateVisits` callback
   - Remove from dependency array if causing issues
   - Add proper cleanup

5. **Add unmount guards to all state setters**
   - Use ref to track if component is mounted
   - Check ref before calling setState

6. **Test each fix**
   - Navigate to page with subscription
   - Navigate away quickly
   - Check browser DevTools for active subscriptions
   - Monitor memory usage

### Verification
- No console warnings about memory leaks
- Network tab shows subscriptions removed on unmount
- Memory profiler shows no growing subscriptions

---

## 2. **Prevent State Updates After Component Unmount** 🔴
**Priority: CRITICAL | Impact: Crashes & Errors**

### Why It's Critical
- Async operations (API calls, timeouts) can complete after component unmounts
- Calling `setState` on unmounted component causes React warnings and potential crashes
- Common in: API calls, setTimeout/setInterval, realtime subscriptions, animations
- Can cause "Can't perform a React state update on an unmounted component" errors

### Current Issues Found
- `PublicDashboard.tsx`: Async edge function call without unmount guard
- `InteractiveWorldMap.tsx`: Mapbox operations and timeouts without unmount checks
- Multiple hooks with async operations in useEffect

### Step-by-Step Action Plan

1. **Create reusable unmount guard hook**
   ```typescript
   // hooks/useIsMounted.ts
   export const useIsMounted = () => {
     const isMountedRef = useRef(true);
     useEffect(() => {
       return () => { isMountedRef.current = false; };
     }, []);
     return () => isMountedRef.current;
   };
   ```

2. **Apply to PublicDashboard**
   - Wrap state updates with unmount check
   - Cancel edge function call if unmounted

3. **Apply to InteractiveWorldMap**
   - Check unmount before map operations
   - Clear all timeouts on unmount
   - Guard state updates

4. **Apply to all async operations in hooks**
   - useFamilyData, useVisitDetails, useStateVisits
   - Any hook with async operations

5. **Add to TripWizard** (already has some, verify completeness)
   - Ensure all async paths check unmount

6. **Test each component**
   - Start async operation
   - Navigate away immediately
   - Verify no React warnings in console

### Verification
- Zero "Can't perform React state update" warnings
- No errors in console when navigating quickly
- All async operations respect unmount state

---

## 3. **Add Null/Undefined Guards for Array Operations** 🟠
**Priority: HIGH | Impact: Runtime Crashes**

### Why It's Critical
- Calling `.map()`, `.filter()`, `.reduce()` on `undefined` or `null` causes immediate crash
- Common when API returns unexpected data structure
- Can crash entire component tree
- User sees blank screen or error boundary

### Current Issues Found
- Multiple components assume arrays are always defined
- No defensive checks before array operations
- Database queries might return null instead of empty array

### Step-by-Step Action Plan

1. **Create safe array utility**
   ```typescript
   // lib/safeArray.ts
   export const safeArray = <T>(arr: T[] | null | undefined): T[] => {
     return Array.isArray(arr) ? arr : [];
   };
   ```

2. **Find all array operations**
   - Search for `.map(`, `.filter(`, `.reduce(`
   - Identify operations on potentially undefined data

3. **Fix critical paths first**
   - Dashboard data rendering
   - Flight results display
   - Trip itinerary rendering
   - Country/visit lists

4. **Apply safe wrapper**
   - Wrap all array operations with `safeArray()`
   - Or add inline checks: `(data?.items || []).map(...)`

5. **Add TypeScript guards**
   - Use type guards where possible
   - Add runtime validation

6. **Test with invalid data**
   - Simulate API returning null
   - Test with empty responses
   - Verify graceful handling

### Verification
- No crashes when API returns null/undefined
- Empty states display correctly
- TypeScript catches potential issues

---

## 4. **Fix Race Conditions in Async Operations** 🟠
**Priority: HIGH | Impact: Data Corruption & UI Bugs**

### Why It's Critical
- Multiple async operations can complete out of order
- Last response might not be the most recent user action
- Can cause UI to show stale or incorrect data
- Especially problematic in: form submissions, search, data fetching

### Current Issues Found
- Flight search: Multiple searches can overlap
- Trip generation: Double-submit prevention exists but could be improved
- Data fetching: Multiple hooks fetching same data simultaneously

### Step-by-Step Action Plan

1. **Identify race condition patterns**
   - Search for multiple async operations without coordination
   - Find operations that don't cancel previous ones
   - Identify operations that should be debounced

2. **Add request cancellation**
   - Use AbortController for fetch requests
   - Cancel previous requests when new one starts
   - Already done in TripWizard, apply pattern elsewhere

3. **Add request deduplication**
   - Use React Query's built-in deduplication
   - Or implement custom request ID tracking
   - Prevent duplicate API calls

4. **Fix flight search**
   - Cancel previous search when new one starts
   - Track active search request
   - Ignore stale responses

5. **Add debouncing where appropriate**
   - Search inputs
   - Filter changes
   - Real-time updates

6. **Test race conditions**
   - Rapidly trigger multiple operations
   - Verify only latest result is used
   - Check for stale data

### Verification
- No stale data displayed
- Latest operation always wins
- No duplicate API calls
- Cancelled requests don't update state

---

## 5. **Add Comprehensive Error Boundaries** 🟡
**Priority: MEDIUM | Impact: User Experience**

### Why It's Critical
- One component error can crash entire app
- User loses all context and data
- No graceful recovery mechanism
- ErrorBoundary exists but may not cover all critical paths

### Current Status
- ✅ ErrorBoundary component exists
- ✅ Wraps TripWizard
- ❓ May not cover all critical features

### Step-by-Step Action Plan

1. **Audit current ErrorBoundary coverage**
   - Check which components are wrapped
   - Identify unwrapped critical features

2. **Add feature-level boundaries**
   - Wrap Dashboard page
   - Wrap Flights page
   - Wrap Trips list
   - Wrap Profile page

3. **Add component-level boundaries**
   - Wrap InteractiveWorldMap (complex, can fail)
   - Wrap complex data visualizations
   - Wrap third-party integrations

4. **Improve error messages**
   - Add context to error messages
   - Provide recovery actions
   - Log errors for debugging

5. **Test error scenarios**
   - Simulate component errors
   - Verify error boundary catches them
   - Test recovery flows

### Verification
- Errors don't crash entire app
- User-friendly error messages
- Recovery options available
- Errors logged for debugging

---

## 6. **Fix Debounce Timer Cleanup** 🟡
**Priority: MEDIUM | Impact: Memory Leaks**

### Why It's Critical
- Debounce timers that aren't cleaned up continue running
- Can cause memory leaks
- Can trigger state updates after unmount
- Found in multiple hooks with debounced realtime updates

### Current Issues Found
- `useFamilyData.ts`: Debounce timer in closure, cleanup in dependency array
- `useVisitDetails.ts`: Similar pattern
- Other components with debounced operations

### Step-by-Step Action Plan

1. **Find all debounce timers**
   - Search for `setTimeout` with debounce patterns
   - Identify timers in useEffect

2. **Move timers to refs**
   - Store timer ID in useRef
   - Clean up in useEffect return
   - Don't include in dependency arrays

3. **Fix useFamilyData**
   - Move debounceTimer to ref
   - Clean up properly
   - Stabilize dependencies

4. **Fix useVisitDetails**
   - Same pattern as useFamilyData

5. **Fix other components**
   - InteractiveWorldMap timeouts
   - Any other debounced operations

6. **Test cleanup**
   - Navigate away during debounce
   - Verify timers are cleared
   - Check for memory leaks

### Verification
- No timers running after unmount
- Memory profiler shows no leaks
- No state updates from cleared timers

---

## 7. **Add Input Validation & Sanitization** 🟡
**Priority: MEDIUM | Impact: Data Integrity & Security**

### Why It's Critical
- Invalid input can cause crashes or data corruption
- Missing validation allows bad data into database
- Can cause downstream errors in other features
- Security risk if user input not sanitized

### Current Issues Found
- Some forms rely only on client-side validation
- Edge cases might not be handled
- Date inputs might accept invalid dates
- String inputs might not be sanitized

### Step-by-Step Action Plan

1. **Audit all user inputs**
   - Forms, search inputs, date pickers
   - API parameters, URL parameters

2. **Add validation layer**
   - Use Zod schemas where possible
   - Add runtime validation
   - Validate before API calls

3. **Fix date validation**
   - Ensure dates are valid before use
   - Handle timezone issues
   - Validate date ranges

4. **Sanitize string inputs**
   - Prevent XSS (if applicable)
   - Trim whitespace
   - Validate length

5. **Add error messages**
   - Show validation errors clearly
   - Prevent submission with invalid data

6. **Test edge cases**
   - Invalid dates
   - Empty strings
   - Special characters
   - Very long strings

### Verification
- Invalid input rejected gracefully
- Clear error messages
- No crashes from bad input
- Data integrity maintained

---

## 8. **Fix Mapbox Cleanup in InteractiveWorldMap** 🟡
**Priority: MEDIUM | Impact: Memory Leaks & Performance**

### Why It's Critical
- Mapbox instances are heavy objects
- If not cleaned up, cause significant memory leaks
- Multiple event listeners can accumulate
- Timeouts and intervals need cleanup

### Current Issues Found
- `InteractiveWorldMap.tsx`: Complex cleanup with multiple timeouts
- Style load timeout might not always clear
- Event listeners might not all be removed

### Step-by-Step Action Plan

1. **Review current cleanup**
   - Check all cleanup paths
   - Verify all listeners removed
   - Check all timeouts cleared

2. **Improve cleanup function**
   - Ensure map instance removed
   - Clear all timeouts
   - Remove all event listeners
   - Reset refs

3. **Add unmount guard**
   - Check if component mounted before operations
   - Prevent operations after cleanup

4. **Test cleanup**
   - Mount and unmount component
   - Check memory usage
   - Verify no map instances remain
   - Check for console errors

5. **Add error handling**
   - Handle cleanup errors gracefully
   - Log cleanup issues

### Verification
- No Mapbox instances after unmount
- Memory usage returns to baseline
- No console errors
- Can remount without issues

---

## 9. **Add Request Retry Logic with Exponential Backoff** 🟢
**Priority: LOW | Impact: Reliability**

### Why It's Important
- Network requests can fail transiently
- Automatic retry improves user experience
- Reduces need for manual retries
- React Query has retry, but some operations might not use it

### Current Status
- ✅ React Query configured with retry
- ❓ Edge function calls might not have retry
- ❓ Some direct Supabase calls might not retry

### Step-by-Step Action Plan

1. **Audit retry coverage**
   - Check which operations use React Query
   - Identify direct API calls without retry

2. **Add retry to edge function calls**
   - Wrap in retry utility
   - Use exponential backoff
   - Limit retry attempts

3. **Add retry to critical Supabase calls**
   - Direct queries that aren't in React Query
   - Important mutations

4. **Configure retry parameters**
   - Max attempts: 3
   - Exponential backoff: 1s, 2s, 4s
   - Don't retry on 4xx errors

5. **Test retry logic**
   - Simulate network failures
   - Verify retries happen
   - Check backoff timing

### Verification
- Transient failures automatically retry
- User doesn't need to manually retry
- Failed requests eventually succeed
- No infinite retry loops

---

## 10. **Add Comprehensive Logging & Error Tracking** 🟢
**Priority: LOW | Impact: Debugging & Monitoring**

### Why It's Important
- Helps identify bugs in production
- Provides context for errors
- Enables proactive issue detection
- Logger exists but might not be used everywhere

### Current Status
- ✅ Logger utility exists
- ❓ Not all errors use logger
- ❓ No error tracking service integration

### Step-by-Step Action Plan

1. **Audit logging coverage**
   - Find console.error/console.log calls
   - Replace with logger
   - Ensure all errors are logged

2. **Add context to logs**
   - Include user ID (if available)
   - Include operation context
   - Include relevant data

3. **Add error tracking integration**
   - Consider Sentry or similar
   - Or prepare for future integration
   - Structure logs for easy parsing

4. **Add performance logging**
   - Log slow operations
   - Track API response times
   - Identify bottlenecks

5. **Test logging**
   - Verify logs in development
   - Check log structure
   - Ensure no sensitive data

### Verification
- All errors logged
- Logs have useful context
- Easy to debug issues
- Ready for error tracking service

---

## Implementation Order

1. **Memory Leaks (1, 6)** - Critical, causes performance degradation
2. **State Updates After Unmount (2)** - Critical, causes crashes
3. **Array Operations (3)** - High, causes immediate crashes
4. **Race Conditions (4)** - High, causes data corruption
5. **Error Boundaries (5)** - Medium, improves UX
6. **Input Validation (7)** - Medium, prevents bad data
7. **Mapbox Cleanup (8)** - Medium, memory leaks
8. **Retry Logic (9)** - Low, improves reliability
9. **Logging (10)** - Low, helps debugging

---

## Testing Strategy

For each fix:
1. **Understand the issue** - Read code, identify problem
2. **Question the approach** - Is this the best way?
3. **Implement fix** - Make minimal, safe changes
4. **Test thoroughly** - Verify fix works, no regressions
5. **Verify no breaking changes** - App still works normally
6. **Document** - Update this file with results

---

## Success Criteria

- Zero memory leaks
- Zero "state update on unmounted component" warnings
- Zero crashes from null/undefined array operations
- Zero race condition bugs
- Graceful error handling everywhere
- All timers/subscriptions cleaned up
- All inputs validated
- Comprehensive error logging

---

## Notes

- All fixes must be non-breaking
- Test each fix in isolation
- Verify app still works after each fix
- Keep changes minimal and focused
- Document any assumptions or trade-offs
