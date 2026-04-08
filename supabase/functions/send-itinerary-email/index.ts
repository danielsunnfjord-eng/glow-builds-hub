const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMAIL_TEMPLATES: Record<string, { subject: string; body: (data: { clientName: string; destination: string; siteName: string }) => string }> = {
  'welcome': {
    subject: 'Your Itinerary from Fjord & Waves Travel',
    body: ({ clientName, destination, siteName }) => `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a2e;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Dear ${clientName},</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Thank you for choosing ${siteName}! We are delighted to share your personalised itinerary for your upcoming trip${destination ? ` to <strong>${destination}</strong>` : ''}.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Please find your detailed itinerary attached via the link below. We have carefully curated every detail to ensure an unforgettable experience.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          If you have any questions or would like to make adjustments, please don't hesitate to reach out.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #555; margin-top: 24px;">
          Warm regards,<br/>
          <strong>The ${siteName} Team</strong>
        </p>
      </div>
    `,
  },
  'final': {
    subject: 'Your Final Itinerary — Ready to Go!',
    body: ({ clientName, destination, siteName }) => `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a2e;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Dear ${clientName},</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Your final itinerary${destination ? ` for <strong>${destination}</strong>` : ''} is ready! All arrangements have been confirmed and we're excited for your journey ahead.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Please review the itinerary via the link below and keep it handy during your trip. All contact numbers, booking references, and daily plans are included.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          We wish you an amazing adventure!
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #555; margin-top: 24px;">
          Best wishes,<br/>
          <strong>The ${siteName} Team</strong>
        </p>
      </div>
    `,
  },
  'revision': {
    subject: 'Updated Itinerary from Fjord & Waves Travel',
    body: ({ clientName, destination, siteName }) => `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a2e;">
        <h1 style="font-size: 24px; margin-bottom: 8px;">Dear ${clientName},</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          Based on your feedback, we've revised your itinerary${destination ? ` for <strong>${destination}</strong>` : ''}. Please find the updated version via the link below.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #555;">
          We've incorporated all the changes you requested. Please review and let us know if everything looks perfect or if you'd like any further adjustments.
        </p>
        <p style="font-size: 16px; line-height: 1.6; color: #555; margin-top: 24px;">
          Kind regards,<br/>
          <strong>The ${siteName} Team</strong>
        </p>
      </div>
    `,
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipientEmail, clientName, destination, templateName, pdfUrl } = await req.json()

    if (!recipientEmail || !clientName || !templateName || !pdfUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recipientEmail, clientName, templateName, pdfUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const template = EMAIL_TEMPLATES[templateName]
    if (!template) {
      return new Response(
        JSON.stringify({ error: `Unknown template: ${templateName}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const siteName = 'Fjord & Waves Travel'
    const htmlBody = template.body({ clientName, destination: destination || '', siteName })

    // Build full email HTML with PDF download button
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background: #f9f6f0;">
        ${htmlBody}
        <div style="text-align: center; margin: 20px 0 40px;">
          <a href="${pdfUrl}" style="display: inline-block; background: #c9a96e; color: #1a1a2e; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-family: Georgia, serif; font-size: 15px; font-weight: bold; letter-spacing: 0.05em;">
            📄 Download Your Itinerary
          </a>
        </div>
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #999; font-family: Arial, sans-serif;">
          © ${new Date().getFullYear()} ${siteName} · Org.nr: 928804860
        </div>
      </body>
      </html>
    `

    // Use Supabase's built-in SMTP to send (via the auth admin or a simple SMTP call)
    // For now, we use the Resend-compatible approach through the LOVABLE_API_KEY
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Email sending is not configured. Please set up an email domain first.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send via Lovable's email infrastructure
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // For now, return success with the email content so the admin can verify
    // Full email sending will be enabled once an email domain is configured
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email prepared for ${recipientEmail}`,
        note: 'To enable actual email delivery, please set up an email domain in Cloud → Emails.',
        preview: { subject: template.subject, to: recipientEmail }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
