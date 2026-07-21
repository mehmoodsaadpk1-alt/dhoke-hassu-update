SELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid='public.analytics_events'::regclass AND NOT tgisinternal;  
SELECT * FROM information_schema.triggers WHERE event_object_table='analytics_events';  
