// Emergency Auth Fix Script
// Run this in the browser console if auth is stuck

console.log('🚨 Emergency Auth Fix - Clearing all auth state');

// Clear all auth-related localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('auth') || key.includes('saverly')) {
    console.log('Removing:', key);
    localStorage.removeItem(key);
  }
});

// Clear all sessionStorage
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('auth') || key.includes('saverly')) {
    console.log('Removing:', key);
    sessionStorage.removeItem(key);
  }
});

// Clear Supabase session
if (typeof supabase !== 'undefined') {
  console.log('Clearing Supabase session');
  supabase.auth.signOut();
}

// Force reload
setTimeout(() => {
  console.log('Reloading page...');
  window.location.reload();
}, 1000);

console.log('✅ Auth state cleared - page will reload in 1 second');