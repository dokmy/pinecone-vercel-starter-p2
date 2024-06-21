import { authMiddleware } from "@clerk/nextjs";
 

// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
export default authMiddleware({
  apiRoutes: ['/api/chat', '/api/search'],
  publicRoutes: ["/", "/api/webhook",
  "/api/dx/credits/add",     
  "/api/dx/credits/reset",
  "/api/dx/user/add",
  "/api/dx/credits/(.*)"  ]
});
 
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
 