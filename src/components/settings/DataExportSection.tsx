import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileJson, FileText, Loader2, Shield, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DataExportSection = () => {
  const [exportingJson, setExportingJson] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const { toast } = useToast();

  const exportToJson = async () => {
    setExportingJson(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch all user data in parallel
      const [
        profileResult,
        countriesResult,
        visitsResult,
        citiesResult,
        familyResult,
        tripsResult,
        photosResult,
        preferencesResult
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('countries').select('*'),
        supabase.from('country_visit_details').select('*'),
        supabase.from('city_visits').select('*'),
        supabase.from('family_members').select('*'),
        supabase.from('trips').select('*, itinerary_days(*, itinerary_items(*))'),
        supabase.from('travel_photos').select('*'),
        supabase.from('travel_preferences').select('*').maybeSingle()
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        profile: profileResult.data,
        countries: countriesResult.data || [],
        visits: visitsResult.data || [],
        cities: citiesResult.data || [],
        familyMembers: familyResult.data || [],
        trips: tripsResult.data || [],
        photos: photosResult.data || [],
        preferences: preferencesResult.data
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `travel-history-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Export successful!', description: 'Your travel data has been downloaded.' });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({ title: 'Export failed', description: error.message, variant: 'destructive' });
    } finally {
      setExportingJson(false);
    }
  };

  const exportToPdf = async () => {
    setExportingPdf(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch data for PDF
      const [
        profileResult,
        countriesResult,
        visitsResult,
        citiesResult
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('countries').select('*'),
        supabase.from('country_visit_details').select('*').order('visit_date', { ascending: false }),
        supabase.from('city_visits').select('*')
      ]);

      const profile = profileResult.data;
      const countries = countriesResult.data || [];
      const visits = visitsResult.data || [];
      const cities = citiesResult.data || [];

      // Generate HTML for print/PDF
      const totalCountries = countries.length;
      const totalDays = visits.reduce((sum, v) => sum + (v.number_of_days || 0), 0);
      const totalCities = cities.length;

      const continentCounts: Record<string, number> = {};
      countries.forEach(c => {
        continentCounts[c.continent] = (continentCounts[c.continent] || 0) + 1;
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Travel History - ${profile?.full_name || 'My Travel Story'}</title>
          <style>
            body { font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
            h1 { color: #1a1a2e; border-bottom: 3px solid #16213e; padding-bottom: 10px; }
            h2 { color: #16213e; margin-top: 30px; }
            .stats { display: flex; gap: 30px; margin: 20px 0; flex-wrap: wrap; }
            .stat { background: #f8f9fa; padding: 15px 25px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 28px; font-weight: bold; color: #16213e; }
            .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
            .country-list { columns: 2; column-gap: 30px; }
            .country-item { break-inside: avoid; padding: 8px 0; border-bottom: 1px solid #eee; }
            .visit-card { background: #fafafa; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #16213e; }
            .visit-title { font-weight: bold; margin-bottom: 5px; }
            .visit-date { color: #666; font-size: 14px; }
            .visit-memory { font-style: italic; margin-top: 8px; color: #555; }
            .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <h1>🌍 ${profile?.full_name || 'My'} Travel Story</h1>
          <p style="color: #666;">Exported on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${totalCountries}</div>
              <div class="stat-label">Countries</div>
            </div>
            <div class="stat">
              <div class="stat-value">${totalCities}</div>
              <div class="stat-label">Cities</div>
            </div>
            <div class="stat">
              <div class="stat-value">${totalDays}</div>
              <div class="stat-label">Days Traveled</div>
            </div>
            <div class="stat">
              <div class="stat-value">${Object.keys(continentCounts).length}</div>
              <div class="stat-label">Continents</div>
            </div>
          </div>

          <h2>🗺️ Countries Visited</h2>
          <div class="country-list">
            ${countries.map(c => `
              <div class="country-item">
                ${c.flag} ${c.name}
                <span style="color: #999; font-size: 12px;">${c.continent}</span>
              </div>
            `).join('')}
          </div>

          <h2>📅 Travel Timeline</h2>
          ${visits.slice(0, 20).map(visit => {
            const country = countries.find(c => c.id === visit.country_id);
            const visitCities = cities.filter(c => c.country_id === visit.country_id);
            let dateStr = '';
            if (visit.visit_date) {
              dateStr = new Date(visit.visit_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            } else if (visit.approximate_year) {
              dateStr = `${visit.approximate_year}`;
            }
            return `
              <div class="visit-card">
                <div class="visit-title">${country?.flag || ''} ${visit.trip_name || country?.name || 'Trip'}</div>
                <div class="visit-date">${dateStr} • ${visit.number_of_days || 1} days${visitCities.length > 0 ? ` • ${visitCities.map(c => c.city_name).join(', ')}` : ''}</div>
                ${visit.highlight ? `<div class="visit-memory">✨ ${visit.highlight}</div>` : ''}
                ${visit.why_it_mattered ? `<div class="visit-memory">❤️ "${visit.why_it_mattered}"</div>` : ''}
                ${visit.notes && !visit.highlight && !visit.why_it_mattered ? `<div class="visit-memory">"${visit.notes}"</div>` : ''}
              </div>
            `;
          }).join('')}
          ${visits.length > 20 ? `<p style="color: #999;">...and ${visits.length - 20} more visits</p>` : ''}

          <div class="footer">
            <p>This is where our family's travel story lives. 🌍</p>
            <p>Generated by Family Travel Tracker</p>
          </div>
        </body>
        </html>
      `;

      // Open print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      toast({ title: 'PDF ready!', description: 'Use your browser\'s print dialog to save as PDF.' });
    } catch (error: any) {
      console.error('PDF export error:', error);
      toast({ title: 'Export failed', description: error.message, variant: 'destructive' });
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-primary" />
          Export Your Data
        </CardTitle>
        <CardDescription>
          Download your complete travel history. Your memories belong to you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
          <Shield className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Your data, your ownership</p>
            <p className="text-muted-foreground">
              We believe your travel memories should always be accessible to you, 
              regardless of what happens to any service.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={exportToJson}
            disabled={exportingJson}
          >
            {exportingJson ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <FileJson className="h-6 w-6 text-blue-500" />
            )}
            <div className="text-center">
              <p className="font-medium">Export JSON</p>
              <p className="text-xs text-muted-foreground">Complete data backup</p>
            </div>
          </Button>

          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={exportToPdf}
            disabled={exportingPdf}
          >
            {exportingPdf ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <FileText className="h-6 w-6 text-red-500" />
            )}
            <div className="text-center">
              <p className="font-medium">Export PDF</p>
              <p className="text-xs text-muted-foreground">Printable travel story</p>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExportSection;
