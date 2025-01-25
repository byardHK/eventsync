import HomePage from "./HomePage";
import CreateEventPage from "./CreateEventPage";
import FriendsPage from "./FriendsPage";
import MyEventsPage from "./MyEventsPage";
import ViewEventPage from "./ViewEventPage";
import { BrowserRouter, Routes, Route } from "react-router-dom"
import ProfilePage from "./ProfilePage";
import { WelcomeScreen } from './components/WelcomeScreen';
import  {LoadUser} from './LoadUser';
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
                    <Route path="/friendsPage" element={<FriendsPage/>}/>
                    <Route path="/myEventsPage" element={<MyEventsPage/>}/>
                    <Route path="/profilePage" element={<ProfilePage/>}/>
                    <Route path="/viewEvent/:eventId" element={<ViewEventPage/>}/>
                </Routes>
            </BrowserRouter>
          </AuthenticatedTemplate>

          <UnauthenticatedTemplate>
            <WelcomeScreen>                
            </WelcomeScreen>
          </UnauthenticatedTemplate>
      </div>
  );
};

export default function App() {
  return (
    <MainContent />
  );
}


// function App() {
//   return (
    // <BrowserRouter>
    //   <Routes>
    //     <Route path="/" element={<HomePage/>}/>
    //     <Route path="/createEvent" element={<CreateEventPage/>}/>
    //     <Route path="/friendsPage" element={<FriendsPage/>}/>
    //     <Route path="/myEventsPage" element={<MyEventsPage/>}/>
    //     <Route path="/viewEvent/:eventId" element={<ViewEventPage/>}/>
    //   </Routes>
    // </BrowserRouter>
//   );
// }

// export default App
