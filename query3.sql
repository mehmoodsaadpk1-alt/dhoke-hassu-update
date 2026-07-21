SELECT column_name, is_generated, generation_expression FROM information_schema.columns WHERE table_name='analytics_events';  
SELECT rulename, definition FROM pg_rules WHERE tablename='analytics_events';  
