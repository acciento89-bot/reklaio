import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentUser} from "@/lib/auth";
import {query} from "@/lib/db";
import {legalOperator} from "@/lib/legal";
import {escapeHtml,isMailConfigured,sendMail,textToHtml} from "@/lib/mail";
import {publicUrl} from "@/lib/public-url";
import {consumeRateLimit,requestFingerprint} from "@/lib/rate-limit";

export const runtime="nodejs";
const schema=z.object({name:z.string().trim().min(2).max(120),email:z.string().trim().toLowerCase().email().max(254),contractReference:z.string().trim().max(240).optional().default(""),declaration:z.string().trim().min(20).max(3000),confirm:z.literal(true),website:z.string().max(200).optional().default("")});
function fail(message:string){const url=publicUrl("/widerruf");url.searchParams.set("error",message);return NextResponse.redirect(url,303)}

export async function POST(request:Request){
 const formData=await request.formData();
 const parsed=schema.safeParse({name:formData.get("name"),email:formData.get("email"),contractReference:formData.get("contractReference"),declaration:formData.get("declaration"),confirm:formData.get("confirm")==="on",website:formData.get("website")});
 if(!parsed.success)return fail("Bitte prüfe die Pflichtfelder und bestätige die Erklärung.");
 if(parsed.data.website)return NextResponse.redirect(publicUrl("/widerruf?sent=1"),303);
 const rate=await consumeRateLimit({key:`withdrawal:${requestFingerprint(request,"withdrawal")}`,limit:4,windowSeconds:3600});
 if(!rate.allowed)return fail("Zu viele Übermittlungen in kurzer Zeit. Bitte versuche es später erneut oder sende eine E-Mail.");
 const user=await getCurrentUser();
 const inserted=await query<{id:string;submitted_at:string}>(`INSERT INTO withdrawal_requests(user_id,name,email,contract_reference,declaration) VALUES($1,$2,$3,NULLIF($4,''),$5) RETURNING id,submitted_at`,[user?.id??null,parsed.data.name,parsed.data.email,parsed.data.contractReference,parsed.data.declaration]);
 const row=inserted.rows[0];
 if(isMailConfigured()&&row){
  const recipient=process.env.CONTACT_RECIPIENT?.trim()||legalOperator.email;
  const text=`Widerruf ${row.id}\nEingang: ${row.submitted_at}\nName: ${parsed.data.name}\nE-Mail: ${parsed.data.email}\nReferenz: ${parsed.data.contractReference||"nicht angegeben"}\n\n${parsed.data.declaration}`;
  try{
   await sendMail({to:recipient,replyTo:parsed.data.email,subject:`[Reklaio Widerruf] ${parsed.data.name}`,text,html:`<h2>Widerruf Reklaio Pro</h2><p><strong>ID:</strong> ${escapeHtml(row.id)}<br/><strong>Name:</strong> ${escapeHtml(parsed.data.name)}<br/><strong>E-Mail:</strong> ${escapeHtml(parsed.data.email)}<br/><strong>Referenz:</strong> ${escapeHtml(parsed.data.contractReference||"nicht angegeben")}</p><p>${textToHtml(parsed.data.declaration)}</p>`});
   await sendMail({to:parsed.data.email,subject:"Eingangsbestätigung Ihres Widerrufs bei Reklaio",text:`Wir bestätigen den Eingang Ihres Widerrufs am ${row.submitted_at}.\nReferenz: ${row.id}\n\n${parsed.data.declaration}\n\nReklaio / ${legalOperator.businessName}`,html:`<h2>Eingangsbestätigung</h2><p>Wir bestätigen den Eingang Ihres Widerrufs.</p><p><strong>Referenz:</strong> ${escapeHtml(row.id)}<br/><strong>Eingang:</strong> ${escapeHtml(String(row.submitted_at))}</p><p>${textToHtml(parsed.data.declaration)}</p>`});
   await query("UPDATE withdrawal_requests SET confirmed_at=NOW() WHERE id=$1",[row.id]);
  }catch(error){console.error("Withdrawal email failed",error)}
 }
 return NextResponse.redirect(publicUrl("/widerruf?sent=1"),303);
}
