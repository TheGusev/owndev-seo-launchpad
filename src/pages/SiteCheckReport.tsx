import { useParams, Navigate } from "react-router-dom";

const SiteCheckReport = () => {
  const { reportId } = useParams<{ reportId: string }>();
  return <Navigate to={`/tools/site-check/result/${reportId}`} replace />;
};

export default SiteCheckReport;
