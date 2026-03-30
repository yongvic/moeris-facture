const resendEndpoint = "https://api.resend.com/emails";

type PasswordResetEmailParams = {
  to: string;
  name?: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: PasswordResetEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY ou RESEND_FROM manquant.");
  }

  const displayName = name?.trim() ? name.trim() : "";
  const greeting = displayName ? `Bonjour ${displayName},` : "Bonjour,";

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#2b2418;">
      <p>${greeting}</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>
        <a
          href="${resetUrl}"
          style="display:inline-block;padding:12px 20px;background:#b88d0e;color:#ffffff;text-decoration:none;border-radius:999px;"
        >
          Réinitialiser mon mot de passe
        </a>
      </p>
      <p>Ce lien expire dans 60 minutes.</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    </div>
  `;

  const text = `${greeting}\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nOuvrez ce lien : ${resetUrl}\n\nCe lien expire dans 60 minutes.\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email.`;

  const response = await fetch(resendEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Réinitialisation du mot de passe",
      html,
      text,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend error: ${response.status} ${message}`);
  }
}
