import HomePage from "./HomePage";
import CreateEventPage from "./CreateEventPage";
import { BrowserRouter, Routes, Route } from "react-router-dom"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/createEvent" element={<CreateEventPage/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
