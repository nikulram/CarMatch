// src/App.js .
import { BrowserRouter as Router } from "react-router-dom";
import Main from "./Main"; // This is our new router handler

function App() {
  return (
    <Router>
      <Main />
    </Router>
  );
}

export default App;
