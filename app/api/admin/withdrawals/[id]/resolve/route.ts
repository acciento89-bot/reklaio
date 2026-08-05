import {NextResponse} from "next/server";
import {isAdminUser,recordAdminAudit} from "@/lib/admin";
import {getCurrentUser} from "@/lib/auth";
import {query} from "@/lib/db";
import {publicUrl} from "@/lib/public-url";

export const runtime="nodejs";
const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(_request:Request,context:{params:Promise<{id:string}>}){
 const admin=await getCurrentUser();
 if(!admin)return NextResponse.redirect(publicUrl("/anmelden"),303);
 if(!isAdminUser(admin))return NextResponse.redirect(publicUrl("/dashboard"),303);
 const {id}=await context.params;
 if(!UUID_PATTERN.test(id))return NextResponse.redirect(publicUrl("/admin?error=Ungültiger+Widerruf"),303);
 const result=await query<{email:string}>("UPDATE withdrawal_requests SET processed_at=NOW(),processed_by=$2 WHERE id=$1 RETURNING email",[id,admin.id]);
 if(result.rows[0])await recordAdminAudit({adminUserId:admin.id,action:"withdrawal_processed",details:{withdrawalId:id,email:result.rows[0].email}});
 return NextResponse.redirect(publicUrl("/admin?notice=Widerruf+als+bearbeitet+markiert"),303);
}
