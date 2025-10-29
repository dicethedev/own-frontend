// create a supabase client
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


export async function checkIfUserIsWhitelisted(address: string) {
    try {
        const { error } = await supabase
            .from('whitelisted_users')
            .select('*')
            .ilike('wallet_address', address)
            .single();
        if (error) {
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error checking if user is whitelisted", error);
        return false;
    }
}
