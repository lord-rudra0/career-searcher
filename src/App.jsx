import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Index from "./pages/Index.jsx";
// import Test from "./pages/Test.jsx";
import SignUp from "./pages/SignUp.jsx";
import SignIn from "./pages/SignIn.jsx";
import Profile from "./pages/Profile.jsx";
import ProfileLayout from "./pages/profile/Layout.jsx";
import ProfileOverview from "./pages/profile/Overview.jsx";
import ProfileEdit from "./pages/profile/Edit.jsx";
import ProfileHistory from "./pages/profile/History.jsx";
import NotFound from "./pages/NotFound.jsx";
// import HomePage from './components/HomePage';
import QuesRes from './components/Ques_res';
import ChatBot from './components/ChatBot';
import Group from "./components/Group";
import SkillGap from "./pages/SkillGap.jsx";
import SkillGapList from "./pages/SkillGapList.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TryoutsDashboard from "./pages/TryoutsDashboard.jsx";
import TryoutsSummary from "./pages/TryoutsSummary.jsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/test" element={<Group />} />
            <Route path="/test/questions" element={<QuesRes />} />
            <Route path="/skill-gap" element={<SkillGap />} />
            <Route path="/skill-gap/:id" element={<SkillGap />} />
            <Route path="/skill-gap/list" element={<SkillGapList />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tryouts" element={<TryoutsDashboard />} />
            <Route path="/tryouts/:id/summary" element={<TryoutsSummary />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            {/* Back-compat: keep old Profile.jsx but redirect to new nested routes */}
            <Route path="/profile" element={<Navigate to="/profile/overview" replace />} />
            <Route path="/profile/*" element={<ProfileLayout />}>
              <Route path="overview" element={<ProfileOverview />} />
              <Route path="edit" element={<ProfileEdit />} />
              <Route path="history" element={<ProfileHistory />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatBot />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
