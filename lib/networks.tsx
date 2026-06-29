import { NetworkBadge } from '@/components/NetworkBadge';
import { SelectOption } from '@/components/SelectField';

export const NETWORK_OPTIONS: SelectOption[] = [
  { value: 'MTN', label: 'MTN', left: <NetworkBadge network="MTN" /> },
  { value: 'AT', label: 'AT', left: <NetworkBadge network="AT" /> },
  { value: 'TELECEL', label: 'Telecel', left: <NetworkBadge network="TELECEL" /> },
  { value: 'BANK', label: 'Bank', left: <NetworkBadge network="BANK" /> },
];
