import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Header from "./components/Header";
import { Playground } from "./services/playground";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import PasskeyListPage from "./pages/PasskeyListPage";
import TransactionsPage from "./pages/TransactionsPage";
import GuideDialog from "./components/GuideDialog";

function App() {
  return (
    <Playground>
      <main className="min-h-screen flex flex-col">
        <BrowserRouter>
          <Header />
          <GuideDialog />
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/passkey-list"
              element={
                <ProtectedRoute>
                  <PasskeyListPage />
                </ProtectedRoute>
              }
            />
            <Route path="login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace={true} />} />
          </Routes>
        </BrowserRouter>
      </main>
    </Playground>
  );
}

export default App;
