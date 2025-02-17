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
// import ChatHomePage from "./pages/ChatHomePage"


const MainContent = () => {
  return (
      <div className="App">
          <AuthenticatedTemplate>

            

            <BrowserRouter>
            <LoadUser></LoadUser>
                <Routes>
                    <Route path="/" element={<HomePage/>}/>
                    <Route path="/createEvent" element={<CreateEventPage/>}/>
                    <Route path="/createEvent/:eventId" element={<CreateEventPage/>}/>
                    <Route path="/friendsPage" element={<FriendsPage/>}/>
                    <Route path="/myEventsPage" element={<MyEventsPage/>}/>
                    <Route path="/profilePage" element={<ProfilePage/>}/>
                    <Route path="/viewEvent/:eventId" element={<ViewEventPage/>}/>
                    <Route path="/adminPage" element={<AdminPage/>}/>
                    <Route path="/viewChat/:chatId" element={<ChatPage/>}/>
                    {/* <Route path="/chatHomePage" element={<ChatHomePage/>}/> */}
                    <Route path="/groupsPage" element={<GroupsPage/>}/>
                </Routes>
            </BrowserRouter>  
          </AuthenticatedTemplate>

          <UnauthenticatedTemplate>
            <LoginPage>                
            </LoginPage>
          </UnauthenticatedTemplate>
      </div>
  );
};

export default function App() {
  return (
    <MainContent />
  );
}
