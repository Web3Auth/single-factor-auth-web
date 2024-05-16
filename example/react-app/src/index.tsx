import ReactDOM from "react-dom/client";
import "./globals";
import "./index.css";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <GoogleOAuthProvider clientId="519228911939-cri01h55lsjbsia1k7ll6qpalrus75ps.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
