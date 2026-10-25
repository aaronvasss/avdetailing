import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { AppointmentPaymentApproval } from '@/components/account/AppointmentPaymentApproval';
const { invoke } = vi.hoisted(() => ({invoke:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{functions:{invoke}}}));
afterEach(()=>{cleanup();invoke.mockReset();});
const quote={review:false,totalCents:14518,creditedCents:0,depositCents:0,amountCents:14518,serviceCents:14518,feeCents:0,terms:'Exact approval',hasDefault:true,authorization:null,charge:null};
describe('approval balance parity',()=>{
  it('blocks a quote differing from the displayed balance',async()=>{
    invoke.mockResolvedValue({data:quote,error:null});
    render(<AppointmentPaymentApproval bookingId="mock" expectedAmountCents={14000}/>);
    await screen.findByText(/Payment balance changed or needs review/);
    expect(screen.queryByRole('button',{name:'Approve This Appointment Charge'})).toBeNull();
  });
  it('accepts the same verified $145.18 with no extra fee',async()=>{
    invoke.mockResolvedValue({data:quote,error:null});
    render(<AppointmentPaymentApproval bookingId="mock" expectedAmountCents={14518}/>);
    await screen.findByRole('button',{name:'Approve This Appointment Charge'});
    expect(screen.getByText('$145.18')).toBeInTheDocument();
  });
  it('blocks fee-added legacy response',async()=>{
    invoke.mockResolvedValue({data:{...quote,amountCents:15026,feeCents:508},error:null});
    render(<AppointmentPaymentApproval bookingId="mock" expectedAmountCents={14518}/>);
    await waitFor(()=>expect(screen.getByText(/Payment balance changed or needs review/)).toBeInTheDocument());
    expect(screen.queryByRole('button',{name:'Approve This Appointment Charge'})).toBeNull();
  });
});