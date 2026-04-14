import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Vercel securely injects these from your Environment Variables dashboard
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { email, name } = req.body;

  // 1. Save the user to Supabase
  const { error } = await supabase.from('waitlist').insert([{ email, name }]);

  if (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'You are already on the list.' });
    return res.status(500).json({ error: error.message });
  }

  // 2. Send the Welcome Email via Resend
  try {
    await resend.emails.send({
      from: 'JINTA <hello@yourdomain.com>', // MAKE SURE TO CHANGE THIS TO YOUR DOMAIN
      to: email,
      subject: 'You are locked in. Welcome to JINTA.',
      html: `
        <p>Hey ${name ? name : 'there'},</p>
        <p>You're officially on the waitlist for JINTA.</p>
        <p>We're building the first porn filter controlled entirely by your accountability partner. No more deleting blockers in 3 seconds. No more fighting alone.</p>
        <p>We'll email you the moment the Android Beta is ready.</p>
        <p>Stay strong,<br>The JINTA Team</p>
      `
    });
  } catch (err) {
    console.error("Resend error:", err);
  }

  // Tell the frontend it was successful
  return res.status(200).json({ success: true });
}