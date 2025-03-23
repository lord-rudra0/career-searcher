import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from '../context/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LogIn } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

const SignIn = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [error, setError] = useState(null);
  
  const form = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    setError(null);
    try {
      await login(values.email, values.password);
      toast.success("Signed in successfully!");
      navigate("/profile");
    } catch (error) {
      setError(error.message || "Failed to sign in. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6 md:px-8 max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-foreground/70">Sign in to continue your career journey</p>
          </div>
          
          <div className="bg-card rounded-xl shadow-lg p-8 animate-scale-in">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full py-6" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center">
                      <span className="w-4 h-4 border-t-2 border-white rounded-full animate-spin mr-2"></span>
                      Signing In...
                    </span>
                  ) : (
                    <>
                      <LogIn className="mr-2" size={18} />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center text-sm">
              <p className="text-foreground/70">
                Don't have an account? <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="py-8 bg-secondary/80">
        <div className="container px-6 md:px-8 mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-xl font-semibold text-foreground mb-4 md:mb-0">
              career<span className="text-primary">glimpse</span>
            </div>
            <div className="text-sm text-foreground/60">
              © {new Date().getFullYear()} CareerGlimpse. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SignIn;
