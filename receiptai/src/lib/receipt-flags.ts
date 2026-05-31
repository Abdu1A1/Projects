import { SupabaseClient } from '@supabase/supabase-js';
import { FlagType } from '@/types';
import { subHours } from 'date-fns';

export async function detectDuplicateFlag(
  supabase: SupabaseClient,
  userId: string,
  receiptId: string,
  merchant: string | null,
  total: number | null
): Promise<boolean> {
  if (!merchant || total == null) return false;

  const since = subHours(new Date(), 24).toISOString();

  const { data } = await supabase
    .from('receipts')
    .select('id')
    .eq('user_id', userId)
    .eq('merchant', merchant)
    .eq('total', total)
    .neq('id', receiptId)
    .gte('created_at', since)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

export function mergeFlags(existing: FlagType[], flag: FlagType): FlagType[] {
  return existing.includes(flag) ? existing : [...existing, flag];
}
