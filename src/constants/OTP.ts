const driverLoginLink = "http://localhost:5173/driver/login" 
export const html = (otp: string) => {
  return `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fafafa; padding: 30px; max-width: 600px; margin: 0 auto; border-radius: 8px; border: 1px solid #e0e0e0;">
  <div style="background-color: #2c3e50; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
    <h2 style="color: #ffffff; margin: 0; font-size: 24px;">Your OTP Code</h2>
  </div>
  <div style="padding: 30px; background-color: #ffffff; border-radius: 0 0 8px 8px; text-align: center;">
    <p style="font-size: 16px; color: #333333; margin-bottom: 15px;">Hello,</p>
    <p style="font-size: 16px; color: #333333; margin-bottom: 30px;">You requested an OTP for your NexaRide account. Your OTP is:</p>
    <h3 style="font-size: 36px; font-weight: 600; color: #2c3e50; margin-bottom: 20px;">${otp}</h3>
    <p style="font-size: 14px; color: #999999;">This OTP will expire in 1 minutes. Please enter it promptly to complete your registration.</p>
    <p style="font-size: 14px; color: #999999; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
  </div>
  <div style="background-color: #f8f8f8; text-align: center; padding: 10px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 12px; color: #888888;">© ${new Date().getFullYear()} NexaRide. All Rights Reserved.</p>
  </div>
</div>
`
}

export const resetLinkBtn = (resetLink: string) => {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #4A4A4A; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #E0E0E0; border-radius: 8px; background-color: #FAFAFA;">
  <h2 style="color: #4A90E2; text-align: center; font-size: 24px; font-weight: 600; margin-bottom: 20px;">Password Reset Request</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px;">
    We received a request to reset your password. To proceed, please click the button below. 
    Please note, the link will expire in 1 hour.
  </p>
  
  <div style="text-align: center; margin: 20px 0;">
    <a href="${resetLink}" 
       style="background-color: #4A90E2; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500; display: inline-block; transition: background-color 0.3s ease;">
      Reset Password
    </a>
  </div>

  <p style="font-size: 14px; color: #777; text-align: center; margin-top: 20px;">
    If you did not request this, please ignore this email or contact our support team.
  </p>

  <hr style="border: 0; border-top: 1px solid #E0E0E0; margin: 30px 0;">
  
  <p style="font-size: 12px; color: #B0B0B0; text-align: center; margin-bottom: 0;">
    This is an automated message. Please do not reply to this email.
  </p>
</div>

  `;
};

export const driverApprovalEmail = (driverName: string) => {
  return `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px; max-width: 600px; margin: 0 auto; border-radius: 8px; border: 1px solid #ddd;">
    <div style="background-color: #2c3e50; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
      <h2 style="color: #ffffff; margin: 0; font-size: 22px;">Driver Approval Confirmation</h2>
    </div>
    <div style="padding: 30px; background-color: #ffffff; border-radius: 0 0 8px 8px; text-align: center;">
      <p style="font-size: 16px; color: #333333; margin-bottom: 15px;">Hello ${driverName},</p>
      <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">Congratulations! Your driver information has been successfully approved.</p>
      <p style="font-size: 14px; color: #555555;">You can now start accepting  requests and providing services on NexaRide.</p>
     <p style="font-size: 9px; color: rgb(74, 73, 73);">If your vehicle information is not verified yet, please wait for the approval process to complete.</p>
      <p style="font-size: 14px; color: #555555; margin-bottom: 20px;">To get started, log in to your account and explore the available features.</p>
      <a href=${driverLoginLink} style="background-color: #2c3e50; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 5px; display: inline-block; font-size: 16px;">Login to Your Account</a>
      <p style="font-size: 14px; color: #999999; margin-top: 20px;">If you have any questions, feel free to contact our support team.</p>
    </div>
    <div style="background-color: #f8f8f8; text-align: center; padding: 10px; border-radius: 0 0 8px 8px;">
      <p style="font-size: 12px; color: #888888;">© ${new Date().getFullYear()} NexaRide. All Rights Reserved.</p>
    </div>
  </div>`;
};

export const vehicleApprovalEmail = (driverName: string) => {
  return `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px; max-width: 600px; margin: 0 auto; border-radius: 8px; border: 1px solid #ddd;">
    <div style="background-color: #2c3e50; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
      <h2 style="color: #ffffff; margin: 0; font-size: 22px;">Vehicle Approved</h2>
    </div>
    <div style="padding: 30px; background-color: #ffffff; border-radius: 0 0 8px 8px; text-align: center;">
      <p style="font-size: 16px; color: #333333; margin-bottom: 15px;">Hello ${driverName},</p>
      <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">Your vehicle has been successfully approved! You are now ready to start accepting ride requests and earning with NexaRide.</p>
     <p style="font-size: 9px; color: rgb(74, 73, 73);">If your User information is not verified yet, please wait for the approval process to complete.</p>
      <p style="font-size: 14px; color: #555555;">Log in to your account and go online to begin receiving ride requests.</p>
      <a href=${driverLoginLink} style="background-color: #28a745; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 5px; display: inline-block; font-size: 16px;">Start Driving</a>
      <p style="font-size: 14px; color: #999999; margin-top: 20px;">Drive safe and happy earning!</p>
    </div>
    <div style="background-color: #f8f8f8; text-align: center; padding: 10px; border-radius: 0 0 8px 8px;">
      <p style="font-size: 12px; color: #888888;">© ${new Date().getFullYear()} NexaRide. All Rights Reserved.</p>
    </div>
  </div>`;
};


export const rejectionEmail = (driverName: string, reason: string,type:string) => {
  return `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px; max-width: 600px; margin: 0 auto; border-radius: 8px; border: 1px solid #ddd;">
    <div style="background-color: #d9534f; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
      <h2 style="color: #ffffff; margin: 0; font-size: 22px;">Submission Rejected</h2>
    </div>
    <div style="padding: 30px; background-color: #ffffff; border-radius: 0 0 8px 8px; text-align: center;">
      <p style="font-size: 16px; color: #333333; margin-bottom: 15px;">Hello ${driverName},</p>
      <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">We regret to inform you that your recent submission of ${type} info has been rejected due to the following reason:</p>
      <p style="font-size: 16px; font-weight: 600; color: #d9534f; margin-bottom: 20px;">"${reason}"</p>
      <p style="font-size: 14px; color: #555555; margin-bottom: 20px;">Please review the issue and resubmit your details with the necessary corrections.</p>
      <a href=${driverLoginLink} style="background-color: #2c3e50; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 5px; display: inline-block; font-size: 16px;">Login to reapply</a>
      <p style="font-size: 14px; color: #999999; margin-top: 20px;">If you need further assistance, please contact our support team.</p>
    </div>
    <div style="background-color: #f8f8f8; text-align: center; padding: 10px; border-radius: 0 0 8px 8px;">
      <p style="font-size: 12px; color: #888888;">© ${new Date().getFullYear()} NexaRide. All Rights Reserved.</p>
    </div>
  </div>`;
};
