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
    peakSMSAPP: `https://peaksms.niceforest-c0138cbe.westeurope.azurecontainerapps.io/api/v1/application`,
    peakSMS: `https://peaksms.niceforest-c0138cbe.westeurope.azurecontainerapps.io/api/v1`,

    LIST_APP_SERVICES: `${process.env.NEXT_PUBLIC_ZOHARI_URL}/api/v1/application`,
    SEND_SMS: `${process.env.NEXT_PUBLIC_ZOHARI_URL}/api/v1/message`,
    LIST_MESSAGES: `${process.env.NEXT_PUBLIC_ZOHARI_URL}/api/v1/message`,
};