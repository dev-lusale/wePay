import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  nrcNumber: z.string().min(6),
  employerName: z.string().min(2),
  napsaNumber: z.string().min(6),
  monthlySalary: z.number().min(1000),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Check if NRC already exists
    const existingNRC = await prisma.user.findUnique({
      where: { nrcNumber: data.nrcNumber },
    });

    if (existingNRC) {
      return NextResponse.json(
        { message: "An account with this NRC number already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user with employment profile
    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        nrcNumber: data.nrcNumber,
        password: hashedPassword,
        employmentProfile: {
          create: {
            employerName: data.employerName,
            napsaNumber: data.napsaNumber,
            monthlySalary: data.monthlySalary,
            verificationStatus: "PENDING",
          },
        },
        creditProfile: {
          create: {
            status: "PENDING",
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data provided", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);

    if (error instanceof Error) {
      // Database not connected / wrong credentials
      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("connect ETIMEDOUT") ||
        error.message.includes("Can't reach database server") ||
        error.message.includes("Connection refused")
      ) {
        return NextResponse.json(
          {
            message:
              "Cannot connect to the database. Please update DATABASE_URL in your .env file with your real PostgreSQL connection string, then run: npm run db:push",
          },
          { status: 500 }
        );
      }

      // Placeholder credentials still in .env
      if (
        error.message.includes("password authentication failed") ||
        error.message.includes("role") ||
        error.message.includes("does not exist")
      ) {
        return NextResponse.json(
          {
            message:
              "Database authentication failed. Your DATABASE_URL in .env still has placeholder credentials. Update it with your real PostgreSQL username and password.",
          },
          { status: 500 }
        );
      }

      // Prisma schema not pushed yet
      if (
        error.message.includes("relation") ||
        error.message.includes("table") ||
        error.message.includes("does not exist") ||
        error.message.includes("P2021")
      ) {
        return NextResponse.json(
          {
            message:
              "Database tables not found. Run: npm run db:push to create the schema.",
          },
          { status: 500 }
        );
      }

      // Unique constraint (duplicate NAPSA)
      if (
        error.message.includes("Unique constraint") ||
        error.message.includes("P2002")
      ) {
        return NextResponse.json(
          { message: "An account with these details already exists." },
          { status: 400 }
        );
      }

      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
