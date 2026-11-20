update public.individuals
set role = 'Technician'
where role is distinct from 'Technician';
