import HomePage from "./HomePage";
import CreateEventPage from "./CreateEventPage";
import FriendsPage from "./FriendsPage";
import MyEventsPage from "./MyEventsPage";
import ViewEventPage from "./ViewEventPage";
import { BrowserRouter, Routes, Route } from "react-router-dom"
import ProfilePage from "./ProfilePage";
import React, { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { loginRequest } from './authConfig';
import { callMsGraph } from './graph';
import { ProfileData } from './components/ProfileData';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import Button from 'react-bootstrap/Button';

/**
* If a user is authenticated the ProfileContent component above is rendered. Otherwise a message indicating a user is not authenticated is rendered.
*/

const ProfileContent = () => {
  const { instance, accounts } = useMsal();
  const [graphData, setGraphData] = useState(null);

  function RequestProfileData() {
      // Silently acquires an access token which is then attached to a request for MS Graph data
      instance
          .acquireTokenSilent({
            
              ...loginRequest,
              account: accounts[0],
              
          })
          .then((response) => {
            callMsGraph(response.accessToken).then((response) => setGraphData(response));
          });
  }

  return (
      <>
          <h5 className="card-title">Welcome {accounts[0].name}</h5>
          <br/>
          {graphData ? (
              <ProfileData graphData={graphData} />
          ) : (
              <Button variant="secondary" onClick={RequestProfileData}>
                  Request Profile Information
              </Button>
          )}
      </>
  );
};

const MainContent = () => {
  return (
      <div className="App">
          <AuthenticatedTemplate>
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
