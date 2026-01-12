import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client and verify JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Invalid authentication token:', claimsError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);

    const liteApiKey = Deno.env.get('LITEAPI_SANDBOX_KEY');
    if (!liteApiKey) {
      console.error('LITEAPI_SANDBOX_KEY not configured');
      throw new Error('LiteAPI key not configured');
    }

    const { origin, destination, departureDate, returnDate, passengers, tripType } = await req.json();

    console.log(`User ${userId} searching flights: ${origin} -> ${destination}, ${departureDate}${returnDate ? ` - ${returnDate}` : ''}, ${passengers} passengers`);

    // LiteAPI REST API for flight search
    const searchParams = new URLSearchParams({
      origin,
      destination,
      departureDate,
      adults: String(passengers),
      currency: 'USD',
    });
    
    if (returnDate && tripType === 'roundtrip') {
      searchParams.append('returnDate', returnDate);
    }

    console.log(`Calling LiteAPI with params: ${searchParams.toString()}`);

    let response;
    try {
      response = await fetch(`https://api.liteapi.travel/v3.0/flights/search?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Api-Key': liteApiKey,
        },
      });
    } catch (fetchError) {
      console.error('Network error calling LiteAPI:', fetchError);
      // Return empty flights on network error instead of 500
      return new Response(JSON.stringify({ 
        flights: [], 
        message: 'Flight search service temporarily unavailable' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if response is ok before parsing JSON
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Unable to read error response';
      }
      console.error('LiteAPI HTTP error:', response.status, errorText);
      
      // Return empty flights with message instead of throwing
      return new Response(JSON.stringify({ 
        flights: [], 
        message: `No flights found. API status: ${response.status}` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let responseText = '';
    try {
      responseText = await response.text();
    } catch (e) {
      console.log('Could not read response text, returning empty flights');
      return new Response(JSON.stringify({ flights: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Handle empty responses
    if (!responseText || responseText.trim() === '') {
      console.log('LiteAPI returned empty response - no flights found');
      return new Response(JSON.stringify({ flights: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse LiteAPI response:', responseText.substring(0, 500));
      return new Response(JSON.stringify({ 
        flights: [], 
        message: 'Invalid response from flight API' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (data.error || data.errors) {
      const errorMsg = data.error?.message || data.errors?.[0]?.message || 'No flights found';
      console.error('LiteAPI error response:', JSON.stringify(data));
      return new Response(JSON.stringify({ 
        flights: [], 
        message: errorMsg 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${data?.data?.length || 0} flight options for user ${userId}`);

    // Transform the response to a cleaner format
    const flights = (data?.data || []).map((option: any) => ({
      id: option.id || crypto.randomUUID(),
      price: option.price?.total || option.price?.net || 0,
      currency: option.price?.currency || 'USD',
      itineraries: option.itineraries?.map((itinerary: any) => ({
        segments: itinerary.segments?.map((segment: any) => ({
          departureAirport: segment.departure?.iataCode || segment.origin,
          departureTime: segment.departure?.at || segment.departureTime,
          arrivalAirport: segment.arrival?.iataCode || segment.destination,
          arrivalTime: segment.arrival?.at || segment.arrivalTime,
          airline: segment.carrierCode || segment.airline,
          flightNumber: segment.flightNumber ? `${segment.carrierCode || ''}${segment.flightNumber}` : segment.flight,
          duration: segment.duration,
          stops: segment.numberOfStops || 0,
        })) || [],
      })) || [],
    }));

    return new Response(JSON.stringify({ flights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error in search-flights function:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
