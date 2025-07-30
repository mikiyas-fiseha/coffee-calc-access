import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Language = 'en' | 'am';

interface Translations {
  // Auth
  signIn: string;
  signUp: string;
  signOut: string;
  forgotPassword: string;
  resetPassword: string;
  name: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
  
  // Navigation
  calculator: string;
  display: string;
  info: string;
  admin: string;
  
  // Profile
  profile: string;
  subscription: string;
  daysLeft: string;
  subscriptionActive: string;
  subscriptionExpired: string;
  noSubscription: string;
  
  // UI
  darkMode: string;
  lightMode: string;
  language: string;
  menu: string;
  close: string;
  
  // Calculator
  weight: string;
  lot: string;
  grade: string;
  calculate: string;
  
  // Coffee grades
  coffeeGrades: string;
  priceRange: string;
  noDataAvailable: string;
  
  // Common
  loading: string;
  error: string;
  success: string;
  cancel: string;
  confirm: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Auth
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    name: 'Name',
    mobileNumber: 'Mobile Number',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    
    // Navigation
    calculator: 'Calculator',
    display: 'Display',
    info: 'Info',
    admin: 'Admin',
    
    // Profile
    profile: 'Profile',
    subscription: 'Subscription',
    daysLeft: 'Days Left',
    subscriptionActive: 'Active',
    subscriptionExpired: 'Expired',
    noSubscription: 'No Subscription',
    
    // UI
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language',
    menu: 'Menu',
    close: 'Close',
    
    // Calculator
    weight: 'Weight',
    lot: 'Lot',
    grade: 'Grade',
    calculate: 'Calculate',
    
    // Coffee grades
    coffeeGrades: 'Coffee Grades',
    priceRange: 'Price Range',
    noDataAvailable: 'No data available',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
  },
  am: {
    // Auth
    signIn: 'ግባ',
    signUp: 'ተመዝገብ',
    signOut: 'ውጣ',
    forgotPassword: 'የይለፍ ቃል ረሳኸው?',
    resetPassword: 'የይለፍ ቃል ዳግም አስተካከል',
    name: 'ስም',
    mobileNumber: 'ሞባይል ቁጥር',
    password: 'የይለፍ ቃል',
    confirmPassword: 'የይለፍ ቃል አረጋግጥ',
    
    // Navigation
    calculator: 'ካልኩሌተር',
    display: 'ማሳያ',
    info: 'መረጃ',
    admin: 'አስተዳደር',
    
    // Profile
    profile: 'መገለጫ',
    subscription: 'ደንበኝነት',
    daysLeft: 'የቀሩ ቀናት',
    subscriptionActive: 'ንቁ',
    subscriptionExpired: 'ጊዜው አልፏል',
    noSubscription: 'ደንበኝነት የለም',
    
    // UI
    darkMode: 'ጨለማ ሁኔታ',
    lightMode: 'ብርሃን ሁኔታ',
    language: 'ቋንቋ',
    menu: 'ዝርዝር',
    close: 'ዝጋ',
    
    // Calculator
    weight: 'ክብደት',
    lot: 'ሎት',
    grade: 'ደረጃ',
    calculate: 'አስላ',
    
    // Coffee grades
    coffeeGrades: 'የቡና ደረጃዎች',
    priceRange: 'የዋጋ ክልል',
    noDataAvailable: 'መረጃ የለም',
    
    // Common
    loading: 'በመጫን ላይ...',
    error: 'ስህተት',
    success: 'ተሳክቷል',
    cancel: 'ተወው',
    confirm: 'አረጋግጥ',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('coffee-app-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('coffee-app-language', language);
  }, [language]);

  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};