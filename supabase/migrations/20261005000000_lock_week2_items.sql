-- week2_items (Assignment 2) is no longer read by the app, so drop its old
-- policies. With RLS on and no policies, it is unreadable through the API.
do $$
declare
    p record;
begin
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'week2_items' loop
        execute format('drop policy %I on public.week2_items', p.policyname);
    end loop;
end;
$$;
