alter table public.individuals
  add column employee_id text,
  add constraint individuals_employee_id_check
    check (char_length(employee_id) = 6 and employee_id ~ '^[0-9]{6}$'),
  add constraint individuals_owner_employee_id_key unique (owner_id, employee_id);
