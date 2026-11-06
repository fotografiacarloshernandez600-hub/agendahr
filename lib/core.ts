import {createClient} from '@supabase/supabase-js';
import {createHmac,timingSafeEqual} from 'crypto';
import {cookies} from 'next/headers';
export const db=()=>{const u=process.env.SUPABASE_URL,k=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!u||!k)throw Error('Configura las variables Supabase');return createClient(u,k,{auth:{persistSession:false}})};
export const dateOK=(d:string)=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T12:00:00Z'))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
export const minutes=(s:string)=>{const m=/^(\d\d):(\d\d)(?::\d\d)?$/.exec(s||'');return m?Number(m[1])*60+Number(m[2]):NaN};
export const hh=(n:number)=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
export async function slots(day:string){if(!dateOK(day))throw Error('Fecha inválida');const weekday=new Date(day+'T12:00:00Z').getUTCDay();let a=weekday===0?600:weekday===6?900:1080,b=weekday===0?1080:1200;const {data:override,error}=await db().from('day_overrides').select('*').eq('day',day).maybeSingle();if(error)throw error;if(override){if(override.closed)return [];a=minutes(override.start_time);b=minutes(override.end_time)}const result:string[]=[];for(let t=a;t+30<=b;t+=30)result.push(hh(t));return result}
export async function taken(day:string){const {data,error}=await db().from('bookings').select('start_time').eq('session_date',day).neq('status','cancelada');if(error)throw error;return new Set((data||[]).map(x=>x.start_time.slice(0,5)))}
const sign=(s:string)=>createHmac('sha256',process.env.SESSION_SECRET||'').update(s).digest('hex');
export async function isAdmin(){const secret=process.env.SESSION_SECRET;if(!secret||secret.length<32)return false;const token=(await cookies()).get('hr_admin')?.value||'';const expected=sign('hr-admin');try{return token.length===expected.length&&timingSafeEqual(Buffer.from(token),Buffer.from(expected))}catch{return false}}
export const adminToken=()=>sign('hr-admin');
export const fail=(message:string,status=400)=>Response.json({error:message},{status});
