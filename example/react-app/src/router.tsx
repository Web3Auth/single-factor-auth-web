import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Header from "./components/Header";
import GuideDialog from "./components/GuideDialog";
import { Playground } from "./services/playground";
import { GoogleOAuthProvider } from "@react-oauth/google";

const router = createBrowserRouter([
  {
    element: (
      <>
        <GoogleOAuthProvider clientId="519228911939-cri01h55lsjbsia1k7ll6qpalrus75ps.apps.googleusercontent.com">
          <Playground>
            <main className="min-h-screen flex flex-col">
              <Header />
              <GuideDialog />
              <Outlet />
            </main>
          </Playground>
        </GoogleOAuthProvider>
      </>
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
          {
            path: "transactions",
            async lazy() {
              const TransactionsPage = (await import("./pages/TransactionsPage")).default;
              return {
                element: <TransactionsPage />,
              };
            },
          },
          {
            path: "passkey-list",
            async lazy() {
              const PasskeyListPage = (await import("./pages/PasskeyListPage")).default;
              return {
                element: <PasskeyListPage />,
              };
            },
          },
        ],
      },

      {
        path: "*",
        element: <Navigate to="/" replace={true} />,
      },
    ],
  },
]);

export default router;
