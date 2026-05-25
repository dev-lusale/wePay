import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  User,
  Briefcase,
  Shield,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Phone,
  Mail,
  Hash,
  Building2,
  DollarSign,
} from "lucide-react";

const verificationBadge = {
  PENDING: { label: "Pending Verification", variant: "warning" as const, icon: Clock },
  VERIFIED: { label: "Verified", variant: "success" as const, icon: CheckCircle2 },
  FAILED: { label: "Verification Failed", variant: "destructive" as const, icon: XCircle },
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      employmentProfile: true,
      creditProfile: true,
    },
  });

  if (!user) redirect("/login");

  const empStatus = user.employmentProfile?.verificationStatus ?? "PENDING";
  const empBadge = verificationBadge[empStatus];
  const EmpIcon = empBadge.icon;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#1a1f36]">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your personal and employment information
        </p>
      </div>

      {/* Profile Avatar Card */}
      <div className="bg-gradient-to-br from-[#1a1f36] to-[#2d3561] rounded-3xl p-6 text-white flex items-center space-x-5">
        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-3xl font-black">
            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
          </span>
        </div>
        <div>
          <h2 className="text-2xl font-black">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-white/70 text-sm">{user.email}</p>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="info" className="text-xs">
              {user.role}
            </Badge>
            <span className="text-white/50 text-xs">
              Member since {formatDate(user.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center space-x-2 mb-5">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <User size={16} className="text-blue-600" />
          </div>
          <h3 className="font-bold text-[#1a1f36]">Personal Information</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: User, label: "First Name", value: user.firstName },
            { icon: User, label: "Last Name", value: user.lastName },
            { icon: Mail, label: "Email Address", value: user.email },
            { icon: Phone, label: "Phone Number", value: user.phone },
            { icon: Hash, label: "NRC Number", value: user.nrcNumber },
            { icon: Clock, label: "Member Since", value: formatDate(user.createdAt) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-1">
                <Icon size={14} className="text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">{label}</p>
              </div>
              <p className="font-semibold text-[#1a1f36] text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Employment Information */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Briefcase size={16} className="text-green-600" />
            </div>
            <h3 className="font-bold text-[#1a1f36]">Employment Details</h3>
          </div>
          {user.employmentProfile && (
            <Badge variant={empBadge.variant}>
              <EmpIcon size={12} className="mr-1" />
              {empBadge.label}
            </Badge>
          )}
        </div>

        {user.employmentProfile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Building2, label: "Employer", value: user.employmentProfile.employerName },
              { icon: Hash, label: "NAPSA Number", value: user.employmentProfile.napsaNumber },
              {
                icon: DollarSign,
                label: "Monthly Salary",
                value: formatCurrency(Number(user.employmentProfile.monthlySalary)),
              },
              {
                icon: DollarSign,
                label: "Max Loan Eligible",
                value: formatCurrency(Number(user.employmentProfile.monthlySalary) * 3),
              },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <Icon size={14} className="text-gray-400" />
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                </div>
                <p className="font-semibold text-[#1a1f36] text-sm">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No employment profile found.</p>
        )}

        {empStatus === "PENDING" && (
          <div className="mt-4 flex items-start space-x-3 bg-orange-50 border border-orange-200 rounded-xl p-3">
            <Clock size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-orange-700 text-xs">
              Your NAPSA number is being verified. This typically takes 1-2 business days.
              You&apos;ll receive an email once verification is complete.
            </p>
          </div>
        )}
      </div>

      {/* Credit Profile */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center space-x-2 mb-5">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <CreditCard size={16} className="text-purple-600" />
          </div>
          <h3 className="font-bold text-[#1a1f36]">Credit Profile</h3>
          <Badge variant="purple" className="ml-auto">TransUnion</Badge>
        </div>

        {user.creditProfile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Credit Score</p>
                {user.creditProfile.transunionScore ? (
                  <div className="flex items-center space-x-3">
                    <p className="text-4xl font-black text-[#1a1f36]">
                      {user.creditProfile.transunionScore}
                    </p>
                    <div>
                      <Badge
                        variant={
                          user.creditProfile.transunionScore >= 700
                            ? "success"
                            : user.creditProfile.transunionScore >= 600
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {user.creditProfile.transunionScore >= 700
                          ? "Excellent"
                          : user.creditProfile.transunionScore >= 600
                          ? "Good"
                          : "Fair"}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Score not yet available</p>
                )}
              </div>
              <Shield size={32} className="text-purple-300" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-semibold text-[#1a1f36] text-sm mt-0.5">
                  {user.creditProfile.status}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Last Report</p>
                <p className="font-semibold text-[#1a1f36] text-sm mt-0.5">
                  {user.creditProfile.reportDate
                    ? formatDate(user.creditProfile.reportDate)
                    : "Pending"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Shield size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Credit profile not yet generated</p>
          </div>
        )}
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center space-x-2 mb-5">
          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-orange-600" />
          </div>
          <h3 className="font-bold text-[#1a1f36]">Security</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-gray-50">
            <div>
              <p className="font-medium text-[#1a1f36] text-sm">Password</p>
              <p className="text-xs text-gray-400">Last changed: Never</p>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Change
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-[#1a1f36] text-sm">Two-Factor Authentication</p>
              <p className="text-xs text-gray-400">Add an extra layer of security</p>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Enable
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
