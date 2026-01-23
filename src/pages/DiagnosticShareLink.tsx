import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { publicSupabase } from "@/integrations/supabase/public-client";
import { useSearchParams } from "react-router-dom";

export default function DiagnosticShareLink() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "9665cf215dcdde8f21131e2a23d46281";
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runDiagnostics() {
      const diagnostics: any = {
        token,
        token_normalized: token.toLowerCase().trim(),
        timestamp: new Date().toISOString(),
        tests: {}
      };

      // Test 1: Check if token exists with regular client (authenticated context)
      try {
        const { data: shareLink, error: shareLinkError } = await supabase
          .from("share_links")
          .select("*")
          .eq("token", token.toLowerCase().trim())
          .maybeSingle();

        diagnostics.tests.database_query_authenticated = {
          success: !shareLinkError,
          error: shareLinkError?.message,
          error_code: shareLinkError?.code,
          error_details: shareLinkError?.details,
          data: shareLink,
          row_found: !!shareLink,
          columns_found: shareLink ? Object.keys(shareLink) : []
        };
      } catch (e: any) {
        diagnostics.tests.database_query_authenticated = {
          success: false,
          error: e.message,
          stack: e.stack
        };
      }

      // Test 2: Check with public client (anon context)
      try {
        const { data: shareLinkPublic, error: shareLinkPublicError } = await publicSupabase
          .from("share_links")
          .select("*")
          .eq("token", token.toLowerCase().trim())
          .maybeSingle();

        diagnostics.tests.database_query_anon = {
          success: !shareLinkPublicError,
          error: shareLinkPublicError?.message,
          error_code: shareLinkPublicError?.code,
          error_details: shareLinkPublicError?.details,
          data: shareLinkPublic,
          row_found: !!shareLinkPublic,
          columns_found: shareLinkPublic ? Object.keys(shareLinkPublic) : []
        };
      } catch (e: any) {
        diagnostics.tests.database_query_anon = {
          success: false,
          error: e.message,
          stack: e.stack
        };
      }

      // Test 3: Check current auth state
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      diagnostics.tests.auth_state = {
        is_authenticated: !!user,
        user_id: user?.id,
        role: user ? "authenticated" : "anon",
        auth_error: authError?.message
      };

      // Test 4: Try edge function call with regular client
      try {
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
          "get-public-dashboard",
          { body: { token: token.toLowerCase().trim() } }
        );

        diagnostics.tests.edge_function_authenticated = {
          success: !edgeError && edgeData?.ok,
          error: edgeError?.message,
          edge_data: edgeData,
          debug: edgeData?.debug
        };
      } catch (e: any) {
        diagnostics.tests.edge_function_authenticated = {
          success: false,
          error: e.message,
          stack: e.stack
        };
      }

      // Test 5: Try edge function call with public client
      try {
        const { data: edgeDataPublic, error: edgeErrorPublic } = await publicSupabase.functions.invoke(
          "get-public-dashboard",
          { body: { token: token.toLowerCase().trim() } }
        );

        diagnostics.tests.edge_function_anon = {
          success: !edgeErrorPublic && edgeDataPublic?.ok,
          error: edgeErrorPublic?.message,
          edge_data: edgeDataPublic,
          debug: edgeDataPublic?.debug
        };
      } catch (e: any) {
        diagnostics.tests.edge_function_anon = {
          success: false,
          error: e.message,
          stack: e.stack
        };
      }

      // Test 6: Check all share_links count (to see if ANY exist)
      try {
        const { count, error: countError } = await supabase
          .from("share_links")
          .select("*", { count: "exact", head: true });

        diagnostics.tests.total_share_links = {
          success: !countError,
          count,
          error: countError?.message
        };
      } catch (e: any) {
        diagnostics.tests.total_share_links = {
          success: false,
          error: e.message
        };
      }

      // Test 7: Check table schema (what columns actually exist)
      try {
        // Try to query with minimal columns to see what exists
        const { data: minimalData, error: minimalError } = await supabase
          .from("share_links")
          .select("id, token")
          .eq("token", token.toLowerCase().trim())
          .limit(1)
          .maybeSingle();

        diagnostics.tests.minimal_query = {
          success: !minimalError,
          found: !!minimalData,
          error: minimalError?.message
        };
      } catch (e: any) {
        diagnostics.tests.minimal_query = {
          success: false,
          error: e.message
        };
      }

      setResults(diagnostics);
      setLoading(false);
    }

    runDiagnostics();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Running diagnostics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Share Link Diagnostics</h1>
        <p className="text-muted-foreground mb-6">
          Token: <code className="bg-muted px-2 py-1 rounded">{token}</code>
        </p>
        
        <div className="bg-muted p-6 rounded-lg overflow-auto mb-8">
          <pre className="text-xs whitespace-pre-wrap break-words">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Interpretation:</h2>
          
          {!results.tests.database_query_authenticated.row_found && 
           !results.tests.database_query_anon.row_found && (
            <div className="bg-destructive/10 border border-destructive p-4 rounded-lg">
              <strong className="text-destructive">❌ TOKEN NOT IN DATABASE</strong>
              <p className="mt-2">The token doesn't exist in the share_links table. The creation code is broken.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Error: {results.tests.database_query_authenticated.error || results.tests.database_query_anon.error}
              </p>
            </div>
          )}

          {results.tests.database_query_authenticated.row_found && 
           !results.tests.edge_function_anon.success && (
            <div className="bg-yellow-500/10 border border-yellow-500 p-4 rounded-lg">
              <strong className="text-yellow-600">⚠️ EDGE FUNCTION FAILING</strong>
              <p className="mt-2">Token exists but edge function can't retrieve it. Likely RLS blocking anon access or schema mismatch.</p>
              <p className="mt-2 text-sm">
                <strong>Error:</strong> {results.tests.edge_function_anon.error}
              </p>
              {results.tests.edge_function_anon.debug && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">Debug Info</summary>
                  <pre className="text-xs mt-2 bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(results.tests.edge_function_anon.debug, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          {results.tests.database_query_authenticated.row_found && 
           results.tests.edge_function_anon.success && (
            <div className="bg-green-500/10 border border-green-500 p-4 rounded-lg">
              <strong className="text-green-600">✅ BACKEND WORKING</strong>
              <p className="mt-2">Token exists and edge function can retrieve it. Issue is in the frontend rendering.</p>
            </div>
          )}

          {results.tests.database_query_authenticated.row_found && 
           !results.tests.database_query_anon.row_found && (
            <div className="bg-orange-500/10 border border-orange-500 p-4 rounded-lg">
              <strong className="text-orange-600">🔒 RLS POLICY BLOCKING</strong>
              <p className="mt-2">Token exists when authenticated, but anon (public) client can't read it. RLS policy is too restrictive.</p>
              <p className="mt-2 text-sm">
                Authenticated query: ✅ Found
                <br />
                Anon query: ❌ {results.tests.database_query_anon.error}
              </p>
            </div>
          )}

          {results.tests.minimal_query.found && 
           !results.tests.database_query_authenticated.row_found && (
            <div className="bg-purple-500/10 border border-purple-500 p-4 rounded-lg">
              <strong className="text-purple-600">🔧 SCHEMA MISMATCH</strong>
              <p className="mt-2">Token exists (minimal query works) but full query fails. Likely missing columns in SELECT.</p>
              <p className="mt-2 text-sm">
                Found columns: {results.tests.database_query_authenticated.columns_found?.join(', ') || 'none'}
              </p>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg mt-6">
            <h3 className="font-bold mb-2">Quick Actions:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>If token not found: Check share link creation code</li>
              <li>If RLS blocking: Run migration to fix policies</li>
              <li>If schema mismatch: Run schema migration</li>
              <li>If edge function failing: Check edge function logs in Supabase</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
