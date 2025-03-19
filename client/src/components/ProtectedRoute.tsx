import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api, { API_ROUTES } from "../utils/api";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const { data, isLoading, error } = useQuery({
    queryKey: ["checkAuth"],
    queryFn: async () => {
      const response = await api.get(API_ROUTES.CHECK_AUTH, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    retry: false,
    enabled: !!token, // Only run the query if a token exists
  });

  useEffect(() => {
    if (!token || (!isLoading && (error || !data?.authenticated))) {
      navigate("/login");
    }
  }, [isLoading, data, error, navigate, token]);

  if (isLoading) return <div>Loading...</div>;
  return <>{children}</>;
};

export default ProtectedRoute;