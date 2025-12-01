const nodemailer = require("nodemailer");

// Email configuration
// IMPORTANT: Replace with your actual email credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "elakonv@gmail.com", // Replace with your actual Gmail address
    pass: "clqjphzkugqlhvrw", // Replace with your app password (remove spaces)
  },
});

// SETUP INSTRUCTIONS:
// 1. Enable 2-Factor Authentication on your Gmail account
// 2. Go to Google Account → Security → App passwords
// 3. Generate app password for "Mail"
// 4. Use the 16-character password here (remove spaces)
// 5. Replace both user and pass values above

// FOR TESTING ONLY - Use Ethereal Email (fake SMTP service):
// const transporter = nodemailer.createTransport({
//   host: 'smtp.ethereal.email',
//   port: 587,
//   auth: {
//     user: 'ethereal.user@ethereal.email',
//     pass: 'ethereal.pass'
//   }
// });

// Alternative configurations for other email services:
//
// For Outlook/Hotmail:
// {
//   service: 'outlook',
//   auth: {
//     user: 'your-email@outlook.com',
//     pass: 'your-password'
//   }
// }
//
// For custom SMTP:
// {
//   host: 'smtp.your-email-provider.com',
//   port: 587,
//   secure: false,
//   auth: {
//     user: 'your-email@domain.com',
//     pass: 'your-password'
//   }
// }

// Verify transporter configuration (commented out to avoid startup errors)
// transporter.verify((error, success) => {
//   if (error) {
//     console.log('❌ Email transporter error:', error);
//   } else {
//     console.log('✅ Email server is ready to send messages');
//   }
// });

// Generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email, otp, username) => {
  try {
    const mailOptions = {
      from: '"ELako.NV Support" <elakonv@gmail.com>', // Your Gmail address
      to: email,
      subject: "Password Reset OTP - ELako.NV",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4CAF50;">ELako.NV</h1>
            <p style="color: #666;">Digital Marketing Solution For MSMEs</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="color: #666; line-height: 1.6;">
              Hello <strong>${username}</strong>,
            </p>
            <p style="color: #666; line-height: 1.6;">
              We received a request to reset your password. Please use the following OTP (One-Time Password) to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #4CAF50; color: white; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; display: inline-block; letter-spacing: 5px;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              This OTP is valid for <strong>10 minutes</strong>. If you didn't request this password reset, please ignore this email.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #999; font-size: 12px; line-height: 1.4;">
                For security reasons, never share this OTP with anyone. If you have any concerns, please contact our support team.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>&copy; 2025 ELako.NV. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ OTP email sent successfully:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    return { success: false, error: error.message };
  }
};

// Send store activity notification email
const sendStoreActivityEmail = async (
  customerEmail,
  customerName,
  storeInfo,
  activityData
) => {
  try {
    let subject = "";
    let activityMessage = "";
    let actionButton = "";

    switch (activityData.type) {
      case "NEW_PRODUCT":
        subject = `🆕 New Product from ${storeInfo.businessName}!`;
        activityMessage = `
          <h2 style="color: #4CAF50; margin-bottom: 20px;">New Product Alert!</h2>
          <p style="color: #666; line-height: 1.6;">
            Great news! <strong>${storeInfo.businessName}</strong> has added a new product that you might be interested in:
          </p>
          <div style="background-color: #f0f8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2E7D32; margin: 0 0 10px 0;">${activityData.productName}</h3>
            <p style="color: #666; margin: 5px 0;"><strong>Price:</strong> ₱${activityData.price}</p>
            <p style="color: #666; margin: 5px 0;">${activityData.description}</p>
          </div>
        `;
        actionButton = `
          <a href="http://localhost:5173/" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            View Product
          </a>
        `;
        break;

      case "PRICE_INCREASE":
        subject = `📈 Price Update from ${storeInfo.businessName}`;
        activityMessage = `
          <h2 style="color: #FF9800; margin-bottom: 20px;">Price Update Notification</h2>
          <p style="color: #666; line-height: 1.6;">
            <strong>${storeInfo.businessName}</strong> has updated the price for one of their products:
          </p>
          <div style="background-color: #fff8e1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #F57C00; margin: 0 0 10px 0;">${activityData.productName}</h3>
            <p style="color: #666; margin: 5px 0;">
              <strong>Previous Price:</strong> <span style="text-decoration: line-through;">₱${activityData.oldPrice}</span>
            </p>
            <p style="color: #666; margin: 5px 0;">
              <strong>New Price:</strong> <span style="color: #F57C00; font-weight: bold;">₱${activityData.newPrice}</span>
            </p>
          </div>
        `;
        actionButton = `
          <a href="http://localhost:5173/" style="background-color: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            View Product
          </a>
        `;
        break;

      case "PRICE_DECREASE":
        subject = `🎉 Great Deal from ${storeInfo.businessName}!`;
        activityMessage = `
          <h2 style="color: #4CAF50; margin-bottom: 20px;">Price Drop Alert!</h2>
          <p style="color: #666; line-height: 1.6;">
            Exciting news! <strong>${
              storeInfo.businessName
            }</strong> has reduced the price on one of their products:
          </p>
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2E7D32; margin: 0 0 10px 0;">${
              activityData.productName
            }</h3>
            <p style="color: #666; margin: 5px 0;">
              <strong>Previous Price:</strong> <span style="text-decoration: line-through;">₱${
                activityData.oldPrice
              }</span>
            </p>
            <p style="color: #666; margin: 5px 0;">
              <strong>New Price:</strong> <span style="color: #4CAF50; font-weight: bold;">₱${
                activityData.newPrice
              }</span>
            </p>
            <p style="color: #4CAF50; font-weight: bold; margin: 10px 0;">
              💰 You save ₱${(
                activityData.oldPrice - activityData.newPrice
              ).toFixed(2)}!
            </p>
          </div>
        `;
        actionButton = `
          <a href="http://localhost:5173/" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Get This Deal
          </a>
        `;
        break;

      case "PRODUCT_AVAILABLE":
        subject = `✅ Product Back in Stock at ${storeInfo.businessName}!`;
        activityMessage = `
          <h2 style="color: #4CAF50; margin-bottom: 20px;">Back in Stock!</h2>
          <p style="color: #666; line-height: 1.6;">
            Good news! The product you've been waiting for is now available again at <strong>${storeInfo.businessName}</strong>:
          </p>
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2E7D32; margin: 0 0 10px 0;">${activityData.productName}</h3>
            <p style="color: #666; margin: 5px 0;"><strong>Price:</strong> ₱${activityData.price}</p>
            <p style="color: #4CAF50; font-weight: bold; margin: 10px 0;">
              ✅ Available Now - Get it before it's gone again!
            </p>
          </div>
        `;
        actionButton = `
          <a href="http://localhost:5173/" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Order Now
          </a>
        `;
        break;

      case "NEW_BLOG_POST":
        subject = `📝 New Update from ${storeInfo.businessName}!`;
        activityMessage = `
          <h2 style="color: #2196F3; margin-bottom: 20px;">New Blog Post!</h2>
          <p style="color: #666; line-height: 1.6;">
            <strong>${storeInfo.businessName}</strong> has shared a new update:
          </p>
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1976D2; margin: 0 0 10px 0;">${
              activityData.title
            }</h3>
            <p style="color: #666; margin: 5px 0; font-style: italic;">${
              activityData.subtitle
            }</p>
            <p style="color: #666; margin: 10px 0;">${activityData.description.substring(
              0,
              200
            )}${activityData.description.length > 200 ? "..." : ""}</p>
            <p style="color: #2196F3; font-weight: bold; margin: 10px 0;">
              📂 Category: ${activityData.category}
            </p>
          </div>
        `;
        actionButton = `
          <a href="http://localhost:5173/" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Read Full Post
          </a>
        `;
        break;

      default:
        subject = `Update from ${storeInfo.businessName}`;
        activityMessage = `
          <h2 style="color: #666; margin-bottom: 20px;">Store Update</h2>
          <p style="color: #666; line-height: 1.6;">
            <strong>${storeInfo.businessName}</strong> has a new update for you.
          </p>
        `;
        break;
    }

    const mailOptions = {
      from: '"ELako.NV Notifications" <elakonv@gmail.com>',
      to: customerEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4CAF50;">ELako.NV</h1>
            <p style="color: #666;">Digital Marketing Solution For MSMEs</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #666; line-height: 1.6;">
              Hello <strong>${customerName}</strong>,
            </p>
            
            ${activityMessage}
            
            <div style="text-align: center; margin: 30px 0;">
              ${actionButton}
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #666; font-size: 14px; line-height: 1.4;">
                <strong>About ${storeInfo.businessName}:</strong><br>
                ${
                  storeInfo.businessDescription ||
                  "A trusted local business in your area."
                }
              </p>
              <p style="color: #999; font-size: 12px; margin-top: 15px;">
                You're receiving this email because you follow ${
                  storeInfo.businessName
                } on ELako.NV.
                <br>To unfollow this store, please log in to your account and manage your following list.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>&copy; 2025 ELako.NV. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Store activity email sent successfully to ${customerEmail}:`,
      result.messageId
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(
      `❌ Error sending store activity email to ${customerEmail}:`,
      error
    );
    return { success: false, error: error.message };
  }
};

// Send welcome email for new user registration
const sendWelcomeEmail = async (email, userName, userType) => {
  try {
    const websiteURL = process.env.WEBSITE_URL || "http://localhost:3000";

    const mailOptions = {
      from: '"ELako.NV Team" <elakonv@gmail.com>',
      to: email,
      subject: "Welcome to ELako.Nv — Your Account Has Been Created",
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #7ed957; font-family: 'Poppins', sans-serif; font-size: 2.2rem; margin-bottom: 10px;">ELako.Nv</h1>
            <p style="color: #313131; font-size: 1rem;">Digital Marketing Solution For MSMEs</p>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 25px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #7ed957 0%, #6bc544 100%); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px;">🎉</span>
              </div>
              <h2 style="color: #313131; font-family: 'Poppins', sans-serif; margin: 0; font-size: 1.5rem;">Welcome to ELako.Nv!</h2>
            </div>
            
            <p style="color: #313131; line-height: 1.6; font-family: 'Poppins', sans-serif; margin-bottom: 20px;">
              Hi <strong style="color: #7ed957;">${userName}</strong>,
            </p>
            
            <p style="color: #313131; line-height: 1.6; font-family: 'Poppins', sans-serif; margin-bottom: 20px;">
              Thank you for signing up on <strong>ELako.Nv</strong>!
            </p>
            
            <p style="color: #313131; line-height: 1.6; font-family: 'Poppins', sans-serif; margin-bottom: 20px;">
              Your ${
                userType === "customer" ? "customer" : "MSME business"
              } account has been successfully created using this email address: <strong style="color: #7ed957;">${email}</strong>
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #7ed957; margin: 25px 0;">
              <p style="color: #313131; line-height: 1.6; font-family: 'Poppins', sans-serif; margin: 0; font-size: 0.95rem;">
                By creating your account, you've agreed to our <strong>Terms and Agreement</strong> and <strong>Privacy Policy</strong>.
              </p>
            </div>
            
            <p style="color: #313131; line-height: 1.6; font-family: 'Poppins', sans-serif; margin-bottom: 25px;">
              You can access your account anytime at <a href="${websiteURL}" style="color: #7ed957; text-decoration: none; font-weight: 600;">${websiteURL}</a>
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173/" style="background: linear-gradient(135deg, #7ed957 0%, #6bc544 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-family: 'Poppins', sans-serif; box-shadow: 0 4px 12px rgba(126, 217, 87, 0.3); transition: all 0.3s ease;">
                Access Your Account
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #313131; line-height: 1.6; font-family: 'Poppins', sans-serif; margin-bottom: 15px; font-size: 0.9rem;">
                If you didn't create this account, please ignore this message or contact us immediately.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px;">
            <p style="color: #313131; font-family: 'Poppins', sans-serif; margin: 0 0 10px 0; font-weight: 600;">
              Warm regards,<br>
              <span style="color: #7ed957;">The ELako.Nv Team</span>
            </p>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
              <p style="color: #313131; font-family: 'Poppins', sans-serif; margin: 5px 0; font-size: 0.9rem;">
                📩 <a href="mailto:elakonv@gmail.com" style="color: #7ed957; text-decoration: none;">elakonv@gmail.com</a>
              </p>
              <p style="color: #313131; font-family: 'Poppins', sans-serif; margin: 5px 0; font-size: 0.9rem;">
                📍 Nueva Vizcaya, Philippines
              </p>
            </div>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px; font-family: 'Poppins', sans-serif; margin-top: 20px;">
            <p>&copy; 2025 ELako.Nv. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(
      `✅ Welcome email sent successfully to ${email} (${userType}):`,
      result.messageId
    );
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Error sending welcome email to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendStoreActivityEmail,
  sendWelcomeEmail,
};
