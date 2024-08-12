export default {
    GET_ACCOUNTS: `${process.env.NEXT_PUBLIC_BASE_URL}/api/v2/organization`,
    GET_CONTACTS: `${process.env.NEXT_PUBLIC_BASE_URL}/api/v2/organization`,
    GET_BALANCE: `${process.env.NEXT_PUBLIC_BASE_URL}/api/v2`,
    SIGN_UP: `${process.env.NEXT_PUBLIC_BASE_URL}/public/register`,
    SIGN_IN: `${process.env.NEXT_PUBLIC_BASE_URL}/public/login`,
    VERIFY_EMAIL: `${process.env.NEXT_PUBLIC_BASE_URL}/public/verify/email`,
    USERS: `${process.env.NEXT_PUBLIC_BASE_URL}/api/v2/organization`,
    APPROVE_UNITS: `${process.env.NEXT_PUBLIC_BASE_URL}/api/v2/admin/recharge`,
    resetPassword: `${process.env.NEXT_PUBLIC_BASE_URL}/public/passwordreset`,
    confirmPasswordReset: `${process.env.NEXT_PUBLIC_BASE_URL}/public/reset/otp`,
    getNotifiations: `${process.env.NEXT_PUBLIC_BASE_URL}/api/v2/organization`,
};