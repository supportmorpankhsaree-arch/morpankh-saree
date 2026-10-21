# Welcome to your Lovable project

TODO: Document your project here

## Admin email OTP configuration

Admin sign-in sends a six-digit OTP to `ADMIN_EMAIL` after the email and password are validated. The OTP is stored hashed in MongoDB and the browser receives a short-lived, encrypted HTTP-only challenge cookie, so verification can still succeed if deployed login and verification instances see different OTP records. Configure the following server-side environment variables in local development and in the deployment environment:

```env
ADMIN_SESSION_SECRET=generate-a-random-secret-at-least-32-characters-long
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USE_SSL=true
EMAIL_HOST_USER=your-sending-email@gmail.com
EMAIL_HOST_PASSWORD=your-email-app-password
```

For Gmail, use a Google App Password rather than the account password. Keep SMTP credentials and the session secret out of source control and browser code. Restart the app after changing local environment variables. Admin API requests require the HTTP-only session cookie issued after successful OTP verification.



<!-- 
, and make sure it should be fully animated , zoom in zoom out , movalbe elements , box shadaow , card shadow -->

## Sfix this issue 


## mmmb uria uith rjrb


<!-- Testing -->


<!-- testing  -->