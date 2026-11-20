alter table public.individuals
  add column role text,
  add constraint individuals_role_check
    check (role in ('Director', 'Manager', 'Technician', 'Operator', 'Engineer', 'Officer'));
