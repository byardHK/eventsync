// UserContext.tsx was written with the help of generative AI 

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UserDetails {
  isOnboardingComplete: boolean | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  microsoftId: string | null;
  isAdmin: boolean | null;
  bio: string | null;
  profilePicture: string | null;
  isPublic: boolean;
  isBanned: boolean | null;
  numTimesReported: number | null;
  notificationId: number | null;
  eventCancelled: boolean;
  token: string | null
};

interface UserContextType {
    userDetails: UserDetails;
    setUserDetails: React.Dispatch<React.SetStateAction<UserDetails>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userDetails, setUserDetails] = useState<UserDetails>({
      isOnboardingComplete: null,
      email: null,
      firstName: null,
      lastName: null,
      isAdmin: null,
      bio: null,
      microsoftId: null,
      profilePicture: null,
      isPublic: false,
      isBanned: null,
      numTimesReported: null,
      notificationId: null,
      eventCancelled: false,
      token: null
  });

    return (
        <UserContext.Provider value={{ userDetails, setUserDetails }}>
          {children}
        </UserContext.Provider>
    );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};