import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/app/(backend)/lib/db";
import { verifyPassword } from "@/app/(backend)/lib/auth";

const handler = NextAuth({
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        // Find user by username and include related lecturer data
        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username,
          },
          include: {
            lecturer: true, // Include related lecturer data
          },
        });

        if (!user) {
          throw new Error("User tidak ditemukan!");
        }

        const isValid = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Password anda salah!");
        }

        const currentUser = {
          id: user.id,
          username: user.username,
          role: user.role,
          lecturer: user.lecturer, // Include lecturer information
        };

        return currentUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Add user information to the token
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.lecturer = user.lecturer;
      }
      return token;
    },
    async session({ session, token }) {
      // Transfer token data to the session
      session.user = {
        id: token.id,
        username: token.username,
        role: token.role,
        lecturer: token.lecturer
      };
      return session;
    },
  }
  
});

export { handler as GET, handler as POST };

// import NextAuth from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import prisma from "@/app/(backend)/lib/db";
// import { verifyPassword } from "@/app/(backend)/lib/auth";

// const handler = NextAuth({
//   session: {
//     strategy: "jwt",
//   },
//   providers: [
//     CredentialsProvider({
//       async authorize(credentials) {
//         try {
//           const user = await prisma.user.findUnique({
//             where: {
//               username: credentials.username,
//             },
//             select: {
//               id: true,
//               username: true,
//               password: true,
//               role: true,
//               lecturer: {
//                 select: {
//                   id: true,
//                   // name: true,
//                   // email: true,
//                 }
//               }
//             },
//           });

//           if (!user) {
//             throw new Error("User tidak ditemukan!");
//           }

//           const isValid = await verifyPassword(
//             credentials.password,
//             user.password
//           );

//           if (!isValid) {
//             throw new Error("Password anda salah!");
//           }

//           const { password, ...currentUser } = user;

//           return currentUser;
//         } catch (error) {
//           console.error("Auth Error:", error);
//           throw new Error(error.message || "Terjadi kesalahan saat autentikasi");
//         }
//       },
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id || token.id;
//         token.username = user.username || token.username;
//         token.role = user.role || token.role;
//         token.lecturer = user.lecturer || token.lecturer;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       session.user = {
//         id: token.id,
//         username: token.username,
//         role: token.role,
//         lecturer: token.lecturer
//       };
//       return session;
//     },
//   },
//   pages: {
//     signIn: '/', 
//     error: '/', 
//   },
// });

// export { handler as GET, handler as POST };