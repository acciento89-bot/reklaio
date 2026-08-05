import {NextResponse} from "next/server";
import {isAdminUser,recordAdminAudit} from "@/lib/admin";
import {getCurrentUser} from "@/lib/auth";
import {query} from "@/lib/db";
import {publicUrl} from "@/lib/public-url";

export const runtime="nodejs";

export async function POST(){
 const admin=await getCurrentUser();
 if(!admin)return NextResponse.redirect(publicUrl("/anmelden"),303);
 if(!isAdminUser(admin))return NextResponse.redirect(publicUrl("/dashboard"),303);
 const pending=await query<{id:string}>("SELECT id FROM backup_requests WHERE status IN ('pending','running') ORDER BY created_at DESC LIMIT 1");
 if(pending.rows[0])return NextResponse.redirect(publicUrl("/admin?notice=Ein+Backup+ist+bereits+vorgemerkt"),303);
 const result=await query<{id:string}>("INSERT INTO backup_requests(requested_by) VALUES($1) RETURNING id",[admin.id]);
 await recordAdminAudit({adminUserId:admin.id,action:"backup_requested",details:{requestId:result.rows[0]?.id}});
 return NextResponse.redirect(publicUrl("/admin?notice=Backup+angefordert.+Der+Backup-Dienst+startet+es+automatisch"),303);
}
