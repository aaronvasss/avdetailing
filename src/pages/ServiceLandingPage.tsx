import { Navigate } from "react-router-dom";
import { ServiceLandingTemplate } from "@/components/services/ServiceLandingTemplate";
import { SERVICE_LANDING_BY_SLUG } from "@/data/serviceLandingPages";

interface Props {
  slug: string;
}

export default function ServiceLandingPage({ slug }: Props) {
  const config = SERVICE_LANDING_BY_SLUG[slug];
  if (!config) return <Navigate to="/404" replace />;
  return <ServiceLandingTemplate config={config} />;
}
