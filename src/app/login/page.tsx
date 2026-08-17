import { LoginClient } from './login-client';

export default function LoginPage() {
    const googleSsoEnabled = Boolean(
        process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
    );
    return <LoginClient googleSsoEnabled={googleSsoEnabled} />;
}
