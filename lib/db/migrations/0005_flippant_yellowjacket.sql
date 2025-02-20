CREATE TABLE IF NOT EXISTS "Payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orderId" varchar(64) NOT NULL,
	"amount" varchar(20) NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"snapToken" text,
	"paymentType" varchar(50),
	"transactionId" varchar(100),
	"userId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
