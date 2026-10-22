import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, Trash2, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Card = {id:string;brand:string;last4:string;expMonth:number;expYear:number};
export function SavedCardWallet({userId}:{userId?:string}) {
  const [cards,setCards]=useState<Card[]>([]);
  const [defaultId,setDefault]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const request = async (body:Record<string,unknown>) => {
    const {data,error}=await supabase.functions.invoke('card-wallet',{body});
    if(error || data?.error) throw new Error(data?.error || 'Unable to open your saved cards');
    return data;
  };
  const load = async () => {
    setLoading(true);setError('');
    try {const data=await request({action:'list'});setCards(data.cards ?? []);setDefault(data.defaultId ?? null);}
    catch(e){setError(e instanceof Error?e.message:'Unable to load cards');}
    finally{setLoading(false);}
  };
  useEffect(()=>{
    if(!userId){setLoading(false);return;}
    const session=new URLSearchParams(window.location.search).get('card_session');
    if(session) request({action:'complete',sessionId:session}).then(()=>toast.success('Card saved securely')).catch(()=>toast.error('Card setup has not completed')).finally(()=>{window.history.replaceState({},'', '/account?tab=payments');load();});
    else load();
  },[userId]);
  const act=async(action:string,paymentMethodId?:string)=>{
    if(action==='remove' && !window.confirm('Remove this saved card?'))return;
    setBusy(true);
    // Open immediately so browsers do not block Stripe after the request completes.
    const tab=action==='setup'?window.open('about:blank','_blank'):null;
    if(tab)tab.opener=null;
    try{const data=await request({action,paymentMethodId});if(data.url){if(tab)tab.location.href=data.url;else window.location.assign(data.url);}else{await load();toast.success(action==='default'?'Default card updated':'Card removed');}}
    catch(e){tab?.close();toast.error(e instanceof Error?e.message:'Unable to update card');}
    finally{setBusy(false);}
  };
  return <div className="space-y-4">
    {loading?<p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Loading cards…</p>:error?<div className="space-y-2"><p role="alert" className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={load}>Retry</Button></div>:cards.length===0?<p className="text-sm text-muted-foreground">No saved cards</p>:<ul className="divide-y divide-border">{cards.map(card=><li key={card.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="flex items-center gap-3"><CreditCard className="h-5 w-5 text-primary"/><div><p className="font-medium capitalize">{card.brand} •••• {card.last4}</p><p className="text-xs text-muted-foreground">Expires {card.expMonth}/{card.expYear}{defaultId===card.id?' · Default':''}</p></div></div><div className="flex gap-2">{defaultId!==card.id&&<Button size="sm" variant="outline" disabled={busy} onClick={()=>act('default',card.id)}><Star className="mr-2 h-4 w-4"/>Set default</Button>}<Button size="icon" variant="ghost" disabled={busy} aria-label={`Remove card ending ${card.last4}`} onClick={()=>act('remove',card.id)}><Trash2 className="h-4 w-4"/></Button></div></li>)}</ul>}
    <Button onClick={()=>act('setup')} disabled={busy||!userId}><Plus className="mr-2 h-4 w-4"/>Add Card</Button>
    <p className="text-xs text-muted-foreground">Adding a card does not authorize new charges. Any appointment balance requires your separate approval.</p>
  </div>;
}