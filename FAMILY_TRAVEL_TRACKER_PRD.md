# Family Travel Tracker - Product Requirements Document (PRD)

## 📋 Executive Summary

**Family Travel Tracker** is a comprehensive, mobile-first web application designed for families to track their travel history, plan future trips with AI-powered itineraries, search flights, and share their travel achievements with others. Built for non-technical users (busy parents), the app emphasizes simplicity, speed, and progressive disclosure of features.

---

## 🎯 Core Purpose & Identity

- **Primary Users**: Families tracking travel together, especially parents with children
- **Use Cases**: 
  - Track which countries each family member has visited
  - Visualize travel on an interactive world map
  - Generate AI-powered day-by-day trip itineraries
  - Search and compare flights with personalized preferences
  - Share travel achievements via public dashboards
  - Set and track travel goals and achievements

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui components |
| State | React Query (@tanstack/react-query) |
| Routing | React Router DOM v6 |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, Storage) |
| Maps | Mapbox GL JS |
| Animations | Framer Motion |
| Icons | Lucide React |
| PWA | vite-plugin-pwa |

---

## 🎨 Design System

### Color Palette (HSL Format)
All colors must use CSS variables defined in `index.css`. Never hardcode colors in components.

```css
/* Light Mode */
--background: 35 20% 98%;        /* Warm off-white */
--foreground: 20 14% 12%;        /* Dark brown */
--primary: 20 90% 58%;           /* Warm orange */
--secondary: 200 85% 55%;        /* Sky blue */
--accent: 160 50% 45%;           /* Teal green */
--muted: 35 15% 92%;             /* Light warm gray */
--destructive: 0 84.2% 60.2%;    /* Red */

/* Brand Colors (from logo) */
--brand-teal: 173 80% 40%;
--brand-orange: 25 95% 53%;
--brand-green: 142 71% 45%;
--brand-sky: 199 89% 48%;

/* Gradients */
--gradient-sunset: linear-gradient(135deg, hsl(20 90% 58%), hsl(35 95% 65%), hsl(45 100% 70%));
--gradient-hero: linear-gradient(135deg, hsl(20 90% 58% / 0.95), hsl(200 85% 55% / 0.9));

/* Special Effects */
--shadow-travel: 0 10px 40px -10px hsl(20 90% 58% / 0.3);
--radius: 0.75rem;
```

### Dark Mode
Full dark mode support with inverted colors maintaining the same semantic structure.

### Typography
- System fonts with fallbacks
- Hierarchy: 3xl for page titles, xl for section headers, base for body

### Component Library
- Uses shadcn/ui as base components
- Custom variants added for travel-specific use cases
- Cards use `shadow-travel` for elevation

---

## 📱 Application Structure

### Routes & Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Main dashboard with map, stats, quick actions |
| `/auth` | Auth | Login/signup with email verification |
| `/reset-password` | Reset Password | Password recovery flow |
| `/onboarding` | Onboarding | 6-step setup wizard for new users |
| `/family` | Travel History | Countries tracking, memories, timeline |
| `/trips` | Trips List | All planned and past trips |
| `/trips/new` | New Trip | AI-powered trip planning wizard |
| `/trips/:tripId` | Trip Detail | Itinerary, bookings, packing lists |
| `/flights` | Flights | Flight search with preferences |
| `/saved-flights` | Saved Flights | Price alerts and tracked flights |
| `/explore` | Explore | Destination discovery |
| `/profile` | Profile | User profile management |
| `/settings` | Settings | App preferences, data export |
| `/year-wrapped` | Year Wrapped | Annual travel summary |
| `/share/dashboard/:token` | Public Dashboard | Shareable travel profile |
| `/highlights/:token` | Highlights | Shared highlight reels |
| `/diagnostic/share` | Diagnostics | Share link troubleshooting |

### Navigation Structure

**Desktop Header**:
- Dashboard, Travel Tracker, Flights, AI Travel Planner
- Hamburger menu with Trip Planning (My Trips, Plan New, Find Flights, Saved Flights, Explore) and Account (Profile, Settings)

**Mobile Bottom Navigation**:
- Countries, Memories, Flights, AI Planner (4 tabs)

---

## 🔐 Authentication & Onboarding

### Authentication Flow
- Email/password signup with email verification (NO auto-confirm unless explicitly requested)
- Password reset via email
- Session management with Supabase Auth
- Profile auto-creation via database trigger on signup

### Onboarding Wizard (6 Steps)
**Critical: Steps must execute in this exact order to prevent data integrity issues**

1. **Welcome** - Feature overview (WelcomeFeaturesStep)
2. **Your Name** - Collect user's name for profile (YourNameStep)
3. **Home Country** - Set home location (excluded from visited stats) (HomeCountryStep)
4. **Family Members** - Add yourself + family members (FamilyMembersStep)
   - Quick-add buttons for common roles (Husband, Wife, Spouse, etc.)
   - Each member gets: name, role, avatar, color
5. **Countries Visited** - Initial travel history (CountriesStep)
   - Family member checkboxes to assign visits
6. **Travel Preferences** - Budget, pace, interests (TravelPreferencesStep)

**Completion Logic**:
- Sets `onboarding_completed = true` in profiles table
- Auto-links user to first family member created
- Redirects to main dashboard

---

## 🗺 Core Feature: Travel Tracking

### World Map Visualization
- **Technology**: Mapbox GL JS
- **Features**:
  - Visited countries highlighted in primary color
  - Wishlist countries in secondary color
  - Home country marked but not counted as visited
  - Click country to view details or mark as visited
  - State/province tracking for select countries (US, Canada, Australia, etc.)
  - Zoom controls and responsive sizing (1.4 zoom desktop, 1.0 mobile)

### Country Management

**Quick Add Flow**:
- Select country from searchable dropdown
- Check family members who visited
- Saves to `country_visits` table (stats only, no trip)

**Add with Trip Flow**:
- Pre-fills trip wizard with country data
- Creates full trip record with itinerary capability

### Visit Details
- Specific dates or approximate (month/year)
- Trip name/label
- Highlight/memorable moment
- Notes
- Associated family members

### Statistics Calculated
- Total countries visited (excluding home)
- Continents explored (out of 7)
- States visited (for countries with state tracking)
- Days abroad (sum of trip durations)
- World coverage percentage (countries / 195)
- Global ranking percentile
- Most visited country (by trip count)
- Longest stay country (by total days)
- Average countries per family member

---

## ✈️ Core Feature: AI Trip Planner

### Trip Wizard Steps (7 steps)
1. **Planner Mode** - Personal vs. professional planner mode
2. **Trip Basics** - Destination(s), dates, multi-country support
3. **Kids** - Ages, nap schedules, stroller needs
4. **Interests** - Activity categories (15 predefined + custom)
5. **Preferences** - Pace (relaxed/moderate/packed), budget level
6. **Context** - Free-text for special needs, dietary restrictions, etc.
7. **Review & Generate** - Final confirmation and AI invocation

### Interest Categories
- Nature & Outdoors
- Culture & History
- Churches & Religious Sites
- Theme Parks
- Beaches & Water
- Museums
- Food & Dining
- Sightseeing
- Shows & Entertainment
- Shopping
- Walking Tours
- Arts & Crafts
- Playgrounds & Play Areas
- Golf
- Business & Work

### AI Generation Output
The `generate-itinerary` Edge Function produces:
- Day-by-day itinerary with time blocks
- Activities with:
  - Start/end times
  - Duration estimates
  - Location with address and coordinates
  - Cost estimates
  - Kid-friendly ratings
  - Stroller accessibility
  - Reservation requirements
  - Transit modes and travel times
  - Booking URLs (affiliate links)
  - Crowd levels and best times to visit
  - Weather/seasonal notes
  - Plan B alternatives

### Trip Management Features
- Edit trip countries after creation
- Combine multiple single-country visits into one multi-country trip
- Packing lists with templates
- Expense tracking
- Emergency info storage
- Trip collaborators (invite by email)
- Notes per day and per activity

---

## 🛫 Core Feature: Flight Search

### Search Parameters
- Origin/destination airports
- Departure/return dates (or one-way)
- Passenger count (adults, children, infants)
- Cabin class (economy, premium economy, business, first)
- Stops filter (nonstop, 1 stop, any)

### Personalization (Flight Preferences)
Stored per-user in `flight_preferences` table:
- Home airports (primary + alternates)
- Preferred airlines and alliances
- Avoided airlines
- Max stops preference
- Max layover hours
- Min connection time (regular and family mode)
- Red-eye flight tolerance
- Baggage preferences
- Seat preferences (window/aisle)
- Amenity priorities (legroom, USB, entertainment)
- Alternate airport search (willing to drive further for savings)

### Flight Scoring Engine
Ranks search results based on preferences:
- Preferred airlines: +20 points
- Avoided airlines: -50 points (sorted to bottom)
- Nonstop preference bonus
- Connection time penalties
- Red-eye penalties
- Price consideration

### Results Display
- Sequential selection: outbound first, then return
- Leg details with airline logos
- Price breakdown
- Connection warnings
- Alternate airport savings comparison

### Saved Flights & Price Alerts
- Save searches for tracking
- Set target price alerts
- Email notifications when price drops

---

## 📤 Sharing System

### Share Types
- Dashboard (full travel profile)
- Individual memories
- Wishlist
- Trip details
- Year highlights

### Share Link Generation
- 32-character hex token (secure random)
- Stored in `share_links` table
- Configurable what to include:
  - Stats (countries, continents, coverage)
  - Map visualization
  - Countries list
  - Photos/memories
  - Timeline
  - Family members
  - Achievements

### Public Dashboard Features
- Read-only view of shared data
- Family member filter dropdown
- Interactive map
- CTA buttons routing to `/auth?tab=signup`
- No authentication required to view

### Edge Function: `get-public-dashboard`
- Uses SERVICE_ROLE_KEY to bypass RLS
- Validates token format (32 hex chars)
- Returns complete aggregated data payload
- Updates last_accessed_at timestamp

---

## 👥 Family Members System

### Member Properties
- Name
- Role (Mom, Dad, Kid, etc.)
- Avatar (emoji or image URL)
- Color (for visual distinction)
- Associated user_id

### Linked Family Member
- User profile linked to one family member
- Used for "your" personal stats vs family stats
- Auto-linked during onboarding to first member created

### Member Filtering
- Dashboard filter to view stats for:
  - Everyone (family aggregate)
  - Individual member
- Filters countries, continents, timeline, achievements

---

## 📊 Analytics & Achievements

### Analytics Dashboard
- Continent progress rings
- Country breakdown by continent
- Travel trends over time
- Family member comparisons

### Achievement System
Categories of unlockable badges:
- Country milestones (5, 10, 25, 50 countries)
- Continent completionist
- State explorer
- First trip together
- Streak achievements (consecutive years traveling)
- And more...

### Travel DNA
Visual representation of travel patterns:
- Preferred continents
- Travel seasonality
- Trip duration preferences

---

## 🗄 Database Schema

### Core Tables

**profiles**
- id (UUID, FK to auth.users)
- email, full_name, avatar_url
- home_country
- linked_family_member_id
- onboarding_completed
- distance_unit (miles/km)
- home_airports (JSON)

**family_members**
- id, user_id, name, role, avatar, color

**countries**
- id, user_id, name, flag, continent

**country_visits** (Quick tracking)
- id, user_id, country_id, family_member_id

**country_visit_details** (Detailed trips)
- id, user_id, country_id
- visit_date, end_date, is_approximate
- approximate_month, approximate_year
- trip_name, highlight, notes
- trip_group_id (for multi-country trips)

**visit_family_members** (Join table)
- visit_id, family_member_id, user_id

**state_visits**
- id, user_id, country_code, state_code, state_name, family_member_id

**trips**
- id, user_id, title, destination, status
- start_date, end_date
- kids_ages (array), interests (array)
- pace_preference, budget_total, currency
- has_stroller, needs_wheelchair_access
- cover_image, notes

**trip_countries** (Multi-country support)
- id, trip_id, country_code, country_name, order_index, start_date, end_date

**itinerary_days**
- id, trip_id, day_number, date, title, notes, weather_notes, plan_b

**itinerary_items**
- id, itinerary_day_id, sort_order
- title, description, category
- start_time, end_time, duration_minutes
- location_name, location_address, latitude, longitude
- cost_estimate, is_kid_friendly, is_stroller_friendly
- requires_reservation, booking_url
- travel_time_minutes, transport_mode
- crowd_level, seasonal_notes
- And many more fields...

**bookings**
- id, trip_id, booking_type
- title, confirmation_number, provider
- check_in, check_out
- location_name, location_address
- cost, currency, notes

**travel_preferences**
- id, user_id
- budget_preference, pace_preference
- interests (array), travel_style (array)
- liked_countries, disliked_countries

**flight_preferences**
- id, user_id
- home_airports (JSON)
- preferred_airlines, avoided_airlines
- cabin_class, seat_preference
- max_stops, max_layover_hours
- And many more...

**saved_flights**
- id, user_id, origin, destination
- outbound_date, return_date
- cabin_class, passengers
- target_price, last_price, price_alert_enabled

**share_links**
- id, token, owner_user_id
- is_active
- include_stats, include_countries, include_memories

**travel_photos**
- id, user_id, country_id, trip_id
- photo_url, caption, taken_at
- is_shareable

---

## ⚡ Edge Functions

### generate-itinerary
- **Purpose**: AI-powered day-by-day itinerary generation
- **Input**: Destination, dates, kids info, interests, preferences
- **Output**: Structured JSON with activities, timing, booking links
- **Model**: OpenAI/Gemini via Lovable AI gateway
- **Rate Limiting**: Per-user limits to manage costs

### search-flights
- **Purpose**: Flight search via SerpAPI (Google Flights)
- **Input**: Origin, destination, dates, passengers, cabin class
- **Output**: Normalized flight results with pricing
- **Features**: Alternate airport searches, result scoring

### generate-trip-suggestions
- **Purpose**: Destination recommendations based on preferences
- **Input**: User preferences, visited countries, travel style
- **Output**: Top 3 destination suggestions with match scores

### get-public-dashboard
- **Purpose**: Fetch shared dashboard data for public viewing
- **Input**: Share token
- **Output**: Complete travel profile data (bypasses RLS)

### get-mapbox-token
- **Purpose**: Securely provide Mapbox token to client
- **Security**: Validates request origin

### send-price-alert
- **Purpose**: Email notifications for flight price drops
- **Integration**: Resend email service

---

## 🔒 Security (RLS Policies)

All tables use Row Level Security:

**Standard User Access Pattern**:
```sql
-- View own data
CREATE POLICY "Users can view own X" ON table_name
FOR SELECT USING (auth.uid() = user_id);

-- Insert own data
CREATE POLICY "Users can insert own X" ON table_name
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update own data
CREATE POLICY "Users can update own X" ON table_name
FOR UPDATE USING (auth.uid() = user_id);

-- Delete own data
CREATE POLICY "Users can delete own X" ON table_name
FOR DELETE USING (auth.uid() = user_id);
```

**Sharing Policies**:
```sql
-- Public can view when sharing is enabled
CREATE POLICY "Public can view shared X" ON table_name
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM share_profiles sp
    WHERE sp.user_id = table_name.user_id
    AND sp.is_public = true
    AND sp.show_X = true
  )
);
```

**Trip Collaboration Policies**:
```sql
-- Accessible via trip ownership, group membership, or collaboration
FOR SELECT USING (
  auth.uid() = user_id 
  OR is_group_member(auth.uid(), family_group_id)
  OR is_trip_collaborator(auth.uid(), id, 'view')
);
```

---

## 🔑 Required Secrets (Edge Functions)

| Secret Name | Purpose |
|-------------|---------|
| MAPBOX_PUBLIC_TOKEN | Map rendering |
| SERPAPI_KEY | Flight search API |
| RESEND_API_KEY | Email notifications |
| LITEAPI_SANDBOX_KEY | Hotel/lodging suggestions |

---

## 📱 PWA Support

The app supports Progressive Web App installation:
- Custom install prompt component
- Offline capability planning
- App icons (192x192, 512x512)
- Manifest configuration

---

## 📋 Key UX Principles

1. **Mobile-first**: All features work on mobile, enhanced on desktop
2. **Progressive disclosure**: Show advanced features only when needed
3. **Minimal steps**: Reduce friction for common actions
4. **Clear CTAs**: "Create Trip", "Generate Itinerary", "Add to Map"
5. **Excellent empty states**: Guide users when no data exists
6. **Accessibility basics**: Readable type, proper contrast, large tap targets
7. **Fast feedback**: Loading states, optimistic updates, error handling

---

## 🚀 Build Instructions for Lovable

When rebuilding this app in Lovable:

1. **Start with authentication** - Set up Supabase Auth with email verification
2. **Create database schema** - Use the migration tool to create all tables with RLS
3. **Build onboarding wizard** - Critical for data integrity, follow exact step order
4. **Implement family members** - Required before country tracking
5. **Add country tracking** - Core feature with map visualization
6. **Create trip planner** - Multi-step wizard with AI integration
7. **Add flight search** - Connect to SerpAPI via Edge Function
8. **Build sharing system** - Public dashboards with token-based access
9. **Polish with analytics & achievements** - Gamification layer

### Critical Reminders:
- Always use semantic color tokens, never hardcode colors
- Implement RLS on ALL user data tables
- Family members must be created BEFORE country visits in onboarding
- Use Edge Functions for all external API calls (never expose keys to client)
- Test both light and dark modes
- Ensure mobile navigation works on all pages

---

## 📁 File Structure Reference

```
src/
├── components/
│   ├── common/          # Shared utilities (CountryFlag, DeleteConfirmDialog)
│   ├── countries/       # Country management (AddCountryModal, CombineTripsDialog)
│   ├── flights/         # Flight search UI components
│   ├── layout/          # AppLayout, Header, BottomNav
│   ├── onboarding/      # Onboarding wizard steps
│   ├── sharing/         # Share dialogs and settings
│   ├── travel/          # Dashboard components (Map, Stats, Achievements)
│   ├── trips/           # Trip wizard and management
│   └── ui/              # shadcn/ui components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities, data, scoring algorithms
├── pages/               # Route page components
└── integrations/
    └── supabase/        # Supabase client and types (auto-generated)

supabase/
├── functions/           # Edge Functions
│   ├── generate-itinerary/
│   ├── search-flights/
│   ├── get-public-dashboard/
│   └── ...
└── migrations/          # Database migrations
```

---

*Document Version: 1.0*
*Generated: January 2026*
