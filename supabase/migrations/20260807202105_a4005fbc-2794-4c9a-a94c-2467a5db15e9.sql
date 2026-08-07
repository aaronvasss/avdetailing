REVOKE EXECUTE ON FUNCTION public.is_manager() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_marketing() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_ops_employee() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.next_ops_job_number() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.prevent_tech_qc_changes() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.prevent_media_approval_changes() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.create_ops_job_for_booking() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.sync_ops_job_technician() FROM anon, public;

GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_marketing() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_ops_employee() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.next_ops_job_number() TO authenticated, service_role;