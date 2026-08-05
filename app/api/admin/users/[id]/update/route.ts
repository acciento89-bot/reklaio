import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";

const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const actions=new Set(["set_quotas","grant_pro","revoke_pro","suspend","unsuspend","make_admin","remove_admin"]);

function adminRedirect(key:"notice"|"error",message:string){const url=publicUrl("/admin");url.searchParams.set(key,message);return NextResponse.redirect(url,303)}
function parseLimit(value:FormDataEntryValue|null){const text=String(value??"").trim();if(!text)return null;const parsed=Number.parseInt(text,10);return Number.isFinite(parsed)&&parsed>=-1?parsed:undefined}

export async function POST(request:Request,context:{params:Promise<{id:string}>}){
  const admin=await getCurrentUser();
  if(!admin)return NextResponse.redirect(publicUrl("/anmelden"),303);
  if(!isAdminUser(admin))return NextResponse.redirect(publicUrl("/dashboard"),303);

  const {id:targetId}=await context.params;
  if(!UUID_PATTERN.test(targetId))return adminRedirect("error","Ungültiges Nutzerkonto.");

  const formData=await request.formData();
  const action=String(formData.get("action")??"");
  if(!actions.has(action))return adminRedirect("error","Ungültige Admin-Aktion.");
  if(targetId===admin.id&&["suspend","remove_admin"].includes(action))return adminRedirect("error","Du kannst deinen eigenen aktiven Adminzugang nicht entfernen oder sperren.");

  const documentLimit=parseLimit(formData.get("documentLimit"));
  const letterLimit=parseLimit(formData.get("letterLimit"));
  if(documentLimit===undefined||letterLimit===undefined)return adminRedirect("error","KI-Limits müssen leer, −1 oder eine nichtnegative Zahl sein.");

  const client=await getDb().connect();
  try{
    await client.query("BEGIN");
    const current=await client.query<{email:string;plan_code:string;role:string;suspended_at:string|null}>(
      "SELECT email,plan_code,role,suspended_at FROM app_users WHERE id=$1 LIMIT 1 FOR UPDATE",[targetId]
    );
    const target=current.rows[0];
    if(!target){await client.query("ROLLBACK");return adminRedirect("error","Nutzerkonto nicht gefunden.")}

    if(action==="set_quotas")await client.query("UPDATE app_users SET ai_document_limit_override=$2,ai_letter_limit_override=$3,updated_at=NOW() WHERE id=$1",[targetId,documentLimit,letterLimit]);
    if(action==="grant_pro")await client.query("UPDATE app_users SET plan_code='pro',subscription_status='manual',updated_at=NOW() WHERE id=$1",[targetId]);
    if(action==="revoke_pro")await client.query("UPDATE app_users SET plan_code='free',subscription_status='manual_revoked',updated_at=NOW() WHERE id=$1",[targetId]);
    if(action==="suspend")await client.query("UPDATE app_users SET suspended_at=NOW(),updated_at=NOW() WHERE id=$1",[targetId]);
    if(action==="unsuspend")await client.query("UPDATE app_users SET suspended_at=NULL,updated_at=NOW() WHERE id=$1",[targetId]);
    if(action==="make_admin")await client.query("UPDATE app_users SET role='admin',updated_at=NOW() WHERE id=$1",[targetId]);
    if(action==="remove_admin")await client.query("UPDATE app_users SET role='user',updated_at=NOW() WHERE id=$1",[targetId]);
    if(action==="suspend")await client.query("DELETE FROM auth_sessions WHERE user_id=$1",[targetId]);

    await client.query(
      "INSERT INTO admin_audit_events(admin_user_id,target_user_id,action,details_json) VALUES($1,$2,$3,$4::jsonb)",
      [admin.id,targetId,action,JSON.stringify({email:target.email,documentLimit,letterLimit})]
    );
    await client.query("COMMIT");
    return adminRedirect("notice",`Aktion „${action}“ für ${target.email} ausgeführt.`);
  }catch(error){
    await client.query("ROLLBACK").catch(()=>undefined);
    console.error("Admin user update failed",error);
    return adminRedirect("error","Die Nutzeränderung konnte nicht gespeichert werden.");
  }finally{client.release()}
}
