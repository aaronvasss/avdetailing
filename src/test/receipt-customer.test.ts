import {it,expect} from 'vitest';
import {generateBookingReceiptHTML} from '@/lib/generateReceipt';
it('prints the guest customer instead of the linked admin identity',()=>{
 const html=generateBookingReceiptHTML({id:'12345678',guest_name:'Guest Customer',guest_email:'guest@example.test',profiles:{full_name:'Linked Administrator',email:'admin@example.test'},total_price:200,payment_status:'paid'});
 expect(html).toContain('Guest Customer');
 expect(html).toContain('guest@example.test');
 expect(html).not.toContain('Linked Administrator');
 expect(html).not.toContain('admin@example.test');
});