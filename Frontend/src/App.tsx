import { Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { GuestOnly, RealtimeBridge, RequireAuth } from "@/components/RouteGuards";
import Landing from "@/pages/Landing";
import Browse from "@/pages/Browse";
import PlanDetailPage from "@/pages/PlanDetail";
import { CreatePlanPage, EditPlanPage } from "@/pages/PlanFormPages";
import MyPlans from "@/pages/MyPlans";
import Profile from "@/pages/Profile";
import { LoginPage, RegisterPage } from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <>
      <RealtimeBridge />
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="browse" element={<Browse />} />
          <Route element={<RequireAuth />}>
            <Route path="plans/new" element={<CreatePlanPage />} />
            <Route path="plans/:id" element={<PlanDetailPage />} />
            <Route path="plans/:id/edit" element={<EditPlanPage />} />
            <Route path="my-plans" element={<MyPlans />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
