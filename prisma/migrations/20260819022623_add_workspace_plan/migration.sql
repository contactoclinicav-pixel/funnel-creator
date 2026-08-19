-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'START', 'GROWTH', 'AGENCY');

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "planActivatedAt" TIMESTAMP(3),
ADD COLUMN     "planNote" TEXT;
