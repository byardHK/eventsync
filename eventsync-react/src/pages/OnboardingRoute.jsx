import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { useUser } from '../sso/UserContext';

export const OnboardingRoute = ({ element, ...props }) => {
  const { userDetails } = useUser();

  const isOnboardingComplete = userDetails?.isOnboardingComplete;
  return isOnboardingComplete ? <Navigate to="/home" /> : element;
};
