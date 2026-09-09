// Small Business Financial Management & Profit Analysis System
// Authentication module — powered by Supabase Auth
//
// ============================================================
// SETUP: Fill in your Supabase project credentials below.
// Find them at: Supabase Dashboard → Project Settings → API
// ============================================================
const SUPABASE_CONFIG = {
  url: "https://pfkkfpfivpompxmwocyq.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBma2tmcGZpdnBvbXB4bXdvY3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MjA1NDMsImV4cCI6MjEwNDQ5NjU0M30.hEFB26WP0Dme17udSZbAUmNbw2_nYMKEpDzXTrlSjAo"
};
// ============================================================

let supabaseClient = null;
let currentUser = null;

function isSupabaseConfigured(){
  return SUPABASE_CONFIG.url &&
    SUPABASE_CONFIG.url !== "YOUR_SUPABASE_PROJECT_URL" &&
    SUPABASE_CONFIG.anonKey &&
    SUPABASE_CONFIG.anonKey !== "YOUR_SUPABASE_ANON_KEY";
}

function initSupabase(){
  if (!isSupabaseConfigured()) return null;
  if (!window.supabase){
    console.error("Supabase SDK failed to load. Check your internet connection.");
    return null;
  }
  supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  return supabaseClient;
}

// ---------- Auth actions ----------
async function signUp(email, password, businessName){
  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { business_name: businessName || "My Business" }
    }
  });
  return { data, error };
}

async function signIn(email, password){
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });
  return { data, error };
}

async function signOut(){
  const { error } = await supabaseClient.auth.signOut();
  return { error };
}

async function getSession(){
  const { data } = await supabaseClient.auth.getSession();
  return data.session;
}

async function getCurrentUser(){
  const { data } = await supabaseClient.auth.getUser();
  return data.user;
}

async function resetPasswordForEmail(email){
  const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.href
  });
  return { data, error };
}

// ---------- Human-readable error messages ----------
function friendlyAuthError(error){
  if (!error) return "";
  const msg = error.message || "";
  if (msg.includes("Invalid login credentials")) return "Incorrect email or password.";
  if (msg.includes("User already registered")) return "An account with this email already exists. Try logging in instead.";
  if (msg.includes("Password should be at least")) return "Password must be at least 6 characters.";
  if (msg.includes("Unable to validate email address")) return "Please enter a valid email address.";
  if (msg.includes("Email not confirmed")) return "Please confirm your email address before logging in. Check your inbox for a confirmation link.";
  return msg || "Something went wrong. Please try again.";
}
