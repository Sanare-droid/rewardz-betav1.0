import { useUser } from "@/context/UserContext";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const location = useLocation();
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  return <>{children}</>;
}
