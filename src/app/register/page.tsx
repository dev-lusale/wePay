"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, ArrowLeft, ArrowRight, Check, User, Briefcase, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WePayLogo } from "@/components/layout/Navbar";

// Step schemas
const step1Schema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  nrcNumber: z.string().min(6, "Please enter a valid NRC number"),
});

const step2Schema = z.object({
  employerName: z.string().min(2, "Employer name is required"),
  napsaNumber: z.string().min(6, "Please enter a valid NAPSA number"),
  monthlySalary: z.number().min(1000, "Monthly salary must be at least ZMW 1,000"),
});

const step3Schema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

const steps = [
  { number: 1, label: "Personal Info", icon: User },
  { number: 2, label: "Employment", icon: Briefcase },
  { number: 3, label: "Security", icon: Lock },
];

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Collected data across steps
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  const handleStep1 = (data: Step1Data) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const handleStep2 = (data: Step2Data) => {
    setStep2Data(data);
    setCurrentStep(3);
  };

  const handleStep3 = async (data: Step3Data) => {
    if (!step1Data || !step2Data) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...step1Data,
          ...step2Data,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Registration failed. Please try again.");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-green-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-[#1a1f36] mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to home
        </Link>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link href="/">
              <WePayLogo size="lg" />
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-[#1a1f36]">Create your account</h1>
            <p className="text-gray-500 text-sm mt-1">
              Join thousands of Zambians using WePay
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.number;
              const isActive = currentStep === step.number;
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-[#1a1f36] text-white"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={18} />
                      ) : (
                        <Icon size={16} />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-1 font-medium ${
                        isActive ? "text-[#1a1f36]" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mb-4 transition-colors duration-300 ${
                        currentStep > step.number ? "bg-green-400" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <form onSubmit={form1.handleSubmit(handleStep1)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[#1a1f36] font-medium text-sm">First Name</Label>
                  <Input
                    placeholder="John"
                    className="h-11 rounded-xl border-gray-200"
                    {...form1.register("firstName")}
                  />
                  {form1.formState.errors.firstName && (
                    <p className="text-red-500 text-xs">{form1.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#1a1f36] font-medium text-sm">Last Name</Label>
                  <Input
                    placeholder="Banda"
                    className="h-11 rounded-xl border-gray-200"
                    {...form1.register("lastName")}
                  />
                  {form1.formState.errors.lastName && (
                    <p className="text-red-500 text-xs">{form1.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#1a1f36] font-medium text-sm">Email Address</Label>
                <Input
                  type="email"
                  placeholder="john.banda@example.com"
                  className="h-11 rounded-xl border-gray-200"
                  {...form1.register("email")}
                />
                {form1.formState.errors.email && (
                  <p className="text-red-500 text-xs">{form1.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#1a1f36] font-medium text-sm">Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="+260 97 000 0000"
                  className="h-11 rounded-xl border-gray-200"
                  {...form1.register("phone")}
                />
                {form1.formState.errors.phone && (
                  <p className="text-red-500 text-xs">{form1.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#1a1f36] font-medium text-sm">NRC Number</Label>
                <Input
                  placeholder="123456/78/9"
                  className="h-11 rounded-xl border-gray-200"
                  {...form1.register("nrcNumber")}
                />
                {form1.formState.errors.nrcNumber && (
                  <p className="text-red-500 text-xs">{form1.formState.errors.nrcNumber.message}</p>
                )}
              </div>

              <Button type="submit" variant="navy" size="xl" className="w-full rounded-xl mt-2">
                Continue
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </form>
          )}

          {/* Step 2: Employment Info */}
          {currentStep === 2 && (
            <form onSubmit={form2.handleSubmit(handleStep2)} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[#1a1f36] font-medium text-sm">Employer Name</Label>
                <Input
                  placeholder="Ministry of Health"
                  className="h-11 rounded-xl border-gray-200"
                  {...form2.register("employerName")}
                />
                {form2.formState.errors.employerName && (
                  <p className="text-red-500 text-xs">{form2.formState.errors.employerName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#1a1f36] font-medium text-sm">NAPSA Number</Label>
                <Input
                  placeholder="1000000000"
                  className="h-11 rounded-xl border-gray-200"
                  {...form2.register("napsaNumber")}
                />
                {form2.formState.errors.napsaNumber && (
                  <p className="text-red-500 text-xs">{form2.formState.errors.napsaNumber.message}</p>
                )}
                <p className="text-xs text-gray-400">
                  Your NAPSA number is used to verify your employment status
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#1a1f36] font-medium text-sm">Monthly Salary (ZMW)</Label>
                <Input
                  type="number"
                  placeholder="5000"
                  className="h-11 rounded-xl border-gray-200"
                  {...form2.register("monthlySalary", { valueAsNumber: true })}
                />
                {form2.formState.errors.monthlySalary && (
                  <p className="text-red-500 text-xs">{form2.formState.errors.monthlySalary.message}</p>
                )}
                <p className="text-xs text-gray-400">
                  Your gross monthly salary before deductions
                </p>
              </div>

              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xl"
                  className="flex-1 rounded-xl"
                  onClick={() => setCurrentStep(1)}
                >
                  <ArrowLeft size={18} className="mr-2" />
                  Back
                </Button>
                <Button type="submit" variant="navy" size="xl" className="flex-1 rounded-xl">
                  Continue
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Password */}
          {currentStep === 3 && (
            <form onSubmit={form3.handleSubmit(handleStep3)} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[#1a1f36] font-medium text-sm">Create Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    className="h-11 rounded-xl border-gray-200 pr-12"
                    {...form3.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {form3.formState.errors.password && (
                  <p className="text-red-500 text-xs">{form3.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#1a1f36] font-medium text-sm">Confirm Password</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                    className="h-11 rounded-xl border-gray-200 pr-12"
                    {...form3.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {form3.formState.errors.confirmPassword && (
                  <p className="text-red-500 text-xs">{form3.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-[#1a1f36] focus:ring-[#1a1f36]"
                  {...form3.register("agreeToTerms")}
                />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                  I agree to WePay&apos;s{" "}
                  <a href="#" className="text-blue-600 hover:underline font-medium">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-blue-600 hover:underline font-medium">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {form3.formState.errors.agreeToTerms && (
                <p className="text-red-500 text-xs">{form3.formState.errors.agreeToTerms.message}</p>
              )}

              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xl"
                  className="flex-1 rounded-xl"
                  onClick={() => setCurrentStep(2)}
                >
                  <ArrowLeft size={18} className="mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="navy"
                  size="xl"
                  className="flex-1 rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Login link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#1a1f36] hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
