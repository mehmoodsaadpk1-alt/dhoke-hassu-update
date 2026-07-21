SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND (routine_name LIKE '%%agg_%%' OR routine_name LIKE '%%get_%%' OR routine_name LIKE '%%analytic%%');  
