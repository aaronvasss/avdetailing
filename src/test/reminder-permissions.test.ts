import {it,expect} from 'vitest';
import {allowsReminder,normalizePhone} from '../../supabase/functions/_shared/reminder-permissions';
it('never assumes consent when no preference or booking approval exists',()=>expect(allowsReminder(undefined,false)).toBe(false));
it('explicit opt-out overrides earlier booking consent',()=>expect(allowsReminder(false,true)).toBe(false));
it('explicit opt-in permits reminders',()=>expect(allowsReminder(true,false)).toBe(true));
it('matches STOP numbers with formatted customer phone numbers',()=>expect(normalizePhone('(225) 521-6264')).toBe('+12252284796'));