-- Extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update user table to include role and active status
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client',
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Create table for audit logging
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    path TEXT,
    method TEXT,
    user_role TEXT,
    success BOOLEAN,
    reason TEXT,
    details JSONB,
    ip_address TEXT
);

-- Create index on audit logs for efficient querying
CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON public.audit_logs(action);

-- Create table for user permissions (for future extensibility)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL,
    permission TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    UNIQUE(role, permission)
);

-- Insert default role permissions
INSERT INTO public.role_permissions (role, permission)
VALUES
    -- Admin permissions
    ('admin', 'manage:users'),
    ('admin', 'view:users'),
    ('admin', 'manage:projects'),
    ('admin', 'view:projects'),
    ('admin', 'manage:content'),
    ('admin', 'submit:content'),
    ('admin', 'view:analytics'),
    ('admin', 'manage:settings'),
    ('admin', 'manage:roles'),
    
    -- Director permissions
    ('director', 'view:users'),
    ('director', 'manage:projects'),
    ('director', 'view:projects'),
    ('director', 'manage:content'),
    ('director', 'submit:content'),
    ('director', 'view:analytics'),
    
    -- Team permissions
    ('team', 'view:projects'),
    ('team', 'manage:content'),
    ('team', 'submit:content'),
    ('team', 'view:analytics'),
    
    -- Client permissions
    ('client', 'view:projects'),
    ('client', 'submit:content'),
    
    -- Builder permissions
    ('builder', 'view:projects')
ON CONFLICT (role, permission) DO NOTHING;

-- Create function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(user_id UUID, required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get the user's role
    SELECT role INTO user_role FROM public.users WHERE id = user_id;
    
    -- Check if the role has the permission
    RETURN EXISTS (
        SELECT 1 FROM public.role_permissions 
        WHERE role = user_role AND permission = required_permission
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically reset failed login attempts
CREATE OR REPLACE FUNCTION public.reset_failed_login_attempts()
RETURNS TRIGGER AS $$
BEGIN
    -- Reset failed attempts and locked status on successful login
    IF NEW.last_login IS NOT NULL AND NEW.last_login > OLD.last_login THEN
        NEW.failed_login_attempts := 0;
        NEW.locked_until := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for failed login reset
CREATE TRIGGER reset_login_attempts
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.reset_failed_login_attempts();

-- Create RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY users_read_own ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Admins can read all users
CREATE POLICY admin_read_all_users ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Directors can read all users but not admins
CREATE POLICY director_read_most_users ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'director'
        ) AND 
        role != 'admin'
    );

-- Policy: Admins can update any user
CREATE POLICY admin_update_any_user ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Directors can update non-admin/director users
CREATE POLICY director_update_some_users ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'director'
        ) AND 
        role NOT IN ('admin', 'director')
    );

-- Policy: Users can update their own non-role information
CREATE POLICY users_update_own ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        NEW.role = OLD.role -- Cannot change own role
    );

-- Secure the audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read all audit logs
CREATE POLICY admin_read_all_logs ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Directors can read non-admin audit logs
CREATE POLICY director_read_some_logs ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'director'
        ) AND
        NOT EXISTS (
            SELECT 1 FROM public.users
            WHERE id = audit_logs.user_id AND role = 'admin'
        )
    );

-- Policy: Users can read their own audit logs
CREATE POLICY users_read_own_logs ON public.audit_logs
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: System can insert audit logs
CREATE POLICY system_insert_logs ON public.audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Secure role permissions table
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read, update, delete role permissions
CREATE POLICY admin_manage_permissions ON public.role_permissions
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Anyone can read role permissions
CREATE POLICY anyone_read_permissions ON public.role_permissions
    FOR SELECT
    USING (true);

-- Make sure auth functions are available
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 