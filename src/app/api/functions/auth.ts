import api from "../http-service";

interface UserLogin {
    email: string;
    password: string;
}

interface UserSignup {
    id: number;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

// Login Function
export const Login = (userLogin: UserLogin) => api.post<UserSignup>(`/auth/login`, userLogin);

// Create New User
export const SignUp = (userSignUp: UserSignup) => api.post<UserSignup>(`/auth/sign-up`, userSignUp);
