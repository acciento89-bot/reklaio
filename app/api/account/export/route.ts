import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { publicUrl } from "@/lib/public-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(publicUrl("/anmelden"), 303);

  try {
    const [
      account, cases, events, deadlines, letters, documents, tasks,
      responses, escalations, deliveries, deliveryAttachments,
      aiAnalyses, aiUsage, checkoutIntents, withdrawals,
      contactMessages, adminAudit
    ] = await Promise.all([
      query(
        `SELECT id,email,display_name,email_verified_at,onboarding_completed_at,
                onboarding_dismissed_at,terms_accepted_at,terms_version,
                privacy_acknowledged_at,role,plan_code,stripe_customer_id,
                stripe_subscription_id,subscription_status,
                subscription_current_period_end,subscription_cancel_at_period_end,
                ai_document_limit_override,ai_letter_limit_override,
                suspended_at,created_at,updated_at
         FROM app_users WHERE id=$1 LIMIT 1`, [user.id]
      ),
      query(`SELECT id,type,status,title,company_name,order_reference,amount_cents,currency,incident_date,summary,created_at,updated_at FROM cases WHERE user_id=$1 ORDER BY created_at`, [user.id]),
      query(`SELECT e.id,e.case_id,e.event_type,e.title,e.details,e.occurred_at,e.created_at FROM case_events e JOIN cases c ON c.id=e.case_id WHERE c.user_id=$1 ORDER BY e.occurred_at`, [user.id]),
      query(`SELECT d.id,d.case_id,d.title,d.due_at,d.completed_at,d.reminder_sent_at,d.created_at FROM case_deadlines d JOIN cases c ON c.id=d.case_id WHERE c.user_id=$1 ORDER BY d.due_at`, [user.id]),
      query(`SELECT l.id,l.case_id,l.kind,l.subject,l.body,l.model_name,l.generation_mode,l.ai_response_id,l.approved_at,l.recipient_email,l.last_sent_at,l.created_at FROM generated_letters l JOIN cases c ON c.id=l.case_id WHERE c.user_id=$1 ORDER BY l.created_at`, [user.id]),
      query(`SELECT d.id,d.case_id,d.original_name,d.mime_type,d.size_bytes,d.sha256,d.document_type,d.extracted_text,d.created_at FROM case_documents d JOIN cases c ON c.id=d.case_id WHERE c.user_id=$1 ORDER BY d.created_at`, [user.id]),
      query(`SELECT t.id,t.case_id,t.title,t.description,t.priority,t.status,t.source,t.due_at,t.completed_at,t.created_at,t.updated_at FROM case_tasks t JOIN cases c ON c.id=t.case_id WHERE c.user_id=$1 ORDER BY t.created_at`, [user.id]),
      query(`SELECT r.id,r.case_id,r.response_received_at,r.outcome,r.promised_amount_cents,r.promised_due_at,r.summary,r.document_id,r.created_at FROM provider_responses r JOIN cases c ON c.id=r.case_id WHERE c.user_id=$1 ORDER BY r.response_received_at`, [user.id]),
      query(`SELECT e.id,e.case_id,e.stage,e.note,e.created_at FROM case_escalations e JOIN cases c ON c.id=e.case_id WHERE c.user_id=$1 ORDER BY e.created_at`, [user.id]),
      query(`SELECT e.id,e.letter_id,e.case_id,e.recipient_email,e.subject,e.attachment_count,e.reply_deadline_id,e.sent_at FROM letter_email_deliveries e JOIN cases c ON c.id=e.case_id WHERE c.user_id=$1 ORDER BY e.sent_at`, [user.id]),
      query(`SELECT a.id,a.delivery_id,a.document_id,a.original_name,a.size_bytes FROM letter_email_delivery_attachments a JOIN letter_email_deliveries e ON e.id=a.delivery_id JOIN cases c ON c.id=e.case_id WHERE c.user_id=$1 ORDER BY e.sent_at`, [user.id]),
      query(`SELECT id,document_id,case_id,provider,model_name,response_id,consent_at,result_json,applied_at,created_at FROM document_ai_analyses WHERE user_id=$1 ORDER BY created_at`, [user.id]),
      query(`SELECT id,case_id,document_id,operation,provider,model_name,response_id,consent_at,metadata_json,status,error_code,input_bytes,estimated_cost_micros,completed_at,created_at FROM ai_usage_events WHERE user_id=$1 ORDER BY created_at`, [user.id]),
      query(`SELECT id,stripe_session_id,stripe_price_id,displayed_price,terms_version,privacy_version,withdrawal_version,terms_accepted_at,withdrawal_acknowledged_at,immediate_start_requested_at,status,completed_at,created_at FROM billing_checkout_intents WHERE user_id=$1 ORDER BY created_at`, [user.id]),
      query(`SELECT id,name,email,contract_reference,declaration,submitted_at,confirmed_at,processed_at FROM withdrawal_requests WHERE user_id=$1 OR LOWER(email)=LOWER($2) ORDER BY submitted_at`, [user.id,user.email]),
      query(`SELECT id,name,email,subject,message,status,delivered_at,resolved_at,created_at FROM contact_messages WHERE user_id=$1 OR LOWER(email)=LOWER($2) ORDER BY created_at`, [user.id,user.email]),
      query(`SELECT id,action,details_json,created_at FROM admin_audit_events WHERE target_user_id=$1 ORDER BY created_at`, [user.id])
    ]);

    const exportData = {
      exportVersion: 4,
      generatedAt: new Date().toISOString(),
      service: "Reklaio",
      account: account.rows[0] ?? null,
      cases: cases.rows,
      events: events.rows,
      deadlines: deadlines.rows,
      letters: letters.rows,
      documents: documents.rows,
      tasks: tasks.rows,
      providerResponses: responses.rows,
      escalations: escalations.rows,
      emailDeliveries: deliveries.rows,
      emailDeliveryAttachments: deliveryAttachments.rows,
      documentAiAnalyses: aiAnalyses.rows,
      aiUsageEvents: aiUsage.rows,
      billingCheckoutIntents: checkoutIntents.rows,
      withdrawalRequests: withdrawals.rows,
      contactMessages: contactMessages.rows,
      accountAdministrationEvents: adminAudit.rows,
      note: "Passwort-Hashes, Sitzungstoken, vollständige Zahlungsdaten, interne IP-Hashes und hochgeladene Binärdateien sind nicht Teil dieses JSON-Exports."
    };

    const json = JSON.stringify(exportData, null, 2);
    const date = new Date().toISOString().slice(0, 10);
    return new Response(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="reklaio-datenexport-${date}.json"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    console.error("Account export failed", error);
    return new Response("Der Datenexport konnte gerade nicht erstellt werden.", { status: 500 });
  }
}
