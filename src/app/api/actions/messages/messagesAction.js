import axios from 'axios';
import apiUrl from "../../utils/apiUtils/apiUrl";
import { authHeaders } from '../../../api/utils/headers/headers';

export async function messagesAction(formValues) {
    const messagesUrl = `${apiUrl.LIST_MESSAGES}/${formValues.org_id}/list?page=${formValues.page}&size=10000`;
    try {
        const config = await authHeaders();
  
        return axios
            .get(messagesUrl, config)
            .then((res) => {
                console.log("THE RESPONSE IS !!!!!!!", res);
                return res;
            })
            .catch((error) => {
                if (error.response) {
                    console.log("Error response data:", error.response.data);
                    console.log("Error response status:", error.response.status);
                    return error.response;
                }
                return {
                    errors: {
                        _error: "Network error. Please try again.",
                    },
                };
            });
    } catch (error) {
        console.error("Error:", error);
        return {
            errors: {
                _error: "An error occurred. Please try again.",
            },
        };
    }
}

export async function messageCountsAction(formValues) {
    try {
        const config = await authHeaders();
        
        let messageCountsUrl = `${apiUrl.MESSAGE_COUNTS}/sms/count/${formValues.org_id}`;
        const params = new URLSearchParams();
        
        if (formValues.selectedYear) {
            params.append('year', formValues.selectedYear);
        }
        
        if (formValues.selectedMonth) {
            params.append('month', formValues.selectedMonth);
        }
        
        if (formValues.selectedDay) {
            params.append('day', formValues.selectedDay);
        }
        
        const paramString = params.toString();
        if (paramString) {
            messageCountsUrl += `?${paramString}`;
        }
        
        console.log("API URL:", messageCountsUrl);
        console.log("Filter params received:", formValues);
        console.log("URLSearchParams:", params.toString());
        
        return axios
            .get(messageCountsUrl, config)
            .then((res) => {
                console.log("Message counts response:", res);
                
                if (!res.data || res.data.TotalMessageCount === null || res.data.TotalMessageCount === undefined) {
                    return {
                        data: {
                            TotalMessageCount: 0,
                            StatusCounts: []
                        }
                    };
                }
                
                return res;
            })
            .catch((error) => {
                if (error.response) {
                    console.log("Error response data:", error.response.data);
                    console.log("Error response status:", error.response.status);
                    
                    if (error.response.status === 404 || 
                        (error.response.data && error.response.data.message && 
                         error.response.data.message.includes('No data found'))) {
                        return {
                            data: {
                                TotalMessageCount: 0,
                                StatusCounts: []
                            }
                        };
                    }
                    
                    return error.response;
                }
                return {
                    errors: {
                        _error: "Network error. Please try again.",
                    },
                };
            });
    } catch (error) {
        console.error("Error:", error);
        return {
            errors: {
                _error: "An error occurred. Please try again.",
            },
        };
    }
}

export async function messageBalanceAction(formValues) {
    const messageBalanceUrl = `${apiUrl.MESSAGE_COUNTS}/application/${formValues.org_id}/balance`;
    try {
        const config = await authHeaders();

        return axios
            .get(messageBalanceUrl, config)
            .then((res) => {
                return res;
            })
            .catch((error) => {
                if (error.response) {
                    console.log("Error response data:", error.response.data);
                    return error.response;
                }
                return {
                    errors: {
                        _error: "Network error. Please try again.",
                    },
                };
            });
    } catch (error) {
        console.error("Error:", error);
        return {
            errors: {
                _error: "An error occurred. Please try again.",
            },
        };
    }
}

export async function broadcastMessages(formValues) {
    const broadcastUrl = `${apiUrl.BROADCAST_MESSAGE_TEST}/${formValues.selectedSenderId}/broadcast/send`;
    try {
        const config = await authHeaders();
  
        return axios
            .post(broadcastUrl, formValues.newSms, config)
            .then((res) => {
                console.log("THE RESPONSE IS !!!!!!!", res);
                return res;
            })
            .catch((error) => {
                if (error.response) {
                    console.log("Error response data:", error.response.data);
                    console.log("Error response status:", error.response.status);
                    return error.response;
                }
                return {
                    errors: {
                        _error: "Network error. Please try again.",
                    },
                };
            });
    } catch (error) {
        console.error("Error:", error);
        return {
            errors: {
                _error: "An error occurred. Please try again.",
            },
        };
    }
}

export async function sendSms(formValues) {
    const sendSms = `${apiUrl.SEND_SMS_TEST}/${formValues.selectedSenderId}/user/send`;
    try {
        const config = await authHeaders();
  
        return axios
            .post(sendSms, formValues.newSms, config)
            .then((res) => {
                console.log("THE RESPONSE IS !!!!!!!", res);
                return res;
            })
            .catch((error) => {
                if (error.response) {
                    console.log("Error response data:", error.response.data);
                    console.log("Error response status:", error.response.status);
                    return error.response;
                }
                return {
                    errors: {
                        _error: "Network error. Please try again.",
                    },
                };
            });
    } catch (error) {
        console.error("Error:", error);
        return {
            errors: {
                _error: "An error occurred. Please try again.",
            },
        };
    }
}

export async function bulkSendMessages(formValues) {
    const bulkSendUrl = apiUrl.BULK_SEND_DLRS;
    try {
        const config = await authHeaders();
  
        return axios
            .get(bulkSendUrl, config, formValues)
            .then((res) => {
                console.log("THE RESPONSE IS !!!!!!!", res);
                return res;
            })
            .catch((error) => {
                if (error.response) {
                    console.log("Error response data:", error.response.data);
                    console.log("Error response status:", error.response.status);
                    return error.response;
                }
                return {
                    errors: {
                        _error: "Network error. Please try again.",
                    },
                };
            });
    } catch (error) {
        console.error("Error:", error);
        return {
            errors: {
                _error: "An error occurred. Please try again.",
            },
        };
    }
}