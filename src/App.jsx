import { Route, Routes } from "react-router-dom";
import Lobby from "./screens/Lobby";
import Room from "./screens/Room";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/room/:roomId" element={<Room />} />
    </Routes>
  );
}

export default App;
