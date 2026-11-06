import {NextResponse} from 'next/server';export async function POST(){const r=NextResponse.json({ok:true});r.cookies.delete('hr_admin');return r}
