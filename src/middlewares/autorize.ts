import { HttpStatus,response } from "@/utils";

export function authorize(role: string) {
    return (req: any, res: any, next: any) => {
        console.log("autorization")
        next()
        // if (req.user.role === role) {
        //     // User has the required role, proceed with the request
        //     next();
        // } else {
        //     // User does not have the required role, return an error
        //     response(HttpStatus.FORBIDDEN,res)
        // }
    };
}