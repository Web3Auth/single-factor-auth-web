import "./globals";
import "./index.css";
import "./App.css";

import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import router from "./router";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(<RouterProvider router={router} />);
