// src/components/LoginForm.tsx
"use client";

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

// The only change is adding "default" here
export default function LoginForm() { 
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("Sending magic link...");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        throw error;
      }
      
      setStatus("Success! Check your email for the magic link.");

    } catch (error: any) {
      setStatus("Error: " + error.message);
      console.error("Sign in error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={signIn} className="space-y-4">
        <h2 className="text-xl font-semibold text-center">Get Started</h2>
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded-md"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Magic Link"}
        </button>
        {status && <p className="text-sm text-center text-gray-600 pt-2">{status}</p>}
      </form>
    </div>
  );
}