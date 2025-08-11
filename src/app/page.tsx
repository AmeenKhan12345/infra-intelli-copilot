// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { type Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

// Import your components
import LoginForm from "@/components/LoginForm";
import ReportIssueForm from "@/components/ReportIssueForm";

// Create a single Supabase client instance for the page
const supabase = createClient();

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<[number, number] | null>(null);

  // Effect to get the user's session
  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("Error fetching session");
      setSession(data.session);
      setLoading(false); // Stop loading once session is checked
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Effect to get the user's geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Geolocation error:", error);
          alert("Could not get your location. Please enable location services in your browser.");
        }
      );
    }
  }, []);

  // --- Main Render Logic ---
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <h1 className="text-4xl font-bold mb-2">CivicSense AI</h1>
      <p className="text-lg text-gray-600 mb-8">Reporting civic issues in Nagpur, powered by AI.</p>
      
      <div className="w-full max-w-lg">
        {session ? (
          // If a session EXISTS, show the Report Issue Form
          <ReportIssueForm location={location} />
        ) : (
          // If a session does NOT exist, show the Login Form
          <LoginForm />
        )}
      </div>
    </main>
  );
}