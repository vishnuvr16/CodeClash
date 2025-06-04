const nodemailer = require("nodemailer")

// Create transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === "production") {
    // Use a real email service in production (e.g., SendGrid, AWS SES)
    return nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  } else {
    // Use Ethereal for development/testing
    return nodemailer.createTransporter({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "ethereal.user@ethereal.email",
        pass: "ethereal.pass",
      },
    })
  }
}

// Send match result email
const sendMatchResultEmail = async (email, matchData) => {
  try {
    const transporter = createTransporter()

    const { result, opponent, problem, trophyChange, matchId, reason } = matchData

    const isWin = result === "won"
    const subject = `PeerPrep Duel ${isWin ? "Victory" : "Result"} - ${problem}`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${isWin ? "#10B981" : "#EF4444"}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .trophy-change { font-size: 24px; font-weight: bold; color: ${isWin ? "#10B981" : "#EF4444"}; }
          .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .stats { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${isWin ? "🏆 Victory!" : "📊 Match Result"}</h1>
            <h2>You ${result} your duel!</h2>
          </div>
          <div class="content">
            <div class="stats">
              <h3>Match Details</h3>
              <p><strong>Problem:</strong> ${problem}</p>
              <p><strong>Opponent:</strong> ${opponent}</p>
              ${reason ? `<p><strong>Result:</strong> ${reason}</p>` : ""}
              <p><strong>Trophy Change:</strong> <span class="trophy-change">${trophyChange > 0 ? "+" : ""}${trophyChange}</span></p>
            </div>
            
            <p>
              ${
                isWin
                  ? "Congratulations on your victory! Your coding skills have earned you valuable trophies. Keep up the excellent work!"
                  : "Don't let this setback discourage you! Every match is a learning opportunity. Analyze your approach and come back stronger!"
              }
            </p>
            
            <p>Ready for your next challenge?</p>
            
            <a href="${process.env.CLIENT_URL}/result/${matchId}" class="button">View Detailed Results</a>
            <a href="${process.env.CLIENT_URL}/dashboard" class="button">Find New Match</a>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@peerprep.com",
      to: email,
      subject,
      html,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Match result email sent to ${email}`)
  } catch (error) {
    console.error("Error sending match result email:", error)
    throw error
  }
}

// Send welcome email
const sendWelcomeEmail = async (email, username) => {
  try {
    const transporter = createTransporter()

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B5CF6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Welcome to PeerPrep Duel!</h1>
          </div>
          <div class="content">
            <h2>Hello ${username}!</h2>
            <p>Welcome to the ultimate coding duel platform! You're now part of a community of passionate programmers ready to test their skills.</p>
            
            <h3>What you can do:</h3>
            <ul>
              <li>🥊 Challenge other coders in real-time duels</li>
              <li>📚 Practice with our extensive problem library</li>
              <li>🏆 Earn trophies and climb the leaderboard</li>
              <li>📈 Track your progress and improve your skills</li>
            </ul>
            
            <p>You start with 100 trophies. Ready to earn more?</p>
            
            <a href="${process.env.CLIENT_URL}/dashboard" class="button">Start Your First Duel</a>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@codeclash.com",
      to: email,
      subject: "Welcome to PeerPrep Duel! 🚀",
      html,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Welcome email sent to ${email}`)
  } catch (error) {
    console.error("Error sending welcome email:", error)
  }
}

module.exports = {
  sendMatchResultEmail,
  sendWelcomeEmail,
}
