import HomePage from "./pages/HomePage";
import CreateEventPage from "./pages/CreateEventPage";
import FriendsPage from "./pages/FriendsPage";
import MyEventsPage from "./pages/MyEventsPage";
import ViewEventPage from "./pages/ViewEventPage";
import AdminPage from "./pages/AdminPage";
import GroupsPage from "./pages/GroupsPage";
import { BrowserRouter, Routes, Route } from "react-router-dom"
import ProfilePage from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import  {LoadUser} from './sso/LoadUser';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import OnboardingPage from "./pages/OnboardingPage";
import ChatPage from "./pages/ChatPage"
import ChatHomePage from "./pages/ChatHomePage"
import { useUser } from "./sso/UserContext";
import LoadingPage from "./pages/LoadingPage";
import { Navigate } from 'react-router-dom';
import { ThemeProvider } from "@mui/material";
import theme from "./components/ColorTheme";
import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { Typography } from "@mui/material";

const MainContent = () => {
  const { userDetails } = useUser();
  const { instance, inProgress } = useMsal();
  const [showBannedMessage, setShowBannedMessage] = useState(false);

  useEffect(() => {
    if (userDetails.isBanned) {
      setShowBannedMessage(true);
      setTimeout(() => {
          instance.logoutRedirect(); 
      }, 3000); 
    }
  }, [userDetails.isBanned, instance, inProgress]);

  if (showBannedMessage) {
    return (
      <div style={{ textAlign: "center", marginTop: "20vh", fontSize: "24px", color: "red" }}>
        <Typography variant="p">You are banned</Typography>
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
          <AuthenticatedTemplate>
            <BrowserRouter>
              <LoadUser></LoadUser>
                <Routes>
                    <Route path="/" element={!userDetails.isOnboardingComplete ? <LoadingPage /> : <Navigate to="/home" />}/>
                    <Route path="/home" element={<HomePage/>}/>
                    <Route path="/onboardingPage" element={<OnboardingPage/>}/>
                    <Route path="/createEvent" element={<CreateEventPage/>}/>
                    <Route path="/createEvent/:eventId" element={<CreateEventPage/>}/>
                    <Route path="/friends" element={<FriendsPage/>}/>
                    <Route path="/myEvents" element={<MyEventsPage/>}/>
                    <Route path="/profile/:id" element={<ProfilePage/>}/>
                    <Route path="/viewEvent/:eventId" element={<ViewEventPage/>}/>
                    <Route path="/admin" element={<AdminPage/>}/>
                    <Route path="/viewChat/:chatId" element={<ChatPage/>}/>
                    <Route path="/chatHome" element={<ChatHomePage/>}/>
                    <Route path="/groups" element={<GroupsPage/>}/>
                </Routes>
            </BrowserRouter>  
          </AuthenticatedTemplate>

          <UnauthenticatedTemplate>
            <LoginPage>                
            </LoginPage>
          </UnauthenticatedTemplate>
      </div>
    </ThemeProvider>
  );
};

export default function App() {
  return (
    <MainContent />
  );
}
