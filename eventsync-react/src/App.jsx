import HomePage from "./pages/HomePage";
import CreateEventPage from "./pages/CreateEventPage";
import FriendsPage from "./pages/FriendsPage";
import MyEventsPage from "./pages/MyEventsPage";
import ViewEventPage from "./pages/ViewEventPage";
import { BrowserRouter, Routes, Route } from "react-router-dom"
import ProfilePage from "./pages/ProfilePage";
import { LoginPage } from './pages/LoginPage';
import  {LoadUser} from './sso/LoadUser';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';

const MainContent = () => {
  return (
      <div className="App">
          <AuthenticatedTemplate>

            <LoadUser></LoadUser>

            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomePage/>}/>
                    <Route path="/createEvent" element={<CreateEventPage/>}/>
                    <Route path="/createEvent/:eventId" element={<CreateEventPage/>}/>
                    <Route path="/friendsPage" element={<FriendsPage/>}/>
                    <Route path="/myEventsPage" element={<MyEventsPage/>}/>
                    <Route path="/profilePage" element={<ProfilePage/>}/>
                    <Route path="/viewEvent/:eventId" element={<ViewEventPage/>}/>
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
