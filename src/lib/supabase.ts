import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://jelhetcesvqjyfhnuxyb.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImU1NzkxZmMzLWVkMTktNDYwOC1iMzZjLTY5YzFlNmI1NDU0YyJ9.eyJwcm9qZWN0SWQiOiJqZWxoZXRjZXN2cWp5ZmhudXh5YiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzc0MjkxMzE1LCJleHAiOjIwODk2NTEzMTUsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.SBFTVrrVd2ku50NUPS191E_KpbXMuGpO6pDlisbrmsY';
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase, supabaseUrl, supabaseKey };
