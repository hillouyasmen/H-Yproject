# Password Reset Functionality Guide

This guide explains how to set up and use the password reset functionality in the H&Y Moda e-commerce application.

## Backend Setup

1. **Environment Variables**
   - Copy `.env.example` to `.env` and update the following variables:
     ```
     # Email Configuration (for password reset)
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_SECURE=false
     SMTP_USER=your_email@gmail.com
     SMTP_PASSWORD=your_email_app_password
     EMAIL_FROM=noreply@hymoda.com
     CLIENT_URL=http://localhost:3000
     ```
   - For Gmail, you'll need to generate an "App Password" if you have 2FA enabled.

2. **Database Migration**
   - The password reset functionality requires additional fields in the users table.
   - Run the migration script:
     ```bash
     node run-migration.js
     ```
   - This will add `reset_token` and `reset_token_expiry` columns to the users table.

3. **Dependencies**
   - Ensure all dependencies are installed:
     ```bash
     npm install
     ```
   - The password reset requires `nodemailer` which is already included in package.json.

## Frontend Setup

1. **Routes**
   - The following routes are available:
     - `/forgot-password` - Request a password reset link
     - `/reset-password/:token` - Reset password using a valid token

2. **Environment Variables**
   - Ensure your frontend is configured to connect to the backend API:
     ```
     REACT_APP_API_URL=http://localhost:5000/api
     ```

## Testing the Password Reset Flow

1. **Request Password Reset**
   - Go to the login page and click "Forgot your password?"
   - Enter your email address and submit the form
   - Check your email for the password reset link

2. **Reset Password**
   - Click the password reset link in your email
   - Enter your new password and confirm it
   - Submit the form to update your password
   - You will be redirected to the login page to sign in with your new password

## Troubleshooting

1. **Emails Not Sending**
   - Check your SMTP configuration in the `.env` file
   - Verify that your email service allows SMTP access
   - Check the server logs for any error messages

2. **Invalid or Expired Token**
   - Password reset tokens expire after 1 hour
   - Request a new password reset if the token has expired

3. **Database Issues**
   - Ensure the migration script ran successfully
   - Verify that the `users` table has the required columns:
     - `reset_token` (VARCHAR)
     - `reset_token_expiry` (DATETIME)

## Security Considerations

1. **Token Security**
   - Tokens are hashed before being stored in the database
   - Tokens expire after 1 hour
   - Used tokens are immediately invalidated

2. **Rate Limiting**
   - Consider implementing rate limiting on the password reset endpoints to prevent abuse

3. **Email Security**
   - Use a dedicated email service for production
   - Never commit email credentials to version control
   - Use environment variables for all sensitive information
