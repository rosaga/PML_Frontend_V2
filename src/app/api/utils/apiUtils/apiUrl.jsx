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
    SMS_URL: `${process.env.NEXT_PUBLIC_ZOHARI_URL}/api/v1`,
    peakSMSAPP: `https://messaging-peak-1048592730476.europe-west4.run.app/api/v1/application`,
    peakSMS: `https://messaging-peak-1048592730476.europe-west4.run.app/api/v1`,

    LIST_APP_SERVICES: `${process.env.NEXT_PUBLIC_ZOHARI_URL}/api/v1/application`,
    SEND_SMS: `${process.env.NEXT_PUBLIC_ZOHARI_URL}/api/v1/message`,
    LIST_MESSAGES: `${process.env.NEXT_PUBLIC_ZOHARI_URL}/api/v1/message`,
    MESSAGE_COUNTS: `${process.env.NEXT_PUBLIC_ZOHARI_URL}/api/v1`,
    BROADCAST_MESSAGE: `${process.env.NEXT_PUBLIC_ZOHARI_URL}/api/v1/message`,
    APPROVE_SMS_UNITS: `${process.env.NEXT_PUBLIC_ZOHARI_URL}/api/v1/admin/recharge/approve`,
};