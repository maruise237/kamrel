import { StackClientApp } from "@stackframe/stack"

export const stackApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  urls: {
    home: "/dashboard",
    signIn: "/login",
    signUp: "/signup",
  },
})
