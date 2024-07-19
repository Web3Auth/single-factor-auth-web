import { GoogleOAuthProvider } from "@react-oauth/google";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

import CancelModal from "./components/CancelModal";
import Header from "./components/Header";
import LoginPage from "./pages/LoginPage";
import { Playground } from "./services/playground";

const router = createBrowserRouter([
  {
    element: (
      <GoogleOAuthProvider clientId="519228911939-cri01h55lsjbsia1k7ll6qpalrus75ps.apps.googleusercontent.com">
        <Playground>
          <main className="min-h-screen flex flex-col">
            <Header />
            <CancelModal />
            <Outlet />
          </main>
        </Playground>
      </GoogleOAuthProvider>
    ),
    children: [
      {
        path: "/",
        element: <LoginPage />,
      },
      {
        async lazy() {
          const { ProtectedRoute } = await import("./components/ProtectedRoute");
          return {
            element: (
              <ProtectedRoute>
                <Outlet />
              </ProtectedRoute>
            ),
          };
        },
        children: [
          {
            path: "home",
            async lazy() {
              const HomePage = (await import("./pages/HomePage")).default;
              return {
                element: <HomePage />,
              };
            },
          },
        ],
      },

      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;
