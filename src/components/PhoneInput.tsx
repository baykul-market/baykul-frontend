import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export interface CountryCode {
  code: string;
  dial: string;
  maxLocal: number;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'RU', dial: '+7', maxLocal: 10 },
  { code: 'KZ', dial: '+77', maxLocal: 9 },
  { code: 'BY', dial: '+375', maxLocal: 9 },
  { code: 'UA', dial: '+380', maxLocal: 9 },
  { code: 'UZ', dial: '+998', maxLocal: 9 },
  { code: 'KG', dial: '+996', maxLocal: 9 },
  { code: 'TJ', dial: '+992', maxLocal: 9 },
  { code: 'TM', dial: '+993', maxLocal: 8 },
  { code: 'TR', dial: '+90', maxLocal: 10 },
  { code: 'US', dial: '+1', maxLocal: 10 },
  { code: 'GB', dial: '+44', maxLocal: 10 },
  { code: 'DE', dial: '+49', maxLocal: 11 },
  { code: 'CN', dial: '+86', maxLocal: 11 },
  { code: 'AE', dial: '+971', maxLocal: 9 },
  { code: 'PL', dial: '+48', maxLocal: 9 },
];

function FlagImg({ code, className }: { code: string; className?: string }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
      alt={code}
      className={cn('inline-block rounded-sm object-cover', className)}
      width={20}
      height={15}
      loading="lazy"
    />
  );
}

function detectCountry(fullNumber: string): { country: CountryCode; local: string } {
  if (!fullNumber || !fullNumber.startsWith('+')) {
    return { country: COUNTRY_CODES[0], local: fullNumber.replace(/^\+/, '') };
  }
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (fullNumber.startsWith(c.dial)) {
      return { country: c, local: fullNumber.slice(c.dial.length) };
    }
  }
  return { country: COUNTRY_CODES[0], local: fullNumber.replace(/^\+/, '') };
}

/**
 * Validates a full phone number (dial code + local digits).
 * Returns null if valid, or an i18n key if invalid.
 */
export function validatePhone(value: string | undefined | null): string | null {
  if (!value || value.trim() === '') return null;
  const digitsOnly = value.replace(/[^0-9]/g, '');
  if (digitsOnly.length < 7) return 'phone.validation.tooShort';
  if (digitsOnly.length > 15) return 'phone.validation.tooLong';
  if (!/^\+\d{7,15}$/.test(value.replace(/\s/g, ''))) return 'phone.validation.invalid';
  return null;
}

interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  hasError?: boolean;
  placeholder?: string;
  className?: string;
}

export default function PhoneInput({
  value,
  onChange,
  hasError,
  placeholder,
  className,
}: PhoneInputProps) {
  const detected = detectCountry(value);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(detected.country);
  const [localNumber, setLocalNumber] = useState(detected.local);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync from parent value when it changes externally (e.g. on edit prefill)
  useEffect(() => {
    const d = detectCountry(value);
    setSelectedCountry(d.country);
    setLocalNumber(d.local);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const emitChange = (country: CountryCode, local: string) => {
    const digits = local.replace(/\D/g, '');
    if (digits === '') {
      onChange('');
    } else {
      onChange(country.dial + digits);
    }
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const capped = raw.slice(0, selectedCountry.maxLocal);
    setLocalNumber(capped);
    emitChange(selectedCountry, capped);
  };

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setDropdownOpen(false);
    const capped = localNumber.replace(/\D/g, '').slice(0, country.maxLocal);
    setLocalNumber(capped);
    emitChange(country, capped);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className={cn(
          'flex items-stretch rounded-lg border bg-background transition-all duration-200',
          'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
          hasError && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
          !hasError && 'border-input'
        )}
      >
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1.5 px-3 border-r border-input text-sm shrink-0 hover:bg-secondary/50 transition-colors rounded-l-lg"
        >
          <FlagImg code={selectedCountry.code} />
          <span className="text-muted-foreground font-medium text-xs">{selectedCountry.dial}</span>
          <ChevronDown className={cn(
            'w-3 h-3 text-muted-foreground transition-transform',
            dropdownOpen && 'rotate-180'
          )} />
        </button>

        {/* Number input */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground min-w-0"
          value={localNumber}
          onChange={handleLocalChange}
          placeholder={placeholder ?? '291234567'}
          maxLength={selectedCountry.maxLocal + 3}
        />
      </div>

      {/* Dropdown */}
      {dropdownOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border bg-background shadow-lg animate-fade-in">
          {COUNTRY_CODES.map((c) => (
            <button
              key={c.code + c.dial}
              type="button"
              onClick={() => handleCountrySelect(c)}
              className={cn(
                'flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-secondary/50 transition-colors',
                selectedCountry.code === c.code && selectedCountry.dial === c.dial && 'bg-primary/5 text-primary'
              )}
            >
              <FlagImg code={c.code} />
              <span className="font-medium">{c.code}</span>
              <span className="text-muted-foreground ml-auto">{c.dial}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { COUNTRY_CODES };
