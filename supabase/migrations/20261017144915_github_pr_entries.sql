alter table public.entries
  add column github_pr_url text,
  add constraint entries_project_id_github_pr_url_key
    unique (project_id, github_pr_url);

grant usage on schema public to service_role;
grant select on public.projects to service_role;
grant insert on public.entries to service_role;