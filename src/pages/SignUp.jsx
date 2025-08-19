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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus } from 'lucide-react';

const signUpSchema = z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  groupType: z.enum(["Class 9-10", "Class 11-12", "UnderGraduate Student", "PostGraduate"], {
    required_error: "Please select your group type.",
  }),
  stream: z.string().optional(),
  targetExam: z.string().optional(),
  college1: z.string().optional(),
  college2: z.string().optional(),
  college3: z.string().optional(),
  jobCountry: z.string().optional(),
  jobState: z.string().optional(),
  jobDistrict: z.string().optional(),
  studyCountry: z.string().optional(),
  studyState: z.string().optional(),
  studyDistrict: z.string().optional(),
});

const SignUp = () => {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuth();
  const [error, setError] = useState(null);
  
  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      groupType: "Class 11-12",
      stream: "",
      targetExam: "",
      college1: "",
      college2: "",
      college3: "",
      jobCountry: "",
      jobState: "",
      jobDistrict: "",
      studyCountry: "",
      studyState: "",
      studyDistrict: "",
    },
  });

  const onSubmit = async (values) => {
    setError(null);
    try {
      const preferences = {
        jobLocation: {
          country: values.jobCountry || undefined,
          state: values.jobState || undefined,
          district: values.jobDistrict || undefined,
        },
        studyLocation: {
          country: values.studyCountry || undefined,
          state: values.studyState || undefined,
          district: values.studyDistrict || undefined,
        },
        stream: values.stream || undefined,
        targetExam: values.targetExam || undefined,
        colleges: [values.college1, values.college2, values.college3]
          .map(v => (v || '').trim())
          .filter(Boolean)
          .slice(0,3),
      };
      await signup(values.username, values.email, values.password, values.groupType, preferences);
      toast.success("Account created successfully!");
      navigate("/profile");
    } catch (error) {
      if (error.message !== "secretOrPrivateKey must have a value") {
        setError(error.message || "Failed to create account. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-32 pb-20">
        <div className="container mx-auto px-6 md:px-8 max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
            <p className="text-foreground/70">Discover your perfect career path</p>
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
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

                <FormField
                  control={form.control}
                  name="groupType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Type</FormLabel>
                      <FormControl>
                        <select className="w-full border rounded-md h-10 px-3" {...field}>
                          <option>Class 9-10</option>
                          <option>Class 11-12</option>
                          <option>UnderGraduate Student</option>
                          <option>PostGraduate</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Academic Preferences */}
                <div>
                  <h3 className="text-sm font-semibold mb-2">Academic Preferences (optional)</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <FormField
                      control={form.control}
                      name="stream"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stream</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Science, Commerce, Arts" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="targetExam"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Exam</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., JEE, NEET, CUET" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {['college1','college2','college3'].map((name, idx) => (
                        <FormField key={name}
                          control={form.control}
                          name={name}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred College {idx+1}</FormLabel>
                              <FormControl>
                                <Input placeholder={`College ${idx+1}`} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Job Location (optional)</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <FormField
                      control={form.control}
                      name="jobCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., India" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="jobState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Karnataka" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="jobDistrict"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>District</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Bengaluru Urban" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Study Location (optional)</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <FormField
                      control={form.control}
                      name="studyCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., India or USA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="studyState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Maharashtra" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="studyDistrict"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>District</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Pune" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full py-6" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center">
                      <span className="w-4 h-4 border-t-2 border-white rounded-full animate-spin mr-2"></span>
                      Creating Account...
                    </span>
                  ) : (
                    <>
                      <UserPlus className="mr-2" size={18} />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6 text-center text-sm">
              <p className="text-foreground/70">
                Already have an account? <Link to="/signin" className="text-primary font-medium hover:underline">Sign in</Link>
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

export default SignUp;
