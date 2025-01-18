import HomePage from "./HomePage";
import CreateEventPage from "./CreateEventPage";
import FriendsPage from "./FriendsPage";
import MyEventsPage from "./MyEventsPage";
import ViewEventPage from "./ViewEventPage";
import { BrowserRouter, Routes, Route } from "react-router-dom"


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/createEvent" element={<CreateEventPage/>}/>
        <Route path="/friendsPage" element={<FriendsPage/>}/>
        <Route path="/myEventsPage" element={<MyEventsPage/>}/>
        <Route path="/viewEvent/:eventId" element={<ViewEventPage/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App
