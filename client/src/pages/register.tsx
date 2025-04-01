import { Link } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";

export default function Register() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animated-bg">
        <motion.div
          className="w-full max-w-md"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <Card className="backdrop-blur-sm bg-card/80 border border-primary/20 shadow-xl">
            <CardHeader className="space-y-2">
              <motion.div 
                className="flex justify-center mb-2"
                variants={itemVariants}
              >
                <div className="p-3 rounded-full bg-primary/20 backdrop-blur-md">
                  <UserPlus className="h-8 w-8 text-primary" />
                </div>
              </motion.div>
              <motion.div variants={itemVariants}>
                <CardTitle className="text-2xl font-bold text-center text-gradient">Create an account</CardTitle>
              </motion.div>
              <motion.div variants={itemVariants}>
                <CardDescription className="text-center">
                  Sign up to start sharing your musical performances
                </CardDescription>
              </motion.div>
            </CardHeader>
            <motion.div variants={itemVariants}>
              <CardContent>
                <RegisterForm />
              </CardContent>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardFooter className="flex justify-center">
                <div className="text-sm text-gray-400">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:text-primary/80 font-medium cursor-pointer transition-colors">
                    Log in
                  </Link>
                </div>
              </CardFooter>
            </motion.div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
