-- Enable Stripe integration
-- Note: Stripe customer creation should be handled via Edge Functions
-- This migration sets up the schema and triggers for Stripe integration

-- Function to handle Stripe customer creation
-- This function is a placeholder - actual Stripe customer creation
-- should be done via Edge Functions for better error handling and security
create or replace function public.handle_stripe_customer_creation()
returns trigger
security definer
set search_path = public
as $$
begin
  -- Stripe customer creation is handled via Edge Functions
  -- The stripe_customer_id will be set when the customer is created
  -- through the Stripe API via Edge Functions
  return new;
end;
$$ language plpgsql;

-- Trigger to create Stripe customer on profile creation
create trigger create_stripe_customer_on_profile_creation
  before insert on public.profiles
  for each row
  execute function public.handle_stripe_customer_creation();

-- Function to handle Stripe customer deletion
-- Note: Actual Stripe customer deletion should be handled via Edge Functions
-- This trigger is kept for potential future use or logging
create or replace function public.handle_stripe_customer_deletion()
returns trigger
security definer
set search_path = public
as $$
begin
  -- Stripe customer deletion should be handled via Edge Functions
  -- This function is kept as a placeholder for potential future functionality
  if old.stripe_customer_id is not null then
    -- Log that a profile with a Stripe customer ID is being deleted
    -- Actual deletion should be handled via webhook or Edge Function
    raise notice 'Profile with Stripe customer ID % is being deleted', old.stripe_customer_id;
  end if;
  return old;
end;
$$ language plpgsql;

-- Trigger to delete Stripe customer on profile deletion
create trigger delete_stripe_customer_on_profile_deletion
  before delete on public.profiles
  for each row
  execute function public.handle_stripe_customer_deletion();

-- Security policy: Users can read their own Stripe data
create policy "Users can read own Stripe data"
  on public.profiles
  for select
  using (auth.uid() = user_id);