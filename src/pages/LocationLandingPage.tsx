import { Navigate } from "react-router-dom";
import { LocationLandingTemplate } from "@/components/locations/LocationLandingTemplate";
import { LOCATION_PAGES_BY_SLUG } from "@/data/locationPages";

interface Props {
  slug: string;
}

export default function LocationLandingPage({ slug }: Props) {
  const config = LOCATION_PAGES_BY_SLUG[slug];
  if (!config) return <Navigate to="/404" replace />;
  return <LocationLandingTemplate config={config} />;
}
