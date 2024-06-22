import axios from 'axios';
import apiUrl from "../../utils/apiUtils/apiUrl";

export async function SignUpAction(signupPayload) {
  console.log("GETS HERE ????", signupPayload)
  const signUpUrl = `${apiUrl.SIGN_UP}`;

  try {
    const config = await authHeaders();

    return axios.post(signUpUrl, signupPayload, config).then((res) => {
      if (res.data && res.status === 201) {
        console.log("THE RESPONSE IS !!!!!!!", res);
      }
      return res;
    });
  } catch (error) {
    if (error.response) {
      return {
        errors: {
          _error: "Sign Up Failed.",
        },
      };
    }
    return {
      errors: {
        _error: "Network error. Please try again.",
      },
    };
  }
}

export async function SignInAction(formValues) {
  const SignInUrl = `${apiUrl.SIGN_IN}`;

  try {
    const config = await authHeaders();

    return axios.post(SignInUrl, formValues.signinPayload).then((res) => {
      if (res.data && res.status === 200) {
        console.log("THE RESPONSE IS !!!!!!!", res);
      }
      return res;
    });
  } catch (error) {
    if (error.response) {
      return {
        errors: {
          _error: "Sign In Failed.",
        },
      };
    }
    return {
      errors: {
        _error: "Network error. Please try again.",
      },
    };
  }
}
