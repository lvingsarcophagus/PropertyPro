// src/lib/i18n/locales/en.ts
export default {
  greeting: 'Hello',
  navbar: {
    home: 'Home',
    properties: 'Properties',
    login: 'Login',
    signup: 'Sign Up',
    profile: 'Profile',
    logout: 'Logout',
    dashboard: 'Dashboard',
    language: 'Language',
  },
  homepage: {
    hero_title: 'Discover, List, Connect',
    hero_subtitle: 'Your Premium Property Broking Platform',
    hero_cta_join: 'Join Now',
    hero_cta_search: 'Search Properties',
  },
  dashboard_sidebar: {
    menu_title: 'Dashboard Menu',
    overview: 'Overview',
    my_properties: 'My Properties',
    my_clients: 'My Clients',
    messages: 'Messages',
    calendar: 'Calendar',
    profile_settings: 'Profile & Settings',
    back_to_homepage: 'Back to Homepage',
    my_calls: 'My Calls', // Added
  },
  dashboard: {
    title: 'Dashboard', // Kept existing, ensure it's used or merged as needed
    welcome: 'Welcome to your dashboard!',
  }
} as const;
