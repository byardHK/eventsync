import HomePage from "./HomePage";
import CreateEventPage from "./CreateEventPage";
import FriendsPage from "./FriendsPage"
import MyEventsPage from "./MyEventsPage"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import ProfilePage from "./ProfilePage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/createEvent" element={<CreateEventPage/>}/>
        <Route path="/friendsPage" element={<FriendsPage/>}/>
        <Route path="/myEventsPage" element={<MyEventsPage/>}/>
        <Route path="/profilePage" element={<ProfilePage/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App
