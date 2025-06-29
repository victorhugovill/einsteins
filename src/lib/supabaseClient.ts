import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bnkymognxyuddsmgjkhs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJua3ltb2dueHl1ZGRzbWdqa2hzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIzNDUyOCwiZXhwIjoyMDY2ODEwNTI4fQ.al35NyuOgxyqsGnOpk8bamHaYrrijPyRSrYQwgcfo7I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);